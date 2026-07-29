/** @typedef {{ res: import('express').Response, userId: string, channelId: string }} Client */

/** @type {Set<Client>} */
const clients = new Set();

export function subscribe(res, { userId, channelId }) {
  const client = { res, userId, channelId };
  clients.add(client);

  res.on("close", () => {
    clients.delete(client);
  });

  return client;
}

export function broadcast(event, payload, { channelId = null, excludeUserId = null } = {}) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    if (channelId && client.channelId !== channelId && event === "message") continue;
    if (excludeUserId && client.userId === excludeUserId && event === "typing") continue;
    try {
      client.res.write(data);
    } catch {
      clients.delete(client);
    }
  }
}

export function broadcastPresence(users) {
  broadcast("presence", { users }, {});
}

export function clientCount() {
  return clients.size;
}

export function setClientChannel(client, channelId) {
  client.channelId = channelId;
}
