import fs from "node:fs/promises"

import type { Middleware } from "./server/middleware.js"
import type { Request } from "./server/request.js"

export { Logger, defaultLogger, LogLevel, LogMode, LoggerMiddleware }

enum LogMode {
    PROD = "PROD",
    DEV = "DEBUG"
}

enum LogLevel {
    ERROR = "ERROR",
    INFO = "INFO",
    WARNING = "WARNING",
    DEBUG = "DEBUG"
}

enum LogColor {
    ERROR = "31", // red
    INFO = "32", // green
    WARNING = "33", // yellow
    DEBUG = "34" // blue
}

class Logger {
    logLevel: LogLevel[] = []
    logFilePath: fs.FileHandle | undefined
    useColor: boolean = true

    public async config(logLevel?: LogLevel[], logFilePath?: string, useColor: boolean = true): Promise<void> {
        // Checking if LogLevel have been provided, and writing them
        if (logLevel) {
            this.logLevel = logLevel
        }
        // Checking if log filepath was provided and creating / opening this file
        if (logFilePath) {
            this.logFilePath = await fs.open(logFilePath, "a")
        }
        this.useColor = useColor
    }

    public async setMode(logMode: LogMode = LogMode.DEV): Promise<void> {
        // Checking if LogLevel have been provided, and writing them
        if (logMode == LogMode.PROD) {
            const prodLogLevel: LogLevel[] = [LogLevel.INFO, LogLevel.ERROR]
            await this.config(prodLogLevel)
        } else if (logMode == LogMode.DEV) {
            const devLogLevel: LogLevel[] = [LogLevel.INFO, LogLevel.DEBUG, LogLevel.ERROR, LogLevel.WARNING]
            await this.config(devLogLevel)
        }
    }

    private async printWrite(message: string): Promise<void> {
        // Outputting message to console
        console.log(message)
        // If log file is specified, write to it
        if (this.logFilePath) {
            try {
                await this.logFilePath.write(`${message}\n`);
            } catch (error) {
                console.error(`Error writing to log file ${this.logFilePath}: ${error}`);
                throw error;
            }
        }
    }

    private colorMessage(level: LogLevel, message: string): string {
        const logColor: LogColor = LogColor[level]

        message = `\u001b[${logColor}m${message}\u001b[0m`

        return message
    }

    private formatMessage(level: LogLevel, message: string): string {
        const date: string = new Date().toISOString()
        // Coloring the string (set to true by default)
        if (this.useColor) {
            message = this.colorMessage(level, message)
        }
        const formattedMessage = `[${level}] [${date}] ${message}`
        return formattedMessage
    }

    public info(message: string): void {
        const level: LogLevel = LogLevel.INFO
        if (this.logLevel.includes(level)) {
            const formattedMessage: string = this.formatMessage(level, message)
            this.printWrite(formattedMessage)
        }
    }
    
    public warning(message: string): void {
        const level: LogLevel = LogLevel.WARNING
        if (this.logLevel.includes(level)) {
            const formattedMessage: string = this.formatMessage(level, message)
            this.printWrite(formattedMessage)
        }
    }
    
    public error(message: string, error?: string): void {
        const level: LogLevel = LogLevel.ERROR
        if (this.logLevel.includes(level)) {
            const formattedMessage: string = this.formatMessage(level, message)
            this.printWrite(formattedMessage)
            if (error) {
                this.printWrite(error)
            }
        }
    }

    public debug(message: string): void {
        const level: LogLevel = LogLevel.DEBUG
        if (this.logLevel.includes(level)) {
            const formattedMessage: string = this.formatMessage(level, message)
            this.printWrite(formattedMessage)
        }
    }
}

const defaultLogger: Logger = new Logger()
// Setting up the default logger
const defaultLogMode: LogMode = LogMode.DEV
defaultLogger.setMode(defaultLogMode)

class LoggerMiddleware extends Logger implements Middleware  {
  constructor () {
    super()
  }

  public call(request: Request): Request {
    // Passing some argument to request, which was given in Middleware constructor
    request.args.logger = defaultLogger
    return request
  }
}