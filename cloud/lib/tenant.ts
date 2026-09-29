export type TenantContext = {
  organizationId: string;
  userId: string;
  role: string;
  facilityIds: string[];
};

export function getDemoTenantContext(): TenantContext {
  return {
    organizationId: "org_demo",
    userId: "u_pm",
    role: "Plant Manager",
    facilityIds: ["central", "north", "south"]
  };
}

export function assertFacilityAccess(ctx: TenantContext, facilityId: string) {
  if (!ctx.facilityIds.includes(facilityId)) throw new Error("forbidden");
}