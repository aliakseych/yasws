![](misc/images/banner.png)


## About

YASWS is Yet Another Simple Web Server, written on TypeScript and http module from NodeJS.

It has support for handler decorators, filters, and nesting multiple routers on top of each other. It's thread-blocking at the moment (sync), but there are plans to rewriting it to promises (async).

## Example

Here is a Small example of web server, which runs on http://localhost:8000 (default values), and 

```js

import http from "node:http"
import fs from "node:fs"
import ejs from "ejs"

import { Dispatcher, Router, Route } from "yasws"
import type { Filter, HandlerResponse } from "yasws"

function renderDefaultTemplate(templateName: string, kwargs: Record<string, any>): string {
  try {
    const template = fs.readFileSync(`./src/templates/${templateName}`, "utf-8")
    return ejs.render(template, kwargs)
  } catch (err) {
    console.error(`Error reading template file: ${err}`)
    return ""
  }
}

// All filters should have a call function
class SomeFilter implements Filter {
  someData: string

  constructor (allowThrough: boolean) {
    this.allowThrough = allowThrough
  }

  public call(request: http.IncomingMessage) {
    // If it's allowed to go through - you go through
    // If it's not - you don't

    return this.allowThrough
  }
}

class SmallRouter extends Router {
  // Decorator, where you can specify the path, request method and filters
  @Route("/test/", "GET", [new SomeFilter("some browser")])
  test(request: http.IncomingMessage, response: http.ServerResponse, ...args: any[]): HandlerResponse {
    // Router fills other data by itself, you just provide content
    const handlerResponse: HandlerResponse = {
      statusCode: 200,
      contentType: "text/json",
      data: "{'Something really small': '100%'}"
    }
    
    return handlerResponse
  }
}

const router = new SmallRouter("test/")

class SomeDispatcher extends Dispatcher {
  // This function is called when dispatcher couldn't handle this request
  public handleUnhandled(request: http.IncomingMessage, response: http.ServerResponse): void {
    const requestURL: string = request.url ??= ""
    const url = new URL(requestURL, `http://${request.headers.host}`)
    const fullRequestPath: string = url.pathname

    // Imagine some ejs template, which displays the error
    const renderedTemplate: string | void = renderDefaultTemplate("status.ejs", {statusCode: 404})

    const templateResponse: HandlerResponse = {
      statusCode: 404,
      contentType: "text/html",
      data: renderedTemplate
    }

    this.sendResponse(response, templateResponse, fullRequestPath)
  }
}


const dispatcher = new SomeDispatcher()

dispatcher.addRouter(test)
dispatcher.run()

```

## Contributing

We'd love for you to create pull requests for this project from the development branch. Releases are created from the main branch.
