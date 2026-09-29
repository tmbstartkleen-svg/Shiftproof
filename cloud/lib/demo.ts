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
  onboarding: 81,
  users: 18,
  integrations: 4,
  activeFacilities: demoFacilities.length
};

export const demoFacilityDetail = {
  central: {
    lines: [
      { id: "l101", name: "Line 101", attainment: 91, status: "Running" },
      { id: "l103", name: "Line 103", attainment: 97, status: "Running" },
      { id: "l104", name: "Line 104", attainment: 86, status: "Watch" }
    ],
    risks: ["Bagger #2 micro-stops", "Raw Grind awaiting QA release"],
    sanitation: { openTasks: 2, etaMinutes: 28 },
    maintenance: { openTickets: 1, criticalAssets: 1 }
  },
  north: {
    lines: [
      { id: "n1", name: "Line 1", attainment: 99, status: "Running" },
      { id: "n2", name: "Line 2", attainment: 97, status: "Running" }
    ],
    risks: [], sanitation: { openTasks: 1, etaMinutes: 9 }, maintenance: { openTickets: 0, criticalAssets: 0 }
  },
  south: {
    lines: [
      { id: "s1", name: "Line A", attainment: 96, status: "Running" },
      { id: "s2", name: "Line B", attainment: 94, status: "Watch" }
    ],
    risks: ["One corrective action remains open"], sanitation: { openTasks: 1, etaMinutes: 16 }, maintenance: { openTickets: 0, criticalAssets: 0 }
  }
} as const;