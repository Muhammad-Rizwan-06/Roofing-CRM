export const normEmail = (v) => String(v || "").trim().toLowerCase();
export const normText = (v) => String(v || "").trim().toLowerCase();

/**
 * Step-1 ownership logic:
 * - Prefer matching by email if project.clientEmail exists (future Step-2/3)
 * - Fallback to matching by name (project.client === user.name) for your current data
 */
export function isProjectForCustomer(project, user) {
  if (!project || !user) return false;

  const uEmail = normEmail(user.email);
  const pEmail = normEmail(project.clientEmail || project.customerEmail);

  if (uEmail && pEmail) return uEmail === pEmail;

  const uName = normText(user.name);
  const pClient = normText(project.client);
  return Boolean(uName && pClient && uName === pClient);
}

export function getCustomerProjects(allProjects = [], user) {
  return (allProjects || []).filter((p) => isProjectForCustomer(p, user));
}

export function getCustomerProjectIdSet(allProjects = [], user) {
  const ids = getCustomerProjects(allProjects, user).map((p) => String(p.id));
  return new Set(ids);
}