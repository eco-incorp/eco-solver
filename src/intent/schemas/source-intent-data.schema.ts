import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { IntentStruct } from '../../typing/contracts/IntentSource'
import { AddressLike, BigNumberish, BytesLike } from 'ethers'
import { EcoError } from '../../common/errors/eco-error'
import { getAddress, Hex } from 'viem'

@Schema({ timestamps: true })
export class SourceIntentDataModel implements IntentStruct {
  @Prop({ required: true, type: String })
  hash: BytesLike
  @Prop({ required: true, type: String, lowercase: true })
  creator: AddressLike
  @Prop({ required: true, type: BigInt })
  destinationChainID: BigNumberish
  @Prop({ required: true, type: Array<string>, lowercase: true })
  targets: Hex[]
  @Prop({ required: true, type: Array<string> })
  data: BytesLike[]
  @Prop({ required: true, type: Array<string>, lowercase: true })
  rewardTokens: AddressLike[]
  @Prop({ required: true, type: Array<bigint> })
  rewardAmounts: BigNumberish[]
  @Prop({ required: true, type: BigInt })
  expiryTime: BigNumberish
  @Prop({ required: true, type: Boolean })
  hasBeenWithdrawn: boolean
  @Prop({ required: true, type: String })
  nonce: BytesLike
  @Prop({ required: true, type: String })
  prover: AddressLike
  @Prop({ required: true, type: Number })
  logIndex: number
  constructor(
    hash: BytesLike,
    creator: AddressLike,
    destinationChain: BigNumberish,
    targets: Hex[],
    data: BytesLike[],
    rewardTokens: AddressLike[],
    rewardAmounts: BigNumberish[],
    expiryTime: BigNumberish,
    nonce: BytesLike,
    prover: AddressLike,
    logIndex: number,
  ) {
    if (targets.length !== data.length) {
      throw EcoError.SourceIntentDataInvalidParams
    }
    this.hash = hash
    this.creator = creator
    this.destinationChainID = destinationChain
    this.targets = targets.map((target) => getAddress(target))
    this.data = data
    this.rewardTokens = rewardTokens.map((token) => getAddress(token as string))
    this.rewardAmounts = rewardAmounts
    this.expiryTime = expiryTime
    this.hasBeenWithdrawn = false
    this.nonce = nonce
    this.prover = getAddress(prover as string)
    this.logIndex = logIndex
  }

  static fromEvent(event: Array<any>): SourceIntentDataModel {
    return new SourceIntentDataModel(
      event[0],
      event[1],
      event[2],
      event[3],
      event[4],
      event[5],
      event[6],
      event[7],
      event[8],
      event[9],
      event[10],
    )
  }
}
export const SourceIntentDataSchema = SchemaFactory.createForClass(SourceIntentDataModel)
SourceIntentDataSchema.index({ hash: 1 }, { unique: true })
SourceIntentDataSchema.index(
  { hasBeenWithdrawn: 1, destinationChain: 'ascending', expiryTime: 'ascending' },
  { unique: false },
)
