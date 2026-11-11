# CampusOne — Architecture

CampusOne is a unified, cloud-ready platform for a college campus: virtual map &
faculty finder, academic resources, notices, events, a student community with
live chat, notifications, bookmarks, recommendations and an admin panel.

This document explains **how the pieces fit together**. For the endpoint-by-endpoint
reference see [`../api/README.md`](../api/README.md). For setup and deployment see the
[root README](../../README.md).

---

## 1. High-level system diagram

```mermaid
flowchart TB
    subgraph Client["Browser (SPA)"]
        UI["React + Vite + Tailwind<br/>React Router · Axios · Socket.IO client"]
    end

    subgraph Edge["Static hosting / CDN"]
        CF["nginx / CloudFront + S3<br/>(serves built SPA)"]
    end

    subgraph Server["Node.js API (Express)"]
        REST["REST API<br/>/api/*"]
        WS["Socket.IO<br/>chat · presence · notifications"]
        MW["Middleware<br/>JWT auth · RBAC · validation · rate-limit"]
    end

    subgraph Providers["Pluggable providers"]
        AUTH["Auth provider<br/>local JWT  ⇄  AWS Cognito"]
        STORE["Storage driver<br/>local disk  ⇄  Amazon S3"]
    end

    DB[("MongoDB<br/>(Atlas or local)")]
    MAPS["Google Maps API<br/>(optional — schematic fallback)"]

    UI -->|HTTPS /api| CF
    UI -->|"HTTPS (VITE_API_URL)"| REST
    UI <-->|WebSocket| WS
    CF -. serves .- UI
    REST --> MW --> DB
    WS --> DB
    MW --> AUTH
    REST --> STORE
    STORE -->|presigned URL| UI
    UI -. optional .-> MAPS
```

The two provider boxes are the heart of the design: **auth** and **file storage**
are abstractions selected by environment variable, so the exact same code runs
with zero cloud accounts (local JWT + disk) or fully on AWS (Cognito + S3) with
no source changes.

---

## 2. Request lifecycle (REST)

```mermaid
sequenceDiagram
    participant B as Browser (Axios)
    participant E as Express
    participant A as auth middleware
    participant R as RBAC (authorize)
    participant V as validator
    participant C as controller
    participant M as MongoDB

    B->>E: HTTP request + Bearer token
    E->>A: verify token (local JWT or Cognito JWKS)
    A->>R: attach req.user, check role
    R->>V: express-validator rules
    V->>C: validated req
    C->>M: Mongoose query
    M-->>C: documents
    C-->>B: { success, data, pagination? }
```

Every response uses one envelope:

```jsonc
// success
{ "success": true, "data": { /* ... */ }, "message": "optional" }
// list
{ "success": true, "data": [ /* ... */ ],
  "pagination": { "page": 1, "limit": 20, "total": 57, "totalPages": 3, "hasMore": true } }
// error (from the centralized error handler)
{ "success": false, "message": "Human readable error" }
```

On a `401`, the Axios interceptor transparently calls `/api/auth/refresh` once,
retries the original request, and on failure clears the session and emits an
`auth:logout` event the app listens for.

---

## 3. Real-time layer (Socket.IO)

```mermaid
sequenceDiagram
    participant U1 as User A
    participant S as Socket.IO server
    participant U2 as User B
    U1->>S: connect (auth.token = JWT)
    S->>S: verify token, join room user:<A>
    U1->>S: chat:join { roomId }
    U1->>S: chat:send { roomId, text } (ack)
    S->>M: persist ChatMessage, update room.lastMessage
    S-->>U1: chat:message (echo — client dedupes by _id)
    S-->>U2: chat:message  +  chat:inbox { roomId }
    S-->>U2: notification:new
```

- Handshake auth uses the same JWT as REST (`auth.token`).
- Each socket joins `user:<id>` (for direct notifications) and `room:<roomId>`
  channels on demand.
- The server **echoes** `chat:message` to the sender too, so the client
  de-duplicates by message `_id` and has a single append path. If the socket
  send times out, the client falls back to the REST endpoint.
- Presence (`presence:update`) and typing (`chat:typing`) are broadcast to room
  members.

---

## 4. Component / module map

```mermaid
flowchart LR
    subgraph FE["frontend/src"]
        pages["pages/*"]
        comps["components/* (ui, layout, admin, community, …)"]
        ctx["context/ (Auth, Notification)"]
        hooks["hooks/ (useApi, useDebounce)"]
        svc["services/ (api, socket)"]
    end
    subgraph BE["backend/src"]
        routes["routes/*.routes.js"]
        ctrl["controllers/*"]
        models["models/* (Mongoose)"]
        mw["middleware/ (auth, authorize, validate, errorHandler)"]
        services["services/ (authService, storageService)"]
        sockets["sockets/ (chatSocket)"]
        seed["seed/seed.js"]
    end
    pages --> hooks --> svc --> routes
    comps --> ctx
    svc -.socket.-> sockets
    routes --> mw --> ctrl --> models
    ctrl --> services
```

---

## 5. Data model (core collections)

```mermaid
erDiagram
    USER ||--o{ RESOURCE : uploads
    USER ||--o{ COMMUNITYPOST : authors
    USER ||--o{ COMMENT : writes
    USER ||--o{ BOOKMARK : saves
    USER ||--o{ NOTIFICATION : receives
    DEPARTMENT ||--o{ FACULTY : has
    DEPARTMENT ||--o{ USER : groups
    FACULTY ||--o| CAMPUSLOCATION : "cabin at"
    CAMPUSLOCATION }o--|| DEPARTMENT : belongs
    COMMUNITYPOST ||--o{ COMMENT : has
    CHATROOM ||--o{ CHATMESSAGE : contains
    RESOURCE }o--|| DEPARTMENT : categorized
    NOTICE }o--o| DEPARTMENT : targets
    EVENT ||--o{ USER : "attendees"
```

Key notes:
- **Resource** is a single collection with a `type` enum (`pyq`, `assignment`,
  `assignment_guide`, `lab_manual`, `study_material`) rather than five tables —
  simpler queries and one moderation flow. Large files are **never** stored in
  MongoDB; only file metadata (`{ key, url, driver, mimeType, size }`) is kept,
  the bytes live on disk or S3.
- **CampusLocation** stores `coords {x,y}` as percentages so the interactive map
  works with no map provider; optional `geo {lat,lng}` enables "Open in Google
  Maps".
- **CommunityPost** embeds `likes[]` and `reports[]` for O(1) "liked by me" and
  moderation without extra collections.

---

## 6. Pluggable providers

### Auth (`AUTH_PROVIDER`)
| Value | Behaviour |
|-------|-----------|
| `local` (default) | Passwords hashed with bcrypt; server issues short-lived access + long-lived refresh JWTs. |
| `cognito` | Verifies AWS Cognito JWTs against the pool's JWKS; user records are still mirrored in MongoDB for profile data and RBAC. |

### Storage (`STORAGE_DRIVER`)
| Value | Behaviour |
|-------|-----------|
| `local` (default) | Files saved under `UPLOAD_DIR`, served via `/api/files/*`. |
| `s3` | Objects uploaded to a **private** S3 bucket; downloads use short-lived **presigned URLs** so the bucket is never public. Falls back to `local` automatically if S3 isn't fully configured. |

Both are resolved once at startup and surfaced on `GET /api/health`
(`authProvider`, `storageDriver`) for quick diagnostics.

---

## 7. Security model

- **Authentication** — JWT (local) or Cognito JWTs; refresh-token rotation on the client.
- **Authorization (RBAC)** — three roles (`student`, `faculty`, `admin`); route
  guards (`authenticate`, `authorize`, `adminOnly`) enforce access; ownership
  checks on mutate/delete.
- **Input validation** — `express-validator` on every write route.
- **Transport / headers** — `helmet`, CORS restricted to `CLIENT_URL`, `compression`.
- **Abuse** — `express-rate-limit` (global + stricter on `/api/auth`).
- **Secrets** — never hard-coded; all via `.env` (see the two `.env.example` files).
  No secret is exposed to the browser (only `VITE_*` values ship to the client).

---

## 8. Deployment topology (AWS reference)

```mermaid
flowchart LR
    user["User"] --> cf["CloudFront"]
    cf --> s3["S3 (built SPA)"]
    cf --> alb["Application Load Balancer"]
    alb --> eb["Elastic Beanstalk / EC2<br/>(Express + Socket.IO)"]
    eb --> atlas[("MongoDB Atlas")]
    eb --> cognito["Cognito"]
    eb --> files["S3 (uploads, private)"]
```

The SPA is static (S3 + CloudFront); the API runs on Elastic Beanstalk or EC2
behind an ALB (sticky sessions enabled for WebSockets). MongoDB Atlas, Cognito
and the private uploads bucket are managed services. Locally the same three tiers
run via `docker compose` (MongoDB + backend + nginx-served frontend).
