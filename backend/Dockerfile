# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q clean package -DskipTests

# ── Stage 2: Runtime — Rocky Linux 9 ─────────────────────────────────────────
FROM rockylinux:9
WORKDIR /app

RUN dnf install -y java-21-openjdk-headless \
    && dnf clean all && rm -rf /var/cache/dnf

RUN useradd -r -s /sbin/nologin chargelink

# Log directory — mapped to a named volume in docker-compose
RUN mkdir -p /var/log/chargelink && chmod 777 /var/log/chargelink

COPY --from=builder /app/target/chargelink-backend-*.jar app.jar
RUN chown chargelink:chargelink app.jar

USER chargelink
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
