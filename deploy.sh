#!/bin/bash
# Deployment script for ServiceNow MCP containerized services

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"servicenow-mcp"}
TAG=${TAG:-"latest"}
ENVIRONMENT=${ENVIRONMENT:-"development"}
NAMESPACE=${NAMESPACE:-"servicenow-mcp"}

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check for Kubernetes tools if deploying to K8s
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if ! command -v kubectl &> /dev/null; then
            print_error "kubectl is not installed or not in PATH"
            exit 1
        fi
        
        if ! kubectl cluster-info &> /dev/null; then
            print_error "Unable to connect to Kubernetes cluster"
            exit 1
        fi
    fi
    
    print_success "Prerequisites check passed"
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build base image first
    print_status "Building base image..."
    docker build -f docker/base/Dockerfile.base -t ${DOCKER_REGISTRY}/base:${TAG} .
    
    # Build all MCP service images
    services=(
        "deployment-mcp"
        "flow-composer-mcp" 
        "intelligent-mcp"
        "update-set-mcp"
        "graph-memory-mcp"
        "operations-mcp"
        "platform-development-mcp"
        "integration-mcp"
        "automation-mcp"
        "security-compliance-mcp"
        "reporting-analytics-mcp"
    )
    
    for service in "${services[@]}"; do
        print_status "Building ${service} image..."
        docker build \
            --build-arg BASE_IMAGE=${DOCKER_REGISTRY}/base:${TAG} \
            -f docker/services/${service}/Dockerfile \
            -t ${DOCKER_REGISTRY}/${service}:${TAG} \
            .
    done
    
    # Build nginx load balancer
    print_status "Building nginx load balancer image..."
    docker build \
        -f docker/nginx/Dockerfile \
        -t ${DOCKER_REGISTRY}/nginx-lb:${TAG} \
        docker/nginx/
    
    print_success "All images built successfully"
}

# Function to deploy using Docker Compose
deploy_compose() {
    local compose_file="docker-compose.yml"
    local override_file=""
    
    case "$ENVIRONMENT" in
        "development")
            override_file="docker-compose.override.yml"
            ;;
        "staging")
            override_file="docker-compose.staging.yml"
            ;;
        "production")
            override_file="docker-compose.prod.yml"
            ;;
    esac
    
    print_status "Deploying with Docker Compose (Environment: $ENVIRONMENT)..."
    
    # Create .env file if it doesn't exist
    if [[ ! -f .env ]]; then
        print_warning ".env file not found. Creating template..."
        cat > .env << EOF
# ServiceNow Configuration
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_CLIENT_ID=your-client-id
SERVICENOW_CLIENT_SECRET=your-client-secret

# Neo4j Configuration
NEO4J_PASSWORD=your-neo4j-password

# Monitoring Configuration
GRAFANA_ADMIN_PASSWORD=your-grafana-password
EOF
        print_warning "Please update the .env file with your actual values before running again"
        exit 1
    fi
    
    # Deploy services
    if [[ -n "$override_file" && -f "$override_file" ]]; then
        docker-compose -f "$compose_file" -f "$override_file" up -d
    else
        docker-compose -f "$compose_file" up -d
    fi
    
    print_success "Docker Compose deployment completed"
}

# Function to deploy to Kubernetes
deploy_kubernetes() {
    print_status "Deploying to Kubernetes (Environment: $ENVIRONMENT)..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply configurations in order
    print_status "Applying namespace and RBAC configurations..."
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/rbac.yaml
    
    print_status "Applying configuration maps and secrets..."
    kubectl apply -f k8s/configmap.yaml
    
    print_status "Deploying infrastructure services..."
    kubectl apply -f k8s/infrastructure.yaml
    
    print_status "Waiting for infrastructure services to be ready..."
    kubectl -n "$NAMESPACE" wait --for=condition=available --timeout=300s deployment/consul
    kubectl -n "$NAMESPACE" wait --for=condition=available --timeout=300s deployment/redis
    kubectl -n "$NAMESPACE" wait --for=condition=available --timeout=300s deployment/neo4j
    
    print_status "Deploying MCP services..."
    kubectl apply -f k8s/mcp-services.yaml
    
    print_status "Waiting for MCP services to be ready..."
    kubectl -n "$NAMESPACE" wait --for=condition=available --timeout=300s deployment --all
    
    print_status "Deploying monitoring stack..."
    kubectl apply -f k8s/monitoring.yaml
    
    print_status "Configuring ingress..."
    kubectl apply -f k8s/ingress.yaml
    
    print_success "Kubernetes deployment completed"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Verify Kubernetes deployment
        print_status "Checking Kubernetes pod status..."
        kubectl -n "$NAMESPACE" get pods
        
        print_status "Checking service endpoints..."
        kubectl -n "$NAMESPACE" get services
        
        # Test service connectivity
        print_status "Testing service connectivity..."
        services=("deployment-mcp" "flow-composer-mcp" "intelligent-mcp" "operations-mcp")
        
        for service in "${services[@]}"; do
            if kubectl -n "$NAMESPACE" get service "$service" &> /dev/null; then
                print_status "✓ Service $service is accessible"
            else
                print_warning "✗ Service $service is not accessible"
            fi
        done
        
    else
        # Verify Docker Compose deployment
        print_status "Checking Docker Compose services..."
        docker-compose ps
        
        # Test basic connectivity
        print_status "Testing service connectivity..."
        
        if curl -f -s http://localhost/health &> /dev/null; then
            print_success "✓ Load balancer health check passed"
        else
            print_warning "✗ Load balancer health check failed"
        fi
        
        if curl -f -s http://localhost:8500/v1/status/leader &> /dev/null; then
            print_success "✓ Consul is accessible"
        else
            print_warning "✗ Consul is not accessible"
        fi
    fi
    
    print_success "Deployment verification completed"
}

# Function to show deployment info
show_info() {
    print_status "Deployment Information"
    echo "========================"
    echo "Environment: $ENVIRONMENT"
    echo "Docker Registry: $DOCKER_REGISTRY"
    echo "Tag: $TAG"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "Namespace: $NAMESPACE"
        echo ""
        echo "Access URLs:"
        echo "  - Main API: https://mcp.servicenow.local"
        echo "  - Monitoring: https://monitoring.servicenow.local"
        echo "  - Direct Access: https://direct.mcp.servicenow.local"
    else
        echo ""
        echo "Access URLs:"
        echo "  - Load Balancer: http://localhost"
        echo "  - Consul UI: http://localhost:8500"
        echo "  - Grafana: http://localhost:3000 (admin/admin)"
        echo "  - Prometheus: http://localhost:9090"
        echo ""
        echo "Individual Services:"
        for i in {1..11}; do
            port=$((3000 + i))
            echo "  - Service on port $port: http://localhost:$port"
        done
    fi
}

# Function to stop deployment
stop_deployment() {
    print_status "Stopping deployment..."
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Stop Kubernetes deployment
        kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
        print_success "Kubernetes deployment stopped"
    else
        # Stop Docker Compose deployment
        docker-compose down -v
        print_success "Docker Compose deployment stopped"
    fi
}

# Function to show logs
show_logs() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        # Show Kubernetes logs
        print_status "Showing recent logs from all pods..."
        kubectl -n "$NAMESPACE" logs --tail=50 -l app.kubernetes.io/part-of=servicenow-mcp
    else
        # Show Docker Compose logs
        docker-compose logs --tail=50 -f
    fi
}

# Main execution
case "${1:-}" in
    "build")
        check_prerequisites
        build_images
        ;;
    "deploy")
        check_prerequisites
        build_images
        if [[ "$ENVIRONMENT" == "production" ]]; then
            deploy_kubernetes
        else
            deploy_compose
        fi
        verify_deployment
        show_info
        ;;
    "verify")
        verify_deployment
        ;;
    "info")
        show_info
        ;;
    "stop")
        stop_deployment
        ;;
    "logs")
        show_logs
        ;;
    "clean")
        stop_deployment
        print_status "Cleaning up Docker images..."
        docker system prune -f
        print_success "Cleanup completed"
        ;;
    *)
        echo "Usage: $0 {build|deploy|verify|info|stop|logs|clean}"
        echo ""
        echo "Commands:"
        echo "  build   - Build all Docker images"
        echo "  deploy  - Deploy the complete stack"
        echo "  verify  - Verify deployment health"
        echo "  info    - Show deployment information"
        echo "  stop    - Stop the deployment"
        echo "  logs    - Show service logs"
        echo "  clean   - Stop deployment and clean up"
        echo ""
        echo "Environment Variables:"
        echo "  ENVIRONMENT - deployment environment (development|staging|production)"
        echo "  DOCKER_REGISTRY - Docker registry prefix"
        echo "  TAG - Docker image tag"
        echo "  NAMESPACE - Kubernetes namespace (production only)"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh build"
        echo "  ENVIRONMENT=staging ./deploy.sh deploy"
        echo "  ENVIRONMENT=production NAMESPACE=prod-mcp ./deploy.sh deploy"
        exit 1
        ;;
esac