export default function formatActivitySummary(activity) {
  if (!activity || typeof activity !== 'object') return '';
  const parts = [];

  if (activity.BATTLE_COMPLETED?.length) {
    parts.push(`Completed battles: ${activity.BATTLE_COMPLETED.map((b) => `${b.battleType} ${b.battleId}`).join(', ')}`);
  }
  if (activity.FREE_MISSION_COMPLETED?.length) {
    parts.push(`Completed free missions: ${activity.FREE_MISSION_COMPLETED.map((b) => `${b.battleType} ${b.battleId}`).join(', ')}`);
  }
  if (activity.COURSE_PASSED?.length) {
    parts.push(`Passed courses: ${activity.COURSE_PASSED.map((c) => `${c.courseName} [${c.courseCode}] (${c.courseGrade})`).join(', ')}`);
  }
  if (activity.IU_COMPLETED?.length) {
    parts.push(`IU courses completed: ${activity.IU_COMPLETED.map((c) => c.iuCourse).join(', ')}`);
  }
  if (activity.SUBMITTED_TIMED_TEST?.length) {
    parts.push(`Submitted timed tests: ${activity.SUBMITTED_TIMED_TEST.map((t) => t.testName).join(', ')}`);
  }
  if (activity.SUBMITTED_BATTLE_REVIEW?.length) {
    parts.push(`Submitted reviews: ${activity.SUBMITTED_BATTLE_REVIEW.map((r) => `${r.battleType} ${r.battleId}`).join(', ')}`);
  }
  if (activity.UPLOADED_FICTION?.length) {
    parts.push(`Submitted fiction: ${activity.UPLOADED_FICTION.map((f) => f.title).join(', ')}`);
  }
  if (activity.NEW_COMBAT_RATING?.length) {
    parts.push(`New combat rating: ${activity.NEW_COMBAT_RATING.map((r) => r.combatRating).join(', ')}`);
  }
  if (activity.NEW_FCHG?.length) {
    parts.push(`New FCHG rating: ${activity.NEW_FCHG.map((r) => r.fchg).join(', ')}`);
  }
  if (activity.NEW_COOP_RATING?.length) {
    parts.push(`New PvE rating: ${activity.NEW_COOP_RATING.map((r) => r.rating).join(', ')}`);
  }
  if (activity.FLIGHT_CERTIFICATION_WINGS?.length) {
    parts.push(`Flight Certification Wings: ${activity.FLIGHT_CERTIFICATION_WINGS.map((f) => f.echelon).join(', ')}`);
  }
  if (activity.NEW_COMPETITION?.length) {
    parts.push(`Submitted competitions: ${activity.NEW_COMPETITION.map((c) => c.activityString).join(', ')}`);
  }
  if (activity.CREATED_BATTLE?.length) {
    parts.push(`Created battle: ${activity.CREATED_BATTLE.map((b) => `${b.battleType} ${b.battleId}`).join(', ')}`);
  }
  if (activity.SUBMITTED_PATCH_BUG_REPORT?.length) {
    parts.push(`Submitted patch bug report: ${activity.SUBMITTED_PATCH_BUG_REPORT.map((r) => r.activityString).join(', ')}`);
  }
  if (activity.SUBMITTED_BATTLE_BUG_REPORT?.length) {
    parts.push(`Submitted battle bug report: ${activity.SUBMITTED_BATTLE_BUG_REPORT.map((r) => r.activityString).join(', ')}`);
  }
  if (activity.NEW_UNIFORM_APPROVED?.length) {
    parts.push('Updated uniform');
  }
  if (activity.UPDATED_INPR?.length) {
    parts.push('Updated INPR');
  }

  return parts.join('; ');
}
