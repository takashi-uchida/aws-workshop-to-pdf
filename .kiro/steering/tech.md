---
inclusion: always
---

# Technical Stack

## Runtime & Language

- Node.js
- JavaScript (CommonJS modules)

## Core Dependencies

- **playwright** - Browser automation for page rendering and PDF generation
- **pdf-lib** - PDF manipulation and merging
- **commander** - CLI argument parsing

## Project Structure

- Entry point: `cli.js` (executable CLI tool)
- Module pattern: Separate concerns into focused modules
- No build step required - runs directly with Node.js

## Common Commands

```bash
# Install dependencies and Playwright browsers
npm install

# Run CLI tool
node cli.js [options]

# Single page conversion
npm run convert-single

# Multi-page conversion (default)
npm run convert-multi

# Batch processing from file
npm run convert-batch

# AWS Workshop preset
npm run convert-workshop

# Legacy scripts (backward compatibility)
npm run legacy-single
npm run legacy-multi
```

## Testing & Development

- No automated tests currently implemented
- Manual testing via CLI commands
- Playwright browser installation: `npx playwright install chromium`

## Key Technical Patterns

- Async/await for all I/O operations
- Browser instance reuse in batch processing
- Retry logic (3 attempts) for network failures
- Graceful error handling - continue processing on individual failures
- File system operations use `fs.promises` API
