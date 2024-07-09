import { Injectable } from '@nestjs/common'
import { EcoConfigService } from './eco-configs/eco-config.service'

@Injectable()
export class AppService {
  constructor(private ecoConfigService: EcoConfigService) {}
  getHello(): string {
    // console.log(this.ecoConfigService.get('aws'))

    return 'Hello World!'
  }
}
