// Vercel Serverless Function: OCR / Tekst-udlæsning fra pallesedler
// Benytter lynhurtig gratis OCR API så felter som MRDR, Beskrivelse og Antal udfyldes automatisk
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
    const { image } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Kald gratis OCR.Space API (eller fallback parser)
    const formData = new URLSearchParams();
    formData.append('base64Image', image);
    formData.append('language', 'dan');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': 'K84739281788957', // Public OCR service key
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!ocrResponse.ok) {
      // Fallback: hvis ekstern OCR fejler, returner tom data så brugeren stadig kan taste manuelt
      return res.status(200).json({ parsed: null });
    }

    const ocrData = await ocrResponse.json();
    const parsedText = ocrData?.ParsedResults?.[0]?.ParsedText || '';

    // Smart Regex Analyse specielt tilpasset Unilever / Smurfit Westrock pallesedler
    const lines = parsedText.split('\n').map(l => l.trim()).filter(Boolean);

    let oldItemNumber = '';
    let description = '';
    let quantity = '';
    let batchNumber = '';
    let expiryDate = '';

    // 1. Find 8-cifret MRDR / Varenummer (f.eks. 65644425)
    for (const line of lines) {
      const mrdrMatch = line.match(/\b(6\d{7})\b/) || line.match(/\b(\d{8})\b/);
      if (mrdrMatch && !oldItemNumber) {
        oldItemNumber = mrdrMatch[1];
      }

      // 2. Find Varebeskrivelse (f.eks. OMO COLOR, KNORR, SUN, DOVE, osv.)
      if (!description && (line.includes('OMO') || line.includes('KNORR') || line.includes('COLOR') || line.includes('SENS') || line.includes('5X') || line.includes('FLASKE') || line.includes('KARTON'))) {
        description = line;
      }

      // 3. Find antal pr palle (f.eks. 720, 2.500, 1750)
      const qtyMatch = line.match(/\b(720|1750|2500|2\.500|\d{3,4})\b/);
      if (qtyMatch && !quantity && Number(qtyMatch[1].replace('.', '')) > 50 && Number(qtyMatch[1].replace('.', '')) < 50000) {
        // Ignorer selve varenummeret som antal
        if (qtyMatch[1] !== oldItemNumber) {
          quantity = qtyMatch[1].replace('.', '');
        }
      }

      // 4. Find dato (f.eks. 25.08.26 eller lignende)
      const dateMatch = line.match(/\b(\d{2}[./-]\d{2}[./-]\d{2,4})\b/);
      if (dateMatch && !expiryDate) {
        expiryDate = dateMatch[1];
      }

      // 5. Find Batch eller Ordre reference
      const batchMatch = line.match(/\b(\d{7}-\d|\d{10}\/\d{2})\b/);
      if (batchMatch && !batchNumber) {
        batchNumber = batchMatch[1];
      }
    }

    // Hvis beskrivelse stadig mangler, men vi fandt linjen under varenr
    if (!description && oldItemNumber) {
      const idx = lines.findIndex(l => l.includes(oldItemNumber));
      if (idx !== -1 && lines[idx + 1]) {
        description = lines[idx + 1];
      }
    }

    return res.status(200).json({
      parsed: {
        rawText: parsedText,
        oldItemNumber,
        description,
        quantity: quantity ? Number(quantity) : undefined,
        batchNumber,
        expiryDate
      }
    });

  } catch (error) {
    console.error('OCR parse error:', error);
    return res.status(200).json({ parsed: null });
  }
}
