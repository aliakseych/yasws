export { isResponse }
export type { HandlerResponse }

// HTTP Basic Response

// HTTP/1.1 403 Forbidden
// Location: http://example.com/users/123
// Date: Fri, 21 Jun 2024 12:52:39 GMT
// Content-Length: 678
// Content-Type: text/html
// < IDOCTYPB html>
// <html lang="en">
// (more data...)

interface HandlerResponse {
    // HTTP Representation headers
    statusCode: number
    contentType: string
    data: string
    headers?: Record<string, string>
}

const isResponse = (response: any): response is HandlerResponse => (response as HandlerResponse)?.statusCode !== undefined;