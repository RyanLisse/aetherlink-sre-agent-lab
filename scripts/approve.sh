#!/usr/bin/env sh
# Run by a HUMAN (the hook blocks Claude). Thin wrapper: the logic lives in approve.mjs so Windows, macOS,
# Linux and the container behave the same. Usage: scripts/approve.sh <name> <branch> "<reason>"
exec node "$(dirname "$0")/approve.mjs" "$@"
