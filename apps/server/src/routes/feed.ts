import { Hono } from 'hono';
import { store } from '../store.js';

const feed = new Hono();

// GET /api/feed
feed.get('/', (c) => {
  const limit = Number(c.req.query('limit') ?? 50);
  return c.json({ feed: store.getFeed(limit) });
});

// GET /api/skills
feed.get('/skills', (c) => {
  return c.json({ skills: store.getSkills() });
});

export default feed;
