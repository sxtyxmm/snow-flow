# Snow-Flow v4.2.0 ENTERPRISE - Google Cloud Build Setup 🏢

Complete enterprise-grade CI/CD pipeline for Snow-Flow with 23 MCP servers and 355+ tools.

## 📋 **Available Cloud Build Configurations**

### 1. **Main Build Pipeline** (`cloudbuild.yaml`)
- **Purpose**: Standard CI/CD for main branch
- **Features**: Build, test, verify CLI, package
- **Triggers**: Push to main, pull requests
- **Artifacts**: Build metadata, packaged dist

### 2. **NPM Release Pipeline** (`cloudbuild-npm.yaml`) 
- **Purpose**: Automated npm publishing for releases
- **Features**: Enterprise verification, npm publishing, success notifications
- **Triggers**: Version tags (v4.2.0, v4.2.1, etc.)
- **Artifacts**: Published npm package

### 3. **Website Pipeline** (`website/cloudbuild.yaml`)
- **Purpose**: Website deployment to Cloud Run
- **Features**: Docker build, Cloud Run deployment
- **Triggers**: Website changes, manual deployment

## 🚀 **Quick Setup for Enterprise**

### 1. **Enable GCP APIs**
```bash
export PROJECT_ID="your-snow-flow-project"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com  
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. **Configure Cloud Build Triggers**

**Main Build Trigger:**
```bash
gcloud builds triggers create github \
  --repo-name=snow-flow \
  --repo-owner=groeimetai \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --description="Snow-Flow Enterprise Main Build"
```

**NPM Release Trigger:**
```bash
gcloud builds triggers create github \
  --repo-name=snow-flow \
  --repo-owner=groeimetai \
  --tag-pattern="^v[0-9]+\.[0-9]+\.[0-9]+$" \
  --build-config=cloudbuild-npm.yaml \
  --description="Snow-Flow Enterprise NPM Release"
```

### 3. **Configure NPM Token Secret** (for npm publishing)
```bash
# Store your npm token in Secret Manager
echo "your-npm-token" | gcloud secrets create npm-token --data-file=-

# Grant Cloud Build access
gcloud secrets add-iam-policy-binding npm-token \
  --member="serviceAccount:$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 4. **Configure Storage Bucket** (for artifacts)
```bash
# Create bucket for build artifacts
gsutil mb gs://$PROJECT_ID-snow-flow-artifacts

# Set lifecycle policy to clean old builds
gsutil lifecycle set - gs://$PROJECT_ID-snow-flow-artifacts << EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 30}
    }
  ]
}
EOF
```

## 🎯 **Enterprise Build Features**

### **Main Build Pipeline Features:**
- ✅ **Node.js 20** - Latest LTS for enterprise stability
- ✅ **High CPU machine** - E2_HIGHCPU_8 for fast TypeScript compilation  
- ✅ **Enterprise verification** - Validates 23 MCP servers present
- ✅ **Memory optimization** - Verifies MemoryPoolManager exists
- ✅ **CLI testing** - Validates `snow-flow --version` works
- ✅ **Artifact storage** - Builds stored in GCS for 30 days

### **NPM Release Pipeline Features:**
- ✅ **Automated publishing** - Only on version tags (v4.2.0, etc.)
- ✅ **Enterprise validation** - Verifies ITAM, SecOps, Notifications present
- ✅ **Security checks** - Validates package integrity
- ✅ **Success notifications** - Build completion alerts
- ✅ **Secret management** - NPM token via Secret Manager

### **Website Pipeline Features:**
- ✅ **Docker deployment** - Containerized website 
- ✅ **Cloud Run hosting** - Serverless website hosting
- ✅ **Auto-scaling** - 1-10 instances based on traffic
- ✅ **European hosting** - europe-west1 region

## 🔧 **Build Environment Variables**

Add these to your Cloud Build triggers:

```yaml
substitutions:
  _NODE_ENV: 'production'
  _SNOW_FLOW_ENTERPRISE: 'true'
  _MEMORY_OPTIMIZATION: 'enabled'
  _MCP_SERVERS_COUNT: '23'
  _TOOLS_COUNT: '355'
```

## 🎯 **Expected Build Outputs**

### **Successful Main Build:**
```
✅ 23 MCP Servers compiled successfully
✅ 355+ Tools ready for deployment  
✅ Enterprise features: ITAM, SecOps, Notifications
✅ Memory optimizations: MemoryPoolManager active
✅ Performance improvements: 85% memory reduction
📦 Artifact ready for enterprise distribution
```

### **Successful NPM Release:**
```
🚀 Publishing Snow-Flow Enterprise Edition to npm...
✅ Published Snow-Flow v4.2.0 to npm registry
📦 Enterprise features now available worldwide!
```

## 💡 **Troubleshooting**

### **If Build Fails:**
1. Check Node.js version is 20.x
2. Verify all MCP server files exist
3. Check enterprise features are present
4. Validate package.json version format

### **If NPM Publish Fails:**
1. Check NPM_TOKEN secret is configured
2. Verify semantic version format (v4.2.0)
3. Ensure no duplicate version exists
4. Check npm registry authentication

### **If Website Deploy Fails:**
1. Check Docker build succeeds
2. Verify Cloud Run permissions
3. Check region availability (europe-west1)
4. Validate service account permissions

## 🏆 **Enterprise Ready**

Your Snow-Flow platform now has **enterprise-grade CI/CD** with:
- **Automated builds** on every commit
- **Automated npm publishing** on version tags  
- **Automated website deployment** on website changes
- **Enterprise feature validation** in every build
- **Performance optimization verification** 
- **Multi-region artifact storage**

**Perfect for enterprise ServiceNow development teams!** 🚀✨