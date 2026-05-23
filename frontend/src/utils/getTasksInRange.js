/**
 * getTasksInRange.js
 *
 * Filters and sorts tasks whose startDate falls within [from, to].
 *
 * @param {Array}  tasks  - array of task objects (each with a startDate string)
 * @param {string} from   - ISO date string "YYYY-MM-DD" (inclusive), or ""
 * @param {string} to     - ISO date string "YYYY-MM-DD" (inclusive), or ""
 * @returns {Array} filtered + sorted tasks
 */
export function getTasksInRange(tasks = [], from = "", to = "") {
  return tasks
    .filter((t) => {
      const start = t.startDate ? new Date(t.startDate) : null;
      if (!start || Number.isNaN(start.getTime())) return false;

      if (from && start < new Date(from)) return false;
      if (to && start > new Date(to)) return false;

      return true;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}
