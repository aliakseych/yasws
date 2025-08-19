import type { HandlerResponse } from "../server/response.js";
import type { Header } from "../server/header.js";

export { HTMLResponse }

class HTMLResponse implements HandlerResponse {
    statusCode: number
    contentType: string = "text/html"
    data: string
    headers?: Header[]

    constructor (data: string, statusCode: number = 200) {
        this.data = data
        this.statusCode = statusCode
    }
}