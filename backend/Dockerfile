# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache dependency layer separately from source
COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q clean package -DskipTests

# ── Stage 2: Runtime on Rocky Linux 9 ────────────────────────────────────────
FROM rockylinux:9
WORKDIR /app

# Install Java 21 from Rocky Linux 9 AppStream (ships in Rocky 9.3+)
RUN dnf install -y java-21-openjdk-headless \
    && dnf clean all && rm -rf /var/cache/dnf

RUN useradd -r -s /sbin/nologin chargelink

COPY --from=builder /app/target/chargelink-backend-*.jar app.jar
RUN mkdir -p logs && chown -R chargelink:chargelink /app

USER chargelink
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
