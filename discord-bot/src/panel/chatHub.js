/** @typedef {{ res: import('express').Response, userId: string, channelId: string }} Client */

/** @type {Set<Client>} */
const clients = new Set();

export function subscribe(res, { userId, channelId }) {
  const client = { res, userId, channelId };
  clients.add(client);
  res.on("close", () => clients.delete(client));
  return client;
}

export function setClientChannel(userId, channelId) {
  for (const client of clients) {
    if (client.userId === userId) client.channelId = channelId;
  }
}

export function broadcast(event, payload, { channelId = null, excludeUserId = null } = {}) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    if (excludeUserId && client.userId === excludeUserId && event === "typing") continue;

    // Channel-scoped events
    if (
      channelId &&
      ["message", "message_update", "typing"].includes(event) &&
      client.channelId !== channelId
    ) {
      continue;
    }

    try {
      client.res.write(data);
    } catch {
      clients.delete(client);
    }
  }
}

export function broadcastPresence(users, voice = []) {
  broadcast("presence", { users, voice }, {});
}

export function clientCount() {
  return clients.size;
}
