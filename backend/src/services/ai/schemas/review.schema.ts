import { z } from 'zod';

// ==========================================
// Code Review Input Schema
// ==========================================
export const reviewInputSchema = z.object({
  diff: z
    .string({ required_error: 'Git diff is required' })
    .min(1, 'Git diff cannot be empty')
    .max(100000, 'Git diff exceeds maximum allowed size (100KB)'),
  title: z
    .string()
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

// ==========================================
// Code Review Structured Output Schema
// ==========================================
export const severityEnum = z.enum([
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFO',
]);
export type Severity = z.infer<typeof severityEnum>;

export const categoryEnum = z.enum([
  'BUG',
  'SECURITY',
  'PERFORMANCE',
  'CORRECTNESS',
  'MAINTAINABILITY',
  'TESTING',
]);
export type Category = z.infer<typeof categoryEnum>;

export const reviewFindingSchema = z.object({
  severity: severityEnum,
  category: categoryEnum,
  title: z.string(),
  explanation: z.string(),
  evidence: z.string(),
  suggestedFix: z.string(),
  filePath: z.string(),
  startLine: z.number().int().nonnegative(),
  endLine: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
});

export type ReviewFinding = z.infer<typeof reviewFindingSchema>;

export const codeReviewLLMOutputSchema = z.object({
  summary: z.string(),
  hasIssues: z.boolean(),
  noIssuesMessage: z.string().optional(),
  findings: z.array(reviewFindingSchema),
});

export type CodeReviewLLMOutput = z.infer<typeof codeReviewLLMOutputSchema>;

export interface Citation {
  filePath: string;
  startLine: number;
  endLine: number;
  symbolName: string | null;
  similarity: number;
  snippet: string;
}

export interface AIMetadata {
  latencyMs: number;
  chunksRetrieved: number;
  model: string;
}

export interface CodeReviewResult extends CodeReviewLLMOutput {
  citations: Citation[];
  meta?: AIMetadata;
}

