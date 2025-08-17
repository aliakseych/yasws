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

    public run(port: number = 8000, hostname: string = "localhost"): void {
        this.server = http.createServer(
            // Handling the requesjs via handleEvent function
            (request: http.IncomingMessage, response: http.ServerResponse) => {
                const eventHandled: boolean = this.handleEvent(request, response)
                if (eventHandled == false) {
                    this.handleUnhandled(request, response)
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

    public stop(): void {
        this.server.close();
        this.logger.info('Server has been successfully stopped');
    }

    // Empty function, that can be replaced by user's business logic for handling unhandled responses
    public handleUnhandled(request: http.IncomingMessage, response: http.ServerResponse): void {return}
}