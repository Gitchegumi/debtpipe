import yaml
import argparse
from pathlib import Path
from simulator import Debt, PayoffSimulator
from rich.console import Console
from rich.table import Table

console = Console()

def load_debts(path: Path) -> list[Debt]:
    with open(path, "r") as f:
        data = yaml.safe_load(f)
    return [Debt(**d) for d in data["debts"]]

def main():
    parser = argparse.ArgumentParser(description="DebtPipe - Unlimited Debt Payoff Simulator")
    parser.add_argument("--data", type=Path, default=Path("data/debts.yaml"), help="Path to debts.yaml")
    parser.add_argument("--method", choices=["snowball", "avalanche"], default="snowball", help="Payoff strategy")
    parser.add_argument("--extra", type=float, default=0.0, help="Extra monthly payment")
    args = parser.parse_args()

    if not args.data.exists():
        console.print(f"[red]Error: Data file {args.data} not found.[/red]")
        return

    try:
        debts = load_debts(args.data)
    except Exception as e:
        console.print(f"[red]Error loading YAML: {e}[/red]")
        return

    sim = PayoffSimulator(debts, extra_monthly=args.extra)
    results = sim.run(method=args.method)

    # Display Summary
    table = Table(title=f"DebtPayoff Simulation ({args.method.capitalize()})")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="magenta")

    table.add_row("Total Debts", str(len(debts)))
    table.add_row("Extra Payment", f"${args.extra:,.2f}")
    table.add_row("Months to Debt-Free", str(results["months"]))
    table.add_row("Years to Debt-Free", f"{results['months']/12:.1f}")
    table.add_row("Total Interest Paid", f"${results['total_interest']:,.2f}")

    console.print(table)

if __name__ == "__main__":
    main()
