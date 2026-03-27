# DebtPipe 💸

Unlimited Debt Snowball & Avalanche Simulator.

## Overview

DebtPipe is a standalone HTML tool designed to help you visualize and optimize your debt payoff strategy. It handles an unlimited number of debts and provides clear, actionable payoff schedules with PDF export capabilities.

## Core Features

- **Methods:** Supports Debt Snowball (lowest balance first) and Debt Avalanche (highest interest first).
- **Unlimited Scalability:** Import 30+, 100+, or 1000+ debts via CSV or manual entry.
- **Detailed Tracking:** Calculates monthly interest, principal reduction, and the "snowball effect" as debts are cleared.
- **Financial Projections:** Provides estimated debt-free dates, total interest saved, and a full transposed timeline.
- **PDF Export:** Generate a professional payoff report directly from the browser.

## Getting Started

1. Open `ui/index.html` in any modern web browser.
2. Enter your debts manually or upload a CSV.
3. Set your extra monthly payment and payoff method.
4. Click **Run** to generate your plan.

## CLI

DebtPipe includes a Node.js CLI for exporting debt data to CSV for use in external tools (spreadsheets, financial software, etc.).

### Requirements

- Node.js 18+

### Installation

```bash
npm install
# Run via: node cli.js --help
# Or link globally: npm link
```

### Usage

```bash
# Export debts from a JSON file to CSV
debtpipe --export-csv --input debts.json --output export.csv

# Print CSV to stdout (pipe to another tool)
debtpipe --export-csv --input debts.json

# With shorthand flags
debtpipe -e -i debts.json -o export.csv
```

### Input Formats

The CLI accepts two JSON input formats:

**AccountPipe unified storage** (`accounts` array):
```json
{
  "accounts": [
    {
      "id": "acc_xxx",
      "name": "Chase Sapphire",
      "mainCategory": "debt",
      "subtype": "credit_card",
      "currentBalance": 5200,
      "apr": 24.99,
      "creditLimit": 10000,
      "dueDate": 15,
      "minPayment": 104,
      "institution": "Chase"
    }
  ]
}
```

**DebtPipe native format** (flat array):
```json
[
  {
    "id": "xxx",
    "name": "Chase Sapphire",
    "balance": 5200,
    "interestRate": 24.99,
    "minPayment": 104,
    "dueDay": 15,
    "creditLimit": 10000
  }
]
```

### CSV Output Columns

| Column | Description |
|--------|-------------|
| `id` | Unique debt identifier |
| `creditor` | Name of the creditor/lender |
| `balance` | Current balance (USD) |
| `interest_rate` | Annual interest rate (APR %) |
| `minimum_payment` | Minimum monthly payment (USD) |
| `due_day` | Day of month payment is due (1-31) |
| `credit_limit` | Credit limit (USD, for credit cards) |
| `account_type` | Account subtype (credit_card, loan, etc.) |
| `institution` | Financial institution name |
| `notes` | Optional notes/memo |
| `created_at` | Date the account was created (YYYY-MM-DD) |
