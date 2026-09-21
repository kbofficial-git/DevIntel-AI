export type IngestionStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface IngestionJob {
  id: string;
  repositoryId: string;
  status: IngestionStatus;
  totalFiles: number;
  processedFiles: number;
  totalChunks: number;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface IngestionStatusResponse {
  repository: {
    id: string;
    name: string;
    fullName: string;
    lastIndexedAt?: string | null;
  };
  latestJob: IngestionJob | null;
  totalChunks: number;
}

export interface Citation {
  filePath: string;
  startLine: number;
  endLine: number;
  symbolName: string | null;
  similarity: number;
  snippet: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  createdAt?: string;
  meta?: AIMetadata;
}

export interface AIMetadata {
  latencyMs: number;
  chunksRetrieved: number;
  model: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  conversationId: string;
  meta?: AIMetadata;
}

export interface Conversation {
  id: string;
  repositoryId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
  _count?: {
    messages: number;
  };
}

// ==========================================
// Milestone 4: AI Engineering Intelligence
// ==========================================

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type FindingCategory =
  | 'BUG'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'CORRECTNESS'
  | 'MAINTAINABILITY'
  | 'TESTING';

export interface ReviewFinding {
  severity: Severity;
  category: FindingCategory;
  title: string;
  explanation: string;
  evidence: string;
  suggestedFix: string;
  filePath: string;
  startLine: number;
  endLine: number;
  confidence: number;
}

export interface CodeReviewResult {
  summary: string;
  hasIssues: boolean;
  noIssuesMessage?: string;
  findings: ReviewFinding[];
  citations: Citation[];
  meta?: AIMetadata;
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DebugResult {
  summary: string;
  probableCause: string;
  confidence: ConfidenceLevel;
  evidence: string;
  suggestedFix: string;
  affectedFiles: string[];
  testingStrategy: string;
  uncertaintyNotes?: string;
  citations: Citation[];
  meta?: AIMetadata;
}

export interface AffectedFile {
  path: string;
  reason: string;
  expectedChange: string;
}

export interface ImplementationStep {
  order: number;
  title: string;
  description: string;
  filePaths: string[];
}

export interface ImplementationPlanResult {
  summary: string;
  assumptions: string[];
  affectedFiles: AffectedFile[];
  implementationSteps: ImplementationStep[];
  dependencies: string[];
  risks: string[];
  testingPlan: string[];
  architecturalConsiderations: string[];
  citations: Citation[];
  meta?: AIMetadata;
}

