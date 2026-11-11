# syntax=docker/dockerfile:1
# ── CampusOne frontend: build the SPA with Node, serve static files via nginx ──

# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# VITE_* values are inlined at build time. Defaults suit the docker-compose
# setup, where nginx proxies /api and /socket.io to the backend (same origin).
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN npm run build

# 2) Serve stage
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
