/**
 * 网址处理工具：补全协议、校验、提取主机名。
 */
export class UrlUtils {
  /**
   * 补全协议：没有协议时默认 https://，返回去掉首尾空白的地址。
   */
  static normalize(input: string): string {
    const value = input.trim()
    if (value.length === 0) {
      return ''
    }
    if (UrlUtils.hasScheme(value)) {
      return value
    }
    return 'https://' + value
  }

  /**
   * 判断字符串是否已经带有合法协议头（如 https://、http://）。
   */
  static hasScheme(value: string): boolean {
    const index = value.indexOf('://')
    if (index <= 0) {
      return false
    }
    const scheme = value.substring(0, index)
    for (let i = 0; i < scheme.length; i++) {
      const ch = scheme.charAt(i)
      const isAlpha = (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')
      const isDigit = ch >= '0' && ch <= '9'
      if (i === 0) {
        if (!isAlpha) {
          return false
        }
      } else if (!isAlpha && !isDigit && ch !== '+' && ch !== '-' && ch !== '.') {
        return false
      }
    }
    return true
  }

  /**
   * 是否是可交给 Web 组件加载的网页地址。
   */
  static isWebUrl(url: string): boolean {
    const lower = url.toLowerCase()
    return lower.startsWith('http://') || lower.startsWith('https://')
  }

  /**
   * 是否是 http 明文地址（内网调试常见）。
   */
  static isPlainHttp(url: string): boolean {
    return url.toLowerCase().startsWith('http://')
  }

  /**
   * 提取主机名（含端口），用于列表副标题和默认名称。
   */
  static hostOf(url: string): string {
    let rest = url
    const schemeIndex = url.indexOf('://')
    if (schemeIndex >= 0) {
      rest = url.substring(schemeIndex + 3)
    }
    let end = rest.length
    const slash = rest.indexOf('/')
    if (slash >= 0 && slash < end) {
      end = slash
    }
    const query = rest.indexOf('?')
    if (query >= 0 && query < end) {
      end = query
    }
    const hash = rest.indexOf('#')
    if (hash >= 0 && hash < end) {
      end = hash
    }
    return rest.substring(0, end)
  }
}
