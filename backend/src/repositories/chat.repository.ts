import { prisma } from '../config/database';

export const chatRepository = {
  async findOrCreateConversation(userId: string, repositoryId: string, title = 'Codebase Chat') {
    // Look for an existing conversation or create a new one
    const existing = await prisma.conversation.findFirst({
      where: { userId, repositoryId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.conversation.create({
      data: {
        userId,
        repositoryId,
        title,
      },
      include: {
        messages: true,
      },
    });
  },

  async listConversations(userId: string, repositoryId: string) {
    return prisma.conversation.findMany({
      where: { userId, repositoryId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  },

  async getConversation(id: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async createMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    citations?: any
  ) {
    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        citations: citations ? JSON.stringify(citations) : undefined,
      },
    });

    // Touch conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  },
};
