# DebtPipe 💸

Unlimited Debt Snowball & Avalanche Simulator.

## Overview

DebtPipe is a Python-based tool designed to help you visualize and optimize your debt payoff strategy. Unlike spreadsheet-based tools, it handles an unlimited number of debts and provides clear, actionable payoff schedules.

## Core Features

- **Methods:** Supports Debt Snowball (lowest balance first) and Debt Avalanche (highest interest first).
- **Unlimited Scalability:** Import 30+, 100+, or 1000+ debts via CSV or YAML.
- **Detailed Tracking:** Calculates monthly interest, principal reduction, and the "snowball effect" as debts are cleared.
- **Financial Projections:** Provides estimated debt-free dates and total interest saved.

## Getting Started

1.  List your debts in `data/debts.yaml`.
2.  Run the simulation:
    ```bash
    python src/main.py --method snowball --extra 500
    ```
