const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding mock data for Bodyshop OS...');

  try {
    // 1. Create a mechanic
    const mechPassword = await bcrypt.hash('Mechanic123', 10);
    const mechUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        name: 'Mike Wrench',
        email: 'mike@bodyshop.com',
        password_hash: mechPassword,
        role: 'mechanic',
        mechanics: {
          create: {
            id: uuidv4(),
            skill_level: 5,
            workload: 2
          }
        }
      }
    });
    console.log('- Created mechanic user');

    // 2. Create a customer
    const custPassword = await bcrypt.hash('Customer123', 10);
    const custUser = await prisma.users.create({
      data: {
        id: uuidv4(),
        name: 'Alice Driver',
        email: 'alice@example.com',
        password_hash: custPassword,
        role: 'customer',
        customers: {
          create: {
            id: uuidv4(),
            phone: '555-0199'
          }
        }
      },
      include: { customers: true }
    });
    const customerRecord = custUser.customers[0];
    console.log('- Created customer user');

    // 3. Create a vehicle
    const vehicle = await prisma.vehicles.create({
      data: {
        id: uuidv4(),
        customer_id: customerRecord.id,
        make: 'Toyota',
        model: 'Camry',
        year: 2019,
        vin: '1HGCM82633A004' + Math.floor(Math.random() * 1000)
      }
    });
    console.log('- Created vehicle');

    // 4. Create Parts
    const part1 = await prisma.parts.create({
      data: { id: uuidv4(), name: 'Front Bumper (OEM)', stock: 4, price: 350.00 }
    });
    const part2 = await prisma.parts.create({
      data: { id: uuidv4(), name: 'Brake Pads Set', stock: 12, price: 45.99 }
    });
    console.log('- Created inventory parts');

    // 5. Create a Job
    const job = await prisma.jobs.create({
      data: {
        id: uuidv4(),
        vehicle_id: vehicle.id,
        customer_id: customerRecord.id,
        status: 'pending',
        estimated_cost: 450.00,
        estimated_time: 120,
        assigned_mechanic_id: mechUser.id
      }
    });
    console.log('- Created job');

    // 6. Create AI Prediction
    await prisma.ai_predictions.create({
      data: {
        id: uuidv4(),
        job_id: job.id,
        type: 'Damage Assessment',
        confidence: 0.94,
        result: { "scratches": 2, "dents": 1, "severity": "moderate" }
      }
    });
    console.log('- Created AI prediction');

    console.log('\n✅ Database successfully populated with mock data!');

  } catch (error) {
    console.error('Failed to seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
