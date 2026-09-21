import { PROMPT_INJECTION_DEFENSE, formatUntrustedContext } from './injectionGuard';
import { RetrievedChunk } from '../../../repositories/chunk.repository';

export function buildDebugPrompts(
  repoFullName: string,
  errorMessage: string,
  stackTrace: string | undefined,
  context: string | undefined,
  filePath: string | undefined,
  chunks: RetrievedChunk[]
): { systemPrompt: string; userMessage: string } {
  const systemPrompt = `You are DevIntel AI's Senior Debugging Diagnostic Engine investigating an error for "${repoFullName}".

${PROMPT_INJECTION_DEFENSE}

DEBUGGING DIRECTIVES:
1. Examine the error message, stack trace, and retrieved repository code context.
2. Identify the most probable root cause.
3. CLEARLY DISTINGUISH:
   - What is directly proven by repository evidence vs.
   - What is an AI inference or hypothesis.
4. If retrieved repository code does not contain sufficient information to determine the root cause with certainty, assign confidence "LOW" or "MEDIUM" and explicitly explain the unknowns in "uncertaintyNotes".
5. Provide actionable, robust suggestedFix code or refactoring steps.
6. Provide a concrete testing strategy to reproduce the defect and verify the resolution.
7. Do not claim certainty when the retrieved code does not support it.

You MUST respond strictly with a valid JSON object conforming to this exact structure:
{
  "summary": "Concise summary of the failure",
  "probableCause": "Detailed explanation of what triggered the failure",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "evidence": "Specific lines of code, call chains, or runtime conditions indicating why this occurs",
  "suggestedFix": "Code diff or code example fixing the issue",
  "affectedFiles": ["path/to/file1.ts", "path/to/file2.ts"],
  "testingStrategy": "How to write a regression test or manual steps to confirm the fix",
  "uncertaintyNotes": "Any remaining ambiguities if confidence is MEDIUM or LOW"
}`;

  const contextText = formatUntrustedContext(chunks);

  const userMessage = `EXISTING REPOSITORY CONTEXT:
<untrusted_repository_context>
${contextText}
</untrusted_repository_context>

DEBUG DIAGNOSTIC INPUT:
Reported Error: ${errorMessage}
${filePath ? `Target File: ${filePath}` : ''}
${context ? `Additional Context: ${context}` : ''}

STACK TRACE:
<untrusted_stack_trace>
${stackTrace || 'No stack trace provided.'}
</untrusted_stack_trace>

Analyze the failure against the repository context and return the structured JSON diagnostic.`;

  return { systemPrompt, userMessage };
}
