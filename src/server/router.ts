import http from "node:http"

import { normalizePath, addEndSlash } from "./helpers.js"
import { Method } from "./method.js"
import type { Handler } from "./handler.js"
import type { Filter } from "./filter.js"
import type { HandlerResponse } from "./response.js"

export { Router, Route }

class Router {
    name: string | undefined
    rootPath: string
    dispatcherPath: string
    fullPath: string
    private handlers: Handler[]
    private subrouters: Router[]

    public constructor(
        rootPath?: string,
        name?: string,
        dispatcherPath?: string
    ) {
        this.rootPath = normalizePath(rootPath ??= "")
        this.dispatcherPath = normalizePath(dispatcherPath ??= "")
        this.name = name
        this.handlers = []
        this.subrouters = []
        this.fullPath = `${this.dispatcherPath}${this.rootPath}`
        this.registerRoutes()
    }

    private registerRoutes(): void {
        // Getting constructor, and casting it's type to any (kinda, idk)
        const routerConstructor = this.constructor as any
        // Getting routes, that was added via router decorator as a list
        this.handlers = routerConstructor._handlers || []
        
        if (this.handlers.length > 0) {
            console.log(`* Registered handlers to router ${this.constructor.name}`)
        }

        for (const handler of this.handlers) {
            console.log(` - ${handler.path}: ${handler.function.name} (${handler.method})`)
        }
    }

    public addRouter <RouterModel extends Router> (router: RouterModel): void {
        // Changing dispatcher path on added router to this router root path, so it's identified as a root router
        router.dispatcherPath = `${this.dispatcherPath}${this.rootPath}`
        this.subrouters.push(router);

        const routerName: string = router.name ??= router.constructor.name
        const subrouterFullPath = `${router.dispatcherPath}${router.rootPath}`
        router.fullPath = subrouterFullPath
        console.log(`% Added router ${routerName} to ${this.constructor.name} (path ${subrouterFullPath})`)
    }

    public handleEvent(request: http.IncomingMessage, response: http.ServerResponse, pathOffset: number = 0): boolean {
        const requestURL: string = request.url ??= ""
        const url = new URL(requestURL, `http://${request.headers.host}`)
        const fullRequestPath: string = addEndSlash(url.pathname)         

        console.log(`\n! Recieved ${request.method} request on ${fullRequestPath}`)

        handlerLoop: for (const handler of this.handlers) {
            console.log(`  * Checking if ${handler.function.name} is a match`)
            // Checking if paths match
            const handlerFullPath = `${this.fullPath}${handler.path}`
            if (fullRequestPath != handlerFullPath) {
                continue
            }

            // Checking if methods match
            if (request.method != handler.method) {
                continue
            }

            // Checking filters of handler, and if it matches - handle the request via it
            for (const filter of handler.filters) {
                const filterResult: boolean = filter.call(request)
                // Skipping this handler, if some of the filters fail (return false)
                if (filterResult == false) {
                    console.log(`    - FAILED: ${filter.constructor.name} filter`)
                    continue handlerLoop
                }
                console.log(`    - PASS: ${filter.constructor.name} filter`)
            }
            
            // Executing the handler, if all of it's filters passed
            const handlerResponse: HandlerResponse = handler.function(request)
            this.sendResponse(response, handlerResponse, fullRequestPath)
            console.log(`    - SUCCESS: returned a response`)
            return true
        } 

        // Checking subrouters' handlers for a match
        for (const subrouter of this.subrouters) {
            // Checking that this subrouter may possibly get this request, in terms of path
            const subrouterFullPath = `${subrouter.dispatcherPath}${subrouter.rootPath}`

            console.log(subrouter.dispatcherPath)
            console.log(subrouter.rootPath)
            console.log(fullRequestPath)

            if (fullRequestPath.startsWith(subrouterFullPath)) {
                console.log(`  * Checking in router ${subrouter.constructor.name}`)
                console.log(`  - - - - - - -`)
                const eventHandled: boolean = subrouter.handleEvent(request, response)
                // Check, if subrouter has found a matching handler.
                // If so - return that this router does found it too
                console.log(`  - - - - - - -`)
                if (eventHandled == true) {
                    return true
                }
            }
        }
        
        return false

    }

    public sendResponse(response: http.ServerResponse, handlerResponse: HandlerResponse, path: string): void {
        response.statusCode = handlerResponse.statusCode
        response.setHeader('Location', path)
        const datetimeGMT: string = (new Date()).toUTCString()
        response.setHeader('Date', datetimeGMT)
        response.setHeader('Content-Type', handlerResponse.contentType)
        response.setHeader('Content-Length', handlerResponse.data.length)
        
        // TODO: add support for adding other headers from handlerResponse.headers

        response.end(handlerResponse.data)
    }
}

function Route(path: string = "", method: Method | string = Method.GET, filters: Filter[] = []) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        const handlerFunction = descriptor.value;

        // Considering slash is a default location for a router, it shouldn't stack on the URL, because it
        // doesn't contain any meaning - so it needs to be removed (replaced with empty path)
        if (path == "/") {
            path = ""
        // Else, it just normalizes the meaningfull path
        } else {
            path = normalizePath(path)
        }

        // Initializing handlers list in Router construcor, if it's undefined
        target.constructor._handlers = target.constructor._handlers ??= []
        let handlers: Handler[] = target.constructor._handlers

        // Adding handler
        handlers.push({
            path: path,
            method: method,
            filters: filters,
            function: handlerFunction
        });

        return descriptor;
    };
}