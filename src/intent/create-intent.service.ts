import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { EcoConfigService } from '../eco-configs/eco-config.service'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { QUEUES } from '../common/redis/constants'
import { JobsOptions, Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'
import { SourceIntentModel } from './schemas/source-intent.schema'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { getIntentJobId } from '../common/utils/strings'
import { Hex } from 'viem'
import { UtilsIntentService } from './utils-intent.service'
import { ValidSmartWalletService } from '../solver/filters/valid-smart-wallet.service'
import { decodeCreateIntentLog, IntentCreatedLog } from '../contracts'
import { SourceIntentDataModel } from './schemas/source-intent-data.schema'

/**
 * Service class for getting configs for the app
 */
@Injectable()
export class CreateIntentService implements OnModuleInit {
  private logger = new Logger(CreateIntentService.name)
  private intentJobConfig: JobsOptions

  constructor(
    @InjectQueue(QUEUES.SOURCE_INTENT.queue) private readonly intentQueue: Queue,
    @InjectModel(SourceIntentModel.name) private intentModel: Model<SourceIntentModel>,
    private readonly validSmartWalletService: ValidSmartWalletService,
    private readonly utilsIntentService: UtilsIntentService,
    private readonly ecoConfigService: EcoConfigService,
  ) {}

  onModuleInit() {
    this.intentJobConfig = this.ecoConfigService.getRedis().jobs.intentJobConfig
  }

  async createIntent(intentWs: IntentCreatedLog) {
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `createIntent ${intentWs.transactionHash}`,
        properties: {
          intentHash: intentWs.transactionHash,
        },
      }),
    )

    const ei = decodeCreateIntentLog(intentWs.data, intentWs.topics)
    const intent = SourceIntentDataModel.fromEvent(ei, intentWs.logIndex || 0)

    try {
      //check db if the intent is already filled
      const model = await this.intentModel.findOne({
        'intent.hash': intent.hash,
      })
      if (model) {
        // Record already exists, do nothing and return
        this.logger.debug(
          EcoLogMessage.fromDefault({
            message: `Record for intent already exists ${intent.hash}`,
            properties: {
              intentHash: intent.hash,
              intent: intent,
            },
          }),
        )
        return
      }
      // const isBendWallet = await this.validSmartWalletService.validateSmartWallet(
      //   intent.creator as Hex,
      //   intentWs.sourceChainID,
      // )
      //todo fix this
      const isBendWallet = true
      //create db record
      const record = await this.intentModel.create({
        event: intentWs,
        intent: intent,
        receipt: null,
        status: isBendWallet ? 'PENDING' : 'NON-BEND-WALLET',
      })

      const jobId = getIntentJobId('create', intent.hash as Hex, intent.logIndex)
      if (isBendWallet) {
        //add to processing queue
        await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.validate_intent, intent.hash, {
          jobId,
          ...this.intentJobConfig,
        })
      }

      this.logger.debug(
        EcoLogMessage.fromDefault({
          message: `Recorded intent ${record.intent.hash}`,
          properties: {
            intentHash: intent.hash,
            intent: record.intent,
            ...(isBendWallet ? { jobId } : {}),
            isBendWallet,
          },
        }),
      )
    } catch (e) {
      this.logger.error(
        EcoLogMessage.fromDefault({
          message: `Error in createIntent ${intentWs.transactionHash}`,
          properties: {
            intentHash: intentWs.transactionHash,
            error: e,
          },
        }),
      )
    }
  }
}
