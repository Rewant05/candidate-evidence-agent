const $ = (id) => document.getElementById(id);

const fields = [
  "candidateName", "roleApplied", "jobDescription", "candidateSummary", "projectEvidence",
  "githubUrl", "portfolioUrl", "linkedinUrl", "productHuntUrl", "assignmentNotes"
];

let state = {
  result: null,
  markdown: "",
  json: null,
  audit: []
};

const dictionaries = {
  fullstack: ["node", "express", "react", "next", "api", "rest", "frontend", "backend", "database", "mysql", "postgres", "mongodb", "jwt", "deployment", "render", "netlify", "vercel", "typescript", "javascript"],
  aiAgentic: ["agent", "agentic", "llm", "rag", "embedding", "embeddings", "glove", "semantic", "vector", "prompt", "workflow", "tool", "automation", "computer vision", "generative", "inpainting", "model"],
  proof: ["github", "portfolio", "live", "deployed", "built", "implemented", "designed", "launched", "improved", "debugged", "selected", "funding", "featured", "product hunt", "top"],
  recruiting: ["recruit", "hiring", "candidate", "resume", "interview", "screen", "role-fit", "job", "evidence"],
  intensity: ["fast", "quick", "ownership", "serious", "high", "learn", "debug", "ship", "execution", "iterate"]
};

const criteria = [
  {
    key: "fullstack",
    label: "Full-stack execution",
    explanation: "Evidence of frontend, backend, APIs, databases, auth, and deployment.",
    keywords: dictionaries.fullstack
  },
  {
    key: "aiAgentic",
    label: "AI / agentic relevance",
    explanation: "Evidence of agentic workflows, LLMs, embeddings, semantic matching, or AI product logic.",
    keywords: dictionaries.aiAgentic
  },
  {
    key: "proof",
    label: "Proof of work",
    explanation: "Evidence that the candidate actually built, shipped, deployed, or demonstrated work.",
    keywords: dictionaries.proof
  },
  {
    key: "recruiting",
    label: "Recruiting workflow alignment",
    explanation: "Evidence that the candidate understands proof-based hiring, screening, or recruiter workflows.",
    keywords: dictionaries.recruiting
  },
  {
    key: "intensity",
    label: "Execution intensity",
    explanation: "Evidence of ownership, speed, learning, debugging, and willingness to operate in a high-bar team.",
    keywords: dictionaries.intensity
  }
];

function text() {
  const data = readInputs();
  return Object.values(data).join(" ").toLowerCase();
}

function readInputs() {
  return Object.fromEntries(fields.map((f) => [f, ($(f)?.value || "").trim()]));
}

function keywordHits(content, keywords) {
  const hits = [];
  keywords.forEach((k) => {
    const regex = new RegExp(`\\b${escapeRegex(k)}\\b`, "i");
    if (content.includes(k.toLowerCase()) || regex.test(content)) hits.push(k);
  });
  return [...new Set(hits)];
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function value(id) {
  return Number($(id).value);
}

function scoreCriterion(content, criterion, weight, evidenceBonus = 0) {
  const hits = keywordHits(content, criterion.keywords);
  let raw = Math.min(100, (hits.length / Math.min(8, criterion.keywords.length)) * 100);
  if (hits.length >= 3) raw += evidenceBonus;
  raw = normalize(raw);
  const weighted = Math.round((raw * weight) / 100);
  return { ...criterion, hits, raw, weight, weighted };
}

function buildEvidenceMatrix(data, scores) {
  const matrix = scores.map((s) => {
    let status = "Weak";
    if (s.raw >= 70) status = "Strong";
    else if (s.raw >= 40) status = "Medium";

    const evidence = s.hits.length
      ? `Matched signals: ${s.hits.slice(0, 8).join(", ")}`
      : "No clear evidence found in provided text.";

    return { criterion: s.label, status, evidence, explanation: s.explanation, score: s.raw };
  });

  return matrix;
}

function detectClaims(data) {
  const content = `${data.candidateSummary} ${data.projectEvidence} ${data.assignmentNotes}`.toLowerCase();
  const claims = [
    { label: "Claims full-stack ability", present: /full[- ]?stack|backend|frontend|api/.test(content), support: keywordHits(content, dictionaries.fullstack).slice(0, 6) },
    { label: "Claims AI/agentic ability", present: /ai|agent|llm|rag|glove|embedding|semantic|generative/.test(content), support: keywordHits(content, dictionaries.aiAgentic).slice(0, 6) },
    { label: "Claims shipped work", present: /deployed|live|render|netlify|vercel|website|portfolio/.test(content), support: keywordHits(content, dictionaries.proof).slice(0, 6) },
    { label: "Claims product taste", present: /product hunt|workflow|user|problem|decision|taste/.test(content), support: keywordHits(content, ["product hunt", "workflow", "user", "problem", "decision", "taste"]) }
  ];
  return claims;
}

function riskFlags(data, scores, claims) {
  const risks = [];
  const content = `${data.candidateSummary} ${data.projectEvidence} ${data.assignmentNotes}`.toLowerCase();

  if (!data.githubUrl) risks.push("GitHub URL missing. Code-level proof cannot be checked quickly.");
  if (!data.portfolioUrl) risks.push("Portfolio/live demo URL missing. Product output is harder to verify.");
  if (!data.productHuntUrl) risks.push("Product Hunt URL missing. Product taste assignment evidence is not linked.");
  if (!content.includes("agent") && !content.includes("workflow") && !content.includes("llm")) {
    risks.push("Agentic AI proof is still thin. A small agent/demo task should be requested.");
  }
  if ((data.projectEvidence || "").length < 350) {
    risks.push("Project evidence is short. Candidate should explain personal contribution and architecture in interview.");
  }

  const unsupported = claims.filter((c) => c.present && c.support.length === 0).map((c) => c.label);
  unsupported.forEach((c) => risks.push(`${c} but provided evidence is weak or indirect.`));

  scores.forEach((s) => {
    if (s.raw < 35) risks.push(`${s.label} score is weak based on provided text.`);
  });

  return [...new Set(risks)];
}

function strengths(data, scores) {
  const out = [];
  const byKey = Object.fromEntries(scores.map((s) => [s.key, s]));

  if (byKey.fullstack?.raw >= 50) out.push("Shows practical full-stack execution across APIs, backend, frontend, database, auth, and deployment signals.");
  if (byKey.aiAgentic?.raw >= 50) out.push("Shows AI/product workflow relevance through embeddings, semantic matching, generative AI, or agentic workflow language.");
  if (byKey.proof?.raw >= 50) out.push("Has proof-of-work signals instead of only claiming skills.");
  if (byKey.recruiting?.raw >= 45) out.push("Understands recruiting as a workflow where evidence, role-fit, risk flags, and interview questions matter.");
  if (data.productHuntUrl) out.push("Product Hunt activity can act as taste/evaluation proof for current agentic AI products.");
  if (data.githubUrl && data.portfolioUrl) out.push("Has both code and product links, making evaluation easier for a recruiter.");

  return out.length ? out : ["Some relevant background exists, but more proof links and project details are needed."];
}

function interviewQuestions(data, scores, risks) {
  const role = data.roleApplied || "this role";
  const content = `${data.candidateSummary} ${data.projectEvidence} ${data.assignmentNotes}`.toLowerCase();

  const qs = [
    `Show one project live and walk through the exact parts you personally built.`,
    `For ${role}, what would you build in the first 72 hours to prove you can contribute?`,
    `Explain how you use AI tools while still reviewing, testing, and owning the output.`,
    `Give one example of a bug or failure you debugged end-to-end.`
  ];

  if (content.includes("glove") || content.includes("semantic")) {
    qs.push("Explain your GloVe/semantic matching pipeline: preprocessing, fields compared, similarity scoring, thresholds, and failure cases.");
  }

  if (content.includes("agent") || content.includes("workflow")) {
    qs.push("Design an agentic recruiting workflow with tools, memory, human approval, fallback behavior, and evaluation metrics.");
  } else {
    qs.push("Build a small recruiting agent MVP. What inputs, outputs, tools, and guardrails would you include?");
  }

  if (risks.length) {
    qs.push("Which risk flag from this brief do you think is fair, and how would you reduce that risk with proof?");
  }

  return qs;
}

function recommendation(total, risks) {
  if (total >= 82 && risks.length <= 3) return "Strong proceed: move to a build-focused technical interview or short agent demo.";
  if (total >= 68) return "Proceed with validation: ask for a live walkthrough and one focused build task.";
  if (total >= 55) return "Hold for proof: candidate may be relevant, but needs a stronger demo or repo before advancing.";
  return "Do not advance yet: insufficient evidence for this role based on provided inputs.";
}

function confidence(data, risks) {
  let c = 55;
  if (data.githubUrl) c += 10;
  if (data.portfolioUrl) c += 10;
  if (data.productHuntUrl) c += 8;
  if ((data.projectEvidence || "").length > 700) c += 10;
  c -= Math.min(25, risks.length * 4);
  return normalize(c);
}

function runAgent() {
  const data = readInputs();
  if (!data.candidateName && !data.candidateSummary && !data.projectEvidence) {
    alert("Add candidate details first.");
    return;
  }

  const content = Object.values(data).join(" ").toLowerCase();
  const weights = {
    fullstack: value("fullstackWeight"),
    aiAgentic: value("aiWeight"),
    proof: value("proofWeight"),
    recruiting: 16,
    intensity: 12
  };

  state.audit = [];
  state.audit.push("Read candidate inputs and role context.");
  state.audit.push("Extracted keyword-level evidence signals from provided text.");
  state.audit.push("Applied weighted scoring. No external claims were invented.");
  state.audit.push("Generated strengths only when supported by detected evidence.");
  state.audit.push("Generated risk flags for missing links, thin agentic proof, or weak evidence.");
  state.audit.push("Kept final decision human-reviewed instead of fully automated.");

  const scores = criteria.map((c) => scoreCriterion(content, c, weights[c.key] || 15, 10));
  const totalWeight = scores.reduce((a, s) => a + s.weight, 0);
  const total = normalize(scores.reduce((a, s) => a + s.weighted, 0) / totalWeight * 100);
  const matrix = buildEvidenceMatrix(data, scores);
  const claims = detectClaims(data);
  const risks = riskFlags(data, scores, claims);
  const good = strengths(data, scores);
  const questions = interviewQuestions(data, scores, risks);
  const conf = confidence(data, risks);
  const rec = recommendation(total, risks);

  const result = {
    candidate: data.candidateName || "Candidate",
    role: data.roleApplied || "Not specified",
    totalScore: total,
    confidence: conf,
    recommendation: rec,
    scores: scores.map(({ key, label, raw, weight, weighted, hits }) => ({ key, label, raw, weight, weighted, hits })),
    evidenceMatrix: matrix,
    claims,
    strengths: good,
    risks,
    questions,
    links: {
      github: data.githubUrl,
      portfolio: data.portfolioUrl,
      linkedin: data.linkedinUrl,
      productHunt: data.productHuntUrl
    },
    generatedAt: new Date().toISOString(),
    auditTrail: state.audit
  };

  state.result = result;
  state.json = result;
  state.markdown = toMarkdown(result);
  renderAnalysis(result);
  renderBrief(result);
  renderAudit(result);
  setStatus("analysisStatus", "Analysis complete");
  switchTab("analysis");
}

function setStatus(id, text) {
  $(id).textContent = text;
}

function renderAnalysis(result) {
  $("scoreGrid").innerHTML = `
    <div class="metric"><span>Role-fit score</span><strong>${result.totalScore}</strong></div>
    <div class="metric"><span>Confidence</span><strong>${result.confidence}</strong></div>
    <div class="metric"><span>Risks</span><strong>${result.risks.length}</strong></div>
    <div class="metric"><span>Questions</span><strong>${result.questions.length}</strong></div>
  `;

  $("evidenceMatrix").classList.remove("empty");
  $("evidenceMatrix").innerHTML = `
    <h3>Evidence Matrix</h3>
    <table class="table">
      <thead>
        <tr><th>Criterion</th><th>Status</th><th>Evidence</th><th>Score</th></tr>
      </thead>
      <tbody>
        ${result.evidenceMatrix.map((row) => `
          <tr>
            <td><strong>${escapeHtml(row.criterion)}</strong><br><span class="muted">${escapeHtml(row.explanation)}</span></td>
            <td>${statusBadge(row.status)}</td>
            <td>${escapeHtml(row.evidence)}</td>
            <td>${row.score}/100</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <h3>Claim Support Check</h3>
    <table class="table">
      <thead><tr><th>Claim</th><th>Detected?</th><th>Supporting Signals</th></tr></thead>
      <tbody>
        ${result.claims.map((c) => `
          <tr>
            <td>${escapeHtml(c.label)}</td>
            <td>${c.present ? '<span class="good">Yes</span>' : '<span class="muted">No</span>'}</td>
            <td>${c.support.length ? escapeHtml(c.support.join(", ")) : '<span class="muted">No direct support found</span>'}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function statusBadge(status) {
  const cls = status === "Strong" ? "good" : status === "Medium" ? "warn" : "bad";
  return `<span class="${cls}">${status}</span>`;
}

function renderBrief(result) {
  $("briefOutput").classList.remove("empty");
  $("briefOutput").innerHTML = `
    <div class="brief-section">
      <h3>Executive Summary</h3>
      <p><strong>${escapeHtml(result.candidate)}</strong> scored <strong>${result.totalScore}/100</strong> for <strong>${escapeHtml(result.role)}</strong> with confidence <strong>${result.confidence}/100</strong>.</p>
      <p>${escapeHtml(result.recommendation)}</p>
    </div>

    <div class="brief-section">
      <h3><span class="good">Strengths</span></h3>
      <ul>${result.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    </div>

    <div class="brief-section">
      <h3><span class="bad">Risk Flags</span></h3>
      <ul>${result.risks.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
    </div>

    <div class="brief-section">
      <h3>Suggested Interview Questions</h3>
      <ul>${result.questions.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ul>
    </div>

    <div class="brief-section">
      <h3>Proof Links</h3>
      <ul>
        ${Object.entries(result.links).filter(([,v]) => v).map(([k,v]) => `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</li>`).join("") || "<li>No links provided.</li>"}
      </ul>
    </div>
  `;
}

function renderAudit(result) {
  $("auditOutput").classList.remove("empty");
  $("auditOutput").innerHTML = `
    <h3>Guardrails</h3>
    <ul>
      <li>The agent does not claim it visited external links. It only scores evidence provided by the recruiter/candidate.</li>
      <li>Missing proof becomes a risk flag instead of being silently ignored.</li>
      <li>Recommendation is not final hiring decision. It routes the candidate to human review.</li>
      <li>Every score is explainable through evidence keywords and criteria.</li>
    </ul>

    <h3>Audit Trail</h3>
    <ul>${result.auditTrail.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>

    <h3>JSON Output Preview</h3>
    <textarea rows="14" readonly>${escapeHtml(JSON.stringify(result, null, 2))}</textarea>
  `;
}

function toMarkdown(r) {
  return `# Candidate Evidence Brief

## Candidate
${r.candidate}

## Role
${r.role}

## Score
- Role-fit: ${r.totalScore}/100
- Confidence: ${r.confidence}/100
- Recommendation: ${r.recommendation}

## Evidence Matrix
${r.evidenceMatrix.map((e) => `- ${e.criterion}: ${e.status} (${e.score}/100) — ${e.evidence}`).join("\n")}

## Strengths
${r.strengths.map((s) => `- ${s}`).join("\n")}

## Risk Flags
${r.risks.map((risk) => `- ${risk}`).join("\n")}

## Suggested Interview Questions
${r.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

## Proof Links
${Object.entries(r.links).filter(([,v]) => v).map(([k,v]) => `- ${k}: ${v}`).join("\n") || "- No links provided."}

## Audit Trail
${r.auditTrail.map((a) => `- ${a}`).join("\n")}
`;
}

function fillSample() {
  $("candidateName").value = "Rewant Anand";
  $("roleApplied").value = "Agentic AI / Full Stack Intern";
  $("jobDescription").value = `BreakoutAI is meant to be an agentic-AI-first company. The team wants people with specific knowledge, strong product taste, proof of doing interesting work themselves, and the ability to build products with high intensity.`;
  $("candidateSummary").value = `B.Tech CSB student at IIIT Delhi. Interested in full-stack development, AI product workflows, agentic AI, and fast execution. Comfortable with Node.js, Express.js, MySQL, REST APIs, JWT authentication, deployment, GloVe embeddings, computer vision, and generative AI experimentation.`;
  $("projectEvidence").value = `KHOJ - Lost & Found Platform: Built and deployed a full-stack lost and found platform using Node.js, Express.js, MySQL, JWT authentication, REST APIs, and Render/Netlify. Implemented GloVe-based semantic similarity matching across item name, description, and location fields to match lost/found reports beyond exact keyword matching. Selected among Top 100 ideas across India in College Youth Ideathon and received prize funding.

AI-based Virtual Try-On: Research/BTP work under Prof. Debarka Sengupta at IIIT Delhi involving computer vision, image masking, region-based editing, and generative AI workflows for realistic jewelry/ear-region try-on. The challenge is preserving user structure and making the output realistic instead of sticker-like.

Product Hunt Assignment: Explored current agentic AI products, upvoted/commented on 10, and selected top picks based on workflow automation, tool use, production-ready agent UX, and knowledge retrieval.`;
  $("githubUrl").value = "https://github.com/Rewant05?tab=repositories";
  $("portfolioUrl").value = "https://rewant-portfolio.netlify.app/#projects";
  $("linkedinUrl").value = "https://www.linkedin.com/in/rewant-anand-214310290/";
  $("productHuntUrl").value = "https://www.producthunt.com/@rewant_anand";
  $("assignmentNotes").value = "Candidate shared a workflow idea for a Candidate Evidence Agent: collecting proof from GitHub, portfolio, Product Hunt, project links, LinkedIn, and written answers to generate a structured recruiter brief with role-fit score, evidence, risk flags, and interview questions.";
}

function clearAll() {
  fields.forEach((f) => $(f).value = "");
  state = { result: null, markdown: "", json: null, audit: [] };
  $("scoreGrid").innerHTML = "";
  $("evidenceMatrix").className = "matrix empty";
  $("evidenceMatrix").innerHTML = "<h3>No analysis yet</h3><p>Run the agent from the Inputs tab.</p>";
  $("briefOutput").className = "brief empty";
  $("briefOutput").innerHTML = "<h3>No brief generated</h3><p>Run the agent first.</p>";
  $("auditOutput").className = "audit empty";
  $("auditOutput").innerHTML = "<h3>No audit trail yet</h3><p>The agent records every scoring decision after analysis.</p>";
  setStatus("analysisStatus", "Not run");
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function compareBriefs() {
  const aRaw = $("candidateAJson").value.trim();
  const bRaw = $("candidateBJson").value.trim();
  if (!aRaw || !bRaw) {
    alert("Paste both JSON briefs.");
    return;
  }

  try {
    const a = JSON.parse(aRaw);
    const b = JSON.parse(bRaw);
    const winner = a.totalScore === b.totalScore ? "Tie" : a.totalScore > b.totalScore ? a.candidate : b.candidate;
    $("compareOutput").classList.remove("empty");
    $("compareOutput").innerHTML = `
      <h3>Comparison Result</h3>
      <table class="table">
        <thead><tr><th>Metric</th><th>${escapeHtml(a.candidate)}</th><th>${escapeHtml(b.candidate)}</th></tr></thead>
        <tbody>
          <tr><td>Role-fit score</td><td>${a.totalScore}</td><td>${b.totalScore}</td></tr>
          <tr><td>Confidence</td><td>${a.confidence}</td><td>${b.confidence}</td></tr>
          <tr><td>Risk flags</td><td>${a.risks?.length || 0}</td><td>${b.risks?.length || 0}</td></tr>
          <tr><td>Recommendation</td><td>${escapeHtml(a.recommendation || "")}</td><td>${escapeHtml(b.recommendation || "")}</td></tr>
        </tbody>
      </table>
      <h3>Suggested shortlist</h3>
      <p>${winner === "Tie" ? "Both candidates are close. Human review should compare proof quality." : `${escapeHtml(winner)} has the stronger evidence score based on this workflow.`}</p>
    `;
  } catch (e) {
    alert("Invalid JSON. Download a JSON brief first and paste it here.");
  }
}

function switchTab(id) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  $(id).classList.add("active");
  document.querySelector(`[data-tab="${id}"]`).classList.add("active");
}

function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

["fullstackWeight", "aiWeight", "proofWeight"].forEach((id) => {
  const el = $(id);
  const label = $(`${id}Value`);
  el.addEventListener("input", () => label.textContent = el.value);
});

$("runAgentBtn").addEventListener("click", runAgent);
$("sampleBtn").addEventListener("click", fillSample);
$("clearBtn").addEventListener("click", clearAll);
$("copyBriefBtn").addEventListener("click", async () => {
  if (!state.markdown) return alert("Generate a brief first.");
  await navigator.clipboard.writeText(state.markdown);
  alert("Brief copied.");
});
$("downloadMdBtn").addEventListener("click", () => {
  if (!state.markdown) return alert("Generate a brief first.");
  download("candidate-evidence-brief.md", state.markdown, "text/markdown");
});
$("downloadJsonBtn").addEventListener("click", () => {
  if (!state.json) return alert("Generate a brief first.");
  download("candidate-evidence-brief.json", JSON.stringify(state.json, null, 2), "application/json");
});
$("compareBtn").addEventListener("click", compareBriefs);
