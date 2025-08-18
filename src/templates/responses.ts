import type { HandlerResponse } from "../server/response.js";

export { HTMLResponse }

class HTMLResponse implements HandlerResponse {
    statusCode: number
    contentType: string = "text/html"
    data: string

    constructor (data: string, statusCode: number = 200) {
        this.data = data
        this.statusCode = statusCode
    }
}