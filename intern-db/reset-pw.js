const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function fix() {
  const newHash = await bcrypt.hash('admin123', 12);
  await prisma.users.update({
    where: { email: 'admin@bodyshop.com' },
    data: { password_hash: newHash }
  });
  console.log('Password reset successfully to: admin123');
  await prisma.$disconnect();
}
fix();
