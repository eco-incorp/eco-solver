import { QuoteIntentDataInterface } from '@/quote/dto/quote.intent.data.dto'
import { QuoteRewardDataModel } from '@/quote/schemas/quote-reward.schema'
import { QuoteRouteDataModel } from '@/quote/schemas/quote-route.schema'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'

@Schema({ timestamps: true })
export class QuoteIntentModel implements QuoteIntentDataInterface {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId

  @Prop({ required: true })
  route: QuoteRouteDataModel

  @Prop({ required: true })
  reward: QuoteRewardDataModel

  @Prop({ type: Object })
  receipt: any
}

export const QuoteIntentSchema = SchemaFactory.createForClass(QuoteIntentModel)
QuoteIntentSchema.index({ 'route.source': 1 }, { unique: false })
QuoteIntentSchema.index({ 'route.destination': 1 }, { unique: false })
