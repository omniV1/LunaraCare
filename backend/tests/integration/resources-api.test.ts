// Simple API structure test for resources
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../../src/server';

describe('Resources API Structure', () => {
  it('should require authentication for GET /api/resources', async () => {
    const res = await request(app)
      .get('/api/resources');
    
    expect(res.status).toBe(401);
  });

  it('should require authentication for POST /api/resources', async () => {
    const res = await request(app)
      .post('/api/resources')
      .send({
        title: 'Test Resource',
        description: 'Test Description',
        content: 'Test Content',
        category: 'Test Category',
        author: '507f1f77bcf86cd799439011'
      });
    
    expect(res.status).toBe(401);
  });

  it('should require authentication for GET /api/resources/:id', async () => {
    const res = await request(app)
      .get('/api/resources/1');
    
    expect(res.status).toBe(401);
  });

  it('should require authentication for PUT /api/resources/:id', async () => {
    const res = await request(app)
      .put('/api/resources/1')
      .send({
        title: 'Updated Resource'
      });
    
    expect(res.status).toBe(401);
  });

  it('should require authentication for DELETE /api/resources/:id', async () => {
    const res = await request(app)
      .delete('/api/resources/1');
    
    expect(res.status).toBe(401);
  });

  it('should return 404 for non-existent routes', async () => {
    const res = await request(app)
      .get('/api/nonexistent');
    
    expect(res.status).toBe(404);
  });
});
