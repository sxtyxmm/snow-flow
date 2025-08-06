# Query Optimization Best Practices

## Universal Query Tool Performance Guide

The `snow_query_table` tool provides intelligent performance optimization for any ServiceNow table. This guide explains how to maximize efficiency and minimize resource usage.

## Query Modes

### 1. Count-Only Mode (Default)
**Use Case:** ML training data sizing, statistics, quick checks  
**Memory Usage:** ~13 bytes  
**Performance:** Instant  

```javascript
snow_query_table({ 
  table: "incident", 
  query: "state!=7", 
  limit: 2000 
})
// Returns: {total_results: 2000}
```

**Benefits:**
- 99.9% memory savings compared to full data
- Perfect for ML training size validation
- Instant performance metrics

### 2. Specific Fields Mode
**Use Case:** Targeted analysis, dashboards, reports  
**Memory Usage:** 70-80% reduction  
**Performance:** Fast  

```javascript
snow_query_table({ 
  table: "sc_request",
  fields: ["number", "short_description", "requested_for"],
  include_display_values: true  // Get names instead of sys_ids
})
```

**Benefits:**
- Only fetch what you need
- Reduced network transfer
- Human-readable display values

### 3. Group By Aggregation
**Use Case:** Analytics, statistics, distribution analysis  
**Memory Usage:** Minimal  
**Performance:** Efficient  

```javascript
snow_query_table({ 
  table: "problem",
  group_by: "category",
  order_by: "-priority"  // - means descending
})
```

**Benefits:**
- Pre-aggregated results
- Server-side processing
- Minimal data transfer

### 4. Full Content Mode
**Use Case:** Detailed analysis, complete data export  
**Memory Usage:** Full dataset  
**Performance:** Slower  

```javascript
snow_query_table({ 
  table: "change_request",
  include_content: true,
  limit: 100
})
```

**When to use:**
- Detailed record analysis needed
- Data export requirements
- Complex client-side processing

## Performance Comparison

| Mode | Memory Usage | Speed | Use Case |
|------|-------------|-------|----------|
| Count-Only | ~13 bytes | Instant | ML sizing, statistics |
| Specific Fields | 20-30% of full | Fast | Targeted analysis |
| Group By | Minimal | Efficient | Analytics |
| Full Content | 100% | Slower | Complete analysis |

## ML Training Optimization

### Batch Processing Pattern
```javascript
// Efficient ML data fetching
async function fetchMLTrainingData(totalSize = 5000, batchSize = 100) {
  const batches = [];
  
  for (let offset = 0; offset < totalSize; offset += batchSize) {
    // Fetch batch with minimal fields
    const batch = await snow_query_table({
      table: "incident",
      fields: ["short_description", "description", "category", "priority"],
      query: `sys_created_onONLast 6 months^ORDERBYDESCsys_created_on`,
      limit: batchSize,
      offset: offset
    });
    
    // Process batch immediately to avoid memory buildup
    const processed = processBatch(batch);
    batches.push(processed);
    
    // Optional: Clear batch from memory
    batch = null;
  }
  
  return batches;
}
```

### Memory-Efficient Feature Extraction
```javascript
// Extract only necessary features for ML
function extractMLFeatures(record) {
  return {
    // Truncate text to reduce memory
    text: `${record.short_description} ${record.description}`.substring(0, 500),
    // Categorical features
    category: record.category || 'uncategorized',
    priority: parseInt(record.priority) || 3,
    // Numerical features
    impact: parseInt(record.impact) || 2,
    urgency: parseInt(record.urgency) || 2
  };
}
```

## Query Optimization Strategies

### 1. Use Indexes
```javascript
// Good: Query on indexed fields
snow_query_table({
  table: "incident",
  query: "number=INC0123456"  // number is indexed
})

// Better: Combine indexed fields
snow_query_table({
  table: "incident",
  query: "state=1^priority=1"  // Both indexed
})
```

### 2. Limit Result Sets
```javascript
// Always specify reasonable limits
snow_query_table({
  table: "incident",
  query: "active=true",
  limit: 100  // Don't fetch more than needed
})
```

### 3. Use Order By Wisely
```javascript
// Descending sort with - prefix
snow_query_table({
  table: "incident",
  order_by: "-sys_created_on",  // Most recent first
  limit: 10
})
```

### 4. Leverage ServiceNow Query Syntax
```javascript
// Date ranges
query: "sys_created_onONLast 7 days"

// Multiple conditions
query: "priority=1^ORpriority=2"

// Pattern matching
query: "short_descriptionLIKEpassword"

// Null checks
query: "categoryISNOTEMPTY"
```

## Common Patterns

### Dashboard Data
```javascript
// Get incident counts by state
const dashboard = await snow_query_table({
  table: "incident",
  group_by: "state",
  query: "sys_created_onONToday"
});
```

### Report Generation
```javascript
// Get specific fields for reporting
const report = await snow_query_table({
  table: "sc_request",
  fields: ["number", "short_description", "state", "requested_for"],
  include_display_values: true,
  query: "active=true",
  order_by: "-sys_created_on",
  limit: 500
});
```

### ML Training Data
```javascript
// Validate dataset size first
const validation = await snow_query_table({
  table: "incident",
  query: "category!=NULL^sys_created_onONLast 6 months",
  limit: 10000
});

if (validation.total_results >= 1000) {
  // Proceed with batch training
  await trainMLModel({
    sample_size: Math.min(5000, validation.total_results),
    batch_size: 100
  });
}
```

## Performance Tips

### Do's ✅
- Use count-only for size validation
- Request specific fields when possible
- Use batch processing for large datasets
- Leverage server-side aggregation
- Cache results when appropriate
- Use indexed fields in queries

### Don'ts ❌
- Don't fetch full content unless necessary
- Don't request unlimited results
- Don't use complex regex in queries
- Don't ignore query optimization
- Don't fetch redundant data
- Don't process large datasets in memory

## Monitoring & Debugging

### Check Query Performance
```javascript
// Measure query execution time
const start = Date.now();
const result = await snow_query_table({
  table: "incident",
  query: "complex_query_here",
  limit: 100
});
const executionTime = Date.now() - start;
console.log(`Query took ${executionTime}ms`);
```

### Memory Usage Tracking
```javascript
// Monitor memory consumption
const before = process.memoryUsage().heapUsed;
const data = await snow_query_table({
  table: "incident",
  include_content: true,
  limit: 1000
});
const after = process.memoryUsage().heapUsed;
const memoryUsed = (after - before) / 1024 / 1024;
console.log(`Query used ${memoryUsed.toFixed(2)} MB`);
```

## Advanced Techniques

### Parallel Query Execution
```javascript
// Fetch from multiple tables in parallel
const [incidents, requests, problems] = await Promise.all([
  snow_query_table({ table: "incident", limit: 100 }),
  snow_query_table({ table: "sc_request", limit: 100 }),
  snow_query_table({ table: "problem", limit: 100 })
]);
```

### Progressive Data Loading
```javascript
// Load data progressively as needed
async function* progressiveLoad(table, query, batchSize = 100) {
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const batch = await snow_query_table({
      table,
      query,
      limit: batchSize,
      offset,
      include_content: true
    });
    
    if (batch.records.length < batchSize) {
      hasMore = false;
    }
    
    yield batch.records;
    offset += batchSize;
  }
}

// Usage
for await (const batch of progressiveLoad("incident", "active=true")) {
  processBatch(batch);
}
```

## Conclusion

The universal query tool provides flexible, efficient data access for any ServiceNow table. By choosing the appropriate query mode and following these best practices, you can achieve:

- **99.9% memory savings** with count-only queries
- **70-80% reduction** with specific field queries
- **Efficient ML training** with batch processing
- **Real-time analytics** with group by aggregation

Always optimize for your specific use case and monitor performance to ensure optimal resource utilization.