import { Context } from '../context'
import { parse, eval } from 'expression-eval'
import { decode } from 'he'
import { debug } from '../util'
import { Cookie } from '../types'

const ATTR_PREFIX = 'data-edgeside-'

class ContextWrapper {
  protected context: Context
  protected key: string

  constructor(context: Context, key: string) {
    this.context = context
    this.key = key
  }
}

export class ContextReader extends ContextWrapper {
  constructor(context: Context, key: string) {
    super(context, key)
  }

  async getJSON(): Promise<any> {
    return this.context.getJSON(this.key)
  }

  async getText(): Promise<string> {
    return this.context.getText(this.key)
  }

  async replaceExpressions(s: string, data?: any): Promise<string> {
    if (data) {
      return replaceExpressions(s, data)
    } else if (this.context.hasData(this.key)) {
      return replaceExpressions(s, await this.getJSON())
    } else {
      return s
    }
  }
}

export class ContextWriter extends ContextWrapper {
  constructor(context: Context, key: string) {
    super(context, key)
  }

  put(promise: Promise<Response>) {
    this.context.put(this.key, promise)
  }

  putObject(obj: any) {
    this.put(Promise.resolve(new Response(JSON.stringify(obj), {})))
  }

  get done(): boolean {
    return this.context.hasData(this.key)
  }
}

export abstract class BaseElementHandler {
  private context: Context

  constructor(context: Context) {
    this.context = context
  }

  protected getOriginURL() {
    return this.context.originURL
  }

  protected getRequest() {
    return this.context.request
  }

  protected getContextReader(element: Element): ContextReader {
    return new ContextReader(this.context, this.getAttribute('input', element))
  }

  protected getContextWriter(element: Element): ContextWriter {
    return new ContextWriter(this.context, this.getAttribute('output', element))
  }

  protected getOptionalContextReader(element: Element): ContextReader | undefined {
    if (this.hasAttribute('input', element)) {
      return new ContextReader(this.context, this.getAttribute('input', element))
    } else {
      return undefined
    }
  }

  protected getOptionalContextWriter(element: Element): ContextReader | undefined {
    if (this.hasAttribute('output', element)) {
      return new ContextReader(this.context, this.getAttribute('output', element))
    } else {
      return undefined
    }
  }

  protected getAttribute(name: string, element: Element): string {
    const value = element.getAttribute(ATTR_PREFIX + name)
    if (!value) {
      const elementType = element.getAttribute('type')
      throw new Error(`Element '${elementType}' is missing required attribute: ${name}`)
    }
    return decode(value, { isAttributeValue: true })
  }

  protected getOptionalAttribute(
    name: string,
    element: Element,
    defaultValue?: string,
  ): string | undefined {
    if (this.hasAttribute(name, element)) {
      return this.getAttribute(name, element)
    } else {
      return defaultValue
    }
  }

  protected getAttributeOr(name: string, element: Element, fallback?: string): string {
    const result = this.getOptionalAttribute(name, element, fallback)
    if (result) {
      return result
    } else {
      const elementType = element.getAttribute('type')
      throw new Error(`Element '${elementType}' is missing required attribute: ${name}`)
    }
  }

  protected getOptionalNumberAttribute(
    name: string,
    element: Element,
    defaultValue: number,
  ): number {
    if (this.hasAttribute(name, element)) {
      return parseInt(this.getAttribute(name, element))
    } else {
      return defaultValue
    }
  }

  protected hasAttribute(attributeName: string, element: Element): boolean {
    return element.hasAttribute(ATTR_PREFIX + attributeName)
  }

  protected replaceGlobalExpressions(s: string) {
    return replaceExpressions(s, this.context.env)
  }

  protected getCookie(name: string): Cookie {
    return this.context.cookies[name]
  }

  protected get sessionCookie(): Cookie {
    return this.getCookie('edgeside-session')
  }

  protected get permanentCookie(): Cookie {
    return this.getCookie('edgeside-permanent')
  }
}

function replaceExpressions(s: string, data: any): string {
  debug('entering replaceExpressions. data:', data)
  debug('replacing in string:', s)
  // match expressions like ${foo}
  const re = /\$\{[^}]*\}/g
  return s.replace(re, (x) => {
    debug('replacing', x)
    //use a function to evaluate any matches
    const expression = x.substring(2, x.length - 1) // remove the '${' and '}'
    debug('expression', expression)
    try {
      const ast = parse(expression)
      const result = eval(ast, data)
      debug('result', result)
      return result ?? x
    } catch (err) {
      debug('could not evaluate, returning string unchanged')
      return x
    }
  })
}
