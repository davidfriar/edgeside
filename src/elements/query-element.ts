import { Context } from '../context'
import {
  BaseElementHandler,
  ContextReader,
  ContextWriter,
  replaceExpressions,
} from './base-element'

declare const DEBUG: string

export abstract class QueryElementHandler extends BaseElementHandler {
  endpoint!: string
  cacheTTL!: number
  input?: ContextReader
  output!: ContextWriter

  variables: { [key: string]: any } = {}
  url: URL

  constructor(context: Context) {
    super(context)
    this.url = new URL(context.request.url)
  }

  element(element: Element) {
    this.output = this.getContextWriter(element)
    if (!this.output.done) {
      this.input = this.getOptionalContextReader(element)
      this.endpoint = this.getAttribute('endpoint', element)
      this.cacheTTL = this.getOptionalNumberAttribute('cache-ttl', element, 60)
      this.variables = this.parseParameterMap(
        this.getOptionalAttribute('parameter-map', element),
      )
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
      if (this.input && paramName.indexOf('$') > -1) {
        return paramName
      } else {
        return this.url.searchParams.get(paramName)
      }
    }
  }

  storeData(promise: Promise<Response>) {
    this.output.put(promise)
  }

  abstract getDataURL(): string

  fetchData(): Promise<Response> {
    const url = this.getDataURL()
    if (DEBUG == 'true') {
      console.log('fetching data from:' + url.toString())
    }
    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      cf: { cacheTtl: this.cacheTTL, cacheEverything: true },
    })
  }

  async executeQuery() {
    if (this.output.done) {
      return
    }
    if (DEBUG == 'true') {
      console.log('Variables before replacement = ', this.variables)
    }
    if (this.input) {
      const data = await this.input.getJSON()
      for (const key in this.variables) {
        this.variables[key] = replaceExpressions(this.variables[key], data)
      }
    }
    if (DEBUG == 'true') {
      console.log('Variables after replacement = ', this.variables)
    }
    this.storeData(this.fetchData())
  }
}
