import http from "node:http"

import { Router } from "./router.js"
import { Logger } from "../logger.js"
import type { Header } from "./header.js"
import type { Request } from "./request.js"
import type { HandlerResponse } from "./response.js"

export { Dispatcher }

class Dispatcher extends Router {
    private server: http.Server

    public constructor(
        {name, rootPath, logger, defaultHeaders}: 
        {name?: string,
        rootPath?: string,
        logger?: Logger,
        defaultHeaders?: Header[]}
    ) {
        name = name ??= "SWS Web App"
        rootPath = rootPath ??= "/"
        defaultHeaders = defaultHeaders ??= []

        super({name: name, rootPath: rootPath, dispatcherPath: "", logger: logger, defaultHeaders: defaultHeaders})

        this.server = http.createServer()
        this.defaultHeaders = defaultHeaders
        this.fullPath = rootPath
        this.dispatcherPath = ""
    }

    public async run(port: number = 8000, hostname: string = "localhost"): Promise<void> {
        this.server = http.createServer(
            // Handling the request via handleEvent function
            async (clientRequest: http.IncomingMessage, response: http.ServerResponse) => {
                const requestPath: string = this.getRequestPath(clientRequest)
                let request: Request | undefined | null = {
                    clientRequest: clientRequest,
                    args: {},
                    path: requestPath
                }

                const eventHandled: Request | boolean = await this.handleEvent(request, response)

                // If event hasn't been declined or handled
                if (typeof eventHandled !== "boolean") {
                    const handlerResponse: HandlerResponse | void = await this.handleUnhandled(eventHandled)

                    // If function, responsible for handling unhandled requests doesn't respond with
                    // handler response - return nothing
                    if (handlerResponse) {
                        await this.sendResponse(response, handlerResponse, requestPath)
                    }
                }
            }
        )

        this.logger.info(`Starting listening on http://${hostname}:${port}`)
        this.server.listen({ port: port, hostname: hostname })

        // Stopping the server if Ctrl+C was stopped
        process.on('SIGINT', () => {
            this.logger.info('Ctrl+C was pressed. Stopping server...');
            this.stop()
        });
    }

    public async stop(): Promise<void> {
        this.server.close();
        this.logger.info('Server has been successfully stopped');
    }

    // Empty function, that can be replaced by user's business logic for handling unhandled responses
    public async handleUnhandled(request: Request): Promise<HandlerResponse | void> {return}
}