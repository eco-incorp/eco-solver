import { Network } from 'alchemy-sdk'
import { Logger } from '@nestjs/common'
import * as _ from 'lodash'
import { EcoLogMessage } from '../logging/eco-log-message'

export class EcoError extends Error {
  // Alchemy Service
  static AlchemyUnsupportedNetworkError(network: Network) {
    return new EcoError(`App does not support network ${network}, check your config file`)
  }
  static AlchemyServiceProviderError(network: string) {
    return new EcoError(`Could not create alchemy provider ${network}`)
  }

  // EcoConfig Service

  static isEcoError(error: any): boolean {
    return error instanceof EcoError
  }

  static getErrorObject(error: any): Error {
    if (error instanceof Error) {
      return error
    }

    return new Error(this.getErrorMessage(error))
  }

  static logErrorWithStack(error: any, caller: string, srcLogger: Logger, properties: object = {}) {
    return this._logError(this.getErrorObject(error), caller, srcLogger, properties, true)
  }

  static _logError(
    error: Error,
    caller: string,
    srcLogger: Logger,
    properties: object,
    logStack?: boolean,
  ) {
    srcLogger.error(
      EcoLogMessage.fromDefault({
        message: `${caller}: error`,
        properties: {
          error: error.message,
          ...properties,
        },
      }),

      logStack && error.stack,
    )
  }

  static getErrorMessage(error: any): string {
    if (_.isString(error)) {
      return error
    }

    if (EcoError.isEcoError(error)) {
      return error.toString()
    }

    return (
      error.body ||
      error.error?.reason ||
      error.reason ||
      error.message ||
      error.enumKey ||
      'Unexpected error occurred'
    )
  }
}
