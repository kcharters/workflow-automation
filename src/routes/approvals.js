'use strict'

const { Router } = require('express')
const { body, param, validationResult } = require('express-validator')
const { v4: uuidv4 } = require('uuid')
const store = require('../store/approvals')
const { sendEmail } = require('../services/email')

const router = Router()

/**
 * POST /approvals
 * Create a new approval request and notify approvers.
 */
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('title is required'),
    body('requestedBy').isEmail().normalizeEmail().withMessage('requestedBy must be a valid email'),
    body('approvers').isArray({ min: 1 }).withMessage('approvers must be a non-empty array of emails'),
    body('approvers.*').isEmail().withMessage('each approver must be a valid email'),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    const { title, requestedBy, approvers, details = '' } = req.body
    const id = uuidv4()
    const baseUrl = `${req.protocol}://${req.get('host')}`

    const approval = store.create({
      id,
      title,
      requestedBy,
      approvers,
      details,
      status: store.STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Notify all approvers
    const approveUrl = `${baseUrl}/approvals/${id}/respond?decision=approved`
    const rejectUrl = `${baseUrl}/approvals/${id}/respond?decision=rejected`

    try {
      await sendEmail({
        to: approvers,
        subject: `Approval Required: ${title}`,
        html: `
          <h3>Approval Request</h3>
          <p><strong>From:</strong> ${requestedBy}</p>
          <p><strong>Title:</strong> ${title}</p>
          ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
          <p>
            <a href="${approveUrl}" style="background:#10b981;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none">✅ Approve</a>
            &nbsp;
            <a href="${rejectUrl}" style="background:#ef4444;color:#fff;padding:8px 16px;border-radius:4px;text-decoration:none">❌ Reject</a>
          </p>
        `,
      })
    } catch (err) {
      console.error('Failed to notify approvers:', err)
    }

    return res.status(201).json(approval)
  }
)

/**
 * GET /approvals/:id/respond?decision=approved|rejected
 * One-click approval/rejection link handler.
 */
router.get(
  '/:id/respond',
  [param('id').isUUID().withMessage('Invalid approval ID')],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const { decision } = req.query

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be "approved" or "rejected"' })
    }

    const approval = store.get(id)
    if (!approval) {
      return res.status(404).json({ error: 'Approval request not found' })
    }

    if (approval.status !== store.STATUS.PENDING) {
      return res.status(409).json({ error: `Already ${approval.status}` })
    }

    const updated = store.update(id, { status: decision })

    // Notify requester
    try {
      await sendEmail({
        to: updated.requestedBy,
        subject: `Your request "${updated.title}" was ${decision}`,
        html: `<p>Your approval request <strong>${updated.title}</strong> has been <strong>${decision}</strong>.</p>`,
      })
    } catch (err) {
      console.error('Failed to notify requester:', err)
    }

    return res.send(`
      <html><body style="font-family:system-ui;text-align:center;padding:60px">
        <h2>${decision === 'approved' ? '✅' : '❌'} Request ${decision}</h2>
        <p>${updated.title} has been <strong>${decision}</strong>.</p>
      </body></html>
    `)
  }
)

/**
 * GET /approvals
 * List all approval requests.
 */
router.get('/', (_req, res) => {
  return res.json(store.list())
})

/**
 * GET /approvals/:id
 * Get a single approval request.
 */
router.get('/:id', [param('id').isUUID()], (req, res) => {
  const approval = store.get(req.params.id)
  if (!approval) return res.status(404).json({ error: 'Not found' })
  return res.json(approval)
})

module.exports = router
