export function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}
export async function readBody(req, limit=262144) {
  if (req.body !== undefined) {
    const text = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(text) > limit) throw new Error('BODY_LIMIT');
    return JSON.parse(text);
  }
  let text='';
  for await (const chunk of req) { text+=chunk; if(Buffer.byteLength(text)>limit)throw new Error('BODY_LIMIT'); }
  return text ? JSON.parse(text) : {};
}
export function sameOrigin(req) {
  const expected = process.env.BETTER_AUTH_URL || 'https://aurora-sre-academy.vercel.app';
  return req.headers.origin === expected && (!req.headers['sec-fetch-site'] || req.headers['sec-fetch-site']==='same-origin');
}
