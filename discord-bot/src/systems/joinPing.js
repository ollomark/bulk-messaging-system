const DEFAULT_CHANNEL = "1537428353403977768";
const DEFAULT_DELETE_MS = 15_000;

export async function sendJoinPing(member) {
  const channelId = process.env.JOIN_PING_CHANNEL_ID || DEFAULT_CHANNEL;
  const deleteMs = Number(process.env.JOIN_PING_DELETE_MS || DEFAULT_DELETE_MS);
  const guildId = process.env.JOIN_PING_GUILD_ID || process.env.GUILD_ID;

  if (guildId && member.guild.id !== guildId) return;
  if (member.user.bot) return;

  const channel =
    member.guild.channels.cache.get(channelId) ||
    (await member.guild.channels.fetch(channelId).catch(() => null));
  if (!channel?.isTextBased?.()) return;

  const sent = await channel
    .send({
      content: `👋 <@${member.id}>`,
      allowedMentions: { users: [member.id] },
    })
    .catch((e) => {
      console.warn("join-ping", e.message);
      return null;
    });

  if (sent && deleteMs > 0) {
    setTimeout(() => {
      sent.delete().catch(() => null);
    }, deleteMs);
  }
}
