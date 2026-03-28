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
let providerUserId: string;
let templateId: string;
let carePlanId: string;
let milestoneId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  await request(app).post('/auth/register').send({
    firstName: 'CPClient', lastName: 'User',
    email: 'cp-client@example.com', password: 'Password123', role: 'client',
  });
  await request(app).post('/auth/register').send({
    firstName: 'CPProvider', lastName: 'User',
    email: 'cp-provider@example.com', password: 'Password123', role: 'provider',
  });

  await mongoose.connection.collection('users').updateOne(
    { email: 'cp-client@example.com' }, { $set: { isEmailVerified: true } });
  await mongoose.connection.collection('users').updateOne(
    { email: 'cp-provider@example.com' }, { $set: { isEmailVerified: true } });

  const cu = await mongoose.connection.collection('users').findOne({ email: 'cp-client@example.com' });
  clientUserId = cu!._id.toString();
  const pu = await mongoose.connection.collection('users').findOne({ email: 'cp-provider@example.com' });
  providerUserId = pu!._id.toString();

  const cr = await request(app).post('/auth/login').send({ email: 'cp-client@example.com', password: 'Password123' });
  clientToken = cr.body.data.accessToken;

  const pr = await request(app).post('/auth/login').send({ email: 'cp-provider@example.com', password: 'Password123' });
  providerToken = pr.body.data.accessToken;

  // Seed a template directly
  const templateDoc = await mongoose.connection.collection('careplantemplates').insertOne({
    name: 'Standard Postpartum',
    description: 'Default 12-week plan',
    targetCondition: 'postpartum',
    isActive: true,
    createdBy: new mongoose.Types.ObjectId(providerUserId),
    sections: [
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Physical Recovery',
        milestones: [
          { _id: new mongoose.Types.ObjectId(), title: '6-week checkup', weekOffset: 6, category: 'physical' },
          { _id: new mongoose.Types.ObjectId(), title: 'Resume exercise', weekOffset: 8, category: 'physical' },
        ],
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Emotional Wellbeing',
        milestones: [
          { _id: new mongoose.Types.ObjectId(), title: 'PPD screening', weekOffset: 2, category: 'emotional' },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  templateId = templateDoc.insertedId.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Care Plans Integration', () => {
  it('lists active templates', async () => {
    const res = await request(app)
      .get('/api/care-plans/templates')
      .set('Authorization', `Bearer ${providerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].name).toBe('Standard Postpartum');
  });

  it('rejects care plan creation by a client', async () => {
    const res = await request(app)
      .post('/api/care-plans')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ clientId: clientUserId, title: 'Test Plan' });
    expect(res.status).toBe(403);
  });

  it('provider creates a care plan from template', async () => {
    const res = await request(app)
      .post('/api/care-plans')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        clientId: clientUserId,
        title: 'Postpartum Plan for CPClient',
        templateId,
      });
    expect(res.status).toBe(201);
    expect(res.body.carePlan.sections).toHaveLength(2);
    expect(res.body.carePlan.progress).toBe(0);
    carePlanId = res.body.carePlan._id;

    // Grab a milestone ID for later
    milestoneId = res.body.carePlan.sections[0].milestones[0]._id;
  });

  it('provider updates the care plan title', async () => {
    const res = await request(app)
      .put(`/api/care-plans/${carePlanId}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ title: 'Updated Plan Title' });
    expect(res.status).toBe(200);
    expect(res.body.carePlan.title).toBe('Updated Plan Title');
  });

  it('client can complete a milestone', async () => {
    const res = await request(app)
      .patch(`/api/care-plans/${carePlanId}/milestone/${milestoneId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'completed', notes: 'Went great!' });
    expect(res.status).toBe(200);
    expect(res.body.progress).toBeGreaterThan(0);
  });

  it('returns 404 for non-existent milestone', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/care-plans/${carePlanId}/milestone/${fakeId}`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Milestone not found');
  });

  it('rejects milestone update from unrelated user', async () => {
    // Register a second unrelated client
    await request(app).post('/auth/register').send({
      firstName: 'Unrelated', lastName: 'User',
      email: 'unrelated@example.com', password: 'Password123', role: 'client',
    });
    await mongoose.connection.collection('users').updateOne(
      { email: 'unrelated@example.com' }, { $set: { isEmailVerified: true } });
    const ur = await request(app).post('/auth/login').send({ email: 'unrelated@example.com', password: 'Password123' });
    const unrelatedToken = ur.body.data.accessToken;

    const res = await request(app)
      .patch(`/api/care-plans/${carePlanId}/milestone/${milestoneId}`)
      .set('Authorization', `Bearer ${unrelatedToken}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(403);
  });
});
