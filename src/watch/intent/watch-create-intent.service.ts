import { Injectable, Logger } from '@nestjs/common'
import { EcoConfigService } from '@/eco-configs/eco-config.service'
import { Queue } from 'bullmq'
import { QUEUES } from '@/common/redis/constants'
import { InjectQueue } from '@nestjs/bullmq'
import { getIntentJobId } from '@/common/utils/strings'
import { IntentSource } from '@/eco-configs/eco-config.types'
import { EcoLogMessage } from '@/common/logging/eco-log-message'
import { MultichainPublicClientService } from '@/transaction/multichain-public-client.service'
import { IntentCreatedLog } from '@/contracts'
import { PublicClient, zeroHash } from 'viem'
import { convertBigIntsToStrings } from '@/common/viem/utils'
import { entries } from 'lodash'
import { IntentSourceAbi } from '@eco-foundation/routes-ts'
import { WatchEventService } from '@/watch/intent/watch-event.service'

/**
 * This service subscribes to IntentSource contracts for IntentCreated events. It subscribes on all
 * supported chains and prover addresses. When an event is emitted, it mutates the event log, and then
 * adds it intent queue for processing.
 */
@Injectable()
export class WatchCreateIntentService extends WatchEventService<IntentSource> {
  protected logger = new Logger(WatchCreateIntentService.name)

  constructor(
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) protected readonly intentQueue: Queue,
    protected readonly publicClientService: MultichainPublicClientService,
    protected readonly ecoConfigService: EcoConfigService,
  ) {
    super(intentQueue, publicClientService, ecoConfigService)
  }

  /**
   * Subscribes to all IntentSource contracts for IntentCreated events. It subscribes on all supported chains
   * filtering on the prover addresses and destination chain ids. It loads a mapping of the unsubscribe events to
   * call {@link onModuleDestroy} to close the clients.
   */
  async subscribe(): Promise<void> {
    const subscribeTasks = this.ecoConfigService.getIntentSources().map(async (source) => {
      const client = await this.publicClientService.getClient(source.chainID)
      await this.subscribeTo(client, source, this.getSupportedChains())
    })

    await Promise.all(subscribeTasks)
  }

  /**
   * Unsubscribes from all IntentSource contracts. It closes all clients in {@link onModuleDestroy}
   */
  async unsubscribe() {
    super.unsubscribe()
  }

  /**
   * Checks to see what networks we have inbox contracts for
   * @returns the supported chains for the event
   */
  getSupportedChains(): bigint[] {
    return entries(this.ecoConfigService.getSolvers()).map(([, solver]) => BigInt(solver.chainID))
  }

  async subscribeTo(client: PublicClient, source: IntentSource, solverSupportedChains: bigint[]) {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `watch create intent: subscribeToSource`,
        properties: {
          source,
        },
      }),
    )
    this.unwatch[source.chainID] = client.watchContractEvent({
      onError: async (error) => {
        await this.onError(error, client, source)
      },
      address: source.sourceAddress,
      abi: IntentSourceAbi,
      eventName: 'IntentCreated',
      args: {
        // restrict by acceptable chains, chain ids must be bigints
        _destinationChain: solverSupportedChains,
        _prover: source.provers,
      },
      onLogs: this.addJob(source),
    })
  }

  addJob(source: IntentSource) {
    return async (logs: IntentCreatedLog[]) => {
      for (const log of logs) {
        // bigint as it can't serialize to JSON
        const createIntent = convertBigIntsToStrings(log)
        createIntent.sourceChainID = source.chainID
        createIntent.sourceNetwork = source.network
        const jobId = getIntentJobId(
          'watch-create-intent',
          createIntent.args._hash ?? zeroHash,
          createIntent.logIndex ?? 0,
        )
        this.logger.debug(
          EcoLogMessage.fromDefault({
            message: `watch intent`,
            properties: {
              createIntent,
              jobId,
            },
          }),
        )
        // add to processing queue
        await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.create_intent, createIntent, {
          jobId,
          ...this.intentJobConfig,
        })
      }
    }
  }
}
