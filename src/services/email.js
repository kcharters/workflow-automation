'use strict'
require('dotenv').config()

const nodemailer = require('nodemailer')

let _transport = null

function getTransport() {
  if (!_transport) {
    _transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return _transport
}

/**
 * Send a plain-text or HTML email.
 * @param {{ to: string|string[], subject: string, text?: string, html?: string }} options
 */
async function sendEmail({ to, subject, text, html }) {
  const transport = getTransport()
  const info = await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: Array.isArray(to) ? to.join(', ') : to,
    subject,
    text,
    html,
  })
  return info
}

module.exports = { sendEmail }
