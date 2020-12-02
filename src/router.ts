import { Config, RouteHandler, Method } from './types'
import { Router } from 'tiny-request-router'

export function handleCustomRoutes(request: Request, config: Config): Promise<Response> | null {
  const router = new Router<RouteHandler>()
  console.log('configuring the router')
  config.routes.forEach((route) => {
    const [method, path, handler, options] = route
    switch (method) {
      case 'GET':
        router.get(path, handler, options)
        console.log('added a get: ', router)
        break
      case 'POST':
        router.post(path, handler, options)
        console.log('added a post: ', router)
        break
    }
  })

  const { pathname } = new URL(request.url)
  const match = router.match(request.method as Method, pathname)
  if (match) {
    return match.handler(match.params, request)
  } else {
    return null
  }
}
