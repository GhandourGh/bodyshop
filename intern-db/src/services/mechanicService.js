import * as mechanicRepo from '@/repositories/mechanicRepository';
import prisma from '@/lib/db';

const SPECIALTY_POOL = [
  'Body Repair',
  'Paint & Refinishing',
  'Frame Alignment',
  'Dent Removal',
  'Glass & Trim',
  'Detailing',
  'Electrical',
];

function defaultSpecialty(seed) {
  if (!seed) return 'General';
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return SPECIALTY_POOL[h % SPECIALTY_POOL.length];
}

export const getMechanics = async () => {
  const mechanics = await mechanicRepo.getAllMechanics();
  return mechanics.map((m) => ({
    id: m.id,
    userId: m.user_id,
    name: m.users?.name || 'Unknown',
    email: m.users?.email || null,
    skillLevel: m.skill_level ?? 1,
    workload: m.workload ?? 0,
    specialty: m.specialty || defaultSpecialty(m.id),
  }));
};

export const deleteMechanic = async (mechanicId) => {
  const mechanic = await prisma.mechanics.findUnique({ where: { id: mechanicId } });
  if (!mechanic) {
    const err = new Error('Mechanic not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.jobs.updateMany({
    where: { assigned_mechanic_id: mechanicId },
    data: { assigned_mechanic_id: null },
  });

  await prisma.mechanics.delete({ where: { id: mechanicId } });

  if (mechanic.user_id) {
    const otherProfiles = await prisma.mechanics.count({ where: { user_id: mechanic.user_id } });
    if (otherProfiles === 0) {
      await prisma.users.deleteMany({ where: { id: mechanic.user_id, role: 'mechanic' } });
    }
  }

  return { success: true };
};
