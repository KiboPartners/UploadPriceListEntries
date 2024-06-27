import path from 'path';
import { createLogger, transports, format, Logger as WinstonLogger } from 'winston';

class Logger {
  private logger: WinstonLogger;

  constructor(private fileDir: string) {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      defaultMeta: { service: fileDir },
      transports: [
        new transports.File({ filename: this.getLogFilePath(fileDir, 'info'), level: 'info' }),
        new transports.File({ filename: this.getLogFilePath(fileDir, 'error'), level: 'error' }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ level, message, timestamp }) => {
              return `${timestamp} ${level}: ${message}`;
            })
          )
        })
      ]
    });
  }

  private getLogFilePath(fileDir: string, type: string): string {
    return path.join(__dirname,'..',fileDir,'logs', `${this.fileDir}-${type}.log`);
  }

  public log(message: string): void {
    this.logger.info(message);
  }

  public error(message: string): void {
    this.logger.error(message);
  }
}

export default Logger;
