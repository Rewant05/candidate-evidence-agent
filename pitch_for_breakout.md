# 2 Paragraph Pitch for Kapil

I built a small Candidate Evidence Agent prototype inspired by BreakoutAI's agentic recruiting direction. The idea is to move beyond resume-keyword screening and create a proof-based hiring brief from scattered signals like GitHub, portfolio, Product Hunt activity, project descriptions, and written answers. The prototype generates a role-fit score, evidence matrix, strengths, risk flags, suggested interview questions, and a human-reviewed recommendation.

I designed it with explainability and guardrails because hiring is a high-stakes workflow where wrong automation can create expensive mistakes. The agent does not silently invent facts or pretend to verify links; it only scores provided evidence and flags missing proof for human review. In a production version, this could be upgraded with GitHub API, Product Hunt signals, portfolio crawling, LLM-based extraction with citations, and recruiter feedback loops.
