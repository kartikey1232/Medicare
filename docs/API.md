# MediDesk — API Reference

Base URL: `http://localhost:4000`  
Authentication: `Bearer <accessToken>` in the `Authorization` header.

> All routes marked 🔒 require a valid JWT access token.

---

## Auth

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/auth/register` | Register a new user (Patient/Doctor/Moderator) | Public |
| `POST` | `/auth/login` | Authenticate and receive tokens | Public |
| `POST` | `/auth/logout` | Clear session | 🔒 Any |
| `POST` | `/auth/refresh` | Exchange refresh token for new access token | 🔒 Any |
| `GET`  | `/auth/me` | Get current authenticated user profile | 🔒 Any |

---

## Tickets

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/tickets` | Create a new medical ticket | 🔒 Patient |
| `GET`  | `/tickets` | List tickets (filtered by role) | 🔒 Any |
| `GET`  | `/tickets/:id` | Get full ticket details + messages + AI prediction | 🔒 Any |
| `PUT`  | `/tickets/:id/assign` | Assign a doctor to a ticket | 🔒 Moderator, Admin |
| `PUT`  | `/tickets/:id/status` | Change ticket status | 🔒 Doctor, Moderator, Admin |
| `PUT`  | `/tickets/:id/severity` | Adjust triage severity rating | 🔒 Doctor, Admin |
| `POST` | `/tickets/:id/notes` | Add a clinical note | 🔒 Doctor, Admin |
| `POST` | `/tickets/:id/messages` | Add a chat message | 🔒 Any |
| `POST` | `/tickets/merge` | Merge a duplicate ticket | 🔒 Moderator, Admin |

### Query Filters for `GET /tickets`

| Param | Type | Example |
|-------|------|---------|
| `status` | string | `OPEN`, `ASSIGNED`, `RESOLVED` |
| `category` | string | `CARDIOLOGY`, `NEUROLOGY` |
| `severity` | string | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `doctorId` | uuid | — |
| `patientId` | uuid | — |

---

## Attachments

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/attachments/upload` | Upload a file (multipart/form-data, max 100MB) | 🔒 Any |

Supported formats: `JPG`, `PNG`, `WEBP`, `PDF`, `DOCX`, `MP4`

---

## AI Triage

> ⚠️ AI responses are for triage assistance only. All results must be reviewed by a licensed clinician before any clinical decision is made.

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `POST` | `/ai/analyze` | Analyze symptoms text → category, severity, risk flags, draft response | 🔒 Any |
| `GET`  | `/ai/similar/:ticketId` | Find similar tickets via vector/category search | 🔒 Doctor, Moderator, Admin |

---

## Search

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET`  | `/search?q=<term>` | Global search across tickets, patients, doctors | 🔒 Any |

---

## Notifications

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET`  | `/notifications` | List all notifications for current user | 🔒 Any |
| `PUT`  | `/notifications/:id/read` | Mark notification as read | 🔒 Any |
| `PUT`  | `/notifications/read-all` | Mark all notifications as read | 🔒 Any |

---

## Analytics

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET`  | `/analytics` | Dashboard KPIs, doctor workload, category spread, trends | 🔒 Admin |

---

## Admin

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| `GET`  | `/admin/users` | List all users with profiles | 🔒 Admin |
| `PUT`  | `/admin/users/:id/suspend` | Suspend user account | 🔒 Admin |
| `PUT`  | `/admin/users/:id/reactivate` | Reactivate suspended user | 🔒 Admin |
| `PUT`  | `/admin/users/:id/role` | Change user role | 🔒 Admin |
| `GET`  | `/admin/doctors` | List all doctors with ticket counts | 🔒 Admin |
| `GET`  | `/admin/audit-logs` | View security and admin audit trail | 🔒 Admin |

---

## WebSocket Events (Chat Gateway)

Connect via Socket.io: `ws://localhost:4000?token=<accessToken>`

| Emit Event | Payload | Description |
|------------|---------|-------------|
| `join_ticket` | `{ ticketId }` | Join the ticket's chat room |
| `leave_ticket` | `{ ticketId }` | Leave a ticket's chat room |
| `send_message` | `{ ticketId, message, voiceUrl? }` | Send a message |
| `typing` | `{ ticketId, isTyping }` | Broadcast typing status |
| `read_receipt` | `{ ticketId, messageId }` | Signal message was read |

| Listen Event | Payload | Description |
|-------------|---------|-------------|
| `new_message` | Message object | Received when someone sends a message |
| `typing` | `{ userId, isTyping }` | Received typing indicator |
| `read_receipt` | `{ messageId, userId }` | Received read receipt |
| `online_status` | `{ userId, online }` | User came online/went offline |

---

## Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Common HTTP status codes:
- `400` — Validation error
- `401` — Unauthenticated
- `403` — Forbidden (wrong role)
- `404` — Resource not found
- `409` — Conflict (e.g., duplicate email)
- `500` — Internal server error
