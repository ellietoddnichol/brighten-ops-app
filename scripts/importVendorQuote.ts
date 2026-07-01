#!/usr/bin/env node
import { importVendorQuoteFromCsv, printImportSummary } from './lib/vendorQuoteImport.ts'

function parseArgs(argv: string[]) {
  const options: {
    filePath?: string
    projectNameOverride?: string
    vendorNameOverride?: string
    quoteNumberOverride?: string
  } = {}

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]

    if (arg === '--file' || arg === '-f') {
      options.filePath = next
      i += 1
    } else if (arg === '--project') {
      options.projectNameOverride = next
      i += 1
    } else if (arg === '--vendor') {
      options.vendorNameOverride = next
      i += 1
    } else if (arg === '--quote') {
      options.quoteNumberOverride = next
      i += 1
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return options
}

function printHelp() {
  console.log(`Usage: npm run import:quote -- --file <path> [options]

Options:
  --file, -f     Path to vendor quote CSV (required)
  --project      Override project_name from CSV
  --vendor       Override vendor_name from CSV
  --quote        Override quote_number from CSV
  --help, -h     Show this help

Template: data/imports/templates/vendor_quote_import_template.csv
Docs:     data/imports/README.md
`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.filePath) {
    printHelp()
    process.exit(1)
  }

  const summary = await importVendorQuoteFromCsv({
    filePath: args.filePath,
    projectNameOverride: args.projectNameOverride,
    vendorNameOverride: args.vendorNameOverride,
    quoteNumberOverride: args.quoteNumberOverride,
  })

  printImportSummary(summary)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
