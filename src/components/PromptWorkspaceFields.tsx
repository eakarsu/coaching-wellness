"use client";

import { useState } from "react";

export const promptFields = [
  ["prompt", "Request", false], ["goal", "Desired outcome", false],
  ["context", "Background", true], ["audience", "Audience", true],
  ["evidence", "Source information", true], ["constraints", "Constraints", true],
  ["budget", "Budget or resources", true], ["deadline", "Timing", true],
  ["tone", "Tone", true], ["format", "Report format", true],
] as const;

const scenarios: Record<string, [string, string]> = {
  "AI adherence-prediction modeling": ["A fictional client completed 9 of 12 planned walks over four weeks; two misses followed a schedule change.", "Estimate likely adherence barriers and suggest questions a coach should ask."],
  "AI biometric trend interpretation (when paired with wearables)": ["Fictional wearable summaries show average sleep of 7.1, 6.8, 6.5, and 6.9 hours across four weeks; activity is steady.", "Explain trends and uncertainty without making a diagnosis."],
  "Multi-modal photo-based meal logging": ["A fictional client describes a lunch photo as a grain bowl with beans, vegetables, and dressing; no image is attached.", "Describe what can be inferred from the description and what requires a real uploaded photo."],
  "AI-driven program-cycle adjustments (deload weeks, rest-day prediction)": ["A fictional client completed three light strength sessions weekly for four weeks and reported increased fatigue in week four.", "Propose a cautious next-week schedule for coach review."],
  "Daily AI check-in summarizing wearable + mood + nutrition signals": ["A fictional check-in reports 6.5 hours of sleep, mood 3/5, two meals logged, and no urgent symptoms.", "Summarize today's coaching signals and missing data."],
  "Habit-streak gamification with social leaderboards": ["A fictional member logged walks on five of the past seven days; peer results are not supplied.", "Suggest private streak feedback without inventing leaderboard ranks."],
  "Insurance / HSA reimbursement export": ["A fictional coach has two dated wellness sessions, but no billing codes, insurer rules, or payment receipts are supplied.", "Draft a review checklist and identify documents needed before any reimbursement claim."],
  "Voice-driven session note dictation": ["A fictional coach dictates: client walked twice this week, discussed scheduling barriers, and agreed to plan one weekend walk.", "Structure a session note and flag details that require confirmation."],
  "Group / cohort coaching": ["A fictional six-person walking cohort meets weekly; attendance and consent details have not been provided.", "Plan a group check-in with accessibility and privacy considerations."],
  "Marketplace listing for coaches": ["A fictional wellness coach offers habit coaching and introductory walking plans; credentials and availability are unverified.", "Draft a listing with placeholders for verified qualifications."],
  "Payments / subscription billing": ["A fictional monthly coaching plan costs 75 USD; no payment method or subscriber record is supplied.", "Outline billing communication and reconciliation checks without charging anyone."],
  "Public discoverability / SEO landing pages per coach": ["A fictional coach focuses on sustainable walking habits; location, credentials, and testimonials are unverified.", "Draft page sections with clear placeholders for verified claims."],
  "Push-notification mobile shell": ["A fictional member wants a weekly check-in reminder; notification consent and device token are not supplied.", "Draft reminder copy and list prerequisites before delivery."],
  "Video sessions integration": ["A fictional coach plans a 30-minute remote check-in; participant consent and meeting provider are not configured.", "Describe a session workflow and the prerequisites for a real meeting link."],
};

export function promptExamples(feature: string) {
  const [scenario, request] = scenarios[feature] || [`A fictional ${feature.toLowerCase()} request needs review; no live records are supplied.`, "Prepare a plan and identify missing prerequisites."];
  return ["Planning scenario", "Detailed review", "Executive briefing"].map((label, index) => ({ label, values: {
    prompt: `${request} ${index === 0 ? "Prepare an initial plan." : index === 1 ? "Review gaps and alternatives in detail." : "Prepare a concise decision briefing."}`,
    goal: index === 0 ? "Produce a practical plan with owners, assumptions and next steps." : index === 1 ? "Explain the findings, alternatives and evidence still needed." : "Provide an executive summary and three prioritized actions.",
    context: scenario,
    audience: index === 2 ? "Project sponsor and leadership team" : "Project owner and operations team",
    evidence: `${scenario} This is a sample input, not a verified record.`,
    constraints: "Use only supplied facts. Identify missing information. Require human review for consequential decisions and external actions.",
    budget: index === 0 ? "Illustrative planning budget: 1500 USD and 12 staff hours." : index === 1 ? "Illustrative planning budget: 4000 USD and 30 staff hours." : "Illustrative resource envelope: one project owner and two reviewers.",
    deadline: "Provide a plan for the next two weeks; exact dates require confirmation.",
    tone: index === 2 ? "Concise and professional" : "Professional and clear",
    format: index === 1 ? "Summary, findings, comparison table, next steps and review notes" : "Executive summary, prioritized actions, assumptions and open questions",
  }}));
}
function requestText(values: Record<string, string>) {
  return promptFields.map(([name, label]) => values[name]?.trim() ? `${label}:\n${values[name].trim()}` : "").filter(Boolean).join("\n\n");
}
export function promptValues(value: string): Record<string, string> {
  if (!value.startsWith("Request:\n")) return value ? { prompt: value } : {};
  const labels = new Map(promptFields.map(([name, label]) => [label, name]));
  const pattern = new RegExp(`(?:^|\\n\\n)(${promptFields.map(([, label]) => label).join("|")}):\\n`, "g");
  const matches = Array.from(value.matchAll(pattern)), values: Record<string, string> = {};
  for (let index = 0; index < matches.length; index++) {
    const match = matches[index], name = labels.get(match[1] as typeof promptFields[number][1]);
    if (name) values[name] = value.slice((match.index || 0) + match[0].length, matches[index + 1]?.index ?? value.length).trim();
  }
  return values;
}
export default function PromptWorkspaceFields({ feature, value, onChange, disabled = false, clearLabel = "Cancel" }: {
  feature: string; value: string; onChange: (value: string) => void; disabled?: boolean; clearLabel?: string;
}) {
  const fields = promptValues(value);
  const [example, setExample] = useState("");
  function apply(next: Record<string, string>) { onChange(requestText(next)); }
  return <section aria-label="AI request fields" className="mb-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
    <div className="space-y-2 rounded-lg bg-slate-50 p-3"><h2 className="text-sm font-semibold text-slate-900">Fill every AI field</h2><p className="text-xs leading-5 text-slate-600">Choose a complete example, including optional fields. Review your inputs, then use the run button to request a response.</p><div className="flex flex-wrap gap-2">{promptExamples(feature).map(item => <button key={item.label} type="button" disabled={disabled} onClick={() => { apply(item.values); setExample(item.label); }} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50">{item.label}</button>)}<button type="button" disabled={disabled} onClick={() => { apply({}); setExample(""); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:opacity-50">{clearLabel}</button></div>{example ? <p role="status" className="text-xs text-amber-800">{example} loaded. These are fictional example inputs; replace them with your own information.</p> : null}</div>
    <div className="grid gap-4 md:grid-cols-2">{promptFields.map(([name, label, optional]) => <label key={name} className="block space-y-1 text-sm"><span className="font-medium text-slate-800">{label}{optional ? <span className="ml-1 text-xs font-normal text-slate-500">Optional</span> : null}</span><textarea aria-label={label} disabled={disabled} required={!optional} value={fields[name] || ""} rows={name === "prompt" || name === "evidence" ? 4 : 2} onChange={event => { apply({ ...fields, [name]: event.target.value }); setExample(""); }} className="w-full rounded-md border border-slate-300 p-3 text-sm disabled:bg-slate-50"/></label>)}</div>
  </section>;
}
