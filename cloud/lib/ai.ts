import { demoFacilities } from "./demo";

export function aiStatus() {
  const provider = process.env.SHIFTPROOF_AI_PROVIDER || "none";
  return {
    provider,
    model: process.env.SHIFTPROOF_AI_MODEL || "grounded-fallback",
    cloudReady: provider !== "none" && Boolean(process.env.SHIFTPROOF_AI_API_KEY),
    fallback: "deterministic plant intelligence"
  };
}

function fallbackAnswer(question: string) {
  const q = question.toLowerCase();
  const worst = [...demoFacilities].sort((a, b) => a.pxs - b.pxs)[0];
  const best = [...demoFacilities].sort((a, b) => b.pxs - a.pxs)[0];
  if (q.includes("risk") || q.includes("attention")) {
    return { answer: `${worst.name} needs the most attention in the current network view: PXS ${worst.pxs}, OEE ${worst.oee}%, ${worst.qaBlocks} QA block(s), and ${worst.openIssues} open issue(s).`, evidence: [worst.id] };
  }
  if (q.includes("best") || q.includes("strongest")) {
    return { answer: `${best.name} is currently the strongest operating plant in the entered data with PXS ${best.pxs} and OEE ${best.oee}%.`, evidence: [best.id] };
  }
  return { answer: `Network view: ${demoFacilities.length} facilities are active. Ask about risk, strongest plant, QA blocks, sanitation ETA, OEE, or production attainment for a more targeted answer.`, evidence: demoFacilities.map((f) => f.id) };
}

export async function askPlant(question: string) {
  const status = aiStatus();
  if (!status.cloudReady) return { provider: "grounded-fallback", ...fallbackAnswer(question) };
  const base = process.env.SHIFTPROOF_AI_BASE_URL || "https://api.openai.com/v1";
  const response = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.SHIFTPROOF_AI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.SHIFTPROOF_AI_MODEL,
      temperature: 0.1,
      messages: [
        { role: "system", content: "You are ShiftProof Shift Commander. Answer only from the supplied plant JSON. Be concise and name evidence facility IDs." },
        { role: "user", content: JSON.stringify({ question, facilities: demoFacilities }) }
      ]
    })
  });
  if (!response.ok) return { provider: "grounded-fallback", ...fallbackAnswer(question), warning: `cloud provider returned ${response.status}` };
  const json = await response.json();
  return { provider: status.provider, answer: json.choices?.[0]?.message?.content || fallbackAnswer(question).answer, evidence: demoFacilities.map((f) => f.id) };
}