import { Context } from '../context'
import { QueryElementHandler } from './query-element'

export class GraphQLElementHandler extends QueryElementHandler {
  query: string = ''
  constructor(context: Context) {
    super(context)
  }

  element(element: Element) {
    this.query = ''
    super.element(element)
  }

  async text(text: Text) {
    this.query += text.text
    if (text.lastInTextNode) {
      await this.executeQuery()
    }
  }

  getDataURL(): string {
    const q = encodeURIComponent(this.query)
    const v = encodeURIComponent(JSON.stringify(this.variables))
    return `${this.endpoint}?query=${q}&variables=${v}`
  }
}
