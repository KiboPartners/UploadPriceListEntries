import { Configuration } from '@kibocommerce/rest-sdk'
import Logger from './logger'
import GetAll from './getAll';

export interface UtilityConfig {
  fileDir: string,
  sdkConfig: Configuration
}

class Utility {
  logger: Logger;
  sdkConfig: Configuration;
  fileDir: string;

  constructor(config: UtilityConfig) {
    this.logger = new Logger(config.fileDir)
    this.sdkConfig = config.sdkConfig
    this.fileDir = config.fileDir
  }

  public getLogger(): Logger {
    return this.logger
  }

  public getAll(): GetAll {
    return new GetAll(this.sdkConfig, this.fileDir)
  }

  public getSDKConfiguration(): Configuration {
    return this.sdkConfig
  }

}

export default Utility