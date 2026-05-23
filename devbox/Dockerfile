FROM rockylinux:9

# ── Core utilities ─────────────────────────────────────────────────────────────
# --allowerasing replaces curl-minimal (pre-installed) with full curl
RUN dnf install -y epel-release && \
    dnf install -y --allowerasing \
        curl wget \
        vim nano \
        net-tools bind-utils iputils \
        procps-ng htop \
        jq \
        redis \
        unzip tar \
    && dnf clean all && rm -rf /var/cache/dnf

# ── PostgreSQL 16 client (arch-aware for x86_64 and aarch64) ──────────────────
RUN ARCH=$(uname -m) && \
    dnf install -y \
        https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-${ARCH}/pgdg-redhat-repo-latest.noarch.rpm \
    && dnf install -y postgresql16 \
    && dnf clean all && rm -rf /var/cache/dnf

# ── Java 21 from Rocky Linux 9 AppStream ─────────────────────────────────────
RUN dnf install -y java-21-openjdk-headless \
    && dnf clean all && rm -rf /var/cache/dnf

# ── Helpful aliases & welcome message ─────────────────────────────────────────
COPY motd.sh /etc/profile.d/chargelink-motd.sh
RUN chmod +x /etc/profile.d/chargelink-motd.sh

# Keep container alive
ENTRYPOINT ["/bin/bash", "-c", "source /etc/profile.d/chargelink-motd.sh; exec tail -f /dev/null"]
