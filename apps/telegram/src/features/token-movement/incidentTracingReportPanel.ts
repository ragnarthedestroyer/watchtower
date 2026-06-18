import type { IncidentTracingReport } from "@watchtower/core";

export function renderIncidentTracingReportTelegramPanel(report: IncidentTracingReport): string {
  const lines: string[] = [];
  lines.push(`Incident report: ${report.title}`);
  lines.push(`Status: ${report.status}`);
  lines.push(`Relevant: ${report.totals.relevantMovements}/${report.totals.movementsReviewed}`);
  lines.push(`SHELL out: ${report.totals.shellOutgoingCandidates} | USDC: ${report.totals.usdcRelatedCandidates}`);
  lines.push(`Accumulator: ${report.totals.accumulatorCandidates} | Bridge: ${report.totals.bridgeCandidates}`);
  lines.push("");

  const topFindings = report.findings.slice(0, 5);
  if (topFindings.length === 0) {
    lines.push("No findings yet.");
  } else {
    lines.push("Findings:");
    for (const finding of topFindings) {
      lines.push(`- ${finding.title} (${finding.severity}, ${finding.confidence})`);
      if (finding.movementIds.length > 0) lines.push(`  movements: ${finding.movementIds.slice(0, 3).join(", ")}`);
    }
  }

  if (report.missingEvidence.length > 0) {
    lines.push("");
    lines.push("Missing evidence:");
    for (const item of report.missingEvidence.slice(0, 5)) lines.push(`- ${item}`);
  }

  lines.push("");
  lines.push("Read-only. Unresolved/candidate movements are not proof.");
  return lines.join("\n");
}
