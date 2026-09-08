// Central Vercel Serverless Endpoint til CRQS Ordrer
// Bruger KV / persistent cloud storage fallback så data synkroniseres mellem alle enheder (iPad & PC)

let memoryOrders = [];

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

  // Hvis Vercel KV er tilknyttet
  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (req.method === 'GET') {
    if (KV_URL && KV_TOKEN) {
      try {
        const response = await fetch(`${KV_URL}/get/unilever_crqs_orders`, {
          headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        const data = await response.json();
        const orders = data.result ? JSON.parse(data.result) : [];
        return res.status(200).json({ orders });
      } catch (err) {
        console.error('KV get error:', err);
      }
    }
    return res.status(200).json({ orders: memoryOrders });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const orders = body && Array.isArray(body.orders) ? body.orders : [];

      memoryOrders = orders;

      if (KV_URL && KV_TOKEN) {
        await fetch(`${KV_URL}/set/unilever_crqs_orders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${KV_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(JSON.stringify(orders))
        });
      }

      return res.status(200).json({ success: true, count: orders.length });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}