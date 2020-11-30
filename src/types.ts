import { Context } from './context'
import { CookieSerializeOptions } from 'cookie'

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

export interface Config {
  elements: Array<[string, ElementHandlerConstructor]>
  urlRewriteRules: Array<[string, string]>
  cookies: Array<[string, CookieOptions]>
}
