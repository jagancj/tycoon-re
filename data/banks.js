export const BANK_LIST = [
  {
    id: 'BANK01',
    name: 'Small Bank Inc.',
    description: 'Fair rates for new entrepreneurs.',
    unlockLevel: 1,
    loanTerms: {
      personal: {
        maxLoan: 100000,
        minLoan: 10000,
        baseInterestRate: 12.0,
      },
      // NEW: Mortgage Terms
      mortgage: {
        maxLoanPercentage: 0.70, // Can borrow up to 70% of total property value
        baseInterestRate: 9.5,   // Lower interest rate than personal loans
      }
    },
  },
  {
    id: 'BANK02',
    name: 'National Bank',
    description: 'National presence, competitive rates.',
    unlockLevel: 10,
    loanTerms: {
      personal: {
        maxLoan: 500000,
        minLoan: 50000,
        baseInterestRate: 9.5,
      },
      mortgage: {
        maxLoanPercentage: 0.75, // 75% LTV
        baseInterestRate: 6.8,
      }
    },
  },
  {
    id: 'BANK03',
    name: 'Prestige Worldwide Finance',
    description: 'Exclusive rates for the 1%.',
    unlockLevel: 25,
    loanTerms: {
      personal: {
        maxLoan: 2000000,
        minLoan: 250000,
        baseInterestRate: 7.0,
      },
      mortgage: {
        maxLoanPercentage: 0.80, // 80% LTV
        baseInterestRate: 5.2,
      }
    },
  },
  {
    id: 'BANK04',
    name: 'Offshore Holdings Ltd.',
    description: 'Ask no questions, we hear no lies.',
    unlockLevel: 40,
    loanTerms: {
      personal: {
        maxLoan: 10000000,
        minLoan: 1000000,
        baseInterestRate: 15.0,
      },
      mortgage: {
        maxLoanPercentage: 0.90, // High risk, high LTV
        baseInterestRate: 8.5,
      }
    },
  },
];