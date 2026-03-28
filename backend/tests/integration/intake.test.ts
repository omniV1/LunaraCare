// jest
// This file uses Jest test globals

import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/server';

let mongoServer: MongoMemoryServer;
let clientToken: string;
let providerToken: string;
let otherClientToken: string;
let clientUserId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Register primary client
  await request(app)
    .post('/auth/register')
    .send({
      firstName: 'IntakeClient',
      lastName: 'User',
      email: 'intake-client@example.com',
      password: 'Password123',
      role: 'client',
    });

  // Register secondary client
  await request(app)
    .post('/auth/register')
    .send({
      firstName: 'OtherClient',
      lastName: 'User',
      email: 'other-client@example.com',
      password: 'Password123',
      role: 'client',
    });

  // Register provider
  await request(app)
    .post('/auth/register')
    .send({
      firstName: 'IntakeProvider',
      lastName: 'User',
      email: 'intake-provider@example.com',
      password: 'Password123',
      role: 'provider',
    });

  // Verify emails manually
  await mongoose.connection.collection('users').updateOne(
    { email: 'intake-client@example.com' },
    { $set: { isEmailVerified: true } }
  );
  await mongoose.connection.collection('users').updateOne(
    { email: 'other-client@example.com' },
    { $set: { isEmailVerified: true } }
  );
  await mongoose.connection.collection('users').updateOne(
    { email: 'intake-provider@example.com' },
    { $set: { isEmailVerified: true } }
  );

  const clientUser = await mongoose.connection.collection('users').findOne({ email: 'intake-client@example.com' });
  clientUserId = clientUser!._id.toString();

  // Login client
  const clientRes = await request(app)
    .post('/auth/login')
    .send({ email: 'intake-client@example.com', password: 'Password123' });
  clientToken = clientRes.body.data.accessToken;

  // Login other client
  const otherClientRes = await request(app)
    .post('/auth/login')
    .send({ email: 'other-client@example.com', password: 'Password123' });
  otherClientToken = otherClientRes.body.data.accessToken;

  // Login provider
  const providerRes = await request(app)
    .post('/auth/login')
    .send({ email: 'intake-provider@example.com', password: 'Password123' });
  providerToken = providerRes.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Intake Integration', () => {
  it('rejects POST /api/intake without authentication', async () => {
    const res = await request(app).post('/api/intake').send({
      partnerName: 'Alex',
    });

    expect(res.status).toBe(401);
  });

  it('rejects GET /api/intake/:userId without authentication', async () => {
    const res = await request(app).get(`/api/intake/${clientUserId}`);
    expect(res.status).toBe(401);
  });

  it('client can create or update their intake via POST /api/intake', async () => {
    const res = await request(app)
      .post('/api/intake')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        partnerName: 'Alex',
        feedingGoals: 'Exclusive breastfeeding',
        isComplete: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.intake).toBeDefined();
    expect(res.body.intake.partnerName).toBe('Alex');
    expect(res.body.intakeCompleted).toBe(false);
  });

  it('rejects invalid payload when isComplete is not boolean', async () => {
    const res = await request(app)
      .post('/api/intake')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        partnerName: 'Alex',
        isComplete: 'yes',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('client can fetch their intake via GET /api/intake/:userId', async () => {
    const res = await request(app)
      .get(`/api/intake/${clientUserId}`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.intake).toBeDefined();
    expect(res.body.intake.partnerName).toBe('Alex');
    expect(res.body.intakeCompleted).toBe(false);
  });

  it('provider can fetch client intake via GET /api/intake/:userId', async () => {
    const res = await request(app)
      .get(`/api/intake/${clientUserId}`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.intake).toBeDefined();
  });

  it('forbids other clients from accessing someone else intake', async () => {
    const res = await request(app)
      .get(`/api/intake/${clientUserId}`)
      .set('Authorization', `Bearer ${otherClientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('client can auto-save section and mark intake complete via PATCH /api/intake/:userId/section/:sectionId', async () => {
    const res = await request(app)
      .patch(`/api/intake/${clientUserId}/section/personal`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        partnerPhone: '+1 555 000 1111',
        isComplete: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.intakeCompleted).toBe(true);
    expect(res.body.intake.partnerPhone).toBe('+1 555 000 1111');
  });

  it('forbids other clients from patching someone else intake', async () => {
    const res = await request(app)
      .patch(`/api/intake/${clientUserId}/section/personal`)
      .set('Authorization', `Bearer ${otherClientToken}`)
      .send({
        partnerPhone: '+1 555 999 2222',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('should update User intakeCompleted flags when intake is complete', async () => {
    const user = await mongoose.connection
      .collection('users')
      .findOne({ _id: new mongoose.Types.ObjectId(clientUserId) });
    expect(user).toBeDefined();
    expect(user!.intakeCompleted).toBe(true);
    expect(user!.intakeCompletedAt).toBeDefined();
  });
}
);

