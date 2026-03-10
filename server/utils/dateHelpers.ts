import { Between } from 'typeorm';

const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

export const AfterDate = (date: Date) => Between(date, addYears(date, 100));
