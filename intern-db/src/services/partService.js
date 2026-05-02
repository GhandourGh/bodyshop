import * as partRepo from '@/repositories/partRepository';
import prisma from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const getParts = async () => {
  const parts = await partRepo.getAllParts();
  return parts.map(p => ({
    id: p.id,
    name: p.name,
    stock: p.stock,
    price: parseFloat(p.price) || 0
  }));
};

export const createPart = async (data) => {
  const { name, stock, price } = data;
  return prisma.parts.create({
    data: {
      id: uuidv4(),
      name,
      stock: parseInt(stock) || 0,
      price: parseFloat(price) || 0
    }
  });
};

export const deletePart = async (id) => {
  return prisma.parts.delete({ where: { id } });
};

export const updatePart = async (id, data) => {
  const { name, stock, price } = data;
  return prisma.parts.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(price !== undefined && { price: parseFloat(price) }),
    }
  });
};
