import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { authService } from '../services/auth/auth.service';
import { successResponse } from '../utils/response';

export const authController = {
  initiate(req: Request, res: Response, next: NextFunction) {
    try {
      const { redirectUrl, state } = authService.initiateOAuth();
      req.session.oauthState = state;
      req.session.save((err) => {
        if (err) {
          logger.error({ err }, 'Failed to save session before OAuth redirect');
          return next(err);
        }
        res.redirect(redirectUrl);
      });
    } catch (err) {
      next(err);
    }
  },

  async callback(req: Request, res: Response, next: NextFunction) {
    const { code, state, error: ghError, error_description } = req.query;

    if (ghError) {
      logger.warn({ ghError, error_description }, 'GitHub OAuth returned an error');
      return res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(String(ghError))}`);
    }

    if (!code || !state) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=missing_code_or_state`);
    }

    try {
      const user = await authService.handleCallback(
        String(code),
        String(state),
        req.session.oauthState
      );

      delete req.session.oauthState;
      req.session.userId = user.id;

      req.session.save((err) => {
        if (err) {
          logger.error({ err }, 'Failed to persist session after OAuth login');
          return next(err);
        }
        res.redirect(`${env.FRONTEND_URL}/dashboard`);
      });
    } catch (err) {
      logger.error({ err }, 'OAuth callback handling failed');
      const msg = err instanceof Error ? err.message : 'auth_failed';
      res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(msg)}`);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.session.userId!);
      return successResponse(res, user);
    } catch (err) {
      next(err);
    }
  },

  logout(req: Request, res: Response, next: NextFunction) {
    req.session.destroy((err) => {
      if (err) {
        logger.error({ err }, 'Failed to destroy session on logout');
        return next(err);
      }
      res.clearCookie('connect.sid');
      return successResponse(res, { message: 'Logged out successfully' });
    });
  },
};
