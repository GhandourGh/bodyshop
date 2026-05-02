import * as mechanicRepo from '@/repositories/mechanicRepository';
import prisma from '@/lib/db';

export const getMechanics = async () => {
  const mechanics = await mechanicRepo.getAllMechanics();
  return mechanics.map(m => ({
    id: m.user_id, // Use User ID for table operations
    name: m.users?.name || 'Unknown',
    skillLevel: m.skill_level,
    workload: m.workload
  }));
};

export const deleteMechanic = async (userId) => {
  // Delete mechanic profile first
  await prisma.mechanics.deleteMany({ where: { user_id: userId } });

  // Then delete the user record
  await prisma.users.delete({ where: { id: userId } });

  return { success: true };
};
