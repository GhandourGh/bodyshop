import * as customerRepo from '@/repositories/customerRepository';

export const getCustomers = async () => {
  const customers = await customerRepo.getAllCustomers();
  return customers.map((c) => ({
    id: c.id,
    userId: c.user_id,
    name: c.users?.name || 'Unknown',
    email: c.users?.email || null,
    phone: c.phone || null,
    created_at: c.users?.created_at || null,
  }));
};
