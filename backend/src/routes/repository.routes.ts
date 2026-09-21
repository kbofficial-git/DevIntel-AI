import { Router } from 'express';
import { repositoryController } from '../controllers/repository.controller';
import { ingestionController } from '../controllers/ingestion.controller';
import { chatController } from '../controllers/chat.controller';
import { intelligenceController } from '../controllers/intelligence.controller';
import { feedbackController } from '../controllers/feedback.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { aiLimiter } from '../middleware/rateLimiter';

export const repositoryRouter = Router();

// Specific routes first
repositoryRouter.get('/github', requireAuth, repositoryController.listGitHub);

// CRUD routes
repositoryRouter.get('/', requireAuth, repositoryController.list);
repositoryRouter.post('/', requireAuth, repositoryController.connect);
repositoryRouter.get('/:id', requireAuth, repositoryController.getById);
repositoryRouter.delete('/:id', requireAuth, repositoryController.delete);

// Milestone 3: Repository Ingestion & Intelligence
repositoryRouter.post('/:id/index', requireAuth, aiLimiter, ingestionController.trigger);
repositoryRouter.get('/:id/index/status', requireAuth, ingestionController.status);

// Milestone 3: Grounded Codebase Q&A (RAG)
repositoryRouter.post('/:id/chat', requireAuth, aiLimiter, chatController.ask);
repositoryRouter.get('/:id/conversations', requireAuth, chatController.listConversations);
repositoryRouter.get('/:id/conversations/:convoId', requireAuth, chatController.getConversation);

// Milestone 4: AI Engineering Intelligence (Review, Debug, Plan)
repositoryRouter.post('/:id/review', requireAuth, aiLimiter, intelligenceController.review);
repositoryRouter.post('/:id/debug', requireAuth, aiLimiter, intelligenceController.debug);
repositoryRouter.post('/:id/plan', requireAuth, aiLimiter, intelligenceController.plan);

// Milestone 5: User Feedback & Evaluation
repositoryRouter.post('/:id/feedback', requireAuth, feedbackController.submit);

