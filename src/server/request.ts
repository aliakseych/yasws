import http from "node:http"

export type { Request }

interface Request {
    clientRequest: http.IncomingMessage
    args: {[key: string]: any}
    path: string
}
