import http from "node:http"

export type { Filter }

interface Filter {
    call(request: http.IncomingMessage): boolean
}
