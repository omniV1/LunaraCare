/// <reference types="node" />
/**
 * Seed script: creates a test provider and test client for local/Docker testing.
 *
 * Usage:  npm run seed:test-users
 *   (or)  npx ts-node scripts/seedTestUsers.ts   (from backend/)
 *
 * If the users already exist, their passwords are reset to the known test password,
 * role/verification are corrected, and account lockout fields are cleared so login works.
 *
 * Email addresses:
 *   Default `*@lunara.dev` is for login/testing only — that domain does not receive real mail
 *   (no MX / DNS for inbox), so verification and "new login" emails will BOUNCE.
 *   To actually receive mail, set in .env:
 *     SEED_PROVIDER_EMAIL=you+provider@gmail.com
 *     SEED_CLIENT_EMAIL=you+client@gmail.com
 *
 * Environment: reads MONGODB_URI from backend/.env via dotenv.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User';
import Provider from '../src/models/Provider';
import Client from '../src/models/Client';

const PROVIDER_EMAIL = process.env.SEED_PROVIDER_EMAIL?.trim() || 'testprovider@lunara.dev';
const CLIENT_EMAIL = process.env.SEED_CLIENT_EMAIL?.trim() || 'testclient@lunara.dev';
const PASSWORD = 'Testing123!';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // --- Provider (create or reset so email/password login always works) ---
  let providerUser = await User.findOne({ email: PROVIDER_EMAIL }).select('+password');
  if (!providerUser) {
    providerUser = await User.create({
      firstName: 'Sarah',
      lastName: 'L',
      email: PROVIDER_EMAIL,
      password: PASSWORD,
      role: 'provider',
      isEmailVerified: true,
    });
    console.log(`Created provider user: ${providerUser.email}`);
  } else {
    providerUser.firstName = 'Sarah';
    providerUser.lastName = 'L';
    providerUser.password = PASSWORD;
    providerUser.role = 'provider';
    providerUser.isEmailVerified = true;
    providerUser.mfaEnabled = false;
    providerUser.failedLoginAttempts = 0;
    providerUser.lockUntil = undefined;
    await providerUser.save();
    console.log(`Updated provider user (password reset, flags normalized): ${providerUser.email}`);
  }

  let providerDoc = await Provider.findOne({ userId: providerUser._id });
  if (!providerDoc) {
    providerDoc = await Provider.create({
      userId: providerUser._id,
      professionalInfo: {
        certifications: [],
        specialties: ['postpartum_depression', 'breastfeeding_support'],
        languages: ['English'],
        education: [],
      },
      contactInfo: {},
      availability: { isAcceptingClients: true },
      status: 'active',
    });
    console.log('Created provider profile');
  } else {
    console.log('Provider profile already exists');
  }

  // --- Client (create or reset) ---
  let clientUser = await User.findOne({ email: CLIENT_EMAIL }).select('+password');
  if (!clientUser) {
    clientUser = await User.create({
      firstName: 'Test',
      lastName: 'Client',
      email: CLIENT_EMAIL,
      password: PASSWORD,
      role: 'client',
      isEmailVerified: true,
    });
    console.log(`Created client user: ${clientUser.email}`);
  } else {
    clientUser.firstName = 'Test';
    clientUser.lastName = 'Client';
    clientUser.password = PASSWORD;
    clientUser.role = 'client';
    clientUser.isEmailVerified = true;
    clientUser.mfaEnabled = false;
    clientUser.failedLoginAttempts = 0;
    clientUser.lockUntil = undefined;
    await clientUser.save();
    console.log(`Updated client user (password reset, flags normalized): ${clientUser.email}`);
  }

  let clientDoc = await Client.findOne({ userId: clientUser._id });
  if (!clientDoc) {
    clientDoc = await Client.create({
      userId: clientUser._id,
      assignedProvider: providerUser._id,
      status: 'active',
    });
    console.log('Created client profile (assigned to test provider)');
  } else {
    console.log('Client profile already exists');
  }

  console.log('\n=== Test Accounts ===');
  console.log(`Provider:  ${PROVIDER_EMAIL}  /  ${PASSWORD}`);
  console.log(`Client:    ${CLIENT_EMAIL}  /  ${PASSWORD}`);
  console.log('=====================');
  if (/@lunara\.dev$/i.test(PROVIDER_EMAIL) || /@lunara\.dev$/i.test(CLIENT_EMAIL)) {
    console.log(
      '\nNote: @lunara.dev cannot receive email (no inbox). Login alerts & verification will bounce.\n' +
        'Use SEED_PROVIDER_EMAIL / SEED_CLIENT_EMAIL with a real address to test mail.\n'
    );
  } else {
    console.log('');
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
