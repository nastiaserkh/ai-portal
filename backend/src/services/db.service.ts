import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAllConversations() {
  return prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      mode: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });
}

export async function getConversationById(id: string) {
  return prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
}

export async function createConversation(title: string, mode: string) {
  return prisma.conversation.create({
    data: { title, mode },
  });
}

export async function deleteConversation(id: string) {
  return prisma.conversation.delete({ where: { id } });
}

export async function updateConversationTitle(id: string, title: string) {
  return prisma.conversation.update({
    where: { id },
    data: { title },
  });
}

export async function addMessage(
  conversationId: string,
  role: string,
  content: string
) {
  return prisma.message.create({
    data: { conversationId, role, content },
  });
}

export async function getMessagesByConversation(conversationId: string) {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}

export default prisma;
