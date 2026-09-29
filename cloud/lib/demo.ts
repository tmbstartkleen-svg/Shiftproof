export type FacilitySummary = {
  id: string;
  name: string;
  location: string;
  model: "Contract" | "Hybrid" | "In-house";
  pxs: number;
  oee: number;
  attainment: number;
  qaBlocks: number;
  sanitationMinutes: number;
  openIssues: number;
};

export const demoFacilities: FacilitySummary[] = [
  { id: "central", name: "Central Plant", location: "Midwest", model: "Contract", pxs: 72, oee: 87.8, attainment: 91.5, qaBlocks: 1, sanitationMinutes: 28, openIssues: 2 },
  { id: "north", name: "North Plant", location: "North Region", model: "Hybrid", pxs: 97, oee: 94.1, attainment: 98.2, qaBlocks: 0, sanitationMinutes: 9, openIssues: 0 },
  { id: "south", name: "South Plant", location: "South Region", model: "In-house", pxs: 85, oee: 91.7, attainment: 95.3, qaBlocks: 0, sanitationMinutes: 16, openIssues: 1 }
];

export const tenant = {
  id: "org_demo",
  name: "ShiftProof Demo Network",
  subscription: "Enterprise Pilot",
  onboarding: 74,
  users: 18,
  integrations: 4,
  activeFacilities: demoFacilities.length
};