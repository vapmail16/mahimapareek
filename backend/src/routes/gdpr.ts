/**
 * GDPR Compliance API Routes
 */

import { Router } from 'express';
import * as gdprService from '../services/gdprService';
import { authenticate } from '../middleware/auth';
import asyncHandler from '../utils/asyncHandler';
import { DeletionType, ConsentType } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/gdpr/export
 * Request data export
 */
router.post(
  '/export',
  asyncHandler(async (req, res) => {
    const exportRequest = await gdprService.requestDataExport(req.user!.id);

    // Trigger background job to generate export
    // For now, generate immediately
    const exportData = await gdprService.generateDataExport(exportRequest.id);

    res.status(201).json({
      success: true,
      data: exportData,
      message: 'Data export generated successfully. Download link expires in 7 days.',
    });
  })
);

/**
 * GET /api/gdpr/exports
 * Get user's export requests
 */
router.get(
  '/exports',
  asyncHandler(async (req, res) => {
    const exports = await gdprService.getUserExportRequests(req.user!.id);

    res.json({
      success: true,
      data: exports,
    });
  })
);

/**
 * POST /api/gdpr/deletion
 * Request data deletion
 */
router.post(
  '/deletion',
  asyncHandler(async (req, res) => {
    const { deletionType, reason } = req.body;

    const deletionRequest = await gdprService.requestDataDeletion(
      req.user!.id,
      (deletionType as DeletionType) || DeletionType.SOFT,
      reason
    );

    res.status(201).json({
      success: true,
      data: deletionRequest,
      message: 'Data deletion requested. Please check your email to confirm.',
    });
  })
);

/**
 * GET /api/gdpr/deletions
 * Get user's deletion requests
 */
router.get(
  '/deletions',
  asyncHandler(async (req, res) => {
    const deletions = await gdprService.getUserDeletionRequests(req.user!.id);

    res.json({
      success: true,
      data: deletions,
    });
  })
);

/**
 * POST /api/gdpr/deletion/confirm/:token
 * Confirm data deletion (public endpoint)
 */
router.post(
  '/deletion/confirm/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;

    await gdprService.confirmDataDeletion(token);

    res.json({
      success: true,
      message: 'Data deletion confirmed. Your data will be deleted within 24 hours.',
    });
  })
);

/**
 * POST /api/gdpr/consents
 * Grant consent
 */
router.post(
  '/consents',
  asyncHandler(async (req, res) => {
    const { consentType } = req.body;

    if (!consentType || !Object.values(ConsentType).includes(consentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consent type',
      });
    }

    const consent = await gdprService.grantConsent(
      req.user!.id,
      consentType as ConsentType,
      req.ip,
      req.headers['user-agent']
    );

    return res.json({
      success: true,
      data: consent,
      message: 'Consent granted successfully',
    });
  })
);

/**
 * DELETE /api/gdpr/consents/:consentType
 * Revoke consent
 */
router.delete(
  '/consents/:consentType',
  asyncHandler(async (req, res) => {
    const { consentType } = req.params;

    if (!Object.values(ConsentType).includes(consentType as ConsentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consent type',
      });
    }

    const consent = await gdprService.revokeConsent(
      req.user!.id,
      consentType as ConsentType,
      req.ip,
      req.headers['user-agent']
    );

    return res.json({
      success: true,
      data: consent,
      message: 'Consent revoked successfully',
    });
  })
);

/**
 * GET /api/gdpr/consents
 * Get user's consents
 */
router.get(
  '/consents',
  asyncHandler(async (req, res) => {
    const consents = await gdprService.getUserConsents(req.user!.id);

    res.json({
      success: true,
      data: consents,
    });
  })
);

/**
 * GET /api/gdpr/consents/:consentType/check
 * Check if user has specific consent
 */
router.get(
  '/consents/:consentType/check',
  asyncHandler(async (req, res) => {
    const { consentType } = req.params;

    const hasConsent = await gdprService.hasConsent(
      req.user!.id,
      consentType as ConsentType
    );

    res.json({
      success: true,
      data: { hasConsent },
    });
  })
);

export default router;

