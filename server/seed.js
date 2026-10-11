import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSeededData } from './data/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'db.json');

async function seed() {
  console.log('Seeding the CareQueue database...');

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Generate clean initial data with hashed passwords
  const seededData = getSeededData();

  // Write to db.json
  fs.writeFileSync(DB_PATH, JSON.stringify(seededData, null, 2), 'utf-8');

  console.log('Database seeded.\n');
  console.log('======================================================================');
  console.log('Demo accounts (one per role):');
  console.log('======================================================================');
  console.log('1. [Admin]        Email: admin@carequeue.org        Password: admin123');
  console.log('2. [Receptionist] Email: receptionist@carequeue.org Password: reception123');
  console.log('3. [Doctor]       Email: doctor.chen@carequeue.org  Password: doctor123 (Dr. Sarah Chen, OPD 101)');
  console.log('4. [Patient]      Email: emma.watson@carequeue.org   Password: patient123 (Emma Watson)');
  console.log('======================================================================');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
