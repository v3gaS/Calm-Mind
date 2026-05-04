#!/bin/bash
# Double-click this in Finder to start CalmMind (macOS).
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
exec node "$DIR/launch.cjs"
