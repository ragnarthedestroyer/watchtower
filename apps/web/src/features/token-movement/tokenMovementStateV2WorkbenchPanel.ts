import { validateTokenDappIdCandidate } from "@watchtower/core";

function escapeHtml(unsafe: string) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function createTokenMovementStateV2Workbench(accountId: string | null, candidate: string) {
    const validation = validateTokenDappIdCandidate(accountId, candidate);
    const warnings = validation.warnings.map((w: string) => `<li>${escapeHtml(w)}</li>`).join("\n");
    
    return `
        <div class="panel workbench-panel">
            <h3>State V2 Query Workbench</h3>
            <p><strong>Format Valid:</strong> ${validation.isValid ? "Yes" : "No"}</p>
            ${warnings ? `<ul>${warnings}</ul>` : ""}
            ${validation.testCommand ? `<h4>Test Command:</h4><pre><code>${escapeHtml(validation.testCommand)}</code></pre>` : ""}
            <h4>Ask the Devs:</h4>
            <pre><code>${escapeHtml(validation.devQuestionTemplate)}</code></pre>
        </div>
    `;
}
