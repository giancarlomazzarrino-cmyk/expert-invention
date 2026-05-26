const http = require('http');
const https = require('https');

const CONFIG = {
  PHONE_NUMBER_ID: '1100440363159404',
  ACCESS_TOKEN: 'EAAVZB2ZBt4csYBRo1jNAhW1APn1ZA6PYfhYvAchLwfoJq6fE562N0eZAwtYx2PiNbxWfujrgdZBBS4JuBMhUcgYgS79G7BsJtLXj56eV4ikHYS7bf4dSL8IKsDIywog09sflsfuResJfRtHztzUAhNwA7kE1whQfVj70sycmpPKdxBQ6ZAafGttZAyVPDDxvVG2AlrtZCHMRjFXz7srJTvN1OtlNpMANhXSNkY2WIb32oh9EwkKEAuhhxcbVhqpDhJZC3qR0Do6yQJUZCDvlGmNZAonz6ZBJER2n7Pe6',
  VERIFY_TOKEN: 'pastarrino2024',
  RESTAURANT_NUMBER: '573229692275',
};

function sendWA(to, msg) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { body: msg }
    });
    const opts = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${CONFIG.PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: d }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Webhook verificacion Meta
  if (req.method === 'GET' && req.url.startsWith('/webhook')) {
    const u = new URL(req.url, 'http://localhost');
    if (u.searchParams.get('hub.verify_token') === CONFIG.VERIFY_TOKEN) {
      res.writeHead(200); res.end(u.searchParams.get('hub.challenge')); return;
    }
    res.writeHead(403); res.end(); return;
  }

  // Webhook mensajes entrantes
  if (req.method === 'POST' && req.url === '/webhook') {
    let b = ''; req.on('data', c => b += c);
    req.on('end', async () => {
      try {
        const data = JSON.parse(b);
        const msg = data?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (msg && msg.text?.body?.toUpperCase().startsWith('CONFIRMAR')) {
          const ref = msg.text.body.split(' ')[1];
          await sendWA(msg.from, `✅ Pedido ${ref} *CONFIRMADO* y en preparacion. Gracias!`);
        }
      } catch(e) { console.error(e); }
      res.writeHead(200); res.end('OK');
    });
    return;
  }

  // Recibir pedido de la app web
  if (req.method === 'POST' && req.url === '/pedido') {
    let b = ''; req.on('data', c => b += c);
    req.on('end', async () => {
      try {
        const p = JSON.parse(b);
        const items = p.items.map(i => `  • ${i.cantidad}x ${i.nombre} - $${Number(i.precio).toLocaleString('es-CO')}`).join('\n');
        const total = Number(p.total).toLocaleString('es-CO');
        const msgR = `🍝 *NUEVO PEDIDO ${p.ref}*\n\n👤 ${p.nombre}\n📱 ${p.telefono}\n🛵 ${p.tipo}${p.direccion ? '\n📍 ' + p.direccion : ''}${p.notas ? '\n📝 ' + p.notas : ''}\n\n*Items:*\n${items}\n\n💰 *TOTAL: $${total}*`;
        const msgC = `✅ *Pedido recibido ${p.nombre}!*\n\nPedido *${p.ref}* enviado a Pastarrino.\nTe confirmamos en unos minutos 🍝\n\n💰 Total: $${total}`;
        await sendWA(CONFIG.RESTAURANT_NUMBER, msgR);
        if (p.telefono) await sendWA(p.telefono, msgC);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, ref: p.ref }));
      } catch(e) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // Health check
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', negocio: 'Pastarrino', ts: new Date().toISOString() }));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

// IMPORTANTE: Railway usa process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend Pastarrino corriendo en puerto ${PORT}`);
});
