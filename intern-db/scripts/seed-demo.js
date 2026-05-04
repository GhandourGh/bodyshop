/**
 * AutoForge Demo Seed
 * --------------------------------------------------------------------------
 * Wipes all application data and re-seeds the database with realistic, varied
 * demo content so every page in the app feels alive.
 *
 * Run from intern-db/:   node scripts/seed-demo.js
 * Or from repo root:     node intern-db/scripts/seed-demo.js
 *
 * Demo logins after seed:
 *   admin@autoforge.com    / password123      (role: admin)
 *   customer@autoforge.com / customer123      (role: customer, owns 2 vehicles + jobs)
 *   <each mechanic>@autoforge.com / mechanic123
 *
 * What it touches (and clears) — in dependency-safe order:
 *   integration_logs, integration_credentials, password_reset_tokens,
 *   booking_inquiries, audit_logs, ai_predictions, damage_reports,
 *   job_parts, parts_usage, messages, jobs, vehicles, parts, mechanics,
 *   customers, users
 *
 * Safe to re-run; idempotent on demo emails.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load env from intern-db/.env, fall back to repo root .env
const localEnv = path.join(__dirname, '..', '.env');
const rootEnv = path.join(__dirname, '..', '..', '.env');
require('dotenv').config({ path: fs.existsSync(localEnv) ? localEnv : rootEnv });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic randomness so a re-seed produces nicely varied (but stable-ish)
// demo content. Override with SEED_RNG env var.
// ─────────────────────────────────────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rngSeed = parseInt(process.env.SEED_RNG || '20260504', 10);
const rng = mulberry32(rngSeed);

const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor(rng() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};
const intBetween = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const choice = (...weighted) => {
  const total = weighted.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of weighted) {
    if ((r -= w) <= 0) return v;
  }
  return weighted[weighted.length - 1][0];
};

// ─────────────────────────────────────────────────────────────────────────────
// Reference data — realistic-looking names, vehicles, parts, content.
// ─────────────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Rami', 'Lara', 'Omar', 'Maya', 'Karim', 'Nour', 'Ziad', 'Hala', 'Tarek', 'Yasmine',
  'Khalil', 'Sara', 'Hadi', 'Dana', 'Fadi', 'Joud', 'Walid', 'Lina', 'Bassel', 'Reem',
  'Marwan', 'Layla', 'Sami', 'Rana', 'Ayman', 'Nadia', 'Jad', 'Zeina', 'Imad', 'Maria',
  'Anthony', 'Rita', 'Charbel', 'Tala', 'Elie', 'Joelle', 'Georges', 'Christelle', 'Nabil', 'Carla',
];
const LAST_NAMES = [
  'Haddad', 'Khoury', 'Saliba', 'Nassar', 'Aoun', 'Karam', 'Mansour', 'Saad', 'Chami', 'Daher',
  'Sleiman', 'Tannous', 'Najjar', 'Abou Khalil', 'Ghanem', 'Antoun', 'Bou Nader', 'Asmar', 'Estephan',
  'Hatem', 'Issa', 'Jabbour', 'Khalife', 'Maalouf', 'Rizk', 'Sfeir', 'Zoghbi', 'Yazbeck',
];

const MECHANIC_NAMES = [
  ['Abdo',     'Al-Sayegh',  'Body Repair'],
  ['Pierre',   'Hashem',     'Paint & Refinishing'],
  ['Hussein',  'Beydoun',    'Frame Alignment'],
  ['Tony',     'Chedid',     'Dent Removal'],
  ['Yousef',   'Mokdad',     'Glass & Trim'],
  ['Wassim',   'Mroueh',     'Electrical'],
  ['Imad',     'Kanaan',     'Detailing'],
];

const VEHICLES = [
  ['Toyota',     'Camry',      'sedan'],
  ['Toyota',     'Corolla',    'sedan'],
  ['Toyota',     'RAV4',       'suv'],
  ['Toyota',     'Highlander', 'suv'],
  ['Honda',      'Civic',      'sedan'],
  ['Honda',      'Accord',     'sedan'],
  ['Honda',      'CR-V',       'suv'],
  ['Hyundai',    'Elantra',    'sedan'],
  ['Hyundai',    'Tucson',     'suv'],
  ['Kia',        'Sportage',   'suv'],
  ['Kia',        'Optima',     'sedan'],
  ['Nissan',     'Sentra',     'sedan'],
  ['Nissan',     'Altima',     'sedan'],
  ['Nissan',     'X-Trail',    'suv'],
  ['Mazda',      'CX-5',       'suv'],
  ['Mazda',      'Mazda3',     'sedan'],
  ['Volkswagen', 'Golf',       'hatchback'],
  ['Volkswagen', 'Tiguan',     'suv'],
  ['Ford',       'F-150',      'truck'],
  ['Ford',       'Ranger',     'truck'],
  ['Chevrolet',  'Silverado',  'truck'],
  ['BMW',        '3 Series',   'luxury'],
  ['BMW',        'X5',         'luxury'],
  ['Mercedes',   'C-Class',    'luxury'],
  ['Mercedes',   'GLE',        'luxury'],
  ['Audi',       'A4',         'luxury'],
  ['Audi',       'Q5',         'luxury'],
  ['Lexus',      'RX',         'luxury'],
  ['Mitsubishi', 'Pajero',     'suv'],
  ['Suzuki',     'Swift',      'hatchback'],
];

const PARTS = [
  // [name, category, price]
  ['Front Bumper Cover',         'bumpers',     320],
  ['Rear Bumper Cover',          'bumpers',     290],
  ['Bumper Reinforcement Bar',   'bumpers',     145],
  ['Tow Hook Cover',             'bumpers',      35],

  ['LED Headlight Assembly',     'headlights',  410],
  ['Halogen Headlight Assembly', 'headlights',  185],
  ['Fog Light Kit',              'headlights',   95],
  ['Headlight Wiring Harness',   'headlights',   60],

  ['Front Fender Panel',         'body-panels', 240],
  ['Rear Quarter Panel',         'body-panels', 360],
  ['Hood Panel',                 'body-panels', 425],
  ['Trunk Lid',                  'body-panels', 380],
  ['Door Skin',                  'body-panels', 215],

  ['Driver Side Mirror',         'mirrors',     110],
  ['Passenger Side Mirror',      'mirrors',     110],
  ['Heated Mirror Glass',        'mirrors',      55],
  ['Mirror Cover Cap',           'mirrors',      28],

  ['Windshield Glass (OEM)',     'windshields', 480],
  ['Rear Windshield Glass',      'windshields', 320],
  ['Windshield Moulding Kit',    'windshields',  45],
  ['Windshield Repair Resin',    'windshields',  18],
];

const DAMAGE_TYPES   = ['dent', 'scratch', 'crack', 'paint', 'multiple'];
const VEHICLE_TYPES  = ['sedan', 'suv', 'truck', 'hatchback', 'luxury', 'van'];
const STATUS_WEIGHTS = [['done', 5], ['in_progress', 3], ['pending', 2]];

const DAMAGE_NOTE_TEMPLATES = {
  dent:     ['Front bumper dent, ~%s cm wide. Paint intact.', 'Door dent from parking incident, %s cm depression.', 'Quarter panel dent ~%s cm, no paint chip.'],
  scratch:  ['Long horizontal scratch %s cm across left fender.', 'Clear-coat scratch on rear bumper, %s cm long.', 'Surface scratch on hood, %s cm.'],
  crack:    ['Headlight housing crack ~%s cm.', 'Hairline crack on bumper cover, %s cm.', 'Windshield star crack, ~%s cm radius.'],
  paint:    ['Paint chipping along edge of door, %s cm² affected.', 'Faded clearcoat on hood, %s cm² area.', 'Spot rust under paint on rear arch, %s cm².'],
  multiple: ['Combined dent + scratch on driver door, %s cm long impact zone.', 'Multi-panel damage, primary on rear quarter, ~%s cm.', 'Rear-end collision damage across bumper + tailgate, %s cm spread.'],
};

const STAFF_MESSAGE_TEMPLATES_EN = [
  ['email',    'Hi {first}, your {vehicle} is in the shop and the inspection has started. We will send a full estimate shortly.'],
  ['whatsapp', 'Hi {first} — quick update on your {vehicle}: parts ordered, work begins tomorrow morning. ETA {days} days.'],
  ['email',    'Hi {first}, painting is complete on your {vehicle}. Final assembly + QC tomorrow, then you can pick it up.'],
  ['whatsapp', 'Hi {first}! Your {vehicle} is ready for pickup. We are open 9am–6pm.'],
  ['sms',      'AutoForge: {vehicle} repair complete. Pickup ready. Total: ${cost}. Reply STOP to opt out.'],
];
const STAFF_MESSAGE_TEMPLATES_AR = [
  ['whatsapp_ar', 'مرحباً {first}، استلمنا سيارتك {vehicle} وبدأنا الفحص. سنرسل لك التقدير قريباً.'],
  ['whatsapp_ar', 'مرحبا {first}، أعمال الطلاء انتهت اليوم. تركيب نهائي غداً ثم جاهزة للاستلام.'],
  ['whatsapp_ar', 'مرحبا {first}! سيارتك {vehicle} جاهزة للاستلام. نحن مفتوحون من ٩ صباحاً حتى ٦ مساءً.'],
];

const INTEGRATIONS = [
  { key: 'fastapi.predict-damage',  label: 'FastAPI · Damage Detection' },
  { key: 'fastapi.predict-cost',    label: 'FastAPI · Cost Predictor' },
  { key: 'fastapi.predict-time',    label: 'FastAPI · Time Predictor' },
  { key: 'fastapi.assign-mechanic', label: 'FastAPI · Mechanic Ranker' },
  { key: 'fastapi.forecast',        label: 'FastAPI · Inventory Forecast' },
  { key: 'groq.generate-message',   label: 'Groq · LLaMA Messaging' },
  { key: 'huggingface.sentiment',   label: 'HuggingFace · Sentiment' },
  { key: 'neon.postgres',           label: 'Neon · Postgres' },
];

const SAMPLE_CREDENTIALS = [
  { name: 'Stripe (live) — payments',           service_slug: 'stripe',     username_plain: 'sk_live_demo' },
  { name: 'Twilio — SMS gateway',               service_slug: 'twilio',     username_plain: 'AC_demo_account' },
  { name: 'SendGrid — transactional email',     service_slug: 'sendgrid',   username_plain: 'apikey' },
  { name: 'Carfax API — vehicle history',       service_slug: 'carfax',     username_plain: 'partner_demo' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const daysAgo = (n) => addDays(new Date(), -n);

const slug = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '').slice(0, 24);

const phone = () => {
  // Lebanese-style demo phone: +961 7X XXX XXX
  const ops = ['70', '71', '76', '78', '81', '03'];
  const op = pick(ops);
  return `+961 ${op} ${intBetween(100, 999)} ${intBetween(100, 999)}`;
};

const generateVIN = () => {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) vin += chars[Math.floor(rng() * chars.length)];
  return vin;
};

const formatTemplate = (tmpl, vars) =>
  tmpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));

// AES-GCM encryption that matches src/lib/credentialCrypto.js
function encryptSecret(plaintext) {
  const master = process.env.CREDENTIALS_MASTER_KEY || process.env.JWT_SECRET || 'dev-only-change-me';
  const key = crypto.createHash('sha256').update(master, 'utf8').digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, enc, tag]).toString('base64');
}

// ─────────────────────────────────────────────────────────────────────────────
// Wipe all application data (FK-safe order)
// ─────────────────────────────────────────────────────────────────────────────
async function wipe() {
  console.log('🧨 Wiping existing data…');
  // Children first
  await prisma.integration_logs.deleteMany({});
  await prisma.integration_credentials.deleteMany({});
  await prisma.password_reset_tokens.deleteMany({});
  await prisma.booking_inquiries.deleteMany({});
  await prisma.audit_logs.deleteMany({});
  await prisma.ai_predictions.deleteMany({});
  await prisma.damage_reports.deleteMany({});
  await prisma.job_parts.deleteMany({});
  await prisma.parts_usage.deleteMany({});
  await prisma.messages.deleteMany({});
  await prisma.jobs.deleteMany({});
  await prisma.vehicles.deleteMany({});
  await prisma.parts.deleteMany({});
  await prisma.mechanics.deleteMany({});
  await prisma.customers.deleteMany({});
  await prisma.users.deleteMany({});
  console.log('   ✓ database is clean');
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────────────────────────────────────
async function seedAdmin() {
  const passwordHash = await bcrypt.hash('password123', 12);
  return prisma.users.create({
    data: {
      id: uuidv4(),
      name: 'AutoForge Admin',
      email: 'admin@autoforge.com',
      password_hash: passwordHash,
      role: 'admin',
      created_at: daysAgo(220),
    },
  });
}

async function seedDemoCustomer() {
  const passwordHash = await bcrypt.hash('customer123', 12);
  const userId = uuidv4();
  const customerId = uuidv4();
  await prisma.users.create({
    data: {
      id: userId,
      name: 'Demo Customer',
      email: 'customer@autoforge.com',
      password_hash: passwordHash,
      role: 'customer',
      created_at: daysAgo(180),
      customers: { create: { id: customerId, phone: phone() } },
    },
  });
  return { userId, customerId };
}

async function seedMechanics() {
  const mechanicHash = await bcrypt.hash('mechanic123', 12);
  const out = [];
  for (const [first, last, specialty] of MECHANIC_NAMES) {
    const userId = uuidv4();
    const mechId = uuidv4();
    const skill = intBetween(2, 5);
    const workload = intBetween(20, 90);
    await prisma.users.create({
      data: {
        id: userId,
        name: `${first} ${last}`,
        email: `${slug(first)}.${slug(last)}@autoforge.com`,
        password_hash: mechanicHash,
        role: 'mechanic',
        created_at: daysAgo(intBetween(120, 280)),
        mechanics: {
          create: {
            id: mechId,
            skill_level: skill,
            workload,
            specialty,
          },
        },
      },
    });
    out.push({ id: mechId, userId, name: `${first} ${last}`, specialty, skillLevel: skill, workload });
  }
  return out;
}

async function seedCustomers(count) {
  const customerHash = await bcrypt.hash('customer123', 12);
  const used = new Set(['admin@autoforge.com', 'customer@autoforge.com']);
  const out = [];
  let i = 0;
  while (out.length < count && i < count * 4) {
    i++;
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const base = `${slug(first)}.${slug(last)}`;
    let email = `${base}@gmail.com`;
    let suffix = 1;
    while (used.has(email)) {
      suffix++;
      email = `${base}${suffix}@gmail.com`;
    }
    used.add(email);

    const userId = uuidv4();
    const customerId = uuidv4();
    await prisma.users.create({
      data: {
        id: userId,
        name: `${first} ${last}`,
        email,
        password_hash: customerHash,
        role: 'customer',
        created_at: daysAgo(intBetween(10, 200)),
        customers: { create: { id: customerId, phone: phone() } },
      },
    });
    out.push({ userId, customerId, name: `${first} ${last}`, email, first });
  }
  return out;
}

async function seedParts() {
  const out = [];
  for (const [name, category, price] of PARTS) {
    const id = uuidv4();
    await prisma.parts.create({
      data: {
        id,
        name,
        category,
        stock: intBetween(4, 60),
        price,
      },
    });
    out.push({ id, name, category, price });
  }
  return out;
}

async function seedVehicles(customers, demoCustomer) {
  const out = [];
  // Give the demo customer 2 vehicles
  for (let i = 0; i < 2; i++) {
    const [make, model] = pick(VEHICLES);
    const id = uuidv4();
    await prisma.vehicles.create({
      data: {
        id,
        customer_id: demoCustomer.customerId,
        make, model,
        year: intBetween(2017, 2025),
        vin: generateVIN(),
      },
    });
    out.push({ id, customerId: demoCustomer.customerId, make, model });
  }
  // 1–2 vehicles for each other customer
  for (const c of customers) {
    const n = choice([1, 7], [2, 3]);
    for (let i = 0; i < n; i++) {
      const [make, model] = pick(VEHICLES);
      const id = uuidv4();
      await prisma.vehicles.create({
        data: {
          id,
          customer_id: c.customerId,
          make, model,
          year: intBetween(2014, 2025),
          vin: generateVIN(),
        },
      });
      out.push({ id, customerId: c.customerId, make, model });
    }
  }
  return out;
}

function damageNote(damageType) {
  const tmpl = pick(DAMAGE_NOTE_TEMPLATES[damageType] || DAMAGE_NOTE_TEMPLATES.dent);
  return tmpl.replace('%s', String(intBetween(2, 35)));
}

function vehicleTypeFor(make, model) {
  const m = (model || '').toLowerCase();
  const k = (make || '').toLowerCase();
  if (['f-150', 'silverado', 'ram', 'ranger'].some((t) => m.includes(t))) return 'truck';
  if (['rav4', 'cr-v', 'x5', 'q5', 'tucson', 'sportage', 'cx-5', 'tiguan', 'highlander', 'rx', 'pajero', 'x-trail', 'gle'].some((t) => m.includes(t))) return 'suv';
  if (['transit', 'sprinter'].some((t) => m.includes(t))) return 'van';
  if (['mercedes', 'bmw', 'audi', 'lexus'].some((t) => k.includes(t))) return 'luxury';
  if (['golf', 'swift'].some((t) => m.includes(t))) return 'hatchback';
  return 'sedan';
}

async function seedJobsAndChildren({ admin, mechanics, customers, demoCustomer, vehicles, parts }) {
  const summary = { jobs: 0, messages: 0, damage: 0, predictions: 0, jobParts: 0 };

  // Helper: create a job and all its trimmings
  async function createJob({ vehicle, customerId, customerName, customerFirst, daysAgoCreated, status, mechanic }) {
    const jobId = uuidv4();
    const vt = vehicleTypeFor(vehicle.make, vehicle.model);
    const damageType = pick(DAMAGE_TYPES);
    const baseCost =
      vt === 'luxury' ? intBetween(900, 4200) :
      vt === 'truck'  ? intBetween(700, 2800) :
      vt === 'suv'    ? intBetween(550, 2400) :
                        intBetween(350, 1800);
    const baseHours = Math.max(2, Math.round(baseCost / intBetween(110, 180)));
    const createdAt = daysAgo(daysAgoCreated);

    await prisma.jobs.create({
      data: {
        id: jobId,
        vehicle_id: vehicle.id,
        customer_id: customerId,
        assigned_mechanic_id: mechanic ? mechanic.id : null,
        status,
        estimated_cost: baseCost,
        estimated_time: baseHours,
        created_at: createdAt,
      },
    });
    summary.jobs++;

    // Damage report (~85% of jobs)
    if (rng() < 0.85) {
      await prisma.damage_reports.create({
        data: {
          id: uuidv4(),
          job_id: jobId,
          severity: intBetween(2, 9),
          notes: damageNote(damageType),
          image_url: `damage_${slug(vehicle.make + vehicle.model)}_${intBetween(1000, 9999)}.jpg`,
          created_at: addDays(createdAt, intBetween(0, 1)),
        },
      });
      summary.damage++;
    }

    // 1–4 parts on the job
    const partCount = intBetween(1, 4);
    for (const p of pickN(parts, partCount)) {
      await prisma.job_parts.create({
        data: {
          id: uuidv4(),
          job_id: jobId,
          part_id: p.id,
          quantity: intBetween(1, 2),
        },
      });
      summary.jobParts++;
    }

    // 1–3 messages
    const msgs = intBetween(1, 3);
    const isArabic = rng() < 0.25;
    const tmplPool = isArabic ? STAFF_MESSAGE_TEMPLATES_AR : STAFF_MESSAGE_TEMPLATES_EN;
    for (let i = 0; i < msgs; i++) {
      const [channel, tmpl] = pick(tmplPool);
      const content = formatTemplate(tmpl, {
        first: customerFirst || customerName.split(' ')[0],
        vehicle: `${vehicle.make} ${vehicle.model}`,
        days: intBetween(1, 5),
        cost: baseCost,
      });
      await prisma.messages.create({
        data: {
          id: uuidv4(),
          job_id: jobId,
          user_id: admin.id,
          channel,
          content,
          created_at: addDays(createdAt, i + intBetween(0, 2)),
        },
      });
      summary.messages++;
    }

    // AI predictions — 1 cost-estimation, plus mechanic recommendation if assigned
    await prisma.ai_predictions.create({
      data: {
        id: uuidv4(),
        job_id: jobId,
        type: 'Cost Estimation',
        result: {
          predicted_cost_usd: baseCost,
          predicted_hours: baseHours,
          vehicle_type: vt,
          damage_type: damageType,
        },
        confidence: +(0.78 + rng() * 0.18).toFixed(3),
        created_at: addDays(createdAt, 0),
      },
    });
    summary.predictions++;

    if (mechanic) {
      await prisma.ai_predictions.create({
        data: {
          id: uuidv4(),
          job_id: jobId,
          type: 'Mechanic Recommendation',
          result: {
            ranked_mechanics: [
              { name: mechanic.name, score: +(3 + rng() * 1.5).toFixed(2) },
              ...pickN(mechanics.filter((m) => m.id !== mechanic.id), 2)
                .map((m) => ({ name: m.name, score: +(1.5 + rng() * 1.5).toFixed(2) })),
            ],
          },
          confidence: +(0.7 + rng() * 0.25).toFixed(3),
          created_at: addDays(createdAt, 1),
        },
      });
      summary.predictions++;
    }

    if (rng() < 0.4) {
      await prisma.ai_predictions.create({
        data: {
          id: uuidv4(),
          job_id: jobId,
          type: 'Damage Assessment',
          result: {
            severity_on_record: +(intBetween(2, 9) / 10).toFixed(2),
            vehicle: `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim(),
            damage_notes: damageNote(damageType),
          },
          confidence: +(0.6 + rng() * 0.3).toFixed(3),
          created_at: addDays(createdAt, intBetween(0, 2)),
        },
      });
      summary.predictions++;
    }

    return jobId;
  }

  // Create ~80 jobs across 6 months
  const allCustomers = [
    { customerId: demoCustomer.customerId, name: 'Demo Customer', first: 'Demo' },
    ...customers.map((c) => ({ customerId: c.customerId, name: c.name, first: c.first })),
  ];
  const customerVehicles = new Map();
  for (const v of vehicles) {
    if (!customerVehicles.has(v.customerId)) customerVehicles.set(v.customerId, []);
    customerVehicles.get(v.customerId).push(v);
  }

  for (let i = 0; i < 80; i++) {
    const c = pick(allCustomers);
    const list = customerVehicles.get(c.customerId);
    if (!list || list.length === 0) continue;
    const vehicle = pick(list);
    const status = choice(...STATUS_WEIGHTS);
    const mechanic = rng() < 0.85 ? pick(mechanics) : null;
    const dAgo = intBetween(0, 180);
    await createJob({
      vehicle,
      customerId: c.customerId,
      customerName: c.name,
      customerFirst: c.first,
      daysAgoCreated: dAgo,
      status,
      mechanic,
    });
  }

  // Force 4 jobs for the demo customer specifically (varied statuses)
  const demoVehicles = customerVehicles.get(demoCustomer.customerId) || [];
  if (demoVehicles.length > 0) {
    const presetStatuses = ['done', 'in_progress', 'pending', 'done'];
    for (let i = 0; i < presetStatuses.length; i++) {
      const v = demoVehicles[i % demoVehicles.length];
      await createJob({
        vehicle: v,
        customerId: demoCustomer.customerId,
        customerName: 'Demo Customer',
        customerFirst: 'Demo',
        daysAgoCreated: 5 + i * 14,
        status: presetStatuses[i],
        mechanic: pick(mechanics),
      });
    }
  }

  return summary;
}

async function seedPartsUsage(parts) {
  // 6 months of daily usage rows per category — Prophet-friendly
  const categories = [...new Set(parts.map((p) => p.category))];
  const data = [];
  const days = 180;
  for (let d = days; d >= 0; d--) {
    const day = daysAgo(d);
    for (const cat of categories) {
      const partsInCat = parts.filter((p) => p.category === cat);
      if (partsInCat.length === 0) continue;
      const part = pick(partsInCat);
      // Weekly seasonality (peaks mid-week) + slight upward trend
      const dow = day.getDay();
      const seasonal = dow >= 1 && dow <= 4 ? 1 : 0.55;
      const trend = 1 + (days - d) * 0.0015;
      const noise = 0.7 + rng() * 0.6;
      const baseQty = cat === 'bumpers' ? 2.4 : cat === 'headlights' ? 1.6 : cat === 'mirrors' ? 1.2 : cat === 'windshields' ? 0.9 : 2.1;
      const qty = Math.max(0, Math.round(baseQty * seasonal * trend * noise));
      if (qty === 0) continue;
      data.push({
        id: uuidv4(),
        part_id: part.id,
        category: cat,
        used_on: day,
        quantity: qty,
      });
    }
  }
  // Batch insert
  for (let i = 0; i < data.length; i += 200) {
    await prisma.parts_usage.createMany({ data: data.slice(i, i + 200) });
  }
  return data.length;
}

async function seedBookingInquiries(demoCustomer, customers) {
  const samples = [
    { name: 'Demo Customer', email: 'customer@autoforge.com', userId: demoCustomer.userId, payload: {
        type: 'estimate-request', vehicle: 'Toyota Camry 2022', damage: 'Front bumper scratch',
        notes: 'Hit a pole in a parking garage. Need a paintless dent + paint touch-up if possible.', preferred_date: '2026-05-12',
    }},
    { name: 'Demo Customer', email: 'customer@autoforge.com', userId: demoCustomer.userId, payload: {
        type: 'pickup-window', vehicle: 'Honda CR-V 2020', notes: 'Can I drop off Saturday morning?',
    }},
  ];
  // Add a few from random customers too
  const extras = pickN(customers, 6).map((c) => ({
    name: c.name,
    email: c.email,
    userId: c.userId,
    payload: {
      type: 'estimate-request',
      vehicle: `${pick(VEHICLES)[0]} ${pick(VEHICLES)[1]} ${intBetween(2016, 2024)}`,
      damage: pick(DAMAGE_TYPES),
      notes: pick([
        'Garage scratched my bumper, needs paint match.',
        'Rear-ended last week — bumper + tailgate.',
        'Hail damage all over the hood.',
        'Side mirror cracked, need OEM replacement.',
        'Door dent from cyclist, no paint chip.',
      ]),
      preferred_date: addDays(new Date(), intBetween(2, 21)).toISOString().slice(0, 10),
    },
  }));

  for (const s of [...samples, ...extras]) {
    await prisma.booking_inquiries.create({
      data: {
        id: uuidv4(),
        user_id: s.userId,
        name: s.name,
        email: s.email,
        phone: phone(),
        payload: s.payload,
        created_at: daysAgo(intBetween(1, 30)),
      },
    });
  }
  return samples.length + extras.length;
}

async function seedAuditLogs(admin, mechanics) {
  const actions = [
    'LOGIN', 'CREATE', 'UPDATE', 'DELETE',
    'STATUS:DONE', 'STATUS:IN_PROGRESS', 'AI_TRIGGER', 'EXPORT',
  ];
  const entities = ['user', 'job', 'customer', 'vehicle', 'mechanic', 'part', 'message'];
  const actors = [{ id: admin.id }, ...mechanics.map((m) => ({ id: m.userId }))];
  for (let i = 0; i < 60; i++) {
    await prisma.audit_logs.create({
      data: {
        id: uuidv4(),
        user_id: pick(actors).id,
        action: pick(actions),
        entity: pick(entities),
        entity_id: uuidv4(),
        created_at: daysAgo(intBetween(0, 60)),
      },
    });
  }
  return 60;
}

async function seedIntegrationLogs() {
  const statuses = [
    ['ok',     'Request completed'],
    ['ok',     'Request completed'],
    ['ok',     'Request completed'],
    ['ok',     'Request completed'],
    ['warn',   'Slow response (>1500ms)'],
    ['error',  'Upstream timeout'],
  ];
  for (let i = 0; i < 120; i++) {
    const integ = pick(INTEGRATIONS);
    const [status, msg] = pick(statuses);
    const duration = status === 'error' ? intBetween(2500, 8000) : status === 'warn' ? intBetween(1500, 2500) : intBetween(40, 1200);
    await prisma.integration_logs.create({
      data: {
        id: uuidv4(),
        integration_key: integ.key,
        status,
        message: msg,
        duration_ms: duration,
        meta: { label: integ.label, retry: status === 'error' ? intBetween(0, 2) : 0 },
        created_at: daysAgo(intBetween(0, 14)),
      },
    });
  }
  return 120;
}

async function seedCredentials(admin) {
  for (const c of SAMPLE_CREDENTIALS) {
    const fakeSecret = `${c.service_slug}_${crypto.randomBytes(12).toString('hex')}`;
    await prisma.integration_credentials.create({
      data: {
        id: uuidv4(),
        name: c.name,
        service_slug: c.service_slug,
        username_plain: c.username_plain,
        secret_encrypted: encryptSecret(fakeSecret),
        notes: 'Demo credential — safe to rotate at any time.',
        created_by_user_id: admin.id,
        created_at: daysAgo(intBetween(7, 60)),
        updated_at: daysAgo(intBetween(0, 7)),
      },
    });
  }
  return SAMPLE_CREDENTIALS.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Aborting.');
    process.exit(1);
  }

  console.log('================================================================');
  console.log(' AutoForge demo seed');
  console.log(' DB:', process.env.DATABASE_URL.replace(/:[^:@/]+@/, ':****@'));
  console.log(' RNG seed:', rngSeed);
  console.log('================================================================');

  await wipe();

  console.log('\n👤 Seeding accounts…');
  const admin = await seedAdmin();
  const demoCustomer = await seedDemoCustomer();
  console.log('   ✓ admin@autoforge.com / password123');
  console.log('   ✓ customer@autoforge.com / customer123');

  console.log('\n🔧 Seeding mechanics…');
  const mechanics = await seedMechanics();
  console.log(`   ✓ ${mechanics.length} mechanics (password: mechanic123)`);

  console.log('\n👥 Seeding customers…');
  const customers = await seedCustomers(28);
  console.log(`   ✓ ${customers.length} customers`);

  console.log('\n🧰 Seeding parts inventory…');
  const parts = await seedParts();
  console.log(`   ✓ ${parts.length} parts across ${new Set(parts.map((p) => p.category)).size} categories`);

  console.log('\n🚗 Seeding vehicles…');
  const vehicles = await seedVehicles(customers, demoCustomer);
  console.log(`   ✓ ${vehicles.length} vehicles`);

  console.log('\n📋 Seeding jobs (+ damage, parts, messages, AI predictions)…');
  const jobSummary = await seedJobsAndChildren({ admin, mechanics, customers, demoCustomer, vehicles, parts });
  console.log(`   ✓ ${jobSummary.jobs} jobs · ${jobSummary.damage} damage reports · ${jobSummary.jobParts} job-parts links`);
  console.log(`   ✓ ${jobSummary.messages} messages · ${jobSummary.predictions} AI predictions`);

  console.log('\n📈 Seeding 6 months of parts usage (for Prophet forecasting)…');
  const usageRows = await seedPartsUsage(parts);
  console.log(`   ✓ ${usageRows} parts_usage rows`);

  console.log('\n📨 Seeding booking inquiries…');
  const inquiries = await seedBookingInquiries(demoCustomer, customers);
  console.log(`   ✓ ${inquiries} booking inquiries`);

  console.log('\n📜 Seeding audit logs…');
  const audits = await seedAuditLogs(admin, mechanics);
  console.log(`   ✓ ${audits} audit log entries`);

  console.log('\n🔌 Seeding integration logs…');
  const intLogs = await seedIntegrationLogs();
  console.log(`   ✓ ${intLogs} integration log entries`);

  console.log('\n🔐 Seeding integration credentials (vault)…');
  const creds = await seedCredentials(admin);
  console.log(`   ✓ ${creds} credentials`);

  console.log('\n================================================================');
  console.log(' ✅  Demo seed complete!');
  console.log('');
  console.log(' Sign in:');
  console.log('   admin@autoforge.com    / password123');
  console.log('   customer@autoforge.com / customer123');
  console.log('   <mechanic>@autoforge.com / mechanic123  (e.g. abdo.alsayegh@autoforge.com)');
  console.log('================================================================\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
