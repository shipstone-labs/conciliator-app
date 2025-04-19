#!/bin/zsh
if docker build -t testing -f Dockerfile.test .
then
  docker run testing
else
  echo "Build failed"
  exit 1
fi