import http from "node:http"

import { Router } from "./router.js"

export { Dispatcher }

class Dispatcher extends Router {
    name: string
    rootPath: string
    private server: http.Server

    public constructor(
        name: string = "SWS Web App",
        rootPath: string = "",
    ) {
        super()
        this.server = http.createServer()

        this.name = name;
        this.rootPath = rootPath;
        this.fullPath = `${this.rootPath}`
    }

    public async run(port: number = 8000, hostname: string = "localhost"): Promise<void> {
        this.server = http.createServer(
            // Handling the requesjs via handleEvent function
            async (request: http.IncomingMessage, response: http.ServerResponse) => {
                const eventHandled: boolean = await this.handleEvent(request, response)
                if (eventHandled == false) {
                    await this.handleUnhandled(request, response)
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
    public async handleUnhandled(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {return}
}