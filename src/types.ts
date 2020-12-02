import { Context } from './context'
import { CookieSerializeOptions } from 'cookie'
import { RouteOptions, Params } from 'tiny-request-router'

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

export type RouteHandler = (params: RouteParams, request: Request) => Promise<Response>

export type RouteParams = Params

export type Method = 'GET' | 'POST'

export interface Config {
  routes: Array<[Method, string, RouteHandler, RouteOptions?]>
  elements: Array<[string, ElementHandlerConstructor]>
  urlRewriteRules: Array<[string, string]>
  cookies: Array<[string, CookieOptions]>
}
