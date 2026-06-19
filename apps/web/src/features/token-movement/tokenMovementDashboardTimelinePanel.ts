import {
  createTokenMovementDashboardTimeline,
  type TokenMovementDashboardTimelineOptions,
  type TokenMovementOnTheFlyFrontendDashboard,
} from "@watchtower/core";

export function renderTokenMovementDashboardTimelinePanel(
  dashboard: TokenMovementOnTheFlyFrontendDashboard,
  options: TokenMovementDashboardTimelineOptions = {},
): string {
  const timeline = createTokenMovementDashboardTimeline(dashboard, options);

  return [
    '<section data-watchtower-token-movement-timeline data-mode="on-the-fly-no-storage">',
    `  <h2>${escapeHtml(timeline.title)}</h2>`,
    `  <p>Rows: ${timeline.summary.visibleRows}/${timeline.summary.totalRows} · Groups: ${timeline.summary.groupCount} · Unknown time: ${timeline.summary.unknownTimeRows}</p>`,
    `  <p>Watched address: ${escapeHtml(timeline.watchedAddress)}</p>`,
    ...timeline.groups.map((group) => [
      `  <article data-timeline-group="${escapeHtml(group.id)}">`,
      `    <h3>${escapeHtml(group.title)}</h3>`,
      group.truncated ? `    <p>Showing ${group.rows.length} of ${group.totalRows} rows in this group.</p>` : "",
      group.rows.length === 0
        ? "    <p>No rows in this time group.</p>"
        : [
            "    <table>",
            "      <thead>",
            "        <tr><th>When</th><th>Token</th><th>Amount</th><th>Direction</th><th>From</th><th>To</th><th>Status</th></tr>",
            "      </thead>",
            "      <tbody>",
            ...group.rows.map((row) => [
              `        <tr data-review-status="${escapeHtml(row.reviewStatus)}" data-section="${escapeHtml(row.sectionId)}">`,
              `          <td>${escapeHtml(row.timeLabel)}</td>`,
              `          <td>${escapeHtml(row.token)}</td>`,
              `          <td>${escapeHtml(row.amount)}</td>`,
              `          <td>${escapeHtml(row.direction)}</td>`,
              `          <td>${escapeHtml(row.from)}</td>`,
              `          <td>${escapeHtml(row.to)}</td>`,
              `          <td>${escapeHtml(row.reviewStatus)} · ${escapeHtml(row.routeLabel)}</td>`,
              "        </tr>",
            ].join("\n")),
            "      </tbody>",
            "    </table>",
          ].join("\n"),
      "  </article>",
    ].filter((line) => line.length > 0).join("\n")),
    "  <p><strong>Privacy:</strong> timeline rows are generated on the fly from the current in-memory dashboard only.</p>",
    "</section>",
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}
