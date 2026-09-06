const COOLDOWN_MS = 15_000;
const lastReply = new Map();

const REPLY = "AS DURUM GUİLD AL ROL VERELİM";

/** sa / selam / selamın aleyküm vb. — kısa selam mesajları */
const GREETING =
  /^(?:s+a+|s\.?\s*a\.?|sea+|sel+a+m+|slm+|sela+m+|selam[ıi]n?\s*aleyk[uü]m|selamun\s*aleyk[uü]m|aleyk[uü]m\s*selam)(?:\s+|!|\.|~|,)*(?:s+a+|sel+a+m+|slm+|selam[ıi]n?\s*aleyk[uü]m|selamun\s*aleyk[uü]m)*(?:\s+|!|\.|~|,)*$/iu;

function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function handleGreetingReply(message) {
  if (!message.guild || message.author.bot) return false;
  if (!message.content) return false;

  const text = normalize(message.content);
  if (!text || text.length > 80) return false;
  if (!GREETING.test(text)) return false;

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  if (lastReply.has(key) && now - lastReply.get(key) < COOLDOWN_MS) return false;
  lastReply.set(key, now);

  await message.channel
    .send({
      content: `${REPLY} <@${message.author.id}>`,
      allowedMentions: { users: [message.author.id] },
    })
    .catch(() => null);

  return true;
}
