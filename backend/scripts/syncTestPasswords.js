const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const User = require('../models/User');

const PASSWORD = 'ChangeMe123!';

const TEST_ACCOUNTS = [
  // Admin (already correct, included for completeness)
  'admin@example.com',
  // Customers (10)
  'fatima.c@novatechbd.com',
  'kamal.c@novatechbd.com',
  'nasrin.c@novatechbd.com',
  'shahidul.c@novatechbd.com',
  'tahmina.c@novatechbd.com',
  'jubayer.c@novatechbd.com',
  'sanjida.c@novatechbd.com',
  'mizanur.c@novatechbd.com',
  'rina.c@novatechbd.com',
  'tariqul.c@novatechbd.com',
  // Affiliates (10)
  'mahmudul.a@novatechbd.com',
  'sajeda.a@novatechbd.com',
  'enamul.a@novatechbd.com',
  'parveen.a@novatechbd.com',
  'jahangir.a@novatechbd.com',
  'roksana.a@novatechbd.com',
  'nurul.a@novatechbd.com',
  'shahnaz.a@novatechbd.com',
  'abul.a@novatechbd.com',
  'hasina.a@novatechbd.com',
];

const run = async () => {
  await connectDB();

  let updated = 0;
  let skipped = 0;

  for (const email of TEST_ACCOUNTS) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`SKIP  ${email} — not found`);
      skipped++;
      continue;
    }

    const alreadyMatches = await user.comparePassword(PASSWORD);
    if (alreadyMatches) {
      console.log(`OK    ${email} — password already matches`);
      skipped++;
      continue;
    }

    user.password = PASSWORD;
    await user.save();
    console.log(`SET   ${email} — password updated to ${PASSWORD}`);
    updated++;
  }

  console.log(`\nDone. ${updated} updated, ${skipped} skipped.`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Script failed:', err.message || err);
  process.exit(1);
});
