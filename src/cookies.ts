import { v4 as uuidv4 } from 'uuid'
import cookie from 'cookie'
import { Config, CookieOptions, CookieStore } from './types'

export class CookieManager {
  readonly cookies: CookieStore
  private cookieConfig: Array<[string, CookieOptions]>

  constructor(request: Request, response: Response, config: Config) {
    this.cookieConfig = config.cookies
    this.cookies = this.readCookies(request)
    this.writeCookies(response)
  }

  readCookies(request: Request): CookieStore {
    return Object.fromEntries(
      Object.entries(cookie.parse(request.headers.get('cookie') ?? '')).map(([k, v]) => [
        k,
        { value: v, isNew: false },
      ]),
    )
  }

  writeCookies(response: Response) {
    this.cookieConfig.forEach(([name, options]) => {
      if (!this.cookies[name]) {
        const value = options.generator ? options.generator() : uuidv4()
        response.headers.append('Set-Cookie', cookie.serialize(name, value, options))
        this.cookies[name] = { value: value, isNew: true }
      }
      // to do : add update function if we need this
    })
  }
}
