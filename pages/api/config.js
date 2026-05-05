import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'config.json');

export default function handler(req, res) {
  if (req.method === 'GET') {
    try {
      res.status(200).json(JSON.parse(fs.readFileSync(configPath, 'utf8')));
    } catch (err) {
      res.status(500).json({ error: `Failed to read config: ${err.message}` });
    }
  } else if (req.method === 'POST') {
    try {
      fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: `Failed to write config: ${err.message}` });
    }
  } else {
    res.status(405).end();
  }
}
