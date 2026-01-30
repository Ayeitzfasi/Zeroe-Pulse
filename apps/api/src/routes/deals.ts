import { Router } from 'express';
import { z } from 'zod';
import * as dealService from '../services/dealService.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { createHubSpotClient } from '../integrations/hubspot.js';

const router = Router();

// Validation schemas
const listParamsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(25),
  // Allow any stage string to support HubSpot pipeline stage IDs
  stage: z.string().optional().default('all'),
  // Filter by pipeline ID
  pipeline: z.string().optional().default('all'),
  search: z.string().optional().default(''),
  sortBy: z.enum(['name', 'amount', 'closeDate', 'updatedAt']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const configSchema = z.object({
  portalId: z.number(),
  pipelineId: z.string(),
  pipelineName: z.string().optional(),
});

// Helper to get HubSpot client
async function getHubSpotClient(userId: string): Promise<ReturnType<typeof createHubSpotClient>> {
  const { supabase } = await import('../lib/supabase.js');
  const { data: userData } = await supabase
    .from('users')
    .select('hubspot_token')
    .eq('id', userId)
    .single();

  const hubspotApiKey = userData?.hubspot_token || process.env.HUBSPOT_API_KEY;

  if (!hubspotApiKey) {
    throw new AppError(400, 'HUBSPOT_NOT_CONFIGURED', 'HubSpot API key not configured. Please add your API key in Settings.');
  }

  return createHubSpotClient(hubspotApiKey);
}

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

// GET /deals/filters/pipelines - Get distinct pipelines for filtering
router.get('/filters/pipelines', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const pipelines = await dealService.getDistinctPipelines();

    res.json({
      success: true,
      data: pipelines,
    });
  } catch (error) {
    next(error);
  }
});

// GET /deals/config - Get HubSpot configuration
router.get('/config', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const config = await dealService.getHubSpotConfig();

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /deals/config - Save HubSpot configuration
router.put('/config', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = configSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    await dealService.saveHubSpotConfig(validation.data);

    res.json({
      success: true,
      data: { message: 'Configuration saved' },
    });
  } catch (error) {
    next(error);
  }
});

// GET /deals/pipelines - Get available HubSpot pipelines
router.get('/pipelines', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const hubspotClient = await getHubSpotClient(req.user!.userId);
    const pipelines = await hubspotClient.getPipelines();

    // Also get the portal ID
    const portalId = await hubspotClient.getPortalId();

    res.json({
      success: true,
      data: {
        portalId,
        pipelines: pipelines.map(p => ({
          id: p.id,
          label: p.label,
          stages: p.stages.map(s => ({
            id: s.id,
            label: s.label,
          })),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(500, 'FETCH_FAILED', `Failed to fetch pipelines: ${(error as Error).message}`));
    }
  }
});

// GET /deals/hubspot/:hubspotId - Get deal by HubSpot ID
router.get('/hubspot/:hubspotId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { hubspotId } = req.params;
    const deal = await dealService.findByHubspotId(hubspotId);

    if (!deal) {
      throw new AppError(404, 'DEAL_NOT_FOUND', 'Deal not found');
    }

    res.json({
      success: true,
      data: { deal },
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

    // Get config for portal ID
    const config = await dealService.getHubSpotConfig();

    res.json({
      success: true,
      data: {
        deal,
        hubspotConfig: config,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /deals/sync - Sync deals from HubSpot
router.post('/sync', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const hubspotClient = await getHubSpotClient(req.user!.userId);

    // Get or create config
    let config = await dealService.getHubSpotConfig();

    if (!config) {
      // First time sync - need to get portal ID and pipeline info
      const portalId = await hubspotClient.getPortalId();
      const pipelines = await hubspotClient.getPipelines();

      // If no pipeline configured, return pipelines for user to select
      if (pipelines.length === 0) {
        throw new AppError(400, 'NO_PIPELINES', 'No deal pipelines found in HubSpot');
      }

      // For now, use the first pipeline if not configured
      // In production, you'd want the user to select this
      const defaultPipeline = pipelines[0];

      config = {
        portalId,
        pipelineId: defaultPipeline.id,
      };

      await dealService.saveHubSpotConfig({
        ...config,
        pipelineName: defaultPipeline.label,
      });
    }

    console.log(`Starting HubSpot sync for pipeline ${config.pipelineId}...`);

    // Sync deals from the configured pipeline
    const normalizedDeals = await hubspotClient.syncDeals(config.pipelineId);
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

// DELETE /deals - Clear all deals (for re-sync)
router.delete('/', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    await dealService.deleteAllDeals();

    res.json({
      success: true,
      data: { message: 'All deals deleted' },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
