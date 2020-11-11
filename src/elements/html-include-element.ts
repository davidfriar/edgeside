import { Context } from '../context'
import { BaseElementHandler, ContextReader } from './base-element'

declare const ORIGIN_PATH_PREFIX: string

export class HTMLIncludeElementHandler extends BaseElementHandler {
  input?: ContextReader
  endpoint!: string
  cacheTTL!: number

  constructor(context: Context) {
    super(context)
  }

  async element(element: Element) {
    this.input = this.getOptionalContextReader(element)
    this.endpoint = this.getAttribute('endpoint', element)
    this.cacheTTL = this.getOptionalNumberAttribute('cache-ttl', element, 60)
    element.after(await this.fetchHTML(), { html: true })
    element.remove()
  }

  private async fetchHTML(): Promise<string> {
    const url = await this.getIncludeURL()
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
        Accept: 'text/html',
      },
      cf: { cacheTtl: this.cacheTTL, cacheEverything: true },
    })
    if (response.ok) {
      return response.text()
    } else {
      console.log('%s did not return OK', url.toString())
      return ''
    }
  }

  private async getIncludeURL(): Promise<string> {
    let url = this.endpoint
    if (this.input) {
      await this.input.replaceExpressions(this.endpoint)
    }
    if (url.startsWith('/')) {
      try {
        url = '/' + ORIGIN_PATH_PREFIX + url
      } catch (e) {
        //ignore
      }
    }
    const absoluteURL = new URL(url, this.getOriginURL())
    return absoluteURL.toString()
  }
}
