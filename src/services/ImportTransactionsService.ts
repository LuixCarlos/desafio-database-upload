import csv from 'csv-parse'
import fs from 'fs'
import { getRepository, getCustomRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';


interface CategoryInterface {
  title: string;
}

interface TransactionInterface {
  title: string;
  type: 'income' | 'outcome'
  value: number;
  category:string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);
    const transactionsFile: TransactionInterface[] = [];
    const categories: CategoryInterface[] = [];
    const csvParser = csv({trim:true, columns: true})
    const fileStream = fs.createReadStream(filePath)

    const parser = fileStream.pipe(csvParser);

    parser.on('data', async row =>{
      if(!row.title || !row.type || !row.value || !row.category) return;
      categories.push({title: row.category})
      transactionsFile.push(row);
    });

    await new Promise(resolve => parser.on('end', resolve));

    const categoriesBD = await categoryRepository.find({
      where: {title: In(categories.map(category=> category.title))}
    });

    let categoriesToAdd = categories
    .filter(category=> !categoriesBD.map(catBD=> catBD.title).includes(category.title))
    .reduce((auxCategories:CategoryInterface[], category:CategoryInterface)=> {
      return auxCategories.findIndex(item=> item.title === category.title) > -1 ?
       auxCategories :
       [...auxCategories, category]
    },[])

    categoriesToAdd = await categoryRepository.save(categoriesToAdd);

    const allCategories = [...categoriesToAdd, ...categoriesBD];

    const transactionsTosave = transactionsFile.map(transaction=> (
      {
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(category=> category.title === transaction.category)
      }
    ));

    let transactions = transactionsRepository.create(transactionsTosave);
    transactions = await transactionsRepository.save(transactions);

    await fs.promises.unlink(filePath);

    return transactions;
  }
}

export default ImportTransactionsService;
