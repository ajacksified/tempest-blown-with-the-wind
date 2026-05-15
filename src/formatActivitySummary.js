export default function formatActivitySummary(activity) {
  if (!activity || typeof activity !== 'object') return '';
  const parts = [];

  const medals = activity.MEDALS_AWARDED ?? {};
  if (medals.LoS) {
    parts.push(`PvE (${medals.LoS})`);
  }
  if (medals.LoC) {
    parts.push(`PvP (${medals.LoC})`);
  }

  if (activity.BATTLE_COMPLETED?.length) {
    parts.push(`Completed battles: ${activity.BATTLE_COMPLETED.map((b) => `${b.battleType} ${b.battleId}`).join(', ')}`);
  }
  if (activity.FREE_MISSION_COMPLETED?.length) {
    parts.push(`Completed free missions: ${activity.FREE_MISSION_COMPLETED.map((b) => `${b.battleType} ${b.battleId}`).join(', ')}`);
  }
  // COURSE_PASSED is the current key; IU_COMPLETED is the legacy alias
  const coursesPassed = [...(activity.COURSE_PASSED ?? []), ...(activity.IU_COMPLETED ?? [])];
  if (coursesPassed.length) {
    parts.push(`Passed courses: ${coursesPassed.map((c) => c.courseName ? `${c.courseName} [${c.courseCode}] (${c.courseGrade})` : `[${c.courseCode}] (${c.courseGrade ?? c.iuCourse})`).join(', ')}`);
  }
  // Courses retroactively added/updated on academic record
  const coursesOnRecord = [...(activity.COURSE_ADDED_TO_RECORD ?? []), ...(activity.COURSE_UPDATED_IN_RECORD ?? [])];
  if (coursesOnRecord.length) {
    parts.push(`Courses added to record: ${coursesOnRecord.map((c) => `[${c.courseCode}] (${c.courseGrade})`).join(', ')}`);
  }
  if (activity.CERTIFICATE_AWARDED?.length) {
    parts.push(`Certificates awarded: ${activity.CERTIFICATE_AWARDED.map((c) => c.certificateName).join(', ')}`);
  }
  if (activity.SUBMITTED_TIMED_TEST?.length) {
    parts.push(`Submitted timed tests: ${activity.SUBMITTED_TIMED_TEST.map((t) => t.testName).join(', ')}`);
  }
  if (activity.SUBMITTED_BATTLE_REVIEW?.length) {
    parts.push(`Submitted reviews: ${activity.SUBMITTED_BATTLE_REVIEW.map((r) => `${r.battleType} ${r.battleId}`).join(', ')}`);
  }
  // UPLOADED_FICTION is the current key; SUBMITTED_FICTION is the legacy alias
  const fiction = [...(activity.UPLOADED_FICTION ?? []), ...(activity.SUBMITTED_FICTION ?? [])];
  if (fiction.length) {
    parts.push(`Submitted fiction: ${fiction.map((f) => f.title).join(', ')}`);
  }
  if (activity.NEW_COMBAT_RATING?.length) {
    parts.push(`New combat rating: ${activity.NEW_COMBAT_RATING.map((r) => r.combatRating ?? r.rating).join(', ')}`);
  }
  if (activity.NEW_FCHG?.length) {
    parts.push(`New FCHG rating: ${activity.NEW_FCHG.map((r) => r.fchg ?? r.activityString).join(', ')}`);
  }
  if (activity.NEW_COOP_RATING?.length) {
    parts.push(`New PvE rating: ${activity.NEW_COOP_RATING.map((r) => r.rating).join(', ')}`);
  }
  if (activity.FLIGHT_CERTIFICATION_WINGS?.length) {
    parts.push(`Flight Certification Wings: ${activity.FLIGHT_CERTIFICATION_WINGS.map((f) => f.echelon).join(', ')}`);
  }
  if (activity.COMPETITION_APPROVED?.length) {
    parts.push(`Competitions approved: ${activity.COMPETITION_APPROVED.map((c) => c.competitionName).join(', ')}`);
  }
  if (activity.NEW_COMPETITION?.length) {
    parts.push(`Submitted competitions: ${activity.NEW_COMPETITION.map((c) => c.activityString).join(', ')}`);
  }
  if (activity.CREATED_BATTLE?.length) {
    parts.push(`Created battle: ${activity.CREATED_BATTLE.map((b) => `${b.battleType} ${b.battleId}`).join(', ')}`);
  }
  if (activity.NEW_REPORT?.length) {
    parts.push(`Submitted reports: ${activity.NEW_REPORT.map((r) => r.reportType).join(', ')}`);
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
  // Catch-all: unknown keys the API doesn't classify yet
  if (activity.unknown?.length) {
    parts.push(...activity.unknown.map((u) => u.activityString).filter(Boolean));
  }

  return parts.join('; ');
}
