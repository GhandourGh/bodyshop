const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = 'admin@bodyshop.com';
  const plaintextPassword = 'Admin123';
  
  try {
    console.log(`Checking for existing user with email: ${email}`);
    
    // 1. Delete existing user if they exist to avoid duplicates
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('Existing user found. Deleting...');
      await prisma.users.delete({
        where: { email }
      });
      console.log('Existing user deleted.');
    }

    // 2. Hash the password
    console.log('Hashing password with bcrypt (12 salt rounds)...');
    const password_hash = await bcrypt.hash(plaintextPassword, 12);

    // 3. Create the new admin user
    console.log('Inserting new admin user...');
    const adminUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        name: 'System Admin',
        email: email,
        password_hash: password_hash,
        role: 'admin',
      }
    });

    console.log('\n✅ SUCCESS: Admin user seeded successfully.');
    console.log('--------------------------------------------------');
    console.log(`ID:       ${adminUser.id}`);
    console.log(`Name:     ${adminUser.name}`);
    console.log(`Email:    ${adminUser.email}`);
    console.log(`Role:     ${adminUser.role}`);
    console.log(`Created:  ${adminUser.created_at}`);
    console.log('--------------------------------------------------\n');

  } catch (error) {
    console.error('❌ ERROR seeding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
