import * as customerRepo from '@/repositories/customerRepository';

export const getCustomers = async () => {
  const customers = await customerRepo.getAllCustomers();
  return customers.map(c => ({
    id: c.id,
    name: c.users?.name || 'Unknown',
    email: c.users?.email || 'Unknown',
    phone: c.phone || 'N/A'
  }));
};
