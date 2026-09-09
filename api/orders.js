// Central Vercel Serverless Endpoint til CRQS Ordrer
// Bruger persistent cloud sync bus så iPad og Chef PC deler alle data i realtid uden login

const SYNC_TOPIC = 'unilever-crqs-db-state-v1';
const SYNC_ENDPOINT = `https://ntfy.sh/${SYNC_TOPIC}`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Hent den seneste ordretilstand fra skyen
  if (req.method === 'GET') {
    try {
      const response = await fetch(`${SYNC_ENDPOINT}/json?poll=1`, {
        headers: { 'User-Agent': 'Unilever-CRQS' }
      });
      if (response.ok) {
        const text = await response.text();
        const lines = text
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter((item) => item && item.event === 'message' && item.message);

        // Find den seneste meddelelse, der indeholder ordrer
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const parsed = JSON.parse(lines[i].message);
            if (parsed && Array.isArray(parsed.orders)) {
              return res.status(200).json({ orders: parsed.orders });
            }
          } catch {
            // Spring over hvis ikke gyldig JSON
          }
        }
      }
    } catch (e) {
      console.error('Fetch cloud orders error:', e);
    }
    return res.status(200).json({ orders: [] });
  }

  // POST: Gem ordrer i den globale sky
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const orders = body && Array.isArray(body.orders) ? body.orders : [];

      const payload = JSON.stringify({
        orders,
        updatedAt: new Date().toISOString()
      });

      const sendRes = await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Title': 'orders-sync',
          'Content-Type': 'application/json'
        },
        body: payload
      });

      if (sendRes.ok) {
        return res.status(200).json({ success: true, count: orders.length });
      } else {
        return res.status(500).json({ error: 'Failed to broadcast orders' });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}