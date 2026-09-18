#!/usr/bin/env bash

ensure_codegraph() {
  command -v codegraph >/dev/null 2>&1 && return 0

  command -v npm >/dev/null 2>&1 || {
    printf 'Missing npm; cannot install CodeGraph.\n' >&2
    return 1
  }
  printf 'Installing CodeGraph (@colbymchenry/codegraph@1.6.0)...\n'
  npm install --global '@colbymchenry/codegraph@1.6.0'
  command -v codegraph >/dev/null 2>&1 || {
    printf 'CodeGraph installation completed but codegraph is not on PATH.\n' >&2
    return 1
  }
}
