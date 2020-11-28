import { Context } from '../context'
import { BaseElementHandler, ContextReader, ContextWriter } from './base-element'
import { debug } from '../util'

export abstract class QueryElementHandler extends BaseElementHandler {
  endpoint!: string
  cacheTTL!: number
  input?: ContextReader
  output!: ContextWriter

  variables: { [key: string]: any } = {}
  url: URL
  method: string
  body: string | undefined

  constructor(context: Context) {
    super(context)
    this.url = new URL(context.request.url)
    this.method = 'GET'
    this.cacheTTL = 60
  }

  element(element: Element) {
    this.output = this.getContextWriter(element)
    if (!this.output.done) {
      this.input = this.getOptionalContextReader(element)
      this.endpoint = this.getAttributeOr('endpoint', element, this.endpoint)
      this.cacheTTL = this.getOptionalNumberAttribute('cache-ttl', element, this.cacheTTL)
      this.variables = this.parseParameterMap(this.getOptionalAttribute('parameter-map', element))
    }
    element.remove()
  }

  parseParameterMap(parameterMap: string | undefined) {
    if (parameterMap) {
      return Object.fromEntries(
        parameterMap
          .trim()
          .split(/\s*,\s*/)
          .map((x) => x.split(/\s*\:\s*/, 2))
          .map((x) => (x.length == 1 ? x.concat(x) : x))
          .map(([k, v]) => [k, this.getParam(v)]),
      )
    } else {
      return {}
    }
  }

  getParam(paramName: string) {
    const match = paramName.match(/\/(\d*)$/) // match "/" followed by digits and nothing else
    if (match && match.length) {
      const n = parseInt(match[1])
      const segments = this.url.pathname.split('/')
      return segments[segments.length - n - 1]
    } else {
      if (paramName.indexOf('$') > -1) {
        return this.replaceGlobalExpressions(paramName)
      } else {
        return this.url.searchParams.get(paramName)
      }
    }
  }

  storeData(promise: Promise<Response>) {
    this.output.put(promise)
  }

  abstract getDataURL(): string

  getHeaders(): { [key: string]: string } {
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    Object.entries(this.variables).forEach(([name, value]) => {
      if (name.startsWith('#')) {
        headers[name.substring(1)] = value
      }
    })
    debug('headers', headers)
    return headers
  }

  fetchData(): Promise<Response> {
    const url = this.getDataURL()
    debug('fetching data from:' + url.toString())
    return fetch(url, {
      method: this.method,
      headers: this.getHeaders(),
      cf: { cacheTtl: this.cacheTTL, cacheEverything: true },
      body: this.body,
    })
  }

  async executeQuery() {
    if (this.output.done) {
      return
    }
    debug('Variables before replacement = ', this.variables)
    if (this.input) {
      const data = await this.input.getJSON()
      for (const key in this.variables) {
        this.variables[key] = await this.input.replaceExpressions(this.variables[key], data)
      }
    }
    debug('Variables after replacement = ', this.variables)
    this.storeData(this.fetchData())
  }
}
