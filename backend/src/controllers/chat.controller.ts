import { Request, Response, NextFunction } from 'express';
import { ragService } from '../services/rag/rag.service';
import { repositoryIdParamSchema } from '../schemas/repository.schema';
import { askQuestionSchema, conversationParamSchema } from '../schemas/chat.schema';
import { successResponse } from '../utils/response';

export const chatController = {
  async ask(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = repositoryIdParamSchema.parse(req.params);
      const { question, conversationId } = askQuestionSchema.parse(req.body);

      const result = await ragService.askQuestion(
        req.session.userId!,
        id,
        question,
        conversationId
      );

      return successResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async listConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = repositoryIdParamSchema.parse(req.params);
      const conversations = await ragService.listConversations(req.session.userId!, id);
      return successResponse(res, conversations);
    } catch (err) {
      next(err);
    }
  },

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, convoId } = conversationParamSchema.parse(req.params);
      const conversation = await ragService.getConversationHistory(
        req.session.userId!,
        id,
        convoId!
      );
      return successResponse(res, conversation);
    } catch (err) {
      next(err);
    }
  },
};
