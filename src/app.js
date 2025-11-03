import express from 'express';
import dotenv from 'dotenv';
import cron from 'node-cron';

import { fetchHistoricalFact } from './services/geminiService.js';
import {
  readDailyFact,
  writeDailyFact,
  needsRefresh,
} from './store/dailyFactStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || null;

app.use(express.json());
app.use(express.static('public'));

async function refreshFact({ force = false } = {}) {
  const cached = await readDailyFact();
  if (!force && !needsRefresh(cached)) {
    return cached;
  }

  const fact = await fetchHistoricalFact({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  });

  const stored = await writeDailyFact(fact);
  return stored;
}

app.get('/api/daily-fact', async (req, res) => {
  try {
    const cached = await readDailyFact();
    if (needsRefresh(cached)) {
      const updated = await refreshFact();
      res.json({ status: 'fresh', data: updated });
    } else {
      res.json({ status: 'cached', data: cached });
    }
  } catch (error) {
    console.error('Failed to serve daily fact', error);
    res.status(500).json({
      error: 'Failed to retrieve daily fact. Please try again later.',
    });
  }
});

app.post('/api/daily-fact/refresh', async (req, res) => {
  try {
    if (ADMIN_API_TOKEN) {
      const token = req.headers['x-admin-token'];
      if (token !== ADMIN_API_TOKEN) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const fact = await refreshFact({ force: true });
    res.json({ status: 'refreshed', data: fact });
  } catch (error) {
    console.error('Failed to refresh daily fact', error);
    res.status(500).json({ error: 'Unable to refresh fact at this time.' });
  }
});

cron.schedule('0 8 * * *', async () => {
  try {
    await refreshFact({ force: true });
    console.log('Daily fact refreshed at 08:00 UTC');
  } catch (error) {
    console.error('Scheduled refresh failed', error);
  }
}, {
  timezone: 'UTC',
});

(async () => {
  try {
    await refreshFact();
  } catch (error) {
    console.error('Initial fact fetch failed', error.message);
  }
})();

app.listen(PORT, () => {
  console.log(`History Daily server listening on port ${PORT}`);
});
