'use strict'

require('dotenv').config()
const express = require('express')
const morgan = require('morgan')

const formsRouter = require('./routes/forms')
const approvalsRouter = require('./routes/approvals')

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(morgan('dev'))

// Routes
app.use('/forms', formsRouter)
app.use('/approvals', approvalsRouter)

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }))

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Workflow Automation API running on http://localhost:${PORT}`)
})

module.exports = app
