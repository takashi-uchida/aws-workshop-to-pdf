---
inclusion: always
---

# Product Overview

Web to PDF Converter - A universal tool for converting web pages to PDF using Playwright.

## Core Purpose

Convert any web page or entire website to PDF format with flexible configuration options. Supports single-page conversion, multi-page site crawling, and batch processing of multiple URLs.

## Key Features

- Single and multi-page conversion modes
- Batch processing of multiple URLs from file input
- Automatic file naming from page titles
- Customizable CSS selectors for navigation links
- PDF format customization (size, orientation, margins)
- Lazy loading support for dynamic content
- Progress reporting and error handling with retry logic

## Target Use Cases

- Converting AWS Workshop documentation
- Archiving documentation sites
- Batch processing multiple web pages
- Creating offline copies of web content

## Output

PDFs are saved to `output/` directory with:
- Title-based automatic file naming
- Timestamped batch directories for multi-URL processing
- JSON summary files for batch operations
