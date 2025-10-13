---
inclusion: always
---

# Project Structure

## Core Files

- **cli.js** - Main CLI entry point with argument parsing and orchestration
- **index.js** - Legacy single-page converter (backward compatibility)
- **convert-all-pages.js** - Legacy multi-page converter (backward compatibility)

## Modules (Separation of Concerns)

- **batchProcessor.js** - BatchProcessor class for multi-URL processing
  - Manages browser lifecycle
  - Handles retry logic
  - Generates processing summaries
  
- **fileNameGenerator.js** - File naming utilities
  - Sanitizes titles to safe filenames
  - Ensures unique filenames (adds counters for duplicates)
  - Extracts page titles or falls back to URL-based names
  
- **urlResolver.js** - URL input handling
  - Reads URLs from text files
  - Validates URL format
  - Filters comments and empty lines
  
- **progressReporter.js** - Console output formatting
  - Reports batch processing progress
  - Displays success/failure status
  - Generates summary statistics

## Output Structure

```
output/
├── batch_YYYYMMDD_HHMMSS/     # Batch processing output
│   ├── Page_Title_1.pdf
│   ├── Page_Title_2.pdf
│   └── batch_summary.json      # Processing results
├── temp_TIMESTAMP/             # Temporary files (cleaned up)
└── *.pdf                       # Individual PDFs
```

## Configuration Files

- **package.json** - Dependencies and npm scripts
- **.gitignore** - Excludes node_modules, output, temp directories
- **.kiro/** - Kiro IDE configuration and specs

## Specs Directory

- **.kiro/specs/multi-url-batch-processing/** - Feature specification
  - requirements.md - User stories and acceptance criteria
  - design.md - Architecture and implementation design
  - tasks.md - Implementation task breakdown

## Conventions

- Use CommonJS `require()` and `module.exports`
- Async functions for all I/O operations
- JSDoc comments for function documentation
- Japanese console output for user-facing messages
- English for code comments and documentation
- Error messages include helpful hints (💡 ヒント:)
- Status indicators use emoji (✅ ❌ ⚠️ 📄 🚀)
