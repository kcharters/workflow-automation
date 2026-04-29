'use strict'

/**
 * In-memory store for approvals.
 * Replace with a database (SQLite, Postgres, etc.) for production use.
 */
const approvals = new Map()

const STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
})

function create(data) {
  approvals.set(data.id, data)
  return data
}

function get(id) {
  return approvals.get(id) ?? null
}

function update(id, patch) {
  const existing = approvals.get(id)
  if (!existing) return null
  const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() }
  approvals.set(id, updated)
  return updated
}

function list() {
  return [...approvals.values()]
}

module.exports = { create, get, update, list, STATUS }
