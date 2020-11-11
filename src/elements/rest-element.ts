import { Context } from '../context'
import { QueryElementHandler } from './query-element'

export class RESTElementHandler extends QueryElementHandler {
  constructor(context: Context) {
    super(context)
  }

  async element(element: Element) {
    super.element(element)
    await this.executeQuery()
  }

  getDataURL(): string {
    const url = new URL(this.endpoint)
    Object.entries(this.variables).forEach(([name, value]) => {
      if (name.startsWith('$')) {
        url.pathname = url.pathname
          .split('/')
          .map((s) => (s === name ? value : s))
          .join('/')
      } else {
        url.searchParams.append(name, value)
      }
    })
    return url.toString()
  }
}
