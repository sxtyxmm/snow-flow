#!/bin/sh
# Health check script for nginx load balancer

set -e

INTERNAL_MODE=false
if [ "$1" = "--internal" ]; then
    INTERNAL_MODE=true
fi

# Colors for output (only for non-internal mode)
if [ "$INTERNAL_MODE" = "false" ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    NC=''
fi

# Function to log messages
log() {
    if [ "$INTERNAL_MODE" = "false" ]; then
        echo -e "$1"
    fi
}

# Check if nginx is running
check_nginx() {
    if ! pgrep -x "nginx" > /dev/null; then
        log "${RED}❌ Nginx is not running${NC}"
        return 1
    fi
    
    # Check if nginx responds on health endpoint
    if ! curl -f -s http://localhost:8080/nginx-health > /dev/null 2>&1; then
        log "${RED}❌ Nginx health endpoint not responding${NC}"
        return 1
    fi
    
    log "${GREEN}✅ Nginx is healthy${NC}"
    return 0
}

# Check if consul-template is running
check_consul_template() {
    if ! pgrep -x "consul-template" > /dev/null; then
        log "${RED}❌ Consul-template is not running${NC}"
        return 1
    fi
    
    log "${GREEN}✅ Consul-template is running${NC}"
    return 0
}

# Check consul connectivity
check_consul() {
    CONSUL_URL=${CONSUL_URL:-"http://consul:8500"}
    
    if ! curl -f -s "$CONSUL_URL/v1/status/leader" > /dev/null 2>&1; then
        log "${YELLOW}⚠️  Consul is not reachable at $CONSUL_URL${NC}"
        return 1
    fi
    
    log "${GREEN}✅ Consul is reachable${NC}"
    return 0
}

# Check MCP service availability
check_mcp_services() {
    CONSUL_URL=${CONSUL_URL:-"http://consul:8500"}
    
    # Get list of MCP services from Consul
    SERVICES=$(curl -s "$CONSUL_URL/v1/agent/services" 2>/dev/null || echo "{}")
    
    if [ "$SERVICES" = "{}" ]; then
        log "${YELLOW}⚠️  No services registered in Consul${NC}"
        return 0
    fi
    
    # Count healthy MCP services
    HEALTHY_COUNT=0
    TOTAL_COUNT=0
    
    # This is a simplified check - in production you'd parse JSON properly
    for service in deployment-mcp flow-composer-mcp intelligent-mcp update-set-mcp graph-memory-mcp operations-mcp platform-development-mcp integration-mcp automation-mcp security-compliance-mcp reporting-analytics-mcp; do
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
        
        # Check if service has healthy instances
        if curl -f -s "$CONSUL_URL/v1/health/service/$service?passing=true" | grep -q "Service"; then
            HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
        fi
    done
    
    if [ $HEALTHY_COUNT -eq 0 ]; then
        log "${RED}❌ No healthy MCP services found${NC}"
        return 1
    elif [ $HEALTHY_COUNT -lt $TOTAL_COUNT ]; then
        log "${YELLOW}⚠️  Only $HEALTHY_COUNT/$TOTAL_COUNT MCP services are healthy${NC}"
    else
        log "${GREEN}✅ All $HEALTHY_COUNT MCP services are healthy${NC}"
    fi
    
    return 0
}

# Update status file
update_status() {
    STATUS_FILE="/var/www/html/status.json"
    TIMESTAMP=$(date -Iseconds)
    
    if [ $1 -eq 0 ]; then
        cat > "$STATUS_FILE" << EOF
{
    "status": "healthy",
    "message": "Load balancer is operating normally",
    "timestamp": "$TIMESTAMP",
    "checks": {
        "nginx": "passing",
        "consul_template": "passing",
        "consul": "passing",
        "mcp_services": "passing"
    }
}
EOF
    else
        cat > "$STATUS_FILE" << EOF
{
    "status": "unhealthy",
    "message": "One or more health checks failed",
    "timestamp": "$TIMESTAMP",
    "checks": {
        "nginx": "unknown",
        "consul_template": "unknown", 
        "consul": "unknown",
        "mcp_services": "unknown"
    }
}
EOF
    fi
}

# Main health check routine
main() {
    log "${GREEN}🔍 Starting health check...${NC}"
    
    OVERALL_STATUS=0
    
    # Core checks (critical)
    if ! check_nginx; then
        OVERALL_STATUS=1
    fi
    
    if ! check_consul_template; then
        OVERALL_STATUS=1
    fi
    
    # Optional checks (warnings only)
    check_consul || true
    check_mcp_services || true
    
    # Update status file
    update_status $OVERALL_STATUS
    
    if [ $OVERALL_STATUS -eq 0 ]; then
        log "${GREEN}✅ Overall health: HEALTHY${NC}"
    else
        log "${RED}❌ Overall health: UNHEALTHY${NC}"
    fi
    
    exit $OVERALL_STATUS
}

# Run main function
main