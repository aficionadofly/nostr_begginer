import WebSocket, { WebSocketServer } from 'ws';
import express from 'express';

const app = express();
const port = 3000;
const server = app.listen(port, () => console.log(`Listening on port ${port}`));
const wss = new WebSocketServer({ server });

const clients = new Map();

// Handling incoming WebSocket connections
wss.on('connection', (ws) => {
  const id = Date.now();
  const subscriptions = new Set();
  clients.set(ws, { id, subscriptions });

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);

    try {
        const { method, params } = JSON.parse(message);
        
        switch(method) {
            case 'EVENT':
                handleEvent(params);
                break;
            case 'REQ':
                handleRequest(params);
                break;
            default:
                console.error('Unsupported method:', method);
                break;
        }
    } catch (err) {
        console.error('Failed to parse message as JSON', err);
    }
});


  ws.on('close', () => {
    clients.delete(ws);
    console.log(`Connection ${id} closed`);
  });
});

// Handling incoming messages
function handleIncomingMessage(ws, message) {
  let data;
  console.log(data.toString('utf-8'))
  try {
    data = JSON.parse(message);
  } catch (error) {
    return console.error('Invalid JSON:', message);
  }

  const { id, subscriptions } = clients.get(ws);

  switch (data.method) {
    case 'EVENT':
      broadcastEvent(data.params);
      break;
    case 'REQ':
      subscribeToEvents(ws, data.params);
      break;
    default:
      console.log(`Unsupported method from ${id}: ${data.method}`);
  }
}

// Broadcasting events to subscribers
function broadcastEvent(event) {
  clients.forEach(({ subscriptions }, ws) => {
    if (subscriptions.has(event.tags)) {
      ws.send(JSON.stringify(event));
    }
  });
}

// Subscribing to specific events
function subscribeToEvents(ws, { tags }) {
  const clientData = clients.get(ws);
  tags.forEach(tag => clientData.subscriptions.add(tag));
  console.log(`Client ${clientData.id} subscribed to tags: ${tags.join(', ')}`);
}

console.log('Nostr relay running...');
