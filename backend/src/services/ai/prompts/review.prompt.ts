import { PROMPT_INJECTION_DEFENSE, formatUntrustedContext } from './injectionGuard';
import { RetrievedChunk } from '../../../repositories/chunk.repository';

export function buildReviewPrompts(
  repoFullName: string,
  diff: string,
  title: string | undefined,
  description: string | undefined,
  chunks: RetrievedChunk[]
): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You are DevIntel AI's Senior Code Review Engine analyzing proposed changes for "${repoFullName}".

${PROMPT_INJECTION_DEFENSE}

REVIEW DIRECTIVES:
1. Analyze the provided Git diff in the context of the repository's existing code and architectural conventions.
2. Evaluate potential bugs, security vulnerabilities, performance regressions, correctness flaws, maintainability regressions, and missing tests.
3. Categorize each finding into one of: BUG, SECURITY, PERFORMANCE, CORRECTNESS, MAINTAINABILITY, TESTING.
4. Assign appropriate severity: CRITICAL, HIGH, MEDIUM, LOW, INFO.
5. Provide precise file paths, startLine, and endLine relative to the diff/modified code.
6. Provide clear explanations, verified evidence from the diff/context, and concrete suggested fixes.
7. CRITICAL RULE: DO NOT FABRICATE OR INVENT ISSUES. If the proposed diff is sound, clean, and contains no meaningful flaws, set "hasIssues": false, "findings": [], and "noIssuesMessage": "no significant issues found".
8. Confidence must be a number between 0.0 and 1.0 based on how strongly the evidence supports the finding.

You MUST respond strictly with a valid JSON object conforming to this exact structure:
{
  "summary": "Brief executive summary of the review",
  "hasIssues": true | false,
  "noIssuesMessage": "no significant issues found" (only if hasIssues is false),
  "findings": [
    {
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "category": "BUG" | "SECURITY" | "PERFORMANCE" | "CORRECTNESS" | "MAINTAINABILITY" | "TESTING",
      "title": "Concise title",
      "explanation": "Detailed explanation of the issue",
      "evidence": "Code snippet or exact line from diff showing the issue",
      "suggestedFix": "Code diff or replacement showing how to fix it",
      "filePath": "src/example.ts",
      "startLine": 12,
      "endLine": 18,
      "confidence": 0.95
    }
  ]
}`;

  const contextText = formatUntrustedContext(chunks);

  const userMessage = `EXISTING REPOSITORY CONTEXT:
<untrusted_repository_context>
${contextText}
</untrusted_repository_context>

CHANGE METADATA:
Title: ${title || 'Not provided'}
Description: ${description || 'Not provided'}

PROPOSED GIT DIFF:
<untrusted_git_diff>
${diff}
</untrusted_git_diff>

Analyze the diff against the repository context and return the structured JSON review.`;

  return { systemPrompt, userMessage };
}
