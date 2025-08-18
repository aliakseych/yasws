import { Method } from "./method.js"
import type { Filter } from "./filter.js"
import type { HandlerResponse } from "./response.js"
import type { Request } from "./request.js"

export type { Handler, HandlerFunction }

type HandlerFunction = (request: Request) => Promise<HandlerResponse>

interface Handler {
    path: string
    method: Method | string
    filters: Filter[]
    function: HandlerFunction
}
