import { z } from 'zod';
import { Citation, AIMetadata } from './review.schema';

// ==========================================
// AI Implementation Planning Input Schema
// ==========================================
export const planInputSchema = z.object({
  request: z
    .string({ required_error: 'Feature request is required' })
    .min(5, 'Feature request must be at least 5 characters')
    .max(4000, 'Feature request exceeds maximum allowed size (4000 characters)'),
  context: z
    .string()
    .max(4000, 'Additional context exceeds maximum allowed size (4000 characters)')
    .optional(),
});

export type PlanInput = z.infer<typeof planInputSchema>;

// ==========================================
// AI Implementation Planning Structured Output Schema
// ==========================================
export const affectedFileSchema = z.object({
  path: z.string(),
  reason: z.string(),
  expectedChange: z.string(),
});
export type AffectedFile = z.infer<typeof affectedFileSchema>;

export const implementationStepSchema = z.object({
  order: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  filePaths: z.array(z.string()),
});
export type ImplementationStep = z.infer<typeof implementationStepSchema>;

export const planLLMOutputSchema = z.object({
  summary: z.string(),
  assumptions: z.array(z.string()),
  affectedFiles: z.array(affectedFileSchema),
  implementationSteps: z.array(implementationStepSchema),
  dependencies: z.array(z.string()),
  risks: z.array(z.string()),
  testingPlan: z.array(z.string()),
  architecturalConsiderations: z.array(z.string()),
});

export type PlanLLMOutput = z.infer<typeof planLLMOutputSchema>;

export interface ImplementationPlanResult extends PlanLLMOutput {
  citations: Citation[];
  meta?: AIMetadata;
}
