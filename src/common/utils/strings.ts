export function getRandomString() {
  return Math.random().toString(36).slice(2)
}

export function getDestinationNetworkAddressKey(chainID: number, tokenAddress: string): string {
  return `${chainID}-${tokenAddress}`
}

/**
 * Appends the service name to the intent hash for the job id, else it will be the same for all intents
 * as they progress down the processing pipe and interfere in the queue
 *
 * @param intentHash the hash of the intent to fulfill
 * @param logIndex the transaction index of the intent to fulfill. Necessary if multiple intents are in the same transaction
 * @returns
 */
export function getIntentJobId(serviceName: string, intentHash: string, logIndex: number): string {
  return `${serviceName}-${intentHash}-${logIndex}`
}
