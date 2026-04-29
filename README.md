# Workflow Automation

Node.js + Express REST API for automating email notifications, form submissions, and multi-step approval workflows.

## Features
- **Contact form handler** – validates input, emails the team, and confirms receipt to the submitter
- **Approval workflows** – create requests, notify approvers via email with one-click Approve/Reject links, notify requesters of decisions
- Input validation with `express-validator`
- Email delivery with `nodemailer` (any SMTP provider)

## Getting Started

```bash
npm install
cp .env.example .env    # fill in SMTP credentials
npm run dev             # starts with --watch (no nodemon needed)
```

Server runs on `http://localhost:4000`.

## API Reference

### Forms

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/forms/contact` | Submit contact form |

```json
POST /forms/contact
{
  "name": "Alice",
  "email": "alice@example.com",
  "message": "I'd like to know more about..."
}
```

### Approvals

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/approvals` | Create approval request |
| `GET`  | `/approvals` | List all requests |
| `GET`  | `/approvals/:id` | Get single request |
| `GET`  | `/approvals/:id/respond?decision=approved\|rejected` | One-click decision |

```json
POST /approvals
{
  "title": "Budget increase for Q3",
  "requestedBy": "alice@example.com",
  "approvers": ["manager@example.com", "finance@example.com"],
  "details": "Requesting $5,000 additional budget for tooling."
}
```

## Project Structure

```
workflow-automation/
  src/
    index.js            # Express app entry point
    routes/
      forms.js          # Form submission route
      approvals.js      # Approval workflow routes
    services/
      email.js          # Nodemailer wrapper
    store/
      approvals.js      # In-memory store (swap for DB)
  .env.example
  package.json
```

## Extending
- Swap `src/store/approvals.js` for a real DB (SQLite with `better-sqlite3`, or Postgres with `pg`)
- Add webhook support to `POST /webhooks` for third-party triggers (Slack, Jira, etc.)
- Add JWT auth middleware to protect routes
