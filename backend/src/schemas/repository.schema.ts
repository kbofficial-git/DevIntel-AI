import { z } from 'zod';

export const connectRepositorySchema = z.object({
  githubRepoId: z.number().int().positive('githubRepoId must be a positive integer'),
  name: z.string().min(1, 'name is required'),
  fullName: z.string().min(1, 'fullName is required'),
  owner: z.string().min(1, 'owner is required'),
  description: z.string().nullable().optional(),
  defaultBranch: z.string().optional().default('main'),
  private: z.boolean().optional().default(false),
  githubUrl: z.string().url('githubUrl must be a valid URL'),
  language: z.string().nullable().optional(),
});

export const repositoryIdParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export type ConnectRepositoryInput = z.infer<typeof connectRepositorySchema>;
