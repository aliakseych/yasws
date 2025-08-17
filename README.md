![](misc/images/banner.png)


## About

YASWS is Yet Another Simple Web Server, written on TypeScript and http module from NodeJS.

It has support for handler decorators, filters, and nesting multiple routers on top of each other. It's thread-blocking at the moment (sync), but there are plans to rewriting it to promises (async).

## Code & architecture example

A Small example of web server, which runs on http://localhost:8000 (default values), and has a network structure of:
* /: Dispatcher
  * /test/: testRouter
    * /test/subtest/: subTestRouter
  * /subtest/: subTestRouter

It has a conditional filter (which 'filters' based on the boolean argument passed to it in the decorator) and multiple simple GET handlers:
* /: "something", simple handler
* /witchery/: "nope", unaccessable handler due to filter
* /nothing/: "nothing", returns 404 because it doesn't return valid response

It also has a middleware, which passes string argument to handlers, which is passed to itself on launch.

Below is the code for example web server described above.

*index.js*
```js
import http from "node:http"
import ejs from "ejs"

import { Dispatcher, Router, Route } from "yasws"
import type { Filter, HandlerResponse, Request, Middleware } from "yasws"

// All filters should have a call function
class SomeFilter implements Filter {
  allowThrough: boolean

  constructor (allowThrough: boolean) {
    this.allowThrough = allowThrough
  }

  public call(request: http.IncomingMessage) {
    // The logic this filter executes is...
    // - If it's "allowed" to go through - you go through
    // - If it's not - you don't

    return this.allowThrough
  }
}

// All middlewares should also have a call function
class SomeMiddleware implements Middleware {
  someData: string

  constructor (someData: string) {
    this.someData = someData
  }

  public call(request: Request): Request {
    // Passing some argument to request, which was given in Middleware constructor
    request.args.somedata = this.someData
    return request
  }
}

class SmallRouter extends Router {
  // Decorator, where you can specify the path, request method and filters
  @Route("/", "GET", [new SomeFilter(true)])
  something(request: Request): HandlerResponse {
    // Getting data, which was passed via middleware to request.args
    const someData = [
      `Middleware passed this string to me: '${request.args.somedata}'. idk, do something with it`,
      `There is also nonexistent argument, check it out: ${request.args.nonexistent}`
    ]

    // Router fills other data by itself, you just provide content
    const handlerResponse: HandlerResponse = {
      statusCode: 200,
      contentType: "text/json",
      data: JSON.stringify(someData)
    }
    
    return handlerResponse
  }

  @Route("/witchery", "GET", [new SomeFilter(false)])
  nope(request: Request): HandlerResponse {
    // Can't get here because of the filters
    const handlerResponse: HandlerResponse = {
      statusCode: 200,
      contentType: "text/json",
      data: "{'You know, before you could've be burnt for witchery...'}"
    }
    
    return handlerResponse
  }

  // If handler returns nothing or not in format (at least it should have status code) - it
  // won't be counted as a return, and user gets redirected to 404 page (about this - below)
  @Route("/nothing", "GET")
  nothing(): void {
    return
  }
}

class SomeDispatcher extends Dispatcher {
  // This function is called when dispatcher couldn't handle this request
  public handleUnhandled(request: http.IncomingMessage, response: http.ServerResponse): void {
    const requestURL: string = request.url ??= ""
    const url = new URL(requestURL, `http://${request.headers.host}`)
    const fullRequestPath: string = url.pathname

    // Small ejs template, which displays the error.
    // Built-in for simplicity, but it's better to move it to filesystem,
    // and reading it via node:fs
    const template: string = `
      <!DOCTYPE html>
      <html>
      <head>
          <title><%= statusCode %></title>
      </head>
      <body>
          <h1>You got <%= statusCode %>-ed</h1>
          <p>Good luck next time!</p>
      </body>
      </html>
    `
    const renderedTemplate: string | void = ejs.render(template, {statusCode: 404})

    const templateResponse: HandlerResponse = {
      statusCode: 404,
      contentType: "text/html",
      data: renderedTemplate
    }

    this.sendResponse(response, templateResponse, fullRequestPath)
  }
}

// Creating a testRouter, which base path will be /test/
const testRouter = new SmallRouter("test/")

// This middleware just passes some text argument.
// But it can go more, for example - passthrough DB session
const someMiddleware: SomeMiddleware = new SomeMiddleware("Some real data (yes. it's 100% real)")
// Registring SomeMiddleware to testRouter
testRouter.addMiddleware(someMiddleware)

// Creating a testSubRouter
const testSubRouter = new SmallRouter("subtest/")
// It's path will be /test/subtest/, sbecause it's added to
// the router with /test/ path
testRouter.addRouter(testSubRouter)

// Dispatcher, which will handle all requests to routers.
// By default runs on localhost:8000, and has / path
const dispatcher = new SomeDispatcher()

dispatcher.addRouter(testRouter)
// When adding this router to dispatcher directly, it will
// have path /subtest/, but that doesn't obstruct the testSubRouter 
// running under the testRouter (I mean that it also works)
dispatcher.addRouter(testSubRouter)
dispatcher.run()
```

## Contributing

We'd love for you to create pull requests for this project from the development branch. Releases are created from the main branch.
