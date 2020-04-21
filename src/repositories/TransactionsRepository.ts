import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const income = transactions
      .filter(transaction => transaction.type === 'income')
      .map(transaction => transaction.value)
      .reduce((totIncome, currentValue) => totIncome + currentValue, 0);

    const outcome = transactions
      .filter(transaction => transaction.type === 'outcome')
      .map(transaction => transaction.value)
      .reduce((totOutcome, currentValue) => totOutcome + currentValue, 0);

    return { income, outcome, total: income - outcome };
  }
}

export default TransactionsRepository;
