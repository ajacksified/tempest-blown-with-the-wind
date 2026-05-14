export default function formatActivitySummary(activity) {
  if (!activity || typeof activity !== 'object') return '';
  const parts = [];

  if (activity.BATTLE_COMPLETED?.length) {
    parts.push(`Completed Battles: ${activity.BATTLE_COMPLETED.map((b) => `${b.battleType} ${b.battleId}`).join(', ')}`);
  }
  if (activity.IU_COMPLETED?.length) {
    parts.push(`IU Courses Completed: ${activity.IU_COMPLETED.map((c) => c.iuCourse).join(', ')}`);
  }
  if (activity.SUBMITTED_BATTLE_REVIEW?.length) {
    parts.push(`Submitted Reviews: ${activity.SUBMITTED_BATTLE_REVIEW.map((r) => `${r.battleType} ${r.battleId}`).join(', ')}`);
  }
  if (activity.NEW_COMBAT_RATING?.length) {
    parts.push(`New Combat Rating: ${activity.NEW_COMBAT_RATING.map((r) => r.combatRating).join(', ')}`);
  }
  if (activity.NEW_FCHG?.length) {
    parts.push(`New FCHG Rating: ${activity.NEW_FCHG.map((r) => r.fchg).join(', ')}`);
  }
  if (activity.NEW_COOP_RATING?.length) {
    parts.push(`New PvE Rating: ${activity.NEW_COOP_RATING.map((r) => r.rating).join(', ')}`);
  }
  if (activity.NEW_COMPETITION?.length) {
    parts.push(`Submitted Approved Competitions: ${activity.NEW_COMPETITION.map((c) => c.activityString).join(', ')}`);
  }
  if (activity.CREATED_BATTLE?.length) {
    parts.push(`Created Battle: ${activity.CREATED_BATTLE.map((b) => `${b.battleType} ${b.battleId}`).join(', ')}`);
  }
  if (activity.SUBMITTED_FICTION?.length) {
    parts.push(`Submitted Fiction: ${activity.SUBMITTED_FICTION.map((f) => f.title).join(', ')}`);
  }
  if (activity.SUBMITTED_PATCH_BUG_REPORT?.length) {
    parts.push(`Submitted Patch Bug Report: ${activity.SUBMITTED_PATCH_BUG_REPORT.map((r) => r.activityString).join(', ')}`);
  }
  if (activity.SUBMITTED_BATTLE_BUG_REPORT?.length) {
    parts.push(`Submitted Battle Bug Report: ${activity.SUBMITTED_BATTLE_BUG_REPORT.map((r) => r.activityString).join(', ')}`);
  }
  if (activity.NEW_UNIFORM_APPROVED?.length) {
    parts.push('Updated Uniform');
  }
  if (activity.UPDATED_INPR?.length) {
    parts.push('Updated INPR');
  }

  return parts.join('; ');
}
