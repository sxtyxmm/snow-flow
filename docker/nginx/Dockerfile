# Nginx Load Balancer with Consul Template Integration
FROM nginx:alpine

LABEL service="nginx-load-balancer" \
      version="1.0.0" \
      description="Dynamic Load Balancer for MCP Services"

# Install consul-template and other necessary tools
RUN apk update && apk add --no-cache \
    curl \
    wget \
    unzip \
    openssl \
    ca-certificates \
    supervisor \
    && rm -rf /var/cache/apk/*

# Install consul-template
ENV CONSUL_TEMPLATE_VERSION=0.32.0
RUN wget https://releases.hashicorp.com/consul-template/${CONSUL_TEMPLATE_VERSION}/consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip \
    && unzip consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip -d /usr/local/bin \
    && rm consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip \
    && chmod +x /usr/local/bin/consul-template

# Create necessary directories
RUN mkdir -p /etc/consul-template/templates \
    /var/log/nginx \
    /var/www/html \
    /etc/nginx/conf.d \
    /etc/nginx/ssl

# Copy consul-template configuration
COPY consul-template.hcl /etc/consul-template/consul-template.hcl
COPY templates/ /etc/consul-template/templates/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Generate self-signed SSL certificates for development
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=mcp-services.local"

# Create initial nginx config
RUN cp /etc/nginx/nginx.conf.template /etc/nginx/nginx.conf

# Create status page
RUN echo '{"status":"starting","message":"Load balancer initializing","timestamp":"'$(date -Iseconds)'"}' > /var/www/html/status.json

# Health check script
COPY healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Environment variables
ENV CONSUL_URL=http://consul:8500 \
    NGINX_LOG_LEVEL=info \
    CONSUL_TEMPLATE_LOG_LEVEL=info

# Expose ports
EXPOSE 80 443 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Use supervisor to manage both nginx and consul-template
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]