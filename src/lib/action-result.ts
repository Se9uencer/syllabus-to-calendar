export type ActionResult = { ok: true } | { ok: false; error: string };

// Constraint names from supabase/migrations/0002_course_schema.sql, mapped
// to messages for the mistakes a real data-entry session actually produces.
// Constraints a <select> already makes impossible to violate (kind, weekday,
// no-self-replace) aren't listed — if one of those ever fires, the raw
// Postgres message is more useful than a wrong guess at what happened.
const KNOWN_CONSTRAINTS: Record<string, string> = {
  terms_user_id_name_key: "You already have a term with that name.",
  terms_dates_check:
    "Check the dates — the term must end on or after it starts, and finals must fall on or after the term's start and the finals-window start.",
  term_breaks_dates_check: "A break's end date must be on or after its start date.",
  courses_term_id_code_key: "This term already has a course with that code.",
  course_meetings_time_check: "End time must be after start time.",
  grade_categories_course_id_name_key:
    "This course already has a category with that name.",
  grade_categories_weight_pct_check: "Weight must be greater than 0 and at most 100.",
  grades_score_check: "Score can't be negative.",
  grades_max_score_check: "Max score must be greater than 0.",
};

// Postgres error codes: unique_violation, check_violation, foreign_key_violation.
const RELEVANT_CODES = new Set(["23505", "23514", "23503"]);

export function friendlyDbError(error: {
  code?: string;
  message: string;
}): string {
  if (error.code && RELEVANT_CODES.has(error.code)) {
    for (const [constraint, message] of Object.entries(KNOWN_CONSTRAINTS)) {
      if (error.message.includes(constraint)) {
        return message;
      }
    }
  }
  return error.message;
}
