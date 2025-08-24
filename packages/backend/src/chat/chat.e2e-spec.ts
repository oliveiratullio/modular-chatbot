import request from 'supertest';

const API = process.env.E2E_API ?? 'http://localhost:8080';

describe('/chat (e2e)', () => {
  it('math', async () => {
    const res = await request(API).post('/chat').send({
      message: '65 x 3.11',
      user_id: 'u1',
      conversation_id: 'c1',
    });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).toMatch(/Result: 202\.15/);
  });
});
