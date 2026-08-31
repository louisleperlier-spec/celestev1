import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/** XP requis par niveau — constant et simple, pas de courbe compliquée à justifier. */
const XP_PER_LEVEL = 150;
const XP_PER_GOAL_MET = 20;

function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export const getOrCreate = mutation({
  args: { deviceId: v.string(), displayName: v.string() },
  handler: async (ctx, { deviceId, displayName }) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();

    if (existing) {
      if (existing.displayName !== displayName) {
        await ctx.db.patch(existing._id, { displayName });
      }
      return existing._id;
    }

    return await ctx.db.insert('users', {
      deviceId,
      displayName,
      currentStreak: 0,
      longestStreak: 0,
      xp: 0,
      level: 1,
    });
  },
});

export const me = query({
  args: { deviceId: v.string() },
  handler: async (ctx, { deviceId }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();
    if (!user) return null;

    const team = user.teamId ? await ctx.db.get(user.teamId) : null;
    return { ...user, team };
  },
});

/**
 * Enregistre le résultat du jour (objectif atteint ou non) — appelé une fois par jour depuis
 * l'app, à partir des vraies données locales (todayStats.globalScore >= objectif). Recalcule la
 * série en cours et l'XP ; aucune donnée d'hydratation brute n'est envoyée, seulement ce booléen.
 */
export const recordDailyResult = mutation({
  args: { deviceId: v.string(), dateKey: v.string(), metGoal: v.boolean() },
  handler: async (ctx, { deviceId, dateKey, metGoal }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_device', (q) => q.eq('deviceId', deviceId))
      .unique();
    if (!user) throw new Error('Utilisateur inconnu — appeler getOrCreate avant.');

    if (user.lastActiveDateKey === dateKey) return; // déjà enregistré aujourd'hui

    const currentStreak = metGoal ? user.currentStreak + 1 : 0;
    const xp = metGoal ? user.xp + XP_PER_GOAL_MET : user.xp;

    await ctx.db.patch(user._id, {
      currentStreak,
      longestStreak: Math.max(user.longestStreak, currentStreak),
      xp,
      level: levelFromXp(xp),
      lastActiveDateKey: dateKey,
    });
  },
});
