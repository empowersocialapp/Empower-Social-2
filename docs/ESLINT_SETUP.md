# ESLint Setup Guide

## Overview

ESLint has been configured to catch syntax errors and code quality issues before they reach production.

## Quick Commands

```bash
# Check for linting errors
npm run lint

# Automatically fix fixable errors (trailing spaces, etc.)
npm run lint:fix
```

## Pre-commit Hook

A Git pre-commit hook automatically runs ESLint before each commit. If there are **errors** (not warnings), the commit will be blocked.

### Bypassing the hook (if needed)

If you need to commit with errors (not recommended), use:
```bash
git commit --no-verify
```

## Common Issues and Fixes

### Trailing Spaces
**Error:** `Trailing spaces not allowed`
**Fix:** Run `npm run lint:fix` or manually remove trailing spaces

### Trailing Commas
**Error:** `Unexpected trailing comma`
**Fix:** Remove the comma or update ESLint config if needed

### Missing Semicolons
**Error:** `Missing semicolon`
**Fix:** Add semicolon or run `npm run lint:fix`

## Configuration

ESLint configuration is in `.eslintrc.json`. Key rules:
- **Errors** (block commits): Syntax errors, missing semicolons, trailing commas
- **Warnings** (don't block commits): Indentation, unused variables

## Fixing All Auto-fixable Issues

Run this to automatically fix most formatting issues:
```bash
npm run lint:fix
```

This will fix:
- Trailing spaces
- Missing semicolons
- Some indentation issues

## What Gets Linted

- All `.js` files in `frontend/` directory
- All `.js` files in `backend/` directory
- Excludes `node_modules/` automatically

## Troubleshooting

If ESLint is too strict, you can:
1. Temporarily disable rules in `.eslintrc.json`
2. Use `// eslint-disable-next-line` comments for specific lines
3. Use `--no-verify` to bypass the hook (not recommended)


