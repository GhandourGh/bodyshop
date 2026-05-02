// Audit Service — called from within other services ONLY (never from controllers or routes)
// Automatically logs job creation, status changes, mechanic assignments
// TODO: implement in audit step

export const logAudit = async ({ jobId, action, actorId, details }) => {};
