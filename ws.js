const WebSocket = require('ws');

const ws = new WebSocket('wss://mainnet.zklighter.elliot.ai/stream');

ws.on('open', function open() {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'trades/0' }));
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'trade/0' }));
});

ws.on('message', function incoming(data) {
  console.log('Received:', data.toString());
});

setTimeout(() => {
  ws.close();
  process.exit(0);
}, 5000);
