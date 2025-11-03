import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.resolve(__dirname, '../../data/dailyFact.json');

export async function readDailyFact() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function writeDailyFact(payload) {
  const withTimestamp = {
    fetchedAt: new Date().toISOString(),
    ...payload,
  };
  await fs.writeFile(DATA_FILE, JSON.stringify(withTimestamp, null, 2), 'utf-8');
  return withTimestamp;
}

export function needsRefresh(currentFact) {
  if (!currentFact) return true;
  const now = new Date();
  const fetched = new Date(currentFact.fetchedAt);
  return (
    fetched.getUTCFullYear() !== now.getUTCFullYear() ||
    fetched.getUTCMonth() !== now.getUTCMonth() ||
    fetched.getUTCDate() !== now.getUTCDate()
  );
}
