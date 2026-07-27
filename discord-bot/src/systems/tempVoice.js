import { ChannelType, PermissionFlagsBits } from "discord.js";
import db from "../database/db.js";
import { getSettings } from "../database/settings.js";

export async function handleTempVoiceState(oldState, newState) {
  const guild = newState.guild || oldState.guild;
  const settings = getSettings(guild.id);
  if (!settings.temp_voice_channel_id) return;

  // Join-to-create
  if (newState.channelId === settings.temp_voice_channel_id && newState.member && !newState.member.user.bot) {
    const parent = settings.temp_voice_category_id || newState.channel?.parentId || undefined;
    const channel = await guild.channels.create({
      name: `🔊 ${newState.member.displayName}`.slice(0, 90),
      type: ChannelType.GuildVoice,
      parent: parent || undefined,
      permissionOverwrites: [
        {
          id: newState.member.id,
          allow: [
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
          ],
        },
      ],
    });

    db.prepare(
      `INSERT INTO temp_voices (channel_id, guild_id, owner_id, created_at)
       VALUES (?, ?, ?, ?)`,
    ).run(channel.id, guild.id, newState.member.id, Date.now());

    await newState.member.voice.setChannel(channel).catch(() => null);
  }

  // Cleanup empty temp channels
  const leftId = oldState.channelId;
  if (!leftId) return;
  const temp = db.prepare("SELECT * FROM temp_voices WHERE channel_id = ?").get(leftId);
  if (!temp) return;

  const channel = oldState.channel;
  if (channel && channel.members.size === 0) {
    db.prepare("DELETE FROM temp_voices WHERE channel_id = ?").run(leftId);
    await channel.delete("Geçici ses odası boşaldı").catch(() => null);
  }
}
