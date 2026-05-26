const http = require('http');
const https = require('https');

const PHONE_ID = '1100440363159404';
const TOKEN =EAAVZB2ZBt4csYBRsR7joHW8ob4QWOenhhuVsDRL13ZB8TLa9VpkCHhyJhR3JQ0fZBKgLIDbC17uwh4Vv5b3DMrG5Raf1GpoEXSxUKmUqy2eN3SziZAvrtFxMhWxtsywvKdZBnMTJAyu5trPPDl7EAgjysDMO6p6SpwBKDPagnWvcXBZC2FgmFwWVmyy9yXAn7IcTsuahS56oDp2s1wVaeLnIkzMEdPWWOARYYtYM5PjZC89ALVoUgPYJHJblCSgOG38E5ZCWjqlgpXNBeZAJBZBh8VsTALMd6QZBensJ
const VERIFY = 'pastarrino2024';
const RESTO = '573229692275';

function sendWA(to, text) {
  return new Promise(function(resolve, reject) {
    var payload = JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: { body: text }
    });
    var options = {
      hostname: 'graph.facebook.com',
      path: '/v19.0/' + PHONE_ID + '/messages',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    var req = https.request(options, function(res) {
      var d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() { resolve({ status: res.statusCode, body: d }); });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

var server = http.createServer(function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"status":"ok","negocio":"Pastarrino"}');
    return;
  }

  if (req.method === 'GET' && req.url.indexOf('/webhook') === 0) {
    var url = new URL(req.url, 'http://localhost');
    var mode = url.searchParams.get('hub.mode');
    var token = url.searchParams.get('hub.verify_token');
    var challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === VERIFY) {
      res.writeHead(200);
      res.end(challenge);
    } else {
      res.writeHead(403);
      res.end('Forbidden');
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/pedido') {
    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try {
        var p = JSON.parse(body);
        var items = p.items.map(function(i) {
          return '  - ' + i.cantidad + 'x ' + i.nombre + ' $' + i.precio;
        }).join('\n');
        var msgR = 'NUEVO PEDIDO ' + p.ref + '\n\nCliente: ' + p.nombre + '\nTel: ' + p.telefono + '\nTipo: ' + p.tipo + '\n\n' + items + '\n\nTOTAL: $' + p.total;
        var msgC = 'Pedido ' + p.ref + ' recibido! Te confirmamos pronto. Pastarrino';
        sendWA(RESTO, msgR).then(function() {
          if (p.telefono) return sendWA(p.telefono, msgC);
        }).then(function() {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        }).catch(function(e) {
          res.writeHead(500);
          res.end('{"ok":false}');
        });
      } catch(e) {
        res.writeHead(400);
        res.end('{"ok":false,"error":"' + e.message + '"}');
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

var PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', function() {
  console.log('Pastarrino backend OK en puerto ' + PORT);
});
