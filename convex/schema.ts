import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Backend Convex — comptes minimalistes liés à l'appareil (pas d'email/mot de passe), équipes et
 * classement. Ajouté pour la fonctionnalité "Équipe" (Phase 2) ; le reste de l'app (journal,
 * score, Coach) reste entièrement local sur l'appareil, voir AGENTS.md et web/privacy.html.
 */
export default defineSchema({
  users: defineTable({
    deviceId: v.string(),
    displayName: v.string(),
    teamId: v.optional(v.id('teams')),
    currentStreak: v.number(),
    longestStreak: v.number(),
    xp: v.number(),
    level: v.number(),
    lastActiveDateKey: v.optional(v.string()),
  }).index('by_device', ['deviceId']),

  teams: defineTable({
    name: v.string(),
    inviteCode: v.string(),
    createdAt: v.number(),
  }).index('by_invite_code', ['inviteCode']),
});
