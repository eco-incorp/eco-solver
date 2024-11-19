import { EcoChainConfig, EcoProtocolAddresses } from '@eco-foundation/routes'
import * as config from 'config'
import { EcoError } from '../common/errors/eco-error'

/**
 * The prefix for non-production deploys on a chain
 */
export const ChainPrefix = 'pre'

export enum NodeEnv {
  Production = 'production',
  Preproduction = 'preproduction',
  Staging = 'staging',
  Development = 'development',
}

/**
 * Returns the NodeEnv enum value from the string node env, defaults to Development
 *
 * @param env the string node env
 * @returns
 */
export function getNodeEnv(): NodeEnv {
  const env: string = config.util.getEnv('NODE_ENV')
  const normalizedEnv = env.toLowerCase() as keyof typeof NodeEnv
  return NodeEnv[normalizedEnv] || NodeEnv.Development
}

/**
 * @returns true if the node env is preproduction or development
 */
export function isPreEnv(): boolean {
  return getNodeEnv() === NodeEnv.Preproduction || getNodeEnv() === NodeEnv.Development
}

/**
 * Gets the chain configuration for the given chain id from the
 * eco protocol addresses library
 * @param chainID the chain id
 * @returns
 */
export function getChainConfig(chainID: number | string): EcoChainConfig {
  const id = isPreEnv() ? `${chainID}-${ChainPrefix}` : chainID.toString()
  const config = EcoProtocolAddresses[id]
  if (config === undefined) {
    throw EcoError.ChainConfigNotFound(id)
  }
  return config
}
