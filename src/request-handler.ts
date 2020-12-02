import { Config } from './types'
import { Context } from './context'
import { mergeConfig, defaultConfig } from './default-config'
import { URLRewriter } from './url-rewriter'
import { debug } from './util'
import { CookieManager } from './cookies'
import { handleCustomRoutes } from './router'

declare const ORIGIN_HOST: string
declare const ORIGIN_PATH_PREFIX: string
declare const ORIGIN_PROTOCOL: string
declare const ORIGIN_CACHE_TTL: number
declare const ORIGIN_CACHE_EVERYTHING: boolean

export async function handleRequest(request: Request, config?: Partial<Config>): Promise<Response> {
  const configuration = config ? mergeConfig(defaultConfig, config) : defaultConfig

  let response = await handleCustomRoutes(request, configuration)
  if (response) {
    return response
  }

  const url = getOriginURL(request, configuration)
  response = makeHeadersMutable(await fetchOrigin(url))

  if (isHTML(request)) {
    const cookieManager = new CookieManager(request, response, configuration)
    const context = new Context(request, url, cookieManager.cookies)
    const htmlRewriter = configureHTMLRewriter(configuration, context)
    return htmlRewriter.transform(response)
  } else {
    return response
  }
}

function makeHeadersMutable(response: Response): Response {
  return new Response(response.body, response)
}

function isHTML(request: Request) {
  const acceptHeader = request.headers.get('accept')
  return acceptHeader && acceptHeader.indexOf('text/html') >= 0
}

function getOriginURL(request: Request, config: Config): URL {
  const url = new URL(request.url)
  url.host = ORIGIN_HOST
  url.protocol = ORIGIN_PROTOCOL
  url.pathname = new URLRewriter(config.urlRewriteRules).rewrite(url.pathname)
  try {
    url.pathname = ORIGIN_PATH_PREFIX + url.pathname
  } catch (e) {
    //ignore
  }
  return url
}

function fetchOrigin(url: URL): Promise<Response> {
  return fetch(url.toString(), {
    cf: {
      cacheTtl: ORIGIN_CACHE_TTL,
      cacheEverything: ORIGIN_CACHE_EVERYTHING,
    },
  })
}

function configureHTMLRewriter(config: Config, context: Context): HTMLRewriter {
  let htmlRewriter = new HTMLRewriter()
  config.elements.forEach(([name, elementHandler]) => {
    debug(elementHandler)
    htmlRewriter = htmlRewriter.on(`script[type='edgeside/${name}']`, new elementHandler(context))
  })
  return htmlRewriter
}
