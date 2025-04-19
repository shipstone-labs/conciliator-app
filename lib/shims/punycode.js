// Empty replacement for punycode
module.exports = {
  decode: (string) => {
    return string
  },
  encode: (string) => {
    return string
  },
  toASCII: (domain) => {
    return domain
  },
  toUnicode: (domain) => {
    return domain
  },
}
