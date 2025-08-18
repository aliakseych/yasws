import { Dispatcher } from "./server/dispatcher.js"
import { Router, Route } from "./server/router.js"

import type { Filter } from "./server/filter.js"
import type { Middleware } from "./server/middleware.js"

import type { Request } from "./server/request.js"
import type { Method } from "./server/method.ts"
import type { Handler, HandlerFunction } from "./server/handler.js"
import type { HandlerResponse } from "./server/response.js"

import { Templater, TemplaterMiddleware, LoadStrategy } from "./templates/templater.js"
import { HTMLResponse } from "./templates/responses.js"

import * as helpers from "./server/helpers.js"

import { Logger, LogLevel, LogMode } from "./logger.js"
import defaultLogger from "./logger.js"

export {
  Dispatcher,
  Router,
  Route,
  helpers,
  defaultLogger,
  Logger,
  LogLevel,
  LogMode,
  Templater,
  TemplaterMiddleware,
  LoadStrategy,
  HTMLResponse
}

export type {
  Filter,
  Middleware,
  Request,
  Method,
  Handler,
  HandlerFunction,
  HandlerResponse
}