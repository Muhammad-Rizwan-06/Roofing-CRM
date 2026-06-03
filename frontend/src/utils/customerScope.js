export const normEmail = (v) => String(v || "").trim().toLowerCase();
export const normText = (v) => String(v || "").trim().toLowerCase();

/**
 * Step-1 ownership logic:
 * - Prefer matching by email if project.clientEmail exists (future Step-2/3)
 * - Fallback to matching by name (project.client === user.name) for your current data
 */
export function isProjectForCustomer(project, user) {
  if (!project || !user) return false;

  const userId = String(user.userId).trim();
  const pclient = String(project.userId || "").trim();

  return Boolean(userId && pclient && userId === pclient);
}

export function getCustomerProjects(allProjects = [], user) {
  return (allProjects || []).filter((p) => isProjectForCustomer(p, user));
}

export function getCustomerProjectIdSet(allProjects = [], user) {
  const ids = getCustomerProjects(allProjects, user).map((p) => String(p.projectId));
  return new Set(ids);
}