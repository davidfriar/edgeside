import { Config } from './types'
import {
  GraphQLElementHandler,
  RESTElementHandler,
  TemplateElementHandler,
  ConditionalElementHandler,
  RequestDataElementHandler,
  TransformElementHandler,
  HTMLIncludeElementHandler,
  DebugElementHandler,
} from './elements'

export const defaultConfig: Config = {
  elements: [
    ['graphql', GraphQLElementHandler],
    ['rest', RESTElementHandler],
    ['template', TemplateElementHandler],
    ['conditional', ConditionalElementHandler],
    ['request-data', RequestDataElementHandler],
    ['transform', TransformElementHandler],
    ['html-include', HTMLIncludeElementHandler],
    ['debug', DebugElementHandler],
  ],
  urlRewriteRules: [],
  cookies: [
    ['edgeside-session', { httpOnly: true, path: '/' }],
    ['edgeside-permanent', { httpOnly: true, path: '/', maxAge: 365 * 24 * 60 * 60 * 1000 }],
  ],
  routes: [],
}

export function mergeConfig(config: Config, config2: Partial<Config>): Config {
  return {
    elements: config.elements.concat(config2.elements ?? []),
    urlRewriteRules: config.urlRewriteRules.concat(config2.urlRewriteRules ?? []),
    cookies: config.cookies.concat(config2.cookies ?? []),
    routes: config.routes.concat(config2.routes ?? []),
  }
}
