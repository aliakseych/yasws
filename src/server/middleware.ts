import type { Request } from "./request.js"

export type { Middleware }

interface Middleware {
    call?(request: Request): Request | void
    postRoute?(request: Request): Request | void
}