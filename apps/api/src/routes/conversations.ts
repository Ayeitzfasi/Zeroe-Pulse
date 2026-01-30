import { Router } from 'express';
import { z } from 'zod';
import * as conversationService from '../services/conversationService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const listParamsSchema = z.object({
  type: z.enum(['general', 'deal', 'skill_creation']).optional(),
  dealId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

const createConversationSchema = z.object({
  title: z.string().max(255).optional(),
  type: z.enum(['general', 'deal', 'skill_creation']).optional().default('general'),
  dealId: z.string().uuid().optional(),
  skillId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  includeContext: z.object({
    deal: z.boolean().optional(),
    skills: z.array(z.string().uuid()).optional(),
  }).optional(),
});

// GET /conversations - List conversations
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = listParamsSchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const result = await conversationService.findAll(req.user!.userId, validation.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /conversations - Create new conversation
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = createConversationSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const conversation = await conversationService.create(req.user!.userId, validation.data);

    res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
});

// GET /conversations/:id - Get conversation with messages
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await conversationService.findById(id, req.user!.userId);

    if (!conversation) {
      throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
});

// POST /conversations/:id/messages - Send message
router.post('/:id/messages', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const validation = sendMessageSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const result = await conversationService.sendMessage(
      id,
      req.user!.userId,
      validation.data
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Conversation not found') {
      next(new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found'));
    } else {
      next(error);
    }
  }
});

// DELETE /conversations/:id - Delete conversation
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const success = await conversationService.remove(id, req.user!.userId);

    if (!success) {
      throw new AppError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    res.json({
      success: true,
      data: { message: 'Conversation deleted' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
