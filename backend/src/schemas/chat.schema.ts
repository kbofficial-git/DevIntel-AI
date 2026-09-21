import { z } from 'zod';

export const askQuestionSchema = z.object({
  question: z.string().trim().min(1, 'Question cannot be empty').max(2000, 'Question too long'),
  conversationId: z.string().uuid().optional(),
});

export const conversationParamSchema = z.object({
  id: z.string().uuid('repositoryId must be a valid UUID'),
  convoId: z.string().uuid('conversationId must be a valid UUID').optional(),
});
