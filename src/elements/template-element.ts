import { Context } from '../context'
import Mustache from 'mustache'
import { BaseElementHandler, ContextReader } from './base-element'

export class TemplateElementHandler extends BaseElementHandler {
  input!: ContextReader
  template!: string

  constructor(context: Context) {
    super(context)
  }

  element(element: Element) {
    this.input = this.getContextReader(element)
    this.template = ''
    element.removeAndKeepContent()
  }

  async text(text: Text) {
    this.template += text.text
    text.remove()
    if (text.lastInTextNode) {
      const json = await this.input.getJSON()
      text.after(Mustache.render(this.template, json), { html: true })
    }
  }
}
