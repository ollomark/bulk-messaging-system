/** Reply then delete the bot message after `ms` (default 3s). */
export async function replyThenDelete(interaction, payload, ms = 3000) {
  let message;
  if (interaction.deferred || interaction.replied) {
    message = await interaction.followUp({ ...payload, fetchReply: true });
  } else {
    message = await interaction.reply({ ...payload, fetchReply: true });
  }

  setTimeout(() => {
    message?.delete?.().catch(() => null);
  }, ms);

  return message;
}
