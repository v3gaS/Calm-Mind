#!/usr/bin/env python3
"""Deprecated: synthetic promo GIF. Use scripts/capture-app-promo.mjs for real app capture."""
import sys

print(
    "Use: npm run dev (or launch) then node scripts/capture-app-promo.mjs",
    file=sys.stderr,
)
sys.exit(1)
