const mockGetIntentJobId = jest.fn()
import { createMock, DeepMocked } from '@golevelup/ts-jest'
import { EcoConfigService } from '../../eco-configs/eco-config.service'
import { Test, TestingModule } from '@nestjs/testing'
import { getModelToken } from '@nestjs/mongoose'
import { IntentSourceModel } from '../schemas/intent-source.schema'
import { Model } from 'mongoose'
import { ValidateIntentService } from '../validate-intent.service'
import { UtilsIntentService } from '../utils-intent.service'
import { BullModule, getQueueToken } from '@nestjs/bullmq'
import { QUEUES } from '../../common/redis/constants'
import { Queue } from 'bullmq'
import { ValidationService } from '@/intent/validation.sevice'
import { zeroHash } from 'viem'

jest.mock('../../common/utils/strings', () => {
  return {
    ...jest.requireActual('../../common/utils/strings'),
    getIntentJobId: mockGetIntentJobId,
  }
})

describe('ValidateIntentService', () => {
  let validateIntentService: ValidateIntentService
  let validationService: DeepMocked<ValidationService>
  let utilsIntentService: DeepMocked<UtilsIntentService>
  let ecoConfigService: DeepMocked<EcoConfigService>
  let queue: DeepMocked<Queue>
  const mockLogDebug = jest.fn()

  beforeEach(async () => {
    const chainMod: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateIntentService,
        {
          provide: UtilsIntentService,
          useValue: createMock<UtilsIntentService>(),
        },
        { provide: ValidationService, useValue: createMock<ValidationService>() },
        { provide: UtilsIntentService, useValue: createMock<UtilsIntentService>() },
        { provide: EcoConfigService, useValue: createMock<EcoConfigService>() },
        {
          provide: getModelToken(IntentSourceModel.name),
          useValue: createMock<Model<IntentSourceModel>>(),
        },
      ],
      imports: [
        BullModule.registerQueue({
          name: QUEUES.SOURCE_INTENT.queue,
        }),
      ],
    })
      .overrideProvider(getQueueToken(QUEUES.SOURCE_INTENT.queue))
      .useValue(createMock<Queue>())
      .compile()

    validateIntentService = chainMod.get(ValidateIntentService)
    validationService = chainMod.get(ValidationService)
    utilsIntentService = chainMod.get(UtilsIntentService)
    ecoConfigService = chainMod.get(EcoConfigService)
    queue = chainMod.get(getQueueToken(QUEUES.SOURCE_INTENT.queue))

    validateIntentService['logger'].debug = mockLogDebug
  })

  afterEach(async () => {
    // restore the spy created with spyOn
    jest.restoreAllMocks()
    mockLogDebug.mockClear()
  })

  describe('on module init', () => {
    it('should set the intentJobConfig', () => {
      const config = { a: 1 } as any
      ecoConfigService.getRedis = jest
        .fn()
        .mockReturnValueOnce({ jobs: { intentJobConfig: config } })
      validateIntentService.onModuleInit()
      expect(validateIntentService['intentJobConfig']).toEqual(config)
    })
  })

  describe('on destructureIntent', () => {
    it('should throw if get intent returns no data', async () => {
      utilsIntentService.getIntentProcessData.mockResolvedValueOnce(undefined)
      await expect(validateIntentService['destructureIntent'](zeroHash)).rejects.toThrow(
        'Desctructuring the intent from the intent hash failed',
      )
    })

    it('should throw if solver is undefined', async () => {
      utilsIntentService.getIntentProcessData.mockResolvedValueOnce({ model: {} } as any)
      await expect(validateIntentService['destructureIntent'](zeroHash)).rejects.toThrow(
        'Desctructuring the intent from the intent hash failed',
      )
    })

    it('should throw if model is undefined', async () => {
      utilsIntentService.getIntentProcessData.mockResolvedValueOnce({ solver: {} } as any)
      await expect(validateIntentService['destructureIntent'](zeroHash)).rejects.toThrow(
        'Desctructuring the intent from the intent hash failed',
      )
    })

    it('should throw error if its returned', async () => {
      const msg = 'Error from getIntentProcessData'
      utilsIntentService.getIntentProcessData.mockResolvedValueOnce({
        err: new Error(msg),
      } as any)
      await expect(validateIntentService['destructureIntent'](zeroHash)).rejects.toThrow('Error')
    })

    it('should throw generic error if no error returned', async () => {
      utilsIntentService.getIntentProcessData.mockResolvedValueOnce({} as any)
      await expect(validateIntentService['destructureIntent'](zeroHash)).rejects.toThrow(
        'Desctructuring the intent from the intent hash failed',
      )
    })

    it('should succeed and return data', async () => {
      const dataIn = { model: {}, solver: {} } as any
      utilsIntentService.getIntentProcessData.mockResolvedValueOnce(dataIn)
      const dataOut = await validateIntentService['destructureIntent'](zeroHash)
      expect(dataOut).toBe(dataIn)
    })
  })

  describe('on validateIntent entrypoint', () => {
    it('should log when entering function and return on failed destructure', async () => {
      const intentHash = '0x1'
      validateIntentService['destructureIntent'] = jest
        .fn()
        .mockReturnValueOnce({ model: undefined, solver: undefined })
      expect(await validateIntentService.validateIntent(intentHash)).toBe(false)
      expect(mockLogDebug).toHaveBeenCalledTimes(1)
      expect(mockLogDebug).toHaveBeenCalledWith({ msg: `validateIntent ${intentHash}`, intentHash })
    })

    it('should return on failed assertions', async () => {
      const intentHash = '0x1'
      validateIntentService['destructureIntent'] = jest
        .fn()
        .mockReturnValueOnce({ model: {}, solver: {} })
      validateIntentService['assertValidations'] = jest.fn().mockReturnValueOnce(false)
      expect(await validateIntentService.validateIntent(intentHash)).toBe(false)
      expect(mockLogDebug).toHaveBeenCalledTimes(1)
    })

    it('should log, create a job and enque it', async () => {
      const intentHash = '0x1'
      const model = { intent: { logIndex: 10 } }
      const config = { a: 1 } as any
      validateIntentService['destructureIntent'] = jest
        .fn()
        .mockReturnValueOnce({ model, solver: {} })
      validateIntentService['assertValidations'] = jest.fn().mockReturnValueOnce(true)
      validateIntentService['intentJobConfig'] = config
      const mockAddQueue = jest.fn()
      queue.add = mockAddQueue
      const jobId = 'validate-asdf-0'
      mockGetIntentJobId.mockReturnValueOnce(jobId)
      expect(await validateIntentService.validateIntent(intentHash)).toBe(true)
      expect(mockGetIntentJobId).toHaveBeenCalledTimes(1)
      expect(mockAddQueue).toHaveBeenCalledTimes(1)
      expect(mockLogDebug).toHaveBeenCalledTimes(2)
      expect(mockGetIntentJobId).toHaveBeenCalledWith('validate', intentHash, model.intent.logIndex)
      expect(mockAddQueue).toHaveBeenCalledWith(
        QUEUES.SOURCE_INTENT.jobs.feasable_intent,
        intentHash,
        {
          jobId,
          ...validateIntentService['intentJobConfig'],
        },
      )
      expect(mockLogDebug).toHaveBeenCalledWith({
        msg: `validateIntent ${intentHash}`,
        intentHash,
        jobId,
      })
    })
  })
})
