import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const getAllUsers = async () => {
  return prisma.users.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' }
  });
};

export const createUser = async (data) => {
  const { name, email, password, role, phone } = data;

  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const userId = uuidv4();

  let customersData = undefined;
  let mechanicsData = undefined;

  if (role === 'customer') {
    customersData = { create: { id: uuidv4(), phone: phone || null } };
  } else if (role === 'mechanic') {
    mechanicsData = { create: { id: uuidv4() } };
  }

  const user = await prisma.users.create({
    data: {
      id: userId,
      name,
      email,
      password_hash: hashedPassword,
      role,
      ...(customersData && { customers: customersData }),
      ...(mechanicsData && { mechanics: mechanicsData }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      created_at: true,
      customers: { select: { id: true, phone: true } },
    },
  });

  return user;
};

export const deleteUser = async (id) => {
  const user = await prisma.users.findUnique({ where: { id } });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // 1. Delete all messages sent by this user
  await prisma.messages.deleteMany({ where: { user_id: id } });

  // 2. Delete all audit logs for this user
  await prisma.audit_logs.deleteMany({ where: { user_id: id } });

  // 3. Handle role-specific data
  if (user.role === 'customer') {
    const customer = await prisma.customers.findFirst({ where: { user_id: id } });
    if (customer) {
      const customerId = customer.id;
      
      // Find all vehicles owned by this customer
      const vehicles = await prisma.vehicles.findMany({ where: { customer_id: customerId } });
      const vehicleIds = vehicles.map(v => v.id);

      // Find all jobs related to this customer or their vehicles
      const jobs = await prisma.jobs.findMany({ 
        where: { 
          OR: [
            { customer_id: customerId },
            { vehicle_id: { in: vehicleIds } }
          ]
        } 
      });
      const jobIds = jobs.map(j => j.id);

      // Deep clean jobs dependencies
      await prisma.ai_predictions.deleteMany({ where: { job_id: { in: jobIds } } });
      await prisma.damage_reports.deleteMany({ where: { job_id: { in: jobIds } } });
      await prisma.job_parts.deleteMany({ where: { job_id: { in: jobIds } } });
      await prisma.messages.deleteMany({ where: { job_id: { in: jobIds } } });
      
      // Delete the jobs themselves
      await prisma.jobs.deleteMany({ where: { id: { in: jobIds } } });

      // Delete the vehicles
      await prisma.vehicles.deleteMany({ where: { customer_id: customerId } });

      // Delete the customer record
      await prisma.customers.delete({ where: { id: customerId } });
    }
  } else if (user.role === 'mechanic') {
    // assigned_mechanic_id always references mechanics.id — clear those rows first
    const profiles = await prisma.mechanics.findMany({ where: { user_id: id } });
    const mechIds = profiles.map((m) => m.id);
    if (mechIds.length > 0) {
      await prisma.jobs.updateMany({
        where: { assigned_mechanic_id: { in: mechIds } },
        data: { assigned_mechanic_id: null },
      });
      await prisma.mechanics.deleteMany({ where: { id: { in: mechIds } } });
    }
  }

  // 4. Finally delete the user record
  await prisma.users.delete({ where: { id } });
  return { success: true };
};

export const updateUser = async (id, data) => {
  const { name, email, role } = data;
  return prisma.users.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
    },
    select: { id: true, name: true, email: true, role: true }
  });
};
