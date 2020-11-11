import { Context } from '../context'
import { BaseElementHandler, ContextWriter } from './base-element'

export class RequestDataElementHandler extends BaseElementHandler {
  output!: ContextWriter

  constructor(context: Context) {
    super(context)
  }

  element(element: Element) {
    this.output = this.getContextWriter(element)
    if (!this.output.done) {
      const request = this.getRequest()
      this.output.putObject({
        url: request.url,
        headers: this.getHeaders(request),
        cf: request.cf,
        method: request.method,
      })
    }
    element.remove()
  }

  private getHeaders(request: Request): { [key: string]: string } {
    const result: { [key: string]: string } = {}
    for (const header of request.headers.entries()) {
      result[header[0]] = header[1]
    }
    return result
  }
}
