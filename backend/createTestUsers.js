/**
 * createTestUsers.js
 *
 * Connects to MongoDB, deletes existing test users (by email domain),
 * then creates 1 admin, 10 customers, and 10 affiliates
 * with properly bcrypt-hashed passwords via the User model pre-save hook.
 *
 * Usage: node createTestUsers.js
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

const PASSWORD = 'test1234';
const TEST_DOMAIN = 'novatechbd.com';

const users = [
  // ── Admin ──
  { firstName: 'Rafiqul', lastName: 'Islam', email: 'rafiqul.admin@novatechbd.com', role: 'admin' },

  // ── Customers ──
  { firstName: 'Fatima', lastName: 'Begum', email: 'fatima.c@novatechbd.com', role: 'customer' },
  { firstName: 'Kamal', lastName: 'Hossain', email: 'kamal.c@novatechbd.com', role: 'customer' },
  { firstName: 'Nasrin', lastName: 'Akhter', email: 'nasrin.c@novatechbd.com', role: 'customer' },
  { firstName: 'Shahidul', lastName: 'Alam', email: 'shahidul.c@novatechbd.com', role: 'customer' },
  { firstName: 'Tahmina', lastName: 'Rahman', email: 'tahmina.c@novatechbd.com', role: 'customer' },
  { firstName: 'Jubayer', lastName: 'Hasan', email: 'jubayer.c@novatechbd.com', role: 'customer' },
  { firstName: 'Sanjida', lastName: 'Sultana', email: 'sanjida.c@novatechbd.com', role: 'customer' },
  { firstName: 'Mizanur', lastName: 'Rahman', email: 'mizanur.c@novatechbd.com', role: 'customer' },
  { firstName: 'Rina', lastName: 'Begum', email: 'rina.c@novatechbd.com', role: 'customer' },
  { firstName: 'Tariqul', lastName: 'Islam', email: 'tariqul.c@novatechbd.com', role: 'customer' },

  // ── Affiliates ──
  { firstName: 'Mahmudul', lastName: 'Hasan', email: 'mahmudul.a@novatechbd.com', role: 'affiliate' },
  { firstName: 'Sajeda', lastName: 'Parvin', email: 'sajeda.a@novatechbd.com', role: 'affiliate' },
  { firstName: 'Enamul', lastName: 'Haque', email: 'enamul.a@novatechbd.com', role: 'affiliate' },
  { firstName: 'Parveen', lastName: 'Sultana', email: 'parveen.a@novatechbd.com', role: 'affiliate' },
  { firstName: 'Jahangir', lastName: 'Alam', email: 'jahangir.a@novatechbd.com', role: 'affiliate' },
  { firstName: 'Roksana', lastName: 'Akhter', email: 'roksana.a@novatechbd.com', role: 'affiliate' },
  { firstName: 'Nurul', lastName: 'Islam', email: 'nurul.a@novatechbd.com', role: 'affiliate' },
  { firstName: 'Shahnaz', lastName: 'Begum', email: 'shahnaz.a@novatechbd.com', role: 'affiliate' },
  { firstName: 'Abul', lastName: 'Kalam', email: 'abul.a@novatechbd.com', role: 'affiliate' },
  { firstName: 'Hasina', lastName: 'Ahmed', email: 'hasina.a@novatechbd.com', role: 'affiliate' },
];

async function createTestUsers() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/affiliate-ecommerce';

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected: ${mongoose.connection.host}\n`);

    // ── Delete existing test users ──
    const { deletedCount } = await User.deleteMany({ email: new RegExp(`@${TEST_DOMAIN.replace('.', '\\.')}$`) });
    console.log(`Deleted ${deletedCount} existing test users (@${TEST_DOMAIN})\n`);

    // ── Create users ──
    const created = [];

    for (const data of users) {
      const user = new User({
        ...data,
        password: PASSWORD,
        isVerified: true,
        isActive: true,
        affiliateProfile: data.role === 'affiliate'
          ? { isActive: true, commissionRate: 2, totalEarnings: 0, totalCommissionPaid: 0 }
          : undefined,
      });

      // The pre('save') hook will hash the password via bcrypt
      await user.save();

      // Generate affiliate code for affiliates
      if (data.role === 'affiliate') {
        user.affiliateCode = `AFF-${user._id.toString().slice(-8).toUpperCase()}`;
        await user.save();
      }

      created.push(user);
    }

    // ── Print credentials ──
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║              NovaTech BD — Test Credentials                ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Password for all accounts: ${PASSWORD.padEnd(27)}║`);
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const printGroup = (label, list) => {
      console.log(`── ${label} ──`);
      list.forEach((u) => {
        const name = `${u.firstName} ${u.lastName}`.padEnd(42);
        const email = u.email.padEnd(42);
        const code = u.affiliateCode ? `  Code: ${u.affiliateCode}` : '  Code: N/A';
        console.log(`   ${name}${email}${PASSWORD}${code}`);
      });
      console.log('');
    };

    const admin = created.find((u) => u.role === 'admin');
    console.log('── Admin (1) ──');
    console.log(`   ${admin.firstName} ${admin.lastName}`.padEnd(42) + `${admin.email}`.padEnd(42) + `${PASSWORD}`);
    console.log('');

    printGroup('Customers (10)', created.filter((u) => u.role === 'customer'));
    printGroup('Affiliates (10)', created.filter((u) => u.role === 'affiliate'));

    console.log(`✅ Created ${created.length} test users successfully.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUsers();
