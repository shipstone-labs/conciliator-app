BEGIN {
  printing = 0
  found_end = 0
  hasError = 0
}

/RUN pnpm build-wrappers/ {
  printing = 1
  # Remove prefix if it exists
  clean_line = gensub(/^(#[0-9]* [0-9]*\.[0-9]*)?(.*)/, "\\2", "g", $0)
  buffer = clean_line
  next
}

/Error/i {
  if (printing) {
    hasError = 1
  }
}

/DONE/ {
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
