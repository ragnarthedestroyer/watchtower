import { analyzeTokenDappIdState } from "@watchtower/core";

function escapeHtml(unsafe: string) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function createTokenMovementDappIdDiagnostics(address: string | null, tokenDappId: string | null) {
    const diagnostics = analyzeTokenDappIdState(address, tokenDappId);
    const explanations = diagnostics.explanation.map(note => `<li>${escapeHtml(note)}</li>`).join("\n");
    
    return `
        <div class="panel diagnostics-panel">
            <h3>Token DApp ID Diagnostics</h3>
            <p><strong>Status:</strong> ${diagnostics.missingTokenDappId ? "Blocked (Missing Token DApp ID)" : "Ready"}</p>
            <ul>${explanations}</ul>
            ${diagnostics.curlTemplate ? `<p><strong>CLI Template:</strong></p><pre><code>${escapeHtml(diagnostics.curlTemplate)}</code></pre>` : ""}
        </div>
    `;
}
