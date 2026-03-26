/**
 * Smoke test for DebtPipe --export-csv
 * Tests CSV export with sample debt data.
 */

import { readFileSync, unlinkSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Sample debt data (AccountPipe format)
const sampleDebts = {
  accounts: [
    {
      id: 'acc_1234567_abc1234',
      name: 'Chase Sapphire Reserve',
      mainCategory: 'debt',
      subtype: 'credit_card',
      currentBalance: 5234.56,
      apr: 24.99,
      creditLimit: 10000,
      dueDate: 15,
      minPayment: 150,
      institution: 'Chase',
      createdAt: 1710000000000,
    },
    {
      id: 'acc_2234567_def5678',
      name: 'Auto Loan - Toyota',
      mainCategory: 'debt',
      subtype: 'loan',
      currentBalance: 12450.0,
      interestRate: 6.5,
      dueDate: 1,
      minPayment: 350,
      institution: 'Capital One Auto',
      createdAt: 1705000000000,
    },
    {
      id: 'acc_3234567_ghi9012',
      name: 'Wells Fargo Card',
      mainCategory: 'debt',
      subtype: 'credit_card',
      currentBalance: 2100.00,
      apr: 19.99,
      creditLimit: 5000,
      dueDate: 22,
      minPayment: 63,
      institution: 'Wells Fargo',
      createdAt: 1720000000000,
    },
  ],
};

// Sample DebtPipe native format (array)
const sampleDebtPipeNative = [
  {
    id: 'debt_1',
    name: 'Chase Sapphire Reserve',
    balance: 5234.56,
    interestRate: 24.99,
    minPayment: 150,
    dueDay: 15,
    creditLimit: 10000,
  },
  {
    id: 'debt_2',
    name: 'Auto Loan - Toyota',
    balance: 12450.0,
    interestRate: 6.5,
    minPayment: 350,
    dueDay: 1,
    creditLimit: 0,
  },
];

const SAMPLE_INPUT = join(__dirname, 'test-sample-debts.json');
const SAMPLE_OUTPUT = join(__dirname, 'test-export-output.csv');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log('  ✓', msg);
    passed++;
  } else {
    console.error('  ✗', msg);
    failed++;
  }
}

function run(cliArgs) {
  const cmd = `node "${join(__dirname, 'cli.js')}" ${cliArgs}`;
  try {
    return execSync(cmd, { encoding: 'utf8', shell: true });
  } catch (err) {
    return err.stdout || err.message;
  }
}

console.log('\nDebtPipe --export-csv smoke tests\n');

// Write sample input file
import { writeFileSync } from 'fs';
writeFileSync(SAMPLE_INPUT, JSON.stringify(sampleDebts));

// Test 1: Export to stdout
console.log('Test 1: Export AccountPipe JSON format to stdout');
const stdout = run(`--export-csv --input "${SAMPLE_INPUT}"`);
assert(stdout.includes('creditor'), 'CSV contains "creditor" header');
assert(stdout.includes('Chase Sapphire Reserve'), 'CSV contains debt name');
assert(stdout.includes('5234.56'), 'CSV contains balance');
assert(stdout.includes('24.99'), 'CSV contains interest rate');
assert(stdout.includes('150.00'), 'CSV contains minimum payment');
assert(stdout.includes('credit_card'), 'CSV contains account_type');
assert(stdout.includes('Chase'), 'CSV contains institution');
assert(stdout.includes('\n'), 'CSV has multiple lines (more than 1 debt)');

// Test 2: Export to file
console.log('\nTest 2: Export to file via --output');
run(`--export-csv --input "${SAMPLE_INPUT}" --output "${SAMPLE_OUTPUT}"`);
const fileOutput = existsSync(SAMPLE_OUTPUT) ? readFileSync(SAMPLE_OUTPUT, 'utf8') : '';
assert(existsSync(SAMPLE_OUTPUT), 'Output file was created');
assert(fileOutput.includes('creditor'), 'File CSV contains "creditor" header');
assert(fileOutput.includes('Auto Loan - Toyota'), 'File CSV contains second debt');

// Test 3: Empty state
console.log('\nTest 3: Empty data handling');
import { writeFileSync as wf2 } from 'fs';
wf2(SAMPLE_INPUT, JSON.stringify({ accounts: [] }));
const emptyOut = run(`--export-csv --input "${SAMPLE_INPUT}"`);
assert(emptyOut.includes('id,creditor,balance'), 'Empty CSV still has headers');

// Test 4: DebtPipe native format (array)
console.log('\nTest 4: DebtPipe native array format');
wf2(SAMPLE_INPUT, JSON.stringify(sampleDebtPipeNative));
const nativeOut = run(`--export-csv --input "${SAMPLE_INPUT}"`);
assert(nativeOut.includes('Chase Sapphire Reserve'), 'Native format: debt name present');
assert(nativeOut.includes('12450.00'), 'Native format: second debt balance present');

// Test 5: CSV field escaping (commas in names)
console.log('\nTest 5: CSV field escaping');
wf2(SAMPLE_INPUT, JSON.stringify({
  accounts: [{
    id: 'acc_test',
    name: 'Bank of America, Platinum',
    mainCategory: 'debt',
    subtype: 'credit_card',
    currentBalance: 100,
    apr: 18.0,
    createdAt: 1710000000000,
  }]
}));
const escapedOut = run(`--export-csv --input "${SAMPLE_INPUT}"`);
assert(escapedOut.includes('"Bank of America, Platinum"'), 'Comma in name is properly escaped');

// Cleanup
unlinkSync(SAMPLE_INPUT);
if (existsSync(SAMPLE_OUTPUT)) unlinkSync(SAMPLE_OUTPUT);

console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
