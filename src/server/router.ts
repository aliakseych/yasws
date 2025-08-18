import http from "node:http"

import { normalizePath, addEndSlash } from "./helpers.js"
import { Method } from "./method.js"
import type { Handler } from "./handler.js"
import type { Filter } from "./filter.js"
import type { HandlerResponse } from "./response.js"
import { isResponse } from "./response.js"
import type { Middleware } from "./middleware.js"
import type { Request } from "./request.js"
import { defaultLogger, Logger } from "../logger.js"

export { Router, Route }

class Router {
    name: string | undefined
    rootPath: string
    dispatcherPath: string
    fullPath: string
    public logger: Logger
    private handlers: Handler[]
    private subrouters: Router[]
    private middlewares: Middleware[]

    public constructor(
        rootPath?: string,
        name?: string,
        dispatcherPath?: string,
        logger?: Logger
    ) {
        // Setting up paths
        this.rootPath = normalizePath(rootPath ??= "")
        this.dispatcherPath = normalizePath(dispatcherPath ??= "")
        // Setting up logger
        this.logger = logger ??= defaultLogger

        // Setting default parameters of router
        this.name = name
        this.fullPath = `${this.dispatcherPath}${this.rootPath}`
        this.handlers = []
        this.subrouters = []
        this.middlewares = []

        // Register all decorators
        this.registerRoutes()
    }

    private async registerRoutes(): Promise<void> {
        // Getting constructor, and casting it's type to any, so TS don't blast with errors
        const routerConstructor = this.constructor as any
        // Getting routes, that was added via router decorator as a list
        this.handlers = routerConstructor._handlers || []
        
        if (this.handlers.length > 0) {
            this.logger.info(`* Registered handlers to router ${this.constructor.name}`)

            // Writing to DEBUG names, paths and methods of handler functions
            let handlersMessage = `\n* Handlers, registered to router ${this.constructor.name}:\n`
            for (const handler of this.handlers) {
                handlersMessage += `- ${handler.path || "/"}: ${handler.function.name} (${handler.method})\n`
            }
            this.logger.debug(handlersMessage)
        }
    }

    public async addRouter <RouterChild extends Router> (router: RouterChild): Promise<void> {
        // Changing dispatcher path on added router to this router root path, so it's identified as a root router
        router.dispatcherPath = `${this.dispatcherPath}${this.rootPath}`
        this.subrouters.push(router);

        const routerName: string = router.name ??= router.constructor.name
        const subrouterFullPath = `${router.dispatcherPath}${router.rootPath}`
        router.fullPath = subrouterFullPath
        this.logger.info(`% Added router ${routerName} to ${this.constructor.name} (path ${subrouterFullPath})`)
    }

    public async addMiddleware <MiddlewareChild extends Middleware> (middleware: MiddlewareChild): Promise<void> {
        // Changing dispatcher path on added router to this router root path, so it's identified as a root router
        this.middlewares.push(middleware);

        const middlewareName: string = middleware.constructor.name
        this.logger.info(`% Added middleware ${middlewareName} to ${this.constructor.name}`)
    }

    public async handleEvent(clientRequest: http.IncomingMessage, response: http.ServerResponse): Promise<boolean> {
        const requestURL: string = clientRequest.url ??= ""
        const url = new URL(requestURL, `http://${clientRequest.headers.host}`)
        const fullRequestPath: string = addEndSlash(url.pathname)         

        this.logger.info(`Recieved ${clientRequest.method} request on ${fullRequestPath}`)

        handlerLoop: for (const handler of this.handlers) {
            this.logger.debug(`* Checking if ${handler.function.name} is a match`)
            // Checking if paths match
            const handlerFullPath = `${this.fullPath}${handler.path}`
            if (fullRequestPath != handlerFullPath) {
                continue
            }

            // Checking if methods match
            if (clientRequest.method != handler.method) {
                continue
            }

            // Checking filters of handler, and if it matches - handle the request via it
            for (const filter of handler.filters) {
                const filterResult: boolean = filter.call(clientRequest)
                // Skipping this handler, if some of the filters fail (return false)
                if (filterResult === false) {
                    this.logger.debug(`FAILED: ${filter.constructor.name} filter`)
                    continue handlerLoop
                }
                this.logger.debug(`PASS: ${filter.constructor.name} filter`)
            }
            
            // Initializing request class, which will be used by middlewares and handler
            // args is a list, which may be used by middleware to pass back arguments
            let request: Request = {
                clientRequest: clientRequest,
                args: {}
            }
            // Going through middlewares, when the matching handler is found
            for (const middleware of this.middlewares) {
                request = middleware.call(request)
            }

            // Executing the handler, if all of it's filters passed
            const handlerResponse: HandlerResponse = await handler.function(request)

            // Checking if the handler has returned response, if not - skip this handler
            // TODO: Replace with returning 5xx error
            if (!isResponse(handlerResponse)) {
                continue 
            }

            this.sendResponse(response, handlerResponse, fullRequestPath)
            this.logger.debug(`SUCCESS: returned a response`)
            return true
        } 

        // Checking subrouters' handlers for a match
        for (const subrouter of this.subrouters) {
            // Checking that this subrouter may possibly get this request, in terms of path
            const subrouterFullPath = `${subrouter.dispatcherPath}${subrouter.rootPath}`

            if (fullRequestPath.startsWith(subrouterFullPath)) {
                this.logger.debug(`* Checking in router ${subrouter.constructor.name}`)
                const eventHandled: boolean = await subrouter.handleEvent(clientRequest, response)
                // Check, if subrouter has found a matching handler.
                // If so - return that this router does found it too
                if (eventHandled === true) {
                    return true
                }
            }
        }
        
        return false

    }

    public async sendResponse(response: http.ServerResponse, handlerResponse: HandlerResponse, path: string): Promise<void> {
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