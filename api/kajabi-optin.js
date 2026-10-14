const FORM_IDS = Object.freeze({
  S1: '2149753334',
  S2: '2149753333',
  S3: '2149753335'
});

const KAJABI_HOST = 'https://angelika-reimer.mykajabi.com';

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    return hostname === 'detector.themagneticfemme.co' ||
      hostname.endsWith('.vercel.app') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function extractEmbedValue(source, pattern, label) {
  const match = source.match(pattern);
  if (!match?.[1]) throw new Error(`Kajabi embed is missing ${label}`);
  return match[1].replaceAll('\\u0026', '&');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!isAllowedOrigin(req.headers.origin)) {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  }

  const { name, email, result, consent, company } = req.body || {};
  if (company) return res.status(200).json({ ok: true });
  if (consent !== true) return res.status(400).json({ ok: false, error: 'Consent required' });
  if (!FORM_IDS[result]) return res.status(400).json({ ok: false, error: 'Invalid result' });
  if (typeof name !== 'string' || name.trim().length < 1 || name.length > 120) {
    return res.status(400).json({ ok: false, error: 'Invalid name' });
  }
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }

  try {
    const formId = FORM_IDS[result];
    const embedUrl = `${KAJABI_HOST}/forms/${formId}/embed.js`;
    const embedResponse = await fetch(embedUrl, {
      headers: { 'User-Agent': 'The Magnetic Femme Situationship Detector' }
    });
    if (!embedResponse.ok) throw new Error(`Kajabi embed returned ${embedResponse.status}`);

    const embedSource = await embedResponse.text();
    const action = extractEmbedValue(
      embedSource,
      /action=\\?"(https:\/\/[^"\\]+\/form_submissions)\\?"/,
      'form action'
    );
    const authenticityToken = extractEmbedValue(
      embedSource,
      /name=\\?"authenticity_token\\?" value=\\?"([^"\\]+)\\?"/,
      'authenticity token'
    );

    const payload = new URLSearchParams({
      authenticity_token: authenticityToken,
      'form_submission[name]': name.trim(),
      'form_submission[email]': email.trim().toLowerCase(),
      kjb_visitor_time_zone: req.headers['x-vercel-ip-timezone'] || 'Europe/Zurich'
    });

    const submission = await fetch(action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'The Magnetic Femme Situationship Detector'
      },
      body: payload,
      redirect: 'follow'
    });

    if (!submission.ok) throw new Error(`Kajabi submission returned ${submission.status}`);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Kajabi opt-in failed', error);
    return res.status(502).json({ ok: false, error: 'Opt-in temporarily unavailable' });
  }
};
