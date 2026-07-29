const snipes = new Map();

export function setSnipe(channelId, payload) {
  snipes.set(channelId, payload);
}

export function getSnipe(channelId) {
  return snipes.get(channelId) || null;
}
