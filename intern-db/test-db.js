const { PrismaClient } = require('@prisma/client');
const passwords = ['Project1', 'project1', 'postgres', 'root', 'password', ''];

async function test() {
  for (const pw of passwords) {
    try {
      const url = `postgresql://postgres:${pw}@localhost:5432/DB?schema=public`;
      console.log('Trying:', url);
      const prisma = new PrismaClient({ datasources: { db: { url } } });
      await prisma.$connect();
      console.log('SUCCESS with password:', pw);
      process.exit(0);
    } catch (e) {
      if (e.message.includes('Authentication failed')) {
        console.log('Failed with password:', pw);
      } else if (e.message.includes('does not exist')) {
        console.log('SUCCESS with password (db missing):', pw);
        process.exit(0);
      } else {
        console.log('Other error with password:', pw, e.message);
      }
    }
  }
}
test();
