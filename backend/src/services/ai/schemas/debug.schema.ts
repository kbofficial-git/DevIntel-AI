import { z } from 'zod';
import { Citation, AIMetadata } from './review.schema';

// ==========================================
// AI Debugging Input Schema
// ==========================================
export const debugInputSchema = z.object({
  errorMessage: z
    .string({ required_error: 'Error message is required' })
    .min(1, 'Error message cannot be empty')
    .max(4000, 'Error message exceeds maximum allowed size (4000 characters)'),
  stackTrace: z
    .string()
    .max(16000, 'Stack trace exceeds maximum allowed size (16000 characters)')
    .optional(),
  context: z
    .string()
    .max(4000, 'Additional context exceeds maximum allowed size (4000 characters)')
    .optional(),
  filePath: z
    .string()
    .max(500, 'File path cannot exceed 500 characters')
    .optional(),
});

export type DebugInput = z.infer<typeof debugInputSchema>;

// ==========================================
// AI Debugging Structured Output Schema
// ==========================================
export const confidenceEnum = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type Confidence = z.infer<typeof confidenceEnum>;

export const debugLLMOutputSchema = z.object({
  summary: z.string(),
  probableCause: z.string(),
  confidence: confidenceEnum,
  evidence: z.string(),
  suggestedFix: z.string(),
  affectedFiles: z.array(z.string()),
  testingStrategy: z.string(),
  uncertaintyNotes: z.string().optional(),
});

export type DebugLLMOutput = z.infer<typeof debugLLMOutputSchema>;

export interface DebugResult extends DebugLLMOutput {
  citations: Citation[];
  meta?: AIMetadata;
}
