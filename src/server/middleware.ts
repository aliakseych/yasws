import type { Request } from "./request.js"

export type { Middleware }

interface Middleware {
    call?(request: Request): Request | undefined | null
    postRoute?(request: Request): Request | undefined | null
}