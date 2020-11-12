export class URLRewriter {
  rules: Array<[string, string]>

  constructor(rules: Array<[string, string]>) {
    this.rules = rules
  }

  rewrite(path: string): string {
    for (let rule of this.rules) {
      const regex = new RegExp(rule[0])
      const replacement = rule[1]
      const newpath = path.replace(regex, replacement)
      if (newpath != path) {
        return newpath
      }
    }
    return path
  }
}
