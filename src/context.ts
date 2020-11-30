import { debug } from './util'
import { CookieStore } from './types'

export class Context {
  readonly request: Request
  readonly originURL: URL
  readonly cookies: CookieStore
  private data: { [key: string]: Promise<Response> }
  readonly env: { [key: string]: string }

  constructor(request: Request, originURL: URL, cookies: CookieStore) {
    this.data = {}
    this.request = request
    this.originURL = originURL
    this.env = this.readEnv()
    this.cookies = cookies
  }

  put(key: string, promise: Promise<Response>) {
    this.data[key] = promise
  }

  async getJSON(key: string) {
    const response = await this.getResponse(key)
    const json = await response.json()
    //todo : when we have better performance testing, consider caching
    //parsed json instead of reparsing if data is used multiple times
    debug('Getting JSON from context for key %s', key)
    debug(JSON.stringify(json))
    return json
  }

  async getText(key: string) {
    const response = await this.getResponse(key)
    const text = await response.text()
    debug('Getting text from context for key %s', key)
    debug(text)
    return text
  }

  hasData(key: string): boolean {
    return key in this.data
  }

  private readEnv(): { [k: string]: string } {
    const glbl: { [key: string]: any } = globalThis
    const result: { [key: string]: string } = {}
    for (const key in glbl) {
      if (typeof glbl[key] == 'string') {
        result[key] = glbl[key] as string
      }
    }
    return result
  }

  private async getResponse(key: string): Promise<Response> {
    // Cloudflare implementation of response.clone doesn't seem to allow multiple concurrent
    // reads of the body, so using tee()
    const response = await this.data[key]
    if (response && response.body) {
      const body = response.body.tee()
      this.data[key] = Promise.resolve(new Response(body[0], {}))
      return new Response(body[1], {})
    } else {
      throw new Error('Could not find any data for key: ' + key)
    }
  }
}
