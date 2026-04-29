'use strict'

const { Router } = require('express')
const { body, validationResult } = require('express-validator')
const { sendEmail } = require('../services/email')

const router = Router()

/**
 * POST /forms/contact
 * Accepts a contact form submission and emails the team.
 */
router.post(
  '/contact',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }

    const { name, email, message } = req.body

    try {
      await sendEmail({
        to: process.env.SMTP_USER,
        subject: `New contact form submission from ${name}`,
        html: `
          <h3>Contact Form Submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      })

      // Confirm receipt to submitter
      await sendEmail({
        to: email,
        subject: 'We received your message',
        html: `<p>Hi ${name}, thanks for reaching out. We'll get back to you shortly.</p>`,
      })

      return res.status(200).json({ message: 'Form submitted successfully' })
    } catch (err) {
      console.error('Email send error:', err)
      return res.status(500).json({ error: 'Failed to send email' })
    }
  }
)

module.exports = router
