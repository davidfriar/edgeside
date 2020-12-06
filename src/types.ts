import { Context } from './context'
import { CookieSerializeOptions } from 'cookie'
import { RouteOptions, Params } from 'tiny-request-router'
import { CookieManager } from './cookies'
export { CookieManager } from './cookies'

interface ElementHandlerConstructor {
  new (context: Context): ElementHandler
}

export interface CookieOptions extends CookieSerializeOptions {
  disabled?: boolean
  generator?: () => string
  updater?: (value: string, request: Request, response: Response) => string
}

export type Cookie = { value: string; isNew: boolean }

export type CookieStore = { [key: string]: Cookie }

type RouteHandler1 = (request: Request) => Promise<Response>

type RouteHandler2 = (request: Request, cookieManager: CookieManager) => Promise<Response>

type RouteHandler3 = (
  request: Request,
  cookieManager: CookieManager,
  configuration: Config,
) => Promise<Response>

type RouteHandler4 = (
  request: Request,
  cookieManager: CookieManager,
  configuration: Config,
  params: RouteParams,
) => Promise<Response>

export type RouteHandler = RouteHandler1 | RouteHandler2 | RouteHandler3 | RouteHandler4

export type RouteParams = Params

export type Method = 'GET' | 'POST'

export interface Config {
  routes: Array<[Method, string, RouteHandler, RouteOptions?]>
  elements: Array<[string, ElementHandlerConstructor]>
  urlRewriteRules: Array<[string, string]>
  cookies: Array<[string, CookieOptions]>
}
