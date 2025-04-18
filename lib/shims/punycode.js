// Empty replacement for punycode
module.exports = {
  decode: function(string) { return string; },
  encode: function(string) { return string; },
  toASCII: function(domain) { return domain; },
  toUnicode: function(domain) { return domain; },
};