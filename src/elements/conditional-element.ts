import { Context } from '../context'
import { BaseElementHandler, ContextReader } from './base-element'
import { parse, eval } from 'expression-eval'

export class ConditionalElementHandler extends BaseElementHandler {
  input!: ContextReader

  constructor(context: Context) {
    super(context)
  }

  async element(element: Element) {
    this.input = this.getContextReader(element)
    const expression = this.getAttribute('expression', element)
    const ast = parse(expression)
    const data = await this.input.getJSON()
    const result = eval(ast, data)
    if (result) {
      element.removeAndKeepContent()
    } else {
      element.remove()
    }
  }
}
