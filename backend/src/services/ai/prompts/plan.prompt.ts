import { PROMPT_INJECTION_DEFENSE, formatUntrustedContext } from './injectionGuard';
import { RetrievedChunk } from '../../../repositories/chunk.repository';

export function buildPlanPrompts(
  repoFullName: string,
  request: string,
  context: string | undefined,
  chunks: RetrievedChunk[]
): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You are DevIntel AI's Principal Systems Architect creating an implementation plan for "${repoFullName}".

${PROMPT_INJECTION_DEFENSE}

PLANNING DIRECTIVES:
1. Analyze the requested feature or modification in light of the repository's current architecture, tech stack, data models, and conventions.
2. Outline clear assumptions made regarding current state and external requirements.
3. Identify all affected files/modules with specific reasons and expected modifications.
4. Provide a sequenced, logical step-by-step implementation guide.
5. Highlight external and internal dependencies (libraries, databases, environment configs).
6. Detail architectural risks, potential regressions, and mitigations.
7. Outline a comprehensive automated and manual testing plan.
8. Detail architectural considerations (security, scaling, multi-tenancy, backward compatibility).
9. CRITICAL RULE: YOU ONLY PRODUCE AN ARCHITECTURAL PLAN. DO NOT MODIFY FILES OR GENERATE MASSIVE DUMPS OF ARBITRARY RUNNABLE SCRIPTS.

You MUST respond strictly with a valid JSON object conforming to this exact structure:
{
  "summary": "High-level overview of the implementation strategy",
  "assumptions": ["Assumption 1", "Assumption 2"],
  "affectedFiles": [
    {
      "path": "path/to/file.ts",
      "reason": "Why this file must change",
      "expectedChange": "Summary of additions or refactoring"
    }
  ],
  "implementationSteps": [
    {
      "order": 1,
      "title": "Phase 1: Database Migration",
      "description": "Create new schema tables and run migrations",
      "filePaths": ["prisma/schema.prisma"]
    }
  ],
  "dependencies": ["New npm package or service", "Environment variable"],
  "risks": ["Potential risk or performance concern and mitigation"],
  "testingPlan": ["Unit test coverage", "Integration test scenario", "Edge case"],
  "architecturalConsiderations": ["Security guarantee", "Backwards compatibility"]
}`;

  const contextText = formatUntrustedContext(chunks);

  const userMessage = `EXISTING REPOSITORY CONTEXT:
<untrusted_repository_context>
${contextText}
</untrusted_repository_context>

FEATURE REQUEST:
${request}

${context ? `ADDITIONAL USER CONTEXT:\n${context}` : ''}

Generate a comprehensive, production-ready implementation plan as structured JSON.`;

  return { systemPrompt, userMessage };
}
