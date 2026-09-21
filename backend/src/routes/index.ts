import { Router } from 'express';
import { healthRoutes } from './health.routes';
import { authRouter } from './auth.routes';
import { repositoryRouter } from './repository.routes';
import { repositoryController } from '../controllers/repository.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Mount health routes at /health
router.use('/health', healthRoutes);

// Mount auth routes at /auth
router.use('/auth', authRouter);

// Mount repository routes at /repositories
router.use('/repositories', repositoryRouter);

// Endpoint GET /api/github/repositories
router.get('/github/repositories', requireAuth, repositoryController.listGitHub);

export const apiRoutes = router;
