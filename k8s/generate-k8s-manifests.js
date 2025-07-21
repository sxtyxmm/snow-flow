#!/usr/bin/env node
/**
 * Generate Kubernetes deployment manifests for all MCP services
 */

const fs = require('fs').promises;
const path = require('path');

const SERVICES = [
  {
    name: 'deployment-mcp',
    displayName: 'ServiceNow Deployment MCP',
    port: 3001,
    replicas: 2,
    resources: {
      requests: { memory: '256Mi', cpu: '250m' },
      limits: { memory: '512Mi', cpu: '500m' }
    }
  },
  {
    name: 'flow-composer-mcp',
    displayName: 'ServiceNow Flow Composer MCP',
    port: 3002,
    replicas: 2,
    resources: {
      requests: { memory: '256Mi', cpu: '250m' },
      limits: { memory: '512Mi', cpu: '500m' }
    }
  },
  {
    name: 'intelligent-mcp',
    displayName: 'ServiceNow Intelligent MCP',
    port: 3003,
    replicas: 3,  // Higher load expected
    resources: {
      requests: { memory: '512Mi', cpu: '500m' },
      limits: { memory: '1Gi', cpu: '1000m' }
    }
  },
  {
    name: 'update-set-mcp',
    displayName: 'ServiceNow Update Set MCP',
    port: 3004,
    replicas: 2,
    resources: {
      requests: { memory: '256Mi', cpu: '250m' },
      limits: { memory: '512Mi', cpu: '500m' }
    }
  },
  {
    name: 'graph-memory-mcp',
    displayName: 'ServiceNow Graph Memory MCP',
    port: 3005,
    replicas: 2,
    resources: {
      requests: { memory: '512Mi', cpu: '500m' },
      limits: { memory: '1Gi', cpu: '1000m' }
    }
  },
  {
    name: 'operations-mcp',
    displayName: 'ServiceNow Operations MCP',
    port: 3006,
    replicas: 3,  // High availability for operations
    resources: {
      requests: { memory: '256Mi', cpu: '250m' },
      limits: { memory: '512Mi', cpu: '500m' }
    }
  },
  {
    name: 'platform-development-mcp',
    displayName: 'ServiceNow Platform Development MCP',
    port: 3007,
    replicas: 2,
    resources: {
      requests: { memory: '256Mi', cpu: '250m' },
      limits: { memory: '512Mi', cpu: '500m' }
    }
  },
  {
    name: 'integration-mcp',
    displayName: 'ServiceNow Integration MCP',
    port: 3008,
    replicas: 2,
    resources: {
      requests: { memory: '256Mi', cpu: '250m' },
      limits: { memory: '512Mi', cpu: '500m' }
    }
  },
  {
    name: 'automation-mcp',
    displayName: 'ServiceNow Automation MCP',
    port: 3009,
    replicas: 2,
    resources: {
      requests: { memory: '256Mi', cpu: '250m' },
      limits: { memory: '512Mi', cpu: '500m' }
    }
  },
  {
    name: 'security-compliance-mcp',
    displayName: 'ServiceNow Security & Compliance MCP',
    port: 3010,
    replicas: 2,
    resources: {
      requests: { memory: '256Mi', cpu: '250m' },
      limits: { memory: '512Mi', cpu: '500m' }
    }
  },
  {
    name: 'reporting-analytics-mcp',
    displayName: 'ServiceNow Reporting & Analytics MCP',
    port: 3011,
    replicas: 2,
    resources: {
      requests: { memory: '384Mi', cpu: '375m' },  // Analytics may need more resources
      limits: { memory: '768Mi', cpu: '750m' }
    }
  }
];

function generateDeployment(service) {
  return `# ${service.displayName} Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${service.name}
  namespace: servicenow-mcp
  labels:
    app.kubernetes.io/name: ${service.name}
    app.kubernetes.io/instance: ${service.name}
    app.kubernetes.io/version: "1.0.0"
    app.kubernetes.io/component: mcp-service
    app.kubernetes.io/part-of: servicenow-mcp
    app.kubernetes.io/managed-by: kubectl
spec:
  replicas: ${service.replicas}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app.kubernetes.io/name: ${service.name}
      app.kubernetes.io/instance: ${service.name}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ${service.name}
        app.kubernetes.io/instance: ${service.name}
        app.kubernetes.io/version: "1.0.0"
        app.kubernetes.io/component: mcp-service
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "${service.port}"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: mcp-service-account
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
      containers:
      - name: ${service.name}
        image: servicenow-mcp/${service.name}:latest
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: ${service.port}
          protocol: TCP
        env:
        - name: SERVICE_NAME
          value: "${service.name}"
        - name: SERVER_PORT
          value: "${service.port}"
        - name: SERVICE_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        - name: HOSTNAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        envFrom:
        - configMapRef:
            name: mcp-config
        - secretRef:
            name: servicenow-credentials
        - secretRef:
            name: neo4j-credentials
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
          successThreshold: 1
        readinessProbe:
          httpGet:
            path: /ready
            port: http
          initialDelaySeconds: 15
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
          successThreshold: 1
        resources:
          requests:
            memory: "${service.resources.requests.memory}"
            cpu: "${service.resources.requests.cpu}"
          limits:
            memory: "${service.resources.limits.memory}"
            cpu: "${service.resources.limits.cpu}"
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: tmp
        emptyDir: {}
      - name: logs
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app.kubernetes.io/name
                  operator: In
                  values:
                  - ${service.name}
              topologyKey: kubernetes.io/hostname
      terminationGracePeriodSeconds: 30
---`;
}

function generateService(service) {
  return `# ${service.displayName} Service
apiVersion: v1
kind: Service
metadata:
  name: ${service.name}
  namespace: servicenow-mcp
  labels:
    app.kubernetes.io/name: ${service.name}
    app.kubernetes.io/instance: ${service.name}
    app.kubernetes.io/version: "1.0.0"
    app.kubernetes.io/component: mcp-service
    app.kubernetes.io/part-of: servicenow-mcp
  annotations:
    service.alpha.kubernetes.io/tolerate-unready-endpoints: "true"
spec:
  type: ClusterIP
  ports:
  - port: ${service.port}
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app.kubernetes.io/name: ${service.name}
    app.kubernetes.io/instance: ${service.name}
---`;
}

function generateHPA(service) {
  return `# ${service.displayName} Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${service.name}-hpa
  namespace: servicenow-mcp
  labels:
    app.kubernetes.io/name: ${service.name}
    app.kubernetes.io/instance: ${service.name}
    app.kubernetes.io/component: autoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${service.name}
  minReplicas: ${service.replicas}
  maxReplicas: ${service.replicas * 3}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 25
        periodSeconds: 60
---`;
}

function generateServiceMonitor(service) {
  return `# ${service.displayName} ServiceMonitor for Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ${service.name}
  namespace: servicenow-mcp
  labels:
    app.kubernetes.io/name: ${service.name}
    app.kubernetes.io/instance: ${service.name}
    app.kubernetes.io/component: monitoring
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: ${service.name}
      app.kubernetes.io/instance: ${service.name}
  endpoints:
  - port: http
    interval: 30s
    path: /metrics
    scrapeTimeout: 10s
---`;
}

function generatePodDisruptionBudget(service) {
  return `# ${service.displayName} Pod Disruption Budget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ${service.name}-pdb
  namespace: servicenow-mcp
  labels:
    app.kubernetes.io/name: ${service.name}
    app.kubernetes.io/instance: ${service.name}
    app.kubernetes.io/component: availability
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: ${service.name}
      app.kubernetes.io/instance: ${service.name}
---`;
}

async function generateAllManifests() {
  console.log('Generating Kubernetes manifests for all MCP services...');

  // Generate individual service manifests
  for (const service of SERVICES) {
    const manifest = [
      generateDeployment(service),
      generateService(service),
      generateHPA(service),
      generateServiceMonitor(service),
      generatePodDisruptionBudget(service)
    ].join('\n');

    const filename = path.join(__dirname, `${service.name}.yaml`);
    await fs.writeFile(filename, manifest);
    console.log(`✅ Generated manifest for ${service.name}`);
  }

  // Generate combined manifest
  const allManifests = SERVICES.flatMap(service => [
    generateDeployment(service),
    generateService(service),
    generateHPA(service),
    generateServiceMonitor(service),
    generatePodDisruptionBudget(service)
  ]).join('\n');

  const combinedFilename = path.join(__dirname, 'mcp-services.yaml');
  await fs.writeFile(combinedFilename, allManifests);
  console.log('✅ Generated combined manifest: mcp-services.yaml');

  // Generate kustomization.yaml
  const kustomization = {
    apiVersion: 'kustomize.config.k8s.io/v1beta1',
    kind: 'Kustomization',
    namespace: 'servicenow-mcp',
    resources: [
      'namespace.yaml',
      'configmap.yaml',
      'rbac.yaml',
      'infrastructure.yaml',
      'mcp-services.yaml',
      'monitoring.yaml',
      'ingress.yaml'
    ],
    images: SERVICES.map(service => ({
      name: `servicenow-mcp/${service.name}`,
      newTag: 'latest'
    })),
    replicas: SERVICES.map(service => ({
      name: service.name,
      count: service.replicas
    })),
    commonLabels: {
      'app.kubernetes.io/part-of': 'servicenow-mcp',
      'app.kubernetes.io/managed-by': 'kustomize'
    }
  };

  await fs.writeFile(
    path.join(__dirname, 'kustomization.yaml'),
    `# Kustomization configuration for ServiceNow MCP services
${JSON.stringify(kustomization, null, 2)}`
  );
  console.log('✅ Generated kustomization.yaml');

  console.log('\n🎉 All Kubernetes manifests generated successfully!');
  console.log('\nGenerated files:');
  SERVICES.forEach(service => {
    console.log(`  - ${service.name}.yaml`);
  });
  console.log('  - mcp-services.yaml (combined)');
  console.log('  - kustomization.yaml');
  
  console.log('\nDeployment summary:');
  SERVICES.forEach(service => {
    console.log(`  - ${service.displayName}: ${service.replicas} replicas on port ${service.port}`);
  });

  const totalReplicas = SERVICES.reduce((sum, service) => sum + service.replicas, 0);
  console.log(`\nTotal replicas: ${totalReplicas}`);
}

// Run the generator
generateAllManifests().catch(console.error);