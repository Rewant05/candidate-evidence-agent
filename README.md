# Candidate Evidence Agent v2

A proof-based hiring workflow prototype inspired by BreakoutAI-style agentic recruiting.

## Why I built this

Recruiting often depends too much on resumes and keyword matching. This prototype shows a small agentic workflow that turns scattered candidate proof into a structured recruiter brief.

It does not replace recruiters. It helps recruiters move faster by collecting evidence, highlighting strengths, flagging risks, and suggesting better interview questions.

## Core workflow

1. Candidate and role context are entered.
2. The agent extracts evidence signals from:
   - Resume/profile summary
   - Project descriptions
   - GitHub link
   - Portfolio link
   - Product Hunt link
   - Written assignment notes
3. The agent scores the candidate across:
   - Full-stack execution
   - AI / agentic relevance
   - Proof of work
   - Recruiting workflow alignment
   - Execution intensity
4. The agent creates:
   - Evidence matrix
   - Strengths
   - Risk flags
   - Suggested interview questions
   - Human-reviewed recommendation
   - Audit trail
   - Markdown and JSON exports

## Features

- Explainable weighted scoring
- Evidence matrix
- Claim support check
- Risk flags for missing proof
- Human-in-the-loop recommendation
- Audit trail
- Markdown export
- JSON export
- Compare two candidate briefs
- Calibration sliders for role-specific scoring

## Guardrails

This prototype intentionally avoids pretending to verify external links. It scores only the evidence provided in the form. In a production version, GitHub/Product Hunt/portfolio APIs or scrapers could be added, but every external signal should still be auditable.

## Tech stack

- HTML
- CSS
- JavaScript
- Static app
- No API key required

## How to run

Open `index.html` in a browser.

## How to deploy

### Netlify

1. Create a Netlify account.
2. Drag and drop this folder.
3. Copy the live demo URL.

### Vercel

1. Create a new project.
2. Import this folder/repo.
3. Deploy as a static site.

## Future upgrades

- GitHub API integration to inspect repos and commits
- Product Hunt API / scraping for product comments
- Portfolio crawler
- LLM-based evidence extraction with citations
- RAG over candidate documents
- ATS integration
- Recruiter feedback loop
- Hiring calibration by role and company
- Chrome extension for LinkedIn/GitHub profile review
