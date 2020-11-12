import { Context } from './context'

interface ElementHandlerConstructor {
  new (context: Context): ElementHandler
}

export interface Config {
  elements?: Array<[string, ElementHandlerConstructor]>
  urlRewriteRules?: Array<[string, string]>
}
