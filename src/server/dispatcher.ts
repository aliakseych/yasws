import http from "node:http"

import { Router } from "./router.js"

export { Dispatcher }

class Dispatcher extends Router {
    name: string
    port: number
    hostname: string
    rootPath: string
    private server: http.Server

    public constructor(
        name: string = "SWS Web App",
        port: number = 8000,
        hostname: string = "localhost",
        rootPath: string = "",
    ) {
        super(rootPath);
        this.server = http.createServer()

        this.name = name;
        this.hostname = hostname;
        this.port = port;
        this.rootPath = rootPath;
        this.fullPath = `${this.rootPath}`
    }

    public run(): void {
        this.server = http.createServer(
            // Handling the requesjs via handleEvent function
            (request: http.IncomingMessage, response: http.ServerResponse) => {
                const eventHandled: boolean = this.handleEvent(request, response)
                if (eventHandled == false) {
                    this.handleUnhandled(request, response)
                }
            }
        )

        console.log(`Starting listening on http://${this.hostname}:${this.port}`)
        this.server.listen({ port: this.port, hostname: this.hostname })

        // Stopping the server if Ctrl+C was stopped
        process.on('SIGINT', () => {
            console.log('Ctrl+C was pressed. Stopping server...');
            this.stop()
        });
    }

    public stop(): void {
        this.server.close();
        console.log('Server has been successfully stopped');
    }

    // Empty function, that can be replaced by user's business logic for handling unhandled responses
    public handleUnhandled(request: http.IncomingMessage, response: http.ServerResponse): void {return}
}