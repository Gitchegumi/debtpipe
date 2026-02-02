from dataclasses import dataclass
import copy

@dataclass
class Debt:
    name: str
    balance: float
    interest_rate: float # Annual percentage
    min_payment: float
    
    def apply_interest(self):
        monthly_rate = (self.interest_rate / 100) / 12
        interest = self.balance * monthly_rate
        self.balance += interest
        return interest

class PayoffSimulator:
    def __init__(self, debts: list[Debt], extra_monthly: float = 0.0):
        self.initial_debts = debts
        self.extra_monthly = extra_monthly

    def run(self, method="snowball"):
        """
        Runs the simulation.
        Monthly Budget = Extra + Sum(All Min Payments)
        """
        # Work on a copy
        debts = [copy.deepcopy(d) for d in self.initial_debts]
        initial_total_principal = sum(d.balance for d in debts)
        
        # Sort based on method
        if method == "snowball":
            debts.sort(key=lambda x: x.balance)
        elif method == "avalanche":
            debts.sort(key=lambda x: x.interest_rate, reverse=True)
            
        month = 0
        total_interest_paid = 0.0
        
        # Total fixed monthly cash flow assigned to debt
        monthly_budget = self.extra_monthly + sum(d.min_payment for d in debts)
        
        payoff_order = []
        
        while any(d.balance > 0 for d in debts):
            month += 1
            current_month_budget = monthly_budget
            
            # 1. Accrue Interest
            for d in debts:
                if d.balance > 0:
                    total_interest_paid += d.apply_interest()
            
            # 2. Pay Minimums first
            for d in debts:
                if d.balance > 0:
                    payment = min(d.balance, d.min_payment)
                    d.balance -= payment
                    current_month_budget -= payment
            
            # 3. Apply Snowball (remaining budget) to highest priority debt
            for d in debts:
                if d.balance > 0 and current_month_budget > 0:
                    payment = min(d.balance, current_month_budget)
                    d.balance -= payment
                    current_month_budget -= payment
                    
                    if d.balance == 0:
                        payoff_order.append(f"Month {month}: {d.name} PAID OFF")
            
            if month > 1200: # 100 year safety break
                break
                
        return {
            "months": month,
            "total_interest": total_interest_paid,
            "total_cost": total_interest_paid + initial_total_principal,
            "payoff_order": payoff_order
        }
