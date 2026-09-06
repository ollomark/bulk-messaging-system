const ANON_WEBHOOK_NAME = "Anonim";
const ANON_AVATAR = "https://cdn.discordapp.com/embed/avatars/1.png";

export { ANON_WEBHOOK_NAME, ANON_AVATAR };

export async function getAnonWebhook(channel) {
  const hooks = await channel.fetchWebhooks();
  let hook = hooks.find(
    (h) => h.name === ANON_WEBHOOK_NAME && h.owner?.id === channel.client.user.id,
  );
  if (!hook) {
    hook = await channel.createWebhook({
      name: ANON_WEBHOOK_NAME,
      avatar: ANON_AVATAR,
      reason: "Anonim mesaj sistemi",
    });
  }
  return hook;
}
