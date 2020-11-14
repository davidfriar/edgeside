declare const DEBUG: string

export function debug(...data: any[]) {
  if (DEBUG == 'true') {
    console.log(data)
  }
}
