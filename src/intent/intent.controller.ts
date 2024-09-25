import { Controller, Get } from '@nestjs/common'
import { WebsocketIntentService } from './websocket-intent.service'
import { Network } from 'alchemy-sdk'
import { ValidateIntentService } from './validate-intent.service'
import { SourceIntent } from '../eco-configs/eco-config.types'
import { Logger } from '@nestjs/common'
import { EcoLogMessage } from '../common/logging/eco-log-message'
import { ViemEventLog } from '../common/events/websocket'

@Controller('intent')
export class SourceIntentController {
  private logger = new Logger(SourceIntentController.name)
  constructor(
    private readonly wsService: WebsocketIntentService,
    private readonly validateService: ValidateIntentService,
  ) {}

  @Get()
  async fakeIntent() {
    const si: SourceIntent = {
      network: (intent[0] as ViemEventLog).sourceNetwork as Network,
      chainID: (intent[0] as ViemEventLog).sourceChainID,
      sourceAddress: '0x',
      tokens: [],
      provers: [],
    }
    this.logger.debug(
      EcoLogMessage.fromDefault({
        message: `fakeIntent intent`,
        properties: {
          si: si,
        },
      }),
    )

    return await this.wsService.addJob(si)(intent)
    // return this.wsService.addJob(Network.OPT_SEPOLIA)(intent)
  }

  @Get('process')
  async fakeProcess() {
    const hash = '0xe42305a292d4df6805f686b2d575b01bfcef35f22675a82aacffacb2122b890f'
    return await this.validateService.validateIntent(hash)
    //  await this.intentQueue.add(QUEUES.SOURCE_INTENT.jobs.process_intent, hash, {
    //   jobId: hash,
    // })
  }
}
const intent = [
  {
    blockNumber: 20220263,
    blockHash: '0x97e812234007ea7ec5fd148303eba2f4a66eee559a7513ee05463d1340e1da0f',
    transactionIndex: 37,
    removed: false,
    address: '0x13727384eb72ee4de1332634957f5473e5f1d52a',
    data: '0x00000000000000000000000035395d96fcb26d416fd5593cadec099cf6b2900700000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000002207b518f342018b98c52a34a7ef70864fb17154c485d3e0e2514804e6127347baf00000000000000000000000099b07ff401e2c73826f3043adab2ef37e53d4f23000000000000000000000000000000000000000000000000000000000000000100000000000000000000000094b008aa00579c1307b0ef2c499ad98a8ce58e58000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000044a9059cbb00000000000000000000000035395d96fcb26d416fd5593cadec099cf6b2900700000000000000000000000000000000000000000000000000000000001240fd000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000001240fd',
    topics: [
      '0x653c41cbe9402a28b206076ac6e316307a1ef8f76f247c1da9fdc2f50a405819',
      '0x0ad607c1c6b1257f303fd7df4eb3b2b34f6cbf44bea7ee472c80d09d3a78ec6c',
      '0x000000000000000000000000000000000000000000000000000000000000000a',
      '0x000000000000000000000000000000000000000000000000000000006705e4a9',
    ],
    transactionHash: '0x9fc8563025960dc7c5f2352581370bed98938fea61f156bddd94b7c636a712c0',
    logIndex: 166,
    sourceNetwork: 'base-mainnet' as Network,
    sourceChainID: 8453,
  } as unknown as ViemEventLog,
  {
    blockNumber: 20220263,
    blockHash: '0x97e812234007ea7ec5fd148303eba2f4a66eee559a7513ee05463d1340e1da0f',
    transactionIndex: 37,
    removed: false,
    address: '0x13727384eb72ee4de1332634957f5473e5f1d52a',
    data: '0x00000000000000000000000035395d96fcb26d416fd5593cadec099cf6b2900700000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000220e7b20d93a3118925da179090f052bc426d516e46b502f8ca98569063535f018600000000000000000000000099b07ff401e2c73826f3043adab2ef37e53d4f23000000000000000000000000000000000000000000000000000000000000000100000000000000000000000094b008aa00579c1307b0ef2c499ad98a8ce58e58000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000044a9059cbb00000000000000000000000035395d96fcb26d416fd5593cadec099cf6b2900700000000000000000000000000000000000000000000000000000000003b90e3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000d9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000003b90e3',
    topics: [
      '0x653c41cbe9402a28b206076ac6e316307a1ef8f76f247c1da9fdc2f50a405819',
      '0xae7027bea4a9a181da07e4bfcc8def155d49e57fec3319cfcbfc729828e995a9',
      '0x000000000000000000000000000000000000000000000000000000000000000a',
      '0x000000000000000000000000000000000000000000000000000000006705e4a9',
    ],
    transactionHash: '0x9fc8563025960dc7c5f2352581370bed98938fea61f156bddd94b7c636a712c0',
    logIndex: 170,
    sourceNetwork: 'base-mainnet' as Network,
    sourceChainID: 8453,
  } as unknown as ViemEventLog,
]
