#!/bin/bash

INCLUDES=()
EXCLUDES=('Visual Studio' 'Discord Helper' 'GitKraken' 'Obsidian' 'grep node' 'nodeps')

# Default includes - common dev servers
DEFAULT_INCLUDES=('nuxt dev' 'nuxt start' 'next-server' 'next start' 'next dev' 'astro' 'node' 'vite' 'webpack' 'parcel' 'react-scripts' 'vue-cli-service')

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -i|--include)
      INCLUDES+=("$2")
      shift 2
      ;;
    -e|--exclude)
      EXCLUDES+=("$2")
      shift 2
      ;;
    -h|--help)
      echo "Usage: $(basename "$0") [options]"
      echo "Options:"
      echo "  -i, --include PATTERN    Include processes matching PATTERN"
      echo "  -e, --exclude PATTERN    Exclude processes matching PATTERN"
      echo "  -h, --help               Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# If no includes specified, use defaults
if [ ${#INCLUDES[@]} -eq 0 ]; then
  INCLUDES=("${DEFAULT_INCLUDES[@]}")
fi

# Start with all node processes
CMD="ps ax"

# Add excludes
for EXCL in "${EXCLUDES[@]}"; do
  CMD+=" | grep -v -e '$EXCL'"
done

# Filter for includes if specified
if [ ${#INCLUDES[@]} -gt 0 ]; then
  INCLUDE_PATTERN=$(printf "%s\|" "${INCLUDES[@]}" | sed 's/\\\|$//')
  echo "$INCLUDE_PATTERN"
  CMD+=" | grep -e '$INCLUDE_PATTERN'"
fi

CMD+=" | grep -v ' grep '"
eval "$CMD"