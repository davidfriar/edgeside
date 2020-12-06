import { v4 as uuidv4 } from 'uuid'
import cookie from 'cookie'
import { Config, CookieOptions, CookieStore } from './types'

export class CookieManager {
  readonly cookies: CookieStore
  private cookieConfig: Array<[string, CookieOptions]>

  constructor(request: Request, config: Config) {
    this.cookieConfig = config.cookies
    this.cookies = this.readCookies(request)
  }

  readCookies(request: Request): CookieStore {
    const cookies: CookieStore = {}
    const cookiesFound = cookie.parse(request.headers.get('cookie') ?? '')
    this.cookieConfig.forEach(([name, options]) => {
      if (cookiesFound[name]) {
        cookies[name] = { value: cookiesFound[name], isNew: false }
      } else {
        const value = options.generator ? options.generator() : uuidv4()
        cookies[name] = { value: value, isNew: true }
      }
    })
    return cookies
  }

  writeCookies(response: Response): Response {
    const result = new Response(response.body, response)
    this.cookieConfig.forEach(([name, options]) => {
      if (this.cookies[name].isNew) {
        const value = options.generator ? options.generator() : uuidv4()
        result.headers.append('Set-Cookie', cookie.serialize(name, value, options))
        this.cookies[name] = { value: value, isNew: true }
      }
      // to do : add update function if we need this
    })
    return result
  }
}
