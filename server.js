const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    const data = JSON.parse(raw.toString());

    // Register username
    if (data.type === "register") {
      ws.username = data.username;
      return;
    }

    // Invite flow
    if (data.type === "invite") {
      wss.clients.forEach(client => {
        if (client.username === data.to) {
          client.send(JSON.stringify({
            type: "invite",
            from: data.from,
            to: data.to
          }));
        }
      });
    }

    // Invite response
    if (data.type === "invite-response") {
      if (data.response === "accept") {
        const roomId = `${data.from}-${data.to}-${Date.now()}`;
        wss.clients.forEach(client => {
          if (client.username === data.from || client.username === data.to) {
            client.send(JSON.stringify({
              type: "start-private",
              room: roomId,
              from: data.from,
              to: data.to,
              partner: client.username === data.from ? data.to : data.from
            }));
          }
        });
      } else {
        wss.clients.forEach(client => {
          if (client.username === data.from) {
            client.send(JSON.stringify({
              type: "invite-ignored",
              from: data.to
            }));
          }
        });
      }
    }

    // Private messages
    if (data.type === "private") {
      wss.clients.forEach(client => {
        if (client.username === data.to || client.username === data.from) {
          client.send(JSON.stringify({
            type: "private",
            from: data.from,
            to: data.to,
            text: data.text,
            room: data.room
          }));
        }
      });
    }

    // Global chat
    if (data.type === "global") {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "global",
            text: data.from + ": " + data.text
          }));
        }
      });
    }
  });
});
