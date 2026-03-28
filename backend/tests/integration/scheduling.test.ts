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
let clientUserId: string;
let providerUserId: string;
let slotId: string;
let appointmentId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Register client
  await request(app)
    .post('/auth/register')
    .send({
      firstName: 'SchedClient',
      lastName: 'User',
      email: 'sched-client@example.com',
      password: 'Password123',
      role: 'client',
    });

  // Register provider
  await request(app)
    .post('/auth/register')
    .send({
      firstName: 'SchedProvider',
      lastName: 'User',
      email: 'sched-provider@example.com',
      password: 'Password123',
      role: 'provider',
    });

  // Verify emails
  await mongoose.connection
    .collection('users')
    .updateOne(
      { email: 'sched-client@example.com' },
      { $set: { isEmailVerified: true } }
    );
  await mongoose.connection
    .collection('users')
    .updateOne(
      { email: 'sched-provider@example.com' },
      { $set: { isEmailVerified: true } }
    );

  // Get user IDs
  const clientUser = await mongoose.connection
    .collection('users')
    .findOne({ email: 'sched-client@example.com' });
  clientUserId = clientUser!._id.toString();

  const providerUser = await mongoose.connection
    .collection('users')
    .findOne({ email: 'sched-provider@example.com' });
  providerUserId = providerUser!._id.toString();

  // Login client
  const clientRes = await request(app)
    .post('/auth/login')
    .send({ email: 'sched-client@example.com', password: 'Password123' });
  clientToken = clientRes.body.data.accessToken;

  // Login provider
  const providerRes = await request(app)
    .post('/auth/login')
    .send({ email: 'sched-provider@example.com', password: 'Password123' });
  providerToken = providerRes.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Scheduling & Booking Workflow', () => {
  // ─── Provider availability ──────────────────────────────────────

  it('rejects creating availability without auth', async () => {
    const res = await request(app)
      .post(`/api/providers/${providerUserId}/availability`)
      .send({
        slots: [{ date: '2026-03-10', startTime: '09:00', endTime: '10:00' }],
      });
    expect(res.status).toBe(401);
  });

  it('provider can create availability slots', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const res = await request(app)
      .post(`/api/providers/${providerUserId}/availability`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        slots: [
          { date: dateStr, startTime: '09:00', endTime: '10:00' },
          { date: dateStr, startTime: '10:00', endTime: '11:00' },
          { date: dateStr, startTime: '14:00', endTime: '15:00' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.slots).toHaveLength(3);
    slotId = res.body.slots[0]._id;
  });

  it('forbids client from creating availability for a provider', async () => {
    const res = await request(app)
      .post(`/api/providers/${providerUserId}/availability`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        slots: [{ date: '2026-03-10', startTime: '09:00', endTime: '10:00' }],
      });
    expect(res.status).toBe(403);
  });

  it('client can query provider availability', async () => {
    const res = await request(app)
      .get(`/api/providers/${providerUserId}/availability`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.slots.length).toBeGreaterThanOrEqual(3);
  });

  // ─── Booking workflow: request → confirm → cancel ───────────────

  it('client can request an appointment via a slot', async () => {
    const res = await request(app)
      .post('/api/appointments/request')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        providerId: providerUserId,
        slotId,
        type: 'virtual',
        notes: 'First consultation',
      });

    expect(res.status).toBe(201);
    expect(res.body.appointment).toBeDefined();
    expect(res.body.appointment.status).toBe('requested');
    appointmentId = res.body.appointment._id;
  });

  it('rejects booking an already-booked slot', async () => {
    const res = await request(app)
      .post('/api/appointments/request')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        providerId: providerUserId,
        slotId,
        type: 'virtual',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Slot is already booked');
  });

  it('provider can confirm the requested appointment', async () => {
    const res = await request(app)
      .post(`/api/appointments/${appointmentId}/confirm`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe('confirmed');
    expect(res.body.appointment.confirmedAt).toBeDefined();
  });

  it('cannot confirm an already confirmed appointment', async () => {
    const res = await request(app)
      .post(`/api/appointments/${appointmentId}/confirm`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(400);
  });

  it('client can cancel the confirmed appointment', async () => {
    const res = await request(app)
      .post(`/api/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ reason: 'Schedule conflict' });

    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe('cancelled');
    expect(res.body.appointment.cancellationReason).toBe('Schedule conflict');
  });

  it('cannot cancel an already cancelled appointment', async () => {
    const res = await request(app)
      .post(`/api/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(400);
  });

  it('freed slot should be available again after cancellation', async () => {
    const slot = await mongoose.connection
      .collection('availabilityslots')
      .findOne({ _id: new mongoose.Types.ObjectId(slotId) });

    expect(slot).toBeDefined();
    expect(slot!.isBooked).toBe(false);
  });

  // ─── List & get ─────────────────────────────────────────────────

  it('client can list their appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${clientToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('provider can list their appointments', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
