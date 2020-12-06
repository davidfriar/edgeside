import { Config } from './types'
import { mergeConfig, defaultConfig } from './default-config'
import { CookieManager } from './cookies'
import { handleRoutes } from './router'

export async function handleRequest(request: Request, config?: Partial<Config>): Promise<Response> {
  const configuration = config ? mergeConfig(defaultConfig, config) : defaultConfig
  const cookieManager = new CookieManager(request, configuration)

  let response = await handleRoutes(request, configuration, cookieManager)
  if (response) {
    return response
  } else {
    return new Response('Not found', { status: 404 })
  }
}
