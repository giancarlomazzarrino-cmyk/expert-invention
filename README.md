# Backend WhatsApp — Pastarrino

## Configuración
- Phone Number ID: 1100440363159404
- WA Business Account ID: 1665683154697345
- Número restaurante: +57 322 969 2275

## Endpoints
- GET  /health     → estado del servidor
- POST /pedido     → recibe pedido de la app web
- GET  /webhook    → verificación Meta
- POST /webhook    → mensajes entrantes WhatsApp

## Publicar gratis en Railway
1. Sube este código a GitHub
2. Conéctalo en railway.app
3. Copia la URL pública
4. Configura el webhook en Meta Developers

## Formato pedido (POST /pedido)
{
  "ref": "#1043",
  "nombre": "Maria Lopez",
  "telefono": "573001234567",
  "tipo": "Domicilio",
  "direccion": "Cra 70 #5-30",
  "notas": "Sin cebolla",
  "items": [
    {"cantidad": 1, "nombre": "Tagliatelle Al Ragú", "precio": 48500}
  ],
  "total": 48500
}
