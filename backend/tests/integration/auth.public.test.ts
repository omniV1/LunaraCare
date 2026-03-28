// jest
// This file uses Jest test globals

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth & Public Integration', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'Password123',
          role: 'client'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('jane@example.com');
    });

    it('should not register with duplicate email', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'dupe@example.com',
          password: 'Password123',
          role: 'client'
        });
      const res = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'dupe@example.com',
          password: 'Password123',
          role: 'client'
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail validation for missing fields', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'bad@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          firstName: 'Login',
          lastName: 'User',
          email: 'login@example.com',
          password: 'Password123',
          role: 'client'
        });
      // Manually verify email for login test
      await mongoose.connection.collection('users').updateOne(
        { email: 'login@example.com' },
        { $set: { isEmailVerified: true } }
      );
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should not login with wrong password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword'
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should fail validation for missing fields', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'login@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Validation failed');
    });
  });

  describe('POST /public/contact', () => {
    it('should submit contact form successfully', async () => {
      const res = await request(app)
        .post('/public/contact')
        .send({
          name: 'Contact User',
          email: 'contact@example.com',
          message: 'I need help!'
        });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/Thank you/i);
      expect(res.body.status).toBe('success');
    });

    it('should fail validation for missing fields', async () => {
      const res = await request(app)
        .post('/public/contact')
        .send({ email: 'bad@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toBeDefined();
    });
  });
}); 