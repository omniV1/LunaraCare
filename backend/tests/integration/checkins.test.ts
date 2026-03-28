// jest
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/server';

let mongoServer: MongoMemoryServer;
let clientToken: string;
let providerToken: string;
let clientUserId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  await request(app).post('/auth/register').send({
    firstName: 'CIClient', lastName: 'User',
    email: 'ci-client@example.com', password: 'Password123', role: 'client',
  });
  await request(app).post('/auth/register').send({
    firstName: 'CIProvider', lastName: 'User',
    email: 'ci-provider@example.com', password: 'Password123', role: 'provider',
  });

  await mongoose.connection.collection('users').updateOne(
    { email: 'ci-client@example.com' }, { $set: { isEmailVerified: true } });
  await mongoose.connection.collection('users').updateOne(
    { email: 'ci-provider@example.com' }, { $set: { isEmailVerified: true } });

  const cu = await mongoose.connection.collection('users').findOne({ email: 'ci-client@example.com' });
  clientUserId = cu!._id.toString();

  const cr = await request(app).post('/auth/login').send({ email: 'ci-client@example.com', password: 'Password123' });
  clientToken = cr.body.data.accessToken;

  const pr = await request(app).post('/auth/login').send({ email: 'ci-provider@example.com', password: 'Password123' });
  providerToken = pr.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Check-in Integration', () => {
  it('rejects check-in without auth', async () => {
    const res = await request(app).post('/api/checkins').send({ date: '2026-03-01', moodScore: 7 });
    expect(res.status).toBe(401);
  });

  it('rejects invalid moodScore', async () => {
    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ date: '2026-03-01', moodScore: 15 });
    expect(res.status).toBe(400);
  });

  it('client can submit a check-in', async () => {
    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        date: '2026-03-01',
        moodScore: 7,
        physicalSymptoms: ['fatigue', 'sleep_issues'],
        notes: 'Feeling okay today',
        sharedWithProvider: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.checkIn.moodScore).toBe(7);
    expect(res.body.alerts).toBeDefined();
  });

  it('rejects duplicate check-in for same date', async () => {
    const res = await request(app)
      .post('/api/checkins')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ date: '2026-03-01', moodScore: 5 });
    expect(res.status).toBe(409);
  });

  it('client can submit more check-ins', async () => {
    for (let d = 2; d <= 5; d++) {
      const dateStr = `2026-03-0${d}`;
      const res = await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ date: dateStr, moodScore: 8 - d, physicalSymptoms: ['fatigue'] });
      expect(res.status).toBe(201);
    }
  });

  it('client can fetch their check-ins', async () => {
    const res = await request(app)
      .get(`/api/checkins/user/${clientUserId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.checkIns.length).toBeGreaterThanOrEqual(5);
  });

  it('provider can fetch client check-ins', async () => {
    const res = await request(app)
      .get(`/api/checkins/user/${clientUserId}`)
      .set('Authorization', `Bearer ${providerToken}`);
    expect(res.status).toBe(200);
  });

  it('client can fetch trends', async () => {
    const res = await request(app)
      .get(`/api/checkins/trends/${clientUserId}?days=30`)
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.trends).toBeDefined();
    expect(res.body.trends.averageMood).toBeGreaterThan(0);
    expect(res.body.trends.symptomFrequency).toBeDefined();
    expect(res.body.alerts).toBeDefined();
  });
});
