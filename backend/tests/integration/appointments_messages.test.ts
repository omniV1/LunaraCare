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
let conversationId: string;
let appointmentId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Register client
  await request(app)
    .post('/auth/register')
    .send({
      firstName: 'Client',
      lastName: 'User',
      email: 'client@example.com',
      password: 'Password123',
      role: 'client'
    });
  // Register provider
  await request(app)
    .post('/auth/register')
    .send({
      firstName: 'Provider',
      lastName: 'User',
      email: 'provider@example.com',
      password: 'Password123',
      role: 'provider'
    });

  // Verify emails manually
  await mongoose.connection.collection('users').updateOne(
    { email: 'client@example.com' },
    { $set: { isEmailVerified: true } }
  );
  await mongoose.connection.collection('users').updateOne(
    { email: 'provider@example.com' },
    { $set: { isEmailVerified: true } }
  );

  // Login client
  const clientRes = await request(app)
    .post('/auth/login')
    .send({ email: 'client@example.com', password: 'Password123' });
  clientToken = clientRes.body.data.accessToken;

  // Login provider
  const providerRes = await request(app)
    .post('/auth/login')
    .send({ email: 'provider@example.com', password: 'Password123' });
  providerToken = providerRes.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Appointments & Messages Integration', () => {
  it('should create an appointment', async () => {
    // fetch user IDs
    const clientUser = await mongoose.connection.collection('users').findOne({ email: 'client@example.com' });
    const providerUser = await mongoose.connection.collection('users').findOne({ email: 'provider@example.com' });

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        clientId: clientUser!._id.toString(),
        providerId: providerUser!._id.toString(),
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        type: 'virtual'
      });
    expect(res.status).toBe(201);
    expect(res.body.appointment).toBeDefined();
    appointmentId = res.body.appointment._id;
  });

  it('client should list their appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('should send a message', async () => {
    const receiverUser = await mongoose.connection.collection('users').findOne({ email: 'provider@example.com' });
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        receiver: receiverUser!._id.toString(),
        content: 'Hello provider!'
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    conversationId = res.body.data.conversationId;
  });

  it('receiver should fetch conversation messages', async () => {
    const res = await request(app)
      .get(`/api/messages/${conversationId}`)
      .set('Authorization', `Bearer ${providerToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
}); 