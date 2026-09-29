import type { Session } from "./auth";

export function assertOrganization(session: Session, organizationId: string) {
  if (session.organizationId !== organizationId) throw new Error("forbidden");
}

export function assertFacilityAccess(session: Session, facilityId: string) {
  if (!session.facilityIds.includes(facilityId)) throw new Error("forbidden");
}

export function can(session: Session, capability: string) {
  const matrix: Record<string, string[]> = {
    "Plant Manager": ["enterprise.read", "facility.read", "production.write", "sanitation.write", "qa.release", "maintenance.write", "proof.write", "ai.ask"],
    "Production Supervisor": ["facility.read", "production.write", "ai.ask"],
    "Sanitation Site Manager": ["facility.read", "sanitation.write", "proof.write", "ai.ask"],
    "QA Manager": ["facility.read", "qa.release", "proof.write", "ai.ask"],
    "Maintenance Lead": ["facility.read", "maintenance.write", "ai.ask"]
  };
  return (matrix[session.role] || []).includes(capability);
}