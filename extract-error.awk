BEGIN {
  printing = 0
  found_end = 0
}

/▲ Next\.js 15\.1\.7/ {
  printing = 1
  # Remove prefix if it exists
  clean_line = gensub(/^(#[0-9]* [0-9]*\.[0-9]*)?(.*)/, "\\2", "g", $0)
  buffer = clean_line
  next
}

/Next.js build worker exited with code: [^0]/ {
  if (printing) {
    print buffer
    exit
  }
}

{
  if (printing) {
    # Remove prefix if it exists
    clean_line = gensub(/^(#[0-9]* [0-9]*\.[0-9]*)?(.*)/, "\\2", "g", $0)
    buffer = buffer "\n" clean_line
  }
}
