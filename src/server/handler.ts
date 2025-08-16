import http from "node:http"

import { Method } from "./method.js"
import type { Filter } from "./filter.js"
import type { HandlerResponse } from "./response.js"

export type { Handler, HandlerFunction }

type HandlerFunction = (req: http.IncomingMessage) => HandlerResponse

interface Handler {
    path: string
    method: Method | string
    filters: Filter[]
    function: HandlerFunction
}
