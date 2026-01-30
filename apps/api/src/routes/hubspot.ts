import { Router } from 'express';
import { z } from 'zod';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { createHubSpotClient } from '../integrations/hubspot.js';
import * as dealService from '../services/dealService.js';

const router = Router();

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

// GET /hubspot/contacts/:hubspotId - Get contact by HubSpot ID with associated deal
router.get('/contacts/:hubspotId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { hubspotId } = req.params;
    const hubspotClient = await getHubSpotClient(req.user!.userId);

    // Fetch contact from HubSpot
    const contact = await hubspotClient.getContact(hubspotId);

    if (!contact) {
      throw new AppError(404, 'CONTACT_NOT_FOUND', 'Contact not found in HubSpot');
    }

    // Try to find associated deal
    let associatedDeal = null;
    if (contact.associatedDealIds && contact.associatedDealIds.length > 0) {
      // Try to find a synced deal
      for (const dealHubspotId of contact.associatedDealIds) {
        const deal = await dealService.findByHubspotId(dealHubspotId);
        if (deal) {
          associatedDeal = deal;
          break;
        }
      }
    }

    res.json({
      success: true,
      data: {
        contact: {
          hubspotId: contact.id,
          firstName: contact.properties.firstname || '',
          lastName: contact.properties.lastname || '',
          email: contact.properties.email || null,
          phone: contact.properties.phone || null,
          company: contact.properties.company || null,
          jobTitle: contact.properties.jobtitle || null,
        },
        associatedDeal,
      },
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(500, 'FETCH_FAILED', `Failed to fetch contact: ${(error as Error).message}`));
    }
  }
});

// GET /hubspot/companies/:hubspotId - Get company by HubSpot ID with associated deal
router.get('/companies/:hubspotId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { hubspotId } = req.params;
    const hubspotClient = await getHubSpotClient(req.user!.userId);

    // Fetch company from HubSpot
    const company = await hubspotClient.getCompany(hubspotId);

    if (!company) {
      throw new AppError(404, 'COMPANY_NOT_FOUND', 'Company not found in HubSpot');
    }

    // Try to find associated deal
    let associatedDeal = null;
    if (company.associatedDealIds && company.associatedDealIds.length > 0) {
      // Try to find a synced deal
      for (const dealHubspotId of company.associatedDealIds) {
        const deal = await dealService.findByHubspotId(dealHubspotId);
        if (deal) {
          associatedDeal = deal;
          break;
        }
      }
    }

    res.json({
      success: true,
      data: {
        company: {
          hubspotId: company.id,
          name: company.properties.name || '',
          domain: company.properties.domain || null,
          industry: company.properties.industry || null,
          city: company.properties.city || null,
          country: company.properties.country || null,
        },
        associatedDeal,
      },
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(500, 'FETCH_FAILED', `Failed to fetch company: ${(error as Error).message}`));
    }
  }
});

// Validation schemas
const createTaskSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().max(5000).optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
  associatedObjectType: z.enum(['deal', 'contact', 'company']),
  associatedObjectId: z.string(),
});

const createNoteSchema = z.object({
  body: z.string().min(1).max(10000),
  associatedObjectType: z.enum(['deal', 'contact', 'company']),
  associatedObjectId: z.string(),
});

// POST /hubspot/tasks - Create a task in HubSpot
router.post('/tasks', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = createTaskSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const { subject, body, dueDate, priority, associatedObjectType, associatedObjectId } = validation.data;
    const hubspotClient = await getHubSpotClient(req.user!.userId);

    const taskId = await hubspotClient.createTask({
      subject,
      body,
      dueDate,
      priority,
      associatedObjectType,
      associatedObjectId,
    });

    res.json({
      success: true,
      data: { taskId },
    });
  } catch (error) {
    console.error('Error creating task:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(500, 'CREATE_FAILED', `Failed to create task: ${(error as Error).message}`));
    }
  }
});

// POST /hubspot/notes - Create a note in HubSpot
router.post('/notes', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validation = createNoteSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(400, 'VALIDATION_ERROR', validation.error.errors[0].message);
    }

    const { body, associatedObjectType, associatedObjectId } = validation.data;
    const hubspotClient = await getHubSpotClient(req.user!.userId);

    const noteId = await hubspotClient.createNote({
      body,
      associatedObjectType,
      associatedObjectId,
    });

    res.json({
      success: true,
      data: { noteId },
    });
  } catch (error) {
    console.error('Error creating note:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(500, 'CREATE_FAILED', `Failed to create note: ${(error as Error).message}`));
    }
  }
});

export default router;
