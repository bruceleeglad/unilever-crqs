// Serverless endpoint til modtagelse og synkronisering af Paller på skyggelager
const SYNC_TOPIC = 'unilever-crqs-pallets-v1';
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

  // GET: Hent den seneste palle-tilstand fra skyen
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

        for (let i = lines.length - 1; i >= 0; i--) {
          const item = lines[i];
          if (item.attachment && item.attachment.url) {
            try {
              const attachRes = await fetch(item.attachment.url);
              if (attachRes.ok) {
                const attachJson = await attachRes.json();
                if (attachJson && Array.isArray(attachJson.pallets)) {
                  return res.status(200).json({ pallets: attachJson.pallets });
                }
              }
            } catch (err) {
              console.error('Fetch attachment error:', err);
            }
          }

          try {
            const parsed = JSON.parse(item.message);
            if (parsed && Array.isArray(parsed.pallets)) {
              return res.status(200).json({ pallets: parsed.pallets });
            }
          } catch (e) {}
        }
      }
      return res.status(200).json({ pallets: [] });
    } catch (e) {
      return res.status(200).json({ pallets: [] });
    }
  }

  // POST: Gem den opdaterede palle-tilstand til skyen
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const pallets = body.pallets || [];

      const payload = JSON.stringify({ pallets, updatedAt: new Date().toISOString() });

      if (Buffer.byteLength(payload, 'utf8') > 3800) {
        const attachRes = await fetch(SYNC_ENDPOINT, {
          method: 'PUT',
          headers: {
            'Title': 'Unilever Pallets Update Attachment',
            'Filename': `pallets-${Date.now()}.json`,
            'Content-Type': 'application/json'
          },
          body: payload
        });
        if (attachRes.ok) {
          return res.status(200).json({ success: true, mode: 'attachment' });
        }
      }

      await fetch(SYNC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Title': 'Unilever Pallets Update',
          'Priority': 'default'
        },
        body: payload
      });

      return res.status(200).json({ success: true, count: pallets.length });
    } catch (error) {
      console.error('Failed to sync pallets:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
