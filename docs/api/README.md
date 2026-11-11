# CampusOne — API Reference

Base URL: `/api` (dev proxy) or `VITE_API_URL` in production.
All responses use the envelope described in
[`../architecture/README.md`](../architecture/README.md#2-request-lifecycle-rest).

**Auth:** send `Authorization: Bearer <accessToken>` on protected routes.
**Roles:** `student`, `faculty`, `admin`.
Legend — 🔓 public · 🔒 any authenticated user · 👩‍🏫 faculty+admin · 🛡️ admin only.

Quick health check (no auth): `GET /api/health` → `{ success, status, authProvider, storageDriver }`.

---

## Auth — `/api/auth`
| Method | Path | Access | Body / Notes |
|---|---|---|---|
| POST | `/register` | 🔓 | `{ name, email, password, role? }` → tokens + user |
| POST | `/login` | 🔓 | `{ email, password }` → `{ accessToken, refreshToken, user }` |
| POST | `/refresh` | 🔓 | `{ refreshToken }` → `{ accessToken }` |
| POST | `/logout` | 🔒 | invalidates refresh token |
| GET | `/me` | 🔒 | current user |

## Users — `/api/users`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/me` | 🔒 | profile |
| PATCH | `/me` | 🔒 | `name, bio, phone, avatarUrl, program, semester, rollNumber, subjects[], department` |
| PATCH | `/me/password` | 🔒 | `{ currentPassword, newPassword }` |

## Departments — `/api/departments`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | list all departments |
| POST/PATCH/DELETE | `/:id?` | 🛡️ | manage departments |

## Faculty directory — `/api/faculty`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | `?search=&department=&page=&limit=` (paginated), populates `department`, `location` |
| GET | `/:id` | 🔒 | single faculty |
| POST/PATCH/DELETE | `/:id?` | 🛡️ | manage directory |

## Campus map — `/api/campus`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔓 | `?search=&type=` — **all** matching locations (no pagination) |
| GET | `/:id` | 🔓 | single location (populated faculty/department) |
| POST | `/` | 🛡️ | `{ name, type, description, building, floor, roomNumber, department, coords{x,y}, geo{lat,lng}?, amenities[] }` |
| PATCH / DELETE | `/:id` | 🛡️ | update / delete |

## Resources — `/api/resources`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | `?type=&subject=&semester=&department=&search=&status=&sort=recent\|popular&page=&limit=`. Non-admins see approved + their own; admins can filter by `status`. |
| GET | `/:id` | 🔒 | single resource (increments views) |
| GET | `/:id/download` | 🔒 | `{ url, filename }` (presigned when on S3) |
| POST | `/` | 🔒 | **multipart** `file` + metadata; students' uploads start `pending` |
| PATCH / DELETE | `/:id` | 🔒 (owner) / 🛡️ | edit / remove |
| PATCH | `/:id/moderate` | 🛡️ | `{ action: 'approve' \| 'reject', reason? }` |

## Notices — `/api/notices`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | `?category=&priority=&search=&page=&limit=`, pinned first |
| POST | `/` | 👩‍🏫 | **multipart** optional `attachment` + `{ title, description, category, priority, department, dueDate, isPinned }` |
| PATCH / DELETE | `/:id` | 👩‍🏫 (owner) / 🛡️ | update (JSON) / delete |

## Events — `/api/events`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | `?filter=upcoming\|past&search=&category=&page=&limit=` |
| POST | `/` | 👩‍🏫 | `{ name, description, startAt, endAt, location, organizer, category, registrationUrl, bannerUrl }` |
| PATCH / DELETE | `/:id` | 👩‍🏫 (owner) / 🛡️ | update / delete |
| POST | `/:id/register` | 🔒 | RSVP toggle → `{ registered, attendees }` |

## Community — `/api/community`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/posts` | 🔒 | `?category=&tag=&search=&sort=top\|recent&page=&limit=` (decorated with `likedByMe`, `isMine`, counts) |
| GET | `/posts/:id` | 🔒 | single post |
| POST | `/posts` | 🔒 | `{ title, body, category, tags[] }` |
| DELETE | `/posts/:id` | 🔒 (owner) / 🛡️ | delete |
| POST | `/posts/:id/like` | 🔒 | toggle → `{ liked, likeCount }` |
| POST | `/posts/:id/report` | 🔒 | `{ reason }` |
| GET | `/posts/:id/comments` | 🔒 | paginated |
| POST | `/posts/:id/comments` | 🔒 | `{ body }` |
| DELETE | `/posts/:id/comments/:commentId` | 🔒 (owner) / 🛡️ | delete comment |

## Chat — `/api/chat`  (real-time via Socket.IO; REST is the fallback/bootstrap)
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/rooms` | 🔒 | rooms + `unread`, members, `lastMessage` |
| POST | `/rooms/direct` | 🔒 | `{ userId }` → get/create 1:1 room |
| GET | `/rooms/:id/messages` | 🔒 | `?limit=` chronological; marks read |
| POST | `/rooms/:id/messages` | 🔒 | `{ text }` REST send fallback |
| PATCH | `/rooms/:id/read` | 🔒 | mark room read |
| GET | `/users` | 🔒 | `?search=` — people to start a chat with |

**Socket events** — client→server: `chat:join`, `chat:leave`, `chat:typing`,
`chat:send` (ack), `chat:read`. server→client: `chat:message`, `chat:inbox`,
`chat:typing`, `presence:update`, `notification:new`.

## Notifications — `/api/notifications`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | `?unread=true&limit=` |
| GET | `/unread-count` | 🔒 | `{ count }` |
| PATCH | `/:id/read` · `/read-all` | 🔒 | mark read |
| DELETE | `/:id` | 🔒 | remove |

## Bookmarks — `/api/bookmarks`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | bookmarked resources (paginated) |
| POST | `/:resourceId` | 🔒 | toggle → `{ bookmarked }` |

## Recommendations — `/api/recommendations`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | `?limit=` → `[{ resource, score, reason }]` (rule-based; LLM-swappable) |

## Search — `/api/search`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | 🔒 | `?q=&limit=` (min 2 chars) → `{ query, total, groups: { resources, faculty, locations, notices, events, posts } }` |

## Admin — `/api/admin`  🛡️
| Method | Path | Notes |
|---|---|---|
| GET | `/stats` | `{ counts{…}, recentUploads }` |
| GET | `/users` | `?role=&search=&status=active\|disabled&page=&limit=` |
| POST | `/users` | `{ name, email, password, role, program?, semester?, department? }` |
| PATCH | `/users/:id` | `name, role, isActive, department, program, semester, rollNumber` (self-lockout guarded) |
| DELETE | `/users/:id` | cannot delete self |
| GET | `/moderation/reported` | reported posts (paginated) |
| PATCH | `/moderation/posts/:id` | `{ isHidden?, clearReports? }` |

## Files — `/api/files`
| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/:key` | 🔒 | streams a file stored by the **local** storage driver (S3 uses presigned URLs instead) |
