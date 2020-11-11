import { Context } from '../context'
import { BaseElementHandler, ContextReader } from './base-element'

export class DebugElementHandler extends BaseElementHandler {
  input!: ContextReader

  constructor(context: Context) {
    super(context)
  }

  async element(element: Element) {
    this.input = this.getContextReader(element)
    element.after(await this.input.getText())
    element.remove()
  }
}
