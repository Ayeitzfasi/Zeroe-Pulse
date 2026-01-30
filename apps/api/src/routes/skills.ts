import { Router } from 'express';
import { z } from 'zod';
import * as skillService from '../services/skillService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const listParamsSchema = z.object({
  includeShared: z.coerce.boolean().optional().default(true),
  search: z.string().optional().default(''),
  category: z.string().optional(),
});

const createSkillSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  prompt: z.string().min(1, 'Prompt is required'),
  category: z.string().optional(),
  isShared: z.boolean().optional().default(false),
  icon: z.string().optional().default('sparkles'),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.enum(['text', 'number', 'select', 'boolean']),
    required: z.boolean(),
    defaultValue: z.string().optional(),
    options: z.array(z.string()).optional(),
  })).optional().default([]),
});

const updateSkillSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  prompt: z.string().min(1).optional(),
  category: z.string().optional(),
  isShared: z.boolean().optional(),
  icon: z.string().optional(),
  variables: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.enum(['text', 'number', 'select', 'boolean']),
    required: z.boolean(),
    defaultValue: z.string().optional(),
    options: z.array(z.string()).optional(),
  })).optional(),
});

const importSkillSchema = z.object({
  fileContent: z.string().min(1, 'File content is required'),
  fileName: z.string().min(1, 'File name is required'),
});

// GET /skills - List skills
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = listParamsSchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const result = await skillService.findAll(req.user!.userId, validation.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /skills - Create skill
router.post('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = createSkillSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const skill = await skillService.create(req.user!.userId, validation.data);

    res.status(201).json({
      success: true,
      data: skill,
    });
  } catch (error) {
    next(error);
  }
});

// POST /skills/import - Import a .skill file (MUST be before /:id routes)
router.post('/import', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = importSkillSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const result = await skillService.importSkillFile(
      req.user!.userId,
      validation.data.fileContent,
      validation.data.fileName
    );

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      next(new AppError(400, 'IMPORT_ERROR', error.message));
    } else {
      next(error);
    }
  }
});

// GET /skills/:id/export - Export a skill as .skill file (MUST be before /:id)
router.get('/:id/export', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const result = await skillService.exportSkillFile(id, req.user!.userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Skill not found') {
      next(new AppError(404, 'SKILL_NOT_FOUND', 'Skill not found'));
    } else {
      next(error);
    }
  }
});

// GET /skills/:id - Get single skill
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const skill = await skillService.findById(id, req.user!.userId);

    if (!skill) {
      throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill not found');
    }

    res.json({
      success: true,
      data: skill,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /skills/:id - Update skill
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const validation = updateSkillSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const skill = await skillService.update(id, req.user!.userId, validation.data);

    if (!skill) {
      throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill not found');
    }

    res.json({
      success: true,
      data: skill,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('only update your own')) {
      next(new AppError(403, 'FORBIDDEN', error.message));
    } else {
      next(error);
    }
  }
});

// DELETE /skills/:id - Delete skill
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const success = await skillService.remove(id, req.user!.userId);

    if (!success) {
      throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill not found');
    }

    res.json({
      success: true,
      data: { message: 'Skill deleted' },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('only delete your own')) {
      next(new AppError(403, 'FORBIDDEN', error.message));
    } else {
      next(error);
    }
  }
});

export default router;
