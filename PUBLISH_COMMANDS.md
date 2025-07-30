# Snow-Flow v1.4.0 Publishing Commands

## ⚠️ Important: I Cannot Execute These Commands

Due to authentication and security restrictions, I cannot directly push to GitHub or publish to NPM. **You must execute these commands yourself.**

## 🔧 Commands to Execute

### 1. Git Commands (Execute in Terminal)

```bash
# Check status
git status

# Stage all changes
git add .

# Commit with comprehensive message
git commit -m "🚨 BREAKING: v1.4.0 - Remove all flow creation functionality

- Remove 38 bug-prone flow creation tools
- Focus on stable core: widgets, update sets, auth
- Add comprehensive migration guide  
- Direct users to native ServiceNow Flow Designer

BREAKING CHANGES:
- All flow creation MCP tools removed
- CLI commands create-flow/xml-flow removed
- Users must use ServiceNow Flow Designer directly

Features that still work:
- Widget development and deployment
- Update Set management
- ServiceNow authentication
- Table/field discovery
- Multi-agent coordination

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Create version tag
git tag -a v1.4.0 -m "Release v1.4.0: Remove flow creation, focus on stable features"

# Push to GitHub
git push origin main
git push origin v1.4.0
```

### 2. NPM Publishing Commands

```bash
# Build the project (fix TypeScript errors first if needed)
npm run build

# Optional: Test locally
npm test

# Login to NPM (if not already logged in)
npm login

# Publish to NPM registry
npm publish

# Verify publication
npm info snow-flow@1.4.0
```

### 3. Verification Commands

```bash
# Check that the package was published correctly
npm view snow-flow@1.4.0

# Test installation (in a different directory)
mkdir test-install && cd test-install
npm install -g snow-flow@1.4.0
snow-flow --version  # Should show 1.4.0
snow-flow --help     # Should NOT show flow commands
```

## 🚨 Pre-Publishing Checklist

- [ ] Fix remaining TypeScript compilation errors
- [ ] Test CLI commands locally (`./bin/snow-flow --help`)
- [ ] Verify deprecation messages work (`./bin/snow-flow swarm "create flow"`)
- [ ] Review MIGRATION.md and README.md
- [ ] Update any other documentation if needed

## 📝 Post-Publishing Steps

1. **Update GitHub Release**
   - Go to GitHub repository
   - Create new release for v1.4.0 tag
   - Add release notes from CHANGELOG-1.4.0.md

2. **Announce Breaking Changes**
   - Update repository README with prominent warning
   - Consider adding GitHub issue template for flow migration questions

3. **Monitor for Issues**
   - Watch for user reports about missing functionality
   - Provide migration support as needed

## 🎯 Expected User Impact

Users trying flow commands will see:
```
❌ Flow creation has been removed from snow-flow v1.4.0+

Please use ServiceNow Flow Designer directly:
1. Log into your ServiceNow instance
2. Navigate to: Flow Designer > Designer  
3. Create flows using the visual interface

Snow-flow continues to support:
- Widget development
- Update Set management
- Table/field discovery
- General ServiceNow operations
```

---

**After executing these commands, snow-flow v1.4.0 will be live!**