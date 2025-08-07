# Snow-Flow v3.0.10 Release

## 🚀 Push to GitHub

```bash
# Push to main branch
git push origin main

# Create and push a version tag
git tag -a v3.0.10 -m "Release v3.0.10: Reporting & Dashboard Fixes"
git push origin v3.0.10
```

## 📦 Publish to NPM

```bash
# Build the project first
npm run build

# Login to npm (if not already logged in)
npm login

# Publish the package
npm publish

# Or publish with public access (if scoped package)
npm publish --access public
```

## 🔗 Alternative: GitHub Release

If you want to create a GitHub release:

```bash
# Using GitHub CLI
gh release create v3.0.10 \
  --title "v3.0.10: Reporting & Dashboard MCPs Fixed" \
  --notes "Complete overhaul of reporting and dashboard creation. Fixed dashboard visibility issues and report data fetching problems. See commit for full details." \
  --latest
```

## ✅ What's Fixed in v3.0.10

### Dashboard Creation
- ✅ Now uses correct ServiceNow tables (pa_dashboards, sys_portal_page)
- ✅ Dashboards are now visible in ServiceNow
- ✅ Intelligent fallback mechanism

### Report Data Retrieval
- ✅ Reports can now fetch data properly
- ✅ Correct field configuration
- ✅ Working aggregations

### KPI & Performance Analytics
- ✅ KPIs track metrics correctly
- ✅ Performance Analytics collect data
- ✅ Multiple fallback options

## 📋 Post-Release Checklist

- [ ] Verify package on npmjs.com
- [ ] Test installation: `npm install snow-flow@3.0.10`
- [ ] Update documentation if needed
- [ ] Notify users of the fix

## 🧪 Testing

Run the test script to verify everything works:

```bash
node tests/test-reporting-dashboard.js
```

## 📚 Documentation

Full fix details available in:
- `docs/REPORTING_DASHBOARD_FIX.md`
- Commit message for technical details