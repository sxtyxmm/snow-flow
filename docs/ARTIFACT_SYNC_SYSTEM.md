# 🌉 Snow-Flow Artifact Sync System

## Dynamic Local Development Bridge for ServiceNow

The Artifact Sync System creates a powerful bridge between ServiceNow and Claude Code's native development tools, enabling you to edit ANY ServiceNow artifact type using your favorite editor with full IDE capabilities.

## 🚀 Key Features

### 1. **Universal Artifact Support**
Works with ALL major ServiceNow artifact types out of the box:

| Artifact Type | Table Name | Features |
|--------------|------------|----------|
| Service Portal Widgets | `sp_widget` | ✅ Coherence validation, ES5 checking |
| Flow Designer Flows | `sys_hub_flow` | ✅ JSON formatting, large file support |
| Script Includes | `sys_script_include` | ✅ ES5 validation, API documentation |
| Business Rules | `sys_script` | ✅ Context injection, ES5 validation |
| UI Pages | `sys_ui_page` | ✅ Jelly syntax, client/server split |
| Client Scripts | `sys_script_client` | ✅ Form context, type detection |
| UI Policies | `sys_ui_policy` | ✅ True/false script separation |
| REST Messages | `sys_rest_message` | ✅ Documentation generation |
| Transform Maps | `sys_transform_map` | ✅ Script extraction |
| Scheduled Jobs | `sysauto_script` | ✅ ES5 validation, schedule info |
| Fix Scripts | `sys_script_fix` | ✅ One-time execution context |

### 2. **Smart Field Chunking**
Automatically handles large artifacts that exceed token limits:
- Splits fields into intelligent groups
- Maintains context relationships
- Preserves coherence between related fields
- Works seamlessly with 20K+ token fields

### 3. **Coherence Validation**
For widgets and other interconnected artifacts:
- Validates template-server data bindings
- Checks template-client method references
- Ensures CSS classes are defined
- Verifies server handles client actions

### 4. **ES5 Compliance**
Automatic detection and validation for server-side scripts:
- Flags modern JavaScript that won't work in ServiceNow
- Suggests ES5 alternatives
- Validates before pushing changes

### 5. **Claude Code Integration**
Full native tool support:
- 🔍 Search across all artifact files
- ✏️ Multi-file editing and refactoring
- 🔄 Git-like diff viewing
- 📁 File tree navigation
- 🎯 Go-to-definition and references

## 📖 Usage Guide

### Pull Any Artifact

```javascript
// Auto-detect artifact type by sys_id
snow_pull_artifact({ 
  sys_id: 'abc123def456' 
});

// Specify table if known (faster)
snow_pull_artifact({ 
  sys_id: 'abc123def456',
  table: 'sp_widget' 
});

// Legacy commands still work
snow_pull_widget({ sys_id: 'widget_id' });
snow_pull_script_include({ sys_id: 'script_id' });
snow_pull_business_rule({ sys_id: 'rule_id' });
```

### Edit with Claude Code

Once pulled, use Claude Code's native tools:

```bash
# Search across all files
grep -r "data.message" ./

# Edit multiple files
code widget.html widget.server.js

# Use multi-cursor editing
# Use find and replace across files
# Use any IDE features you like!
```

### Push Changes Back

```javascript
// Push with automatic validation
snow_push_artifact({ 
  sys_id: 'abc123def456' 
});

// Force push despite warnings
snow_push_artifact({ 
  sys_id: 'abc123def456',
  force: true 
});
```

### Validate Coherence

```javascript
// Check artifact coherence rules
snow_validate_artifact_coherence({ 
  sys_id: 'abc123def456' 
});
```

### Check Sync Status

```javascript
// See all local artifacts
snow_sync_status({});

// Check specific artifact
snow_sync_status({ 
  sys_id: 'abc123def456' 
});
```

### Clean Up

```javascript
// Remove local files after sync
snow_sync_cleanup({ 
  sys_id: 'abc123def456' 
});

// Force cleanup even with changes
snow_sync_cleanup({ 
  sys_id: 'abc123def456',
  force: true 
});
```

## 🏗️ Architecture

### Dynamic Registry System

The heart of the system is the **Artifact Registry** (`artifact-registry.ts`):

```typescript
export const ARTIFACT_REGISTRY: Record<string, ArtifactTypeConfig> = {
  'sp_widget': {
    tableName: 'sp_widget',
    displayName: 'Service Portal Widget',
    folderName: 'widgets',
    identifierField: 'name',
    fieldMappings: [...],
    coherenceRules: [...],
    documentation: '...'
  },
  // ... 11 more artifact types
};
```

Each artifact type defines:
- **Field Mappings**: How ServiceNow fields map to local files
- **Wrappers**: Context headers/footers for better editing experience
- **Validation**: ES5 checking, coherence rules
- **Documentation**: Inline help and guidelines

### File Structure

When you pull an artifact, it creates this structure:

```
/tmp/snow-flow-artifacts/
├── widgets/
│   └── my_widget/
│       ├── my_widget.html          # Template
│       ├── my_widget.server.js     # Server script (ES5)
│       ├── my_widget.client.js     # Client script
│       ├── my_widget.css           # Styles
│       ├── my_widget.config.json   # Configuration
│       └── README.md               # Context & instructions
├── script_includes/
│   └── MyScriptInclude/
│       ├── MyScriptInclude.js      # Script
│       └── MyScriptInclude.docs.md # Documentation
└── business_rules/
    └── my_rule/
        ├── my_rule.js               # Rule script
        └── my_rule.condition.js     # Condition
```

### Smart Fetching

For large artifacts, the system automatically:
1. Fetches metadata first (name, sys_id, etc.)
2. Fetches each large field separately
3. Groups small fields together
4. Maintains relationships between fields
5. Provides context hints

## 🎯 Best Practices

### 1. Always Sync User Changes
If a user says they've modified something in ServiceNow:
```javascript
// ALWAYS fetch latest first!
snow_pull_artifact({ sys_id: 'modified_artifact' });
// Then make your changes on top of theirs
```

### 2. Respect ES5 Requirements
Server-side scripts MUST be ES5:
```javascript
// ❌ DON'T use modern JavaScript
const data = [];
let message = `Hello ${name}`;
items.forEach(item => process(item));

// ✅ DO use ES5
var data = [];
var message = 'Hello ' + name;
for (var i = 0; i < items.length; i++) {
  process(items[i]);
}
```

### 3. Maintain Widget Coherence
For widgets, ensure:
- Every `{{data.x}}` in template has `data.x` in server
- Every `ng-click="method()"` has `$scope.method` in client
- Every `c.server.get({action})` has `if(input.action)` in server

### 4. Use Validation Before Push
Always validate before pushing:
```javascript
// Check coherence first
snow_validate_artifact_coherence({ sys_id: 'my_widget' });

// Then push if valid
snow_push_artifact({ sys_id: 'my_widget' });
```

## 🔧 Extending the System

### Adding New Artifact Types

Edit `artifact-registry.ts` to add new types:

```typescript
ARTIFACT_REGISTRY['new_table'] = {
  tableName: 'new_table',
  displayName: 'New Artifact Type',
  folderName: 'new_artifacts',
  identifierField: 'name',
  fieldMappings: [
    {
      serviceNowField: 'script',
      localFileName: '{name}',
      fileExtension: 'js',
      description: 'Main script',
      maxTokens: 20000,
      isRequired: true,
      validateES5: true
    }
  ],
  searchableFields: ['name', 'script'],
  supportsBulkOperations: true
};
```

### Custom Coherence Rules

Add validation rules for artifact relationships:

```typescript
coherenceRules: [
  {
    name: 'Custom Validation',
    description: 'Ensures X matches Y',
    validate: (files: Map<string, string>) => {
      // Your validation logic
      return {
        valid: true,
        errors: [],
        warnings: [],
        hints: []
      };
    }
  }
]
```

### Preprocessors/Postprocessors

Transform content during sync:

```typescript
fieldMappings: [
  {
    serviceNowField: 'config',
    preprocessor: (content) => {
      // Format JSON for editing
      return JSON.stringify(JSON.parse(content), null, 2);
    },
    postprocessor: (content) => {
      // Minify for ServiceNow
      return JSON.stringify(JSON.parse(content));
    }
  }
]
```

## 🚨 Troubleshooting

### Token Limit Errors
**Problem**: "Query exceeds maximum allowed tokens"
**Solution**: The system automatically handles this with smart chunking

### ES5 Validation Failures
**Problem**: Modern JavaScript in server scripts
**Solution**: Use the `snow_convert_to_es5` tool or manually convert

### Coherence Violations
**Problem**: Template references non-existent data/methods
**Solution**: Review the validation output and fix mismatches

### Sync Conflicts
**Problem**: Local changes conflict with ServiceNow
**Solution**: Pull latest, merge changes, then push

## 🎉 Benefits

1. **Use Your Favorite Editor**: VS Code, Vim, Sublime, etc.
2. **Full Search Capabilities**: Regex, multi-file, go-to-definition
3. **Version Control**: Git integration for local changes
4. **Bulk Operations**: Edit multiple artifacts simultaneously
5. **Offline Development**: Work without constant ServiceNow connection
6. **Better Performance**: Local editing is instant
7. **Advanced Refactoring**: Rename across files, extract methods
8. **Syntax Highlighting**: Full language support in your editor

## 🔮 Future Enhancements

- [ ] Batch pull/push operations
- [ ] Automatic merge conflict resolution
- [ ] Git integration for version tracking
- [ ] Template library for new artifacts
- [ ] Automated testing framework
- [ ] Performance profiling tools
- [ ] Dependency analysis
- [ ] Impact assessment

## 📚 Related Documentation

- [ServiceNow Development Standards](../CLAUDE.md#servicenow-development-standards)
- [ES5 JavaScript Guide](../CLAUDE.md#rule-1-es5-javascript-only-in-servicenow)
- [Widget Coherence Rules](../CLAUDE.md#rule-3-widget-coherence---critical-client-server-communication)
- [MCP Server Capabilities](../CLAUDE.md#mcp-server-capabilities)

---

**Remember**: This system was built "met extreem veel zorg en grondig" (with extreme care and thoroughness) to make ServiceNow development a joy with Claude Code! 🚀