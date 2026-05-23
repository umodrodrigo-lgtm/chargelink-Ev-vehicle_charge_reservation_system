# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

# ── Stage 2: Runtime — Rocky Linux 9 + nginx ─────────────────────────────────
FROM rockylinux:9

RUN dnf install -y nginx \
    && dnf clean all && rm -rf /var/cache/dnf

# Run nginx as root so it can write logs inside the container
RUN sed -i 's/^user nginx;/user root;/' /etc/nginx/nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/chargelink.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
