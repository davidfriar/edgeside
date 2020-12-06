import { Config, RouteHandler, Method } from './types'
import { Router } from 'tiny-request-router'
import { CookieManager } from './cookies'
import { debug } from './util'

export function handleRoutes(
  request: Request,
  config: Config,
  cookieManager: CookieManager,
): Promise<Response> | null {
  const router = new Router<RouteHandler>()
  debug('configuring the router')
  config.routes.reverse().forEach((route) => {
    const [method, path, handler, options] = route
    switch (method) {
      case 'GET':
        router.get(path, handler, options)
        debug('added a get: ', router)
        break
      case 'POST':
        router.post(path, handler, options)
        debug('added a post: ', router)
        break
    }
  })

  const { pathname } = new URL(request.url)
  const match = router.match(request.method as Method, pathname)
  if (match) {
    return match.handler(request, cookieManager, config, match.params)
  } else {
    return null
  }
}
