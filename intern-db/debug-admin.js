const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function debug() {
  try {
    const user = await prisma.users.findUnique({ where: { email: 'admin@bodyshop.com' } });
    if (!user) {
      console.log('RESULT: null (User not found in DB)');
    } else {
      console.log('RESULT: User found');
      console.log('ID:', user.id);
      console.log('Password hash string format:', user.password_hash);
      
      // Since it fails to login, let's see if the hash is actually a plaintext password.
      // E.g. if the user was seeded manually with 'admin123' instead of a bcrypt hash.
      const testPw = 'admin123'; // common guess
      const testPw2 = 'Project1'; // common guess
      const testPw3 = 'password'; // common guess
      
      // Let's test if it's plaintext
      if (!user.password_hash.startsWith('$2a$') && !user.password_hash.startsWith('$2b$')) {
        console.log('WARNING: Hash does not start with bcrypt signature ($2a$ or $2b$). This might be plain text.');
      }
      
      console.log('Trying to compare with some common passwords just in case...');
      for (const pw of [testPw, testPw2, testPw3, user.password_hash]) {
        try {
          const match = await bcrypt.compare(pw, user.password_hash);
          console.log(`Compare '${pw}' with hash: ${match}`);
        } catch (e) {
          console.log(`Compare '${pw}' threw error: ${e.message}`);
        }
      }
    }
  } catch(e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}
debug();
