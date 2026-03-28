import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config();

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/lunara';

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFirstName = process.env.ADMIN_FIRST_NAME ?? 'Admin';
  const adminLastName = process.env.ADMIN_LAST_NAME ?? 'User';

  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
    process.exit(1);
  }

  if (adminPassword.length < 12) {
    console.error('ADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri);

  const existing = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existing) {
    console.log(`Admin user already exists with email ${adminEmail}`);
    await mongoose.disconnect();
    return;
  }

  console.log(`Creating admin user ${adminEmail}...`);
  const admin = new User({
    firstName: adminFirstName,
    lastName: adminLastName,
    email: adminEmail.toLowerCase(),
    password: adminPassword,
    role: 'admin',
    isEmailVerified: true,
  });

  await admin.save();

  console.log('Admin user created:');
  console.log({
    email: adminEmail,
    id: String((admin as any)._id),
  });

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Failed to create admin user:', err);
  void mongoose.disconnect();
  process.exit(1);
});

