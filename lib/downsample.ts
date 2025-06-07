export function downsample(content: string) {
  return content.replace(/([\d,.]+)/g, (_match, number) => {
    try {
      const num = Number.parseFloat(number)
      if (num === 0) {
        return number
      }
      if (Number.isNaN(num)) return number
      const min = Math.round(num) * 0.9
      const max = Math.round(num) * 1.1
      const decimals = /\.(\d+)/.exec(number)?.[1]?.length || 0
      let attempts = 5
      while (attempts--) {
        const num2 = Math.random() * (max - min) + min
        if (Math.abs((num2 - num) / num) > 0.05) {
          return num2.toFixed(decimals)
        }
      }
      // Fallback: return a value at the edge of the range
      return (Math.random() > 0.5 ? max : min).toFixed(decimals)
    } catch {
      return number
    }
  })
}
