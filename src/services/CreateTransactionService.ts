import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  titleCategory: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    titleCategory,
  }: RequestDTO): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const {total} = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError(
        'Saldo Insuficiente para realizar a transação desejada',
      );
    }

    let category = await categoryRepository.findOne({
      where: { title: titleCategory },
    });

    if (!category) {
      category = categoryRepository.create({
        title: titleCategory,
      });
      await categoryRepository.save(category);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: category,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
