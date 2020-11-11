import { Config } from './types'
import { Context } from './context'
import { mergeConfig, defaultConfig } from './default-config'
import { URLRewriter } from './url-rewriter'

declare const ORIGIN_HOST: string
declare const ORIGIN_PATH_PREFIX: string
declare const ORIGIN_PROTOCOL: string
declare const ORIGIN_CACHE_TTL: number
declare const ORIGIN_CACHE_EVERYTHING: boolean

export async function handleRequest(
  request: Request,
  config: Config,
): Promise<Response> {
  const configuration = mergeConfig(defaultConfig, config)
  const url = getOriginURL(request, configuration)
  const response = await fetchOrigin(url)
  if (isHTML(request)) {
    const context = new Context(request, url)
    const htmlRewriter = configureHTMLRewriter(configuration, context)
    return htmlRewriter.transform(response)
  } else {
    return response
  }
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
    console.log(elementHandler)
    htmlRewriter = htmlRewriter.on(
      `script[type='edgeside/${name}']`,
      new elementHandler(context),
    )
  })
  return htmlRewriter
}
