# ── Stage 1: Build backend JAR ────────────────────────────────────────────────
FROM maven:3.9.9-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /build
COPY backend/pom.xml .
RUN mvn -q dependency:go-offline
COPY backend/src ./src
RUN mvn -q clean package -DskipTests

# ── Stage 2: Build React frontend ─────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ .
RUN npm run build

# ── Stage 3: Rocky Linux 9 combined runtime ───────────────────────────────────
FROM rockylinux:9

# Install Java 21, nginx, supervisord
RUN dnf install -y epel-release && \
    dnf install -y \
        java-21-openjdk-headless \
        nginx \
        supervisor \
    && dnf clean all && rm -rf /var/cache/dnf

# Create app user
RUN useradd -r -s /sbin/nologin chargelink

# Run nginx as root so it can write to /var/log/chargelink alongside the app
RUN sed -i 's/^user nginx;/user root;/' /etc/nginx/nginx.conf

# All application log files land here
RUN mkdir -p /var/log/chargelink && chmod 777 /var/log/chargelink

# Backend JAR
RUN mkdir -p /app
COPY --from=backend-builder /build/target/chargelink-backend-*.jar /app/backend.jar
RUN chown -R chargelink:chargelink /app

# Frontend static files
COPY --from=frontend-builder /build/dist /usr/share/nginx/html

# Configs
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx-app.conf    /etc/nginx/conf.d/chargelink.conf
COPY supervisord.conf  /etc/supervisord.conf

# Default log path — Spring Boot writes here via LOG_DIR env var
ENV LOG_DIR=/var/log/chargelink

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
