import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans O/0/I/1, ambigus à recopier
  let code = '';
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

export const create = mutation({
  args: { deviceId: v.string(), name: v.string() },
  handler: async (ctx, { deviceId, name }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();
    if (!user) throw new Error('Utilisateur inconnu — appeler users.getOrCreate avant.');

    const inviteCode = generateInviteCode();
    const teamId = await ctx.db.insert('teams', { name, inviteCode, createdAt: Date.now() });
    await ctx.db.patch(user._id, { teamId });
    return { teamId, inviteCode };
  },
});

export const join = mutation({
  args: { deviceId: v.string(), inviteCode: v.string() },
  handler: async (ctx, { deviceId, inviteCode }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();
    if (!user) throw new Error('Utilisateur inconnu — appeler users.getOrCreate avant.');

    const team = await ctx.db
      .query('teams')
      .withIndex('by_invite_code', (q) => q.eq('inviteCode', inviteCode.toUpperCase()))
      .unique();
    if (!team) throw new Error("Code d'invitation introuvable.");

    await ctx.db.patch(user._id, { teamId: team._id });
    return team._id;
  },
});

export const leaderboard = query({
  args: { teamId: v.id('teams') },
  handler: async (ctx, { teamId }) => {
    const members = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('teamId'), teamId))
      .collect();

    return members
      .map((m) => ({
        displayName: m.displayName,
        currentStreak: m.currentStreak,
        xp: m.xp,
        level: m.level,
      }))
      .sort((a, b) => b.currentStreak - a.currentStreak || b.xp - a.xp);
  },
});
