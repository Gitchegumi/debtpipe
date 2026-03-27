#!/usr/bin/env node
/**
 * DebtPipe CLI
 *
 * Usage:
 *   debtpipe --export-csv [--output <path>] [--input <path>]
 *   debtpipe --export-csv --input debts.json
 *   debtpipe --export-csv > debts.csv
 *
 * DebtPipe stores debt data as CSV-formatted text in localStorage.
 * This CLI reads from a JSON file (or stdin) and exports proper CSV.
 *
 * Input JSON shape (from AccountPipe unified storage):
 * {
 *   "accounts": [
 *     {
 *       "id": "acc_xxx",
 *       "name": "Chase Sapphire",
 *       "mainCategory": "debt",
 *       "subtype": "credit_card",
 *       "currentBalance": 5200,
 *       "apr": 24.99,
 *       "creditLimit": 10000,
 *       "dueDate": 15,
 *       "minPayment": 104,
 *       "institution": "Chase",
 *       "createdAt": 1710000000000
 *     }
 *   ]
 * }
 *
 * Or from DebtPipe's own format (array of DebtItem):
 * [
 *   {
 *     "id": "xxx",
 *     "name": "Chase Sapphire",
 *     "balance": 5200,
 *     "interestRate": 24.99,
 *     "minPayment": 104,
 *     "dueDay": 15,
 *     "creditLimit": 10000
 *   }
 * ]
 */

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { parseArgs } from 'util';

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

const CSV_HEADERS = [
  'id',
  'creditor',
  'balance',
  'interest_rate',
  'minimum_payment',
  'due_day',
  'credit_limit',
  'account_type',
  'institution',
  'notes',
  'created_at',
];

/**
 * Escape a value for CSV: wrap in quotes if it contains comma/newline/quote,
 * otherwise return as-is.
 */
function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of debt objects to CSV string.
 * Handles both DebtPipe DebtItem[] and AccountPipe AccountsData formats.
 */
function debtsToCSV(debts) {
  const lines = [CSV_HEADERS.join(',')];

  for (const debt of debts) {
    // Support both DebtItem (balance/interestRate/dueDay) and
    // AccountPipe debt account (currentBalance/apr/dueDate) field names
    const balance = debt.balance ?? debt.currentBalance ?? 0;
    const interestRate = debt.interestRate ?? debt.apr ?? 0;
    const dueDay = debt.dueDay ?? debt.dueDate ?? '';
    const rawCreditLimit = debt.creditLimit ?? '';
    const creditLimit = rawCreditLimit !== '' ? Number(rawCreditLimit).toFixed(2) : '';
    const accountType = debt.subtype ?? debt.accountType ?? '';
    const institution = debt.institution ?? '';
    const notes = debt.notes ?? debt.memo ?? '';
    const createdAt = debt.createdAt
      ? new Date(debt.createdAt).toISOString().slice(0, 10)
      : '';

    const row = [
      csvEscape(debt.id ?? ''),
      csvEscape(debt.name ?? ''),
      csvEscape(typeof balance === 'number' ? balance.toFixed(2) : balance),
      csvEscape(typeof interestRate === 'number' ? interestRate.toFixed(4) : interestRate),
      csvEscape(typeof (debt.minPayment) === 'number' ? debt.minPayment.toFixed(2) : debt.minPayment ?? '0.00'),
      csvEscape(dueDay),
      csvEscape(creditLimit),
      csvEscape(accountType),
      csvEscape(institution),
      csvEscape(notes),
      csvEscape(createdAt),
    ];

    lines.push(row.join(','));
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------------------

/**
 * Load and parse debt data from a JSON file path.
 * Handles both DebtItem[] arrays and AccountPipe AccountsData objects.
 */
function loadDebtsFromFile(filePath) {
  const raw = readFileSync(filePath, 'utf8').trim();
  const data = JSON.parse(raw);

  // AccountPipe unified storage format
  if (data.accounts && Array.isArray(data.accounts)) {
    return data.accounts.filter(
      (a) => a.mainCategory === 'debt' || a.subtype === 'credit_card' || a.subtype === 'loan'
    );
  }

  // DebtPipe native format (array of DebtItem)
  if (Array.isArray(data)) {
    return data;
  }

  throw new Error(`Unrecognized JSON format in ${filePath}`);
}

/**
 * Parse CSV text into DebtItem objects (DebtPipe's native storage format).
 * This is the format DebtPipe uses in localStorage: name,balance,rate,min,due,limit
 */
function parseDebtPipeCSV(csvText) {
  return csvText
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line, idx) => {
      const parts = line.split(',').map((s) => s.trim());
      let rate = parseFloat(parts[2]) || 0;
      if (rate < 1 && rate > 0) rate = rate * 100;
      return {
        id: parts[6] || `debt_${idx}`,
        name: parts[0] || 'Unknown',
        balance: parseFloat(parts[1]) || 0,
        interestRate: parseFloat(rate.toFixed(4)),
        minPayment: parseFloat(parts[3]) || 0,
        dueDay: parseInt(parts[4]) || 1,
        creditLimit: parseFloat(parts[5]) || 0,
      };
    });
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

function main() {
  const { values, positionals } = parseArgs({
    options: {
      'export-csv': { type: 'boolean', default: false, short: 'e' },
      output: { type: 'string', short: 'o' },
      input: { type: 'string', short: 'i' },
      help: { type: 'boolean', default: false, short: 'h' },
    },
    allowPositionals: true,
    strict: false,
  });

  if (values.help || (!values['export-csv'] && positionals[0] !== 'export-csv')) {
    console.log(`
DebtPipe CLI — Unlimited Debt Snowball & Avalanche Simulator

Usage:
  debtpipe --export-csv [--output <path>] [--input <path>]
  debtpipe --export-csv --input debts.json --output debts.csv
  debtpipe --export-csv --input debts.json          # prints to stdout

Options:
  --export-csv, -e    Export debts to CSV format
  --output, -o        Output file path (prints to stdout if omitted)
  --input, -i         Input JSON file (from AccountPipe export or DebtPipe JSON)
  --help, -h         Show this help message

Examples:
  debtpipe --export-csv --input my-debts.json --output export.csv
  debtpipe -e -i debts.json > debts.csv
`);
    process.exit(0);
  }

  if (!values.input) {
    console.error('Error: --input <path> is required');
    console.error('Run "debtpipe --help" for usage information.');
    process.exit(1);
  }

  let debts;
  try {
    debts = loadDebtsFromFile(values.input);
  } catch (err) {
    // If JSON parse fails, try treating it as DebtPipe CSV text
    try {
      debts = parseDebtPipeCSV(readFileSync(values.input, 'utf8'));
    } catch {
      console.error(`Error reading input file: ${err.message}`);
      process.exit(1);
    }
  }

  if (debts.length === 0) {
    const empty = debtsToCSV([]);
    if (values.output) {
      writeFileSync(values.output, empty + '\n');
      console.error('No debts found; empty CSV written.');
    } else {
      console.log(empty);
    }
    process.exit(0);
  }

  const csv = debtsToCSV(debts);

  if (values.output) {
    writeFileSync(values.output, csv + '\n');
    console.error(`Exported ${debts.length} debt(s) to ${values.output}`);
  } else {
    console.log(csv);
  }
}

main();
