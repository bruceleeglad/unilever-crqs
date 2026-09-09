// Serverless endpoint til modtagelse og persistens af CRQS billeder
// Gemmer direkte i ntfy attachment cloud s� billeder altid er tilg�ngelige internt i Unilever uden blokering
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, filename } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Convert base64 data url to Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const fname = filename || `crqs-${Date.now()}.jpg`;

    // Upload to ntfy cloud attachment bucket
    const ntfyRes = await fetch('https://ntfy.sh/unilever-crqs-photos-v1', {
      method: 'PUT',
      headers: {
        'Filename': fname,
        'Content-Type': 'image/jpeg'
      },
      body: buffer
    });

    if (ntfyRes.ok) {
      const data = await ntfyRes.json();
      if (data && data.attachment && data.attachment.url) {
        return res.status(200).json({ url: data.attachment.url });
      }
    }

    // Fallback til litterbox hvis ntfy fejler
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('time', '72h');
    form.append('fileToUpload', new Blob([buffer], { type: 'image/jpeg' }), fname);

    const litterRes = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: form
    });
    if (litterRes.ok) {
      const litterUrl = await litterRes.text();
      return res.status(200).json({ url: litterUrl.trim() });
    }

    // Hvis ekstern upload fejler, returner det komprimerede base64 direkte
    return res.status(200).json({ url: image });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
