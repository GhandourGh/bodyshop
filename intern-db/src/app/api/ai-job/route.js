export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '@/middlewares/authMiddleware';

// Generate a VIN-like unique identifier
function generateVIN() {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) vin += chars[Math.floor(Math.random() * chars.length)];
  return vin;
}

// Slugify a name to an email-safe string
function nameToSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
}

export async function POST(request) {
  const auth = authenticate(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      mechanicName,
      estimatedCost,
      estimatedHours,
      severity,
      damageType,
      detections,
      message,
      language,
    } = body;

    if (!customerName || !vehicleMake || !vehicleModel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ── 1. Resolve or create customer ───────────────────────────────────────────
    let userId, customerId;

    const lookupEmail = customerEmail?.trim().toLowerCase() || null;

    if (lookupEmail) {
      // Try to find existing user by email
      const existingUser = await prisma.users.findUnique({ where: { email: lookupEmail } });
      if (existingUser) {
        userId = existingUser.id;
        // Get or create customer record for this user
        let cust = await prisma.customers.findFirst({ where: { user_id: userId } });
        if (!cust) {
          cust = await prisma.customers.create({
            data: { id: uuidv4(), user_id: userId, phone: customerPhone || null },
          });
        }
        customerId = cust.id;
      }
    }

    if (!customerId) {
      // Create a new user + customer
      const slug = nameToSlug(customerName);
      const baseEmail = lookupEmail || `${slug}.${Date.now()}@autoforge.customer`;

      // Ensure email uniqueness
      let finalEmail = baseEmail;
      const clash = await prisma.users.findUnique({ where: { email: finalEmail } });
      if (clash) finalEmail = `${slug}.${Date.now()}@autoforge.customer`;

      const passwordHash = await bcrypt.hash(uuidv4(), 10); // random unguessable password

      userId = uuidv4();
      const newUser = await prisma.users.create({
        data: {
          id: userId,
          name: customerName,
          email: finalEmail,
          password_hash: passwordHash,
          role: 'customer',
        },
      });

      const newCustomer = await prisma.customers.create({
        data: { id: uuidv4(), user_id: newUser.id, phone: customerPhone || null },
      });
      customerId = newCustomer.id;
    }

    // ── 2. Create vehicle ────────────────────────────────────────────────────────
    const vehicleId = uuidv4();
    await prisma.vehicles.create({
      data: {
        id: vehicleId,
        customer_id: customerId,
        make: vehicleMake,
        model: vehicleModel,
        year: parseInt(vehicleYear) || new Date().getFullYear(),
        vin: generateVIN(),
      },
    });

    // ── 3. Resolve mechanic ──────────────────────────────────────────────────────
    let assignedMechanicId = null;
    if (mechanicName) {
      const mechUser = await prisma.users.findFirst({
        where: { name: { contains: mechanicName, mode: 'insensitive' }, role: 'mechanic' },
      });
      if (mechUser) {
        const mechRecord = await prisma.mechanics.findFirst({ where: { user_id: mechUser.id } });
        if (mechRecord) assignedMechanicId = mechRecord.id;
      }
    }

    // ── 4. Create job ────────────────────────────────────────────────────────────
    const jobId = uuidv4();
    await prisma.jobs.create({
      data: {
        id: jobId,
        customer_id: customerId,
        vehicle_id: vehicleId,
        assigned_mechanic_id: assignedMechanicId,
        status: 'pending',
        estimated_cost: parseFloat(estimatedCost) || 0,
        estimated_time: Math.round(parseFloat(estimatedHours) || 0),
      },
    });

    // ── 5. Save AI prediction ────────────────────────────────────────────────────
    await prisma.ai_predictions.create({
      data: {
        id: uuidv4(),
        job_id: jobId,
        type: 'full_analysis',
        result: {
          damageType,
          detections,
          predictedHours: parseFloat(estimatedHours),
          predictedCost: parseFloat(estimatedCost),
          mechanicName: mechanicName || null,
        },
        confidence: severity || null,
      },
    });

    // ── 6. Save damage report ────────────────────────────────────────────────────
    await prisma.damage_reports.create({
      data: {
        id: uuidv4(),
        job_id: jobId,
        severity: Math.round((parseFloat(severity) || 0) * 100),
        notes: `Damage type: ${damageType}. Detected: ${(detections || []).map(d => d.class).join(', ') || 'none'}.`,
      },
    });

    // ── 7. Save customer message ─────────────────────────────────────────────────
    if (message) {
      await prisma.messages.create({
        data: {
          id: uuidv4(),
          job_id: jobId,
          user_id: userId,
          channel: language === 'ar' ? 'whatsapp_ar' : 'whatsapp',
          content: message,
        },
      });
    }

    return NextResponse.json({ success: true, jobId, customerId, vehicleId }, { status: 201 });
  } catch (err) {
    console.error('[ai-job] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
