import { Router } from 'express';
import { z } from 'zod';
import * as dealService from '../services/dealService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { createHubSpotClient } from '../integrations/hubspot.js';
import * as userService from '../services/userService.js';

const router = Router();

// Validation schemas
const listParamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(25),
  stage: z.enum(['all', 'qualified', 'discovery', 'demo', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional().default('all'),
  search: z.string().optional().default(''),
  sortBy: z.enum(['name', 'amount', 'closeDate', 'updatedAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// GET /deals - List deals with pagination and filtering
router.get('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = listParamsSchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const result = await dealService.findAll(validation.data);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /deals/stats - Get deal statistics
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const stats = await dealService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// GET /deals/:id - Get single deal
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const deal = await dealService.findById(id);

    if (!deal) {
      throw new AppError(404, 'DEAL_NOT_FOUND', 'Deal not found');
    }

    res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
});

// POST /deals/sync - Sync deals from HubSpot
router.post('/sync', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    // Get HubSpot API key - first check user's personal key, then fall back to env
    const userId = req.user!.userId;

    // Try to get user's personal HubSpot token from database
    const { data: userData } = await (await import('../lib/supabase.js')).supabase
      .from('users')
      .select('hubspot_token')
      .eq('id', userId)
      .single();

    const hubspotApiKey = userData?.hubspot_token || process.env.HUBSPOT_API_KEY;

    if (!hubspotApiKey) {
      throw new AppError(400, 'HUBSPOT_NOT_CONFIGURED', 'HubSpot API key not configured. Please add your API key in Settings.');
    }

    // Create HubSpot client and sync deals
    const hubspotClient = createHubSpotClient(hubspotApiKey);

    console.log('Starting HubSpot sync...');
    const normalizedDeals = await hubspotClient.syncDeals();
    console.log(`Fetched ${normalizedDeals.length} deals from HubSpot`);

    // Upsert deals to database
    const { created, updated } = await dealService.upsertFromHubSpot(normalizedDeals);
    console.log(`Sync complete: ${created} created, ${updated} updated`);

    res.json({
      success: true,
      data: {
        message: 'Sync completed successfully',
        totalFetched: normalizedDeals.length,
        created,
        updated,
      },
    });
  } catch (error) {
    console.error('HubSpot sync error:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(500, 'SYNC_FAILED', `Failed to sync deals: ${(error as Error).message}`));
    }
  }
});

export default router;
