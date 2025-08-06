# Timeout Configuration Guide - Snow-Flow v2.9.2

## Overview

Snow-Flow v2.9.2 introduces intelligent timeout management to eliminate frequent timeout errors. The system now automatically adjusts timeouts based on operation type and implements retry logic with exponential backoff.

## Default Timeout Values

| Operation Type | Base Timeout | Max Timeout | Retries |
|---------------|--------------|-------------|---------|
| Simple Query | 30 seconds | 1 minute | 2 |
| Standard Operations | 2 minutes | 5 minutes | 3 |
| Complex Operations | 5 minutes | 10 minutes | 3 |
| ML Training | 10 minutes | 15 minutes | 2 |
| ML Batch Fetch | 10 minutes | 15 minutes | 3 |
| Large Exports | 15 minutes | 30 minutes | 1 |
| Deployments | 5 minutes | 10 minutes | 2 |

## Quick Configuration

### Method 1: Environment Variables (Recommended)

Copy the timeout template to your `.env` file:

```bash
cp .env.timeout.template .env.timeout
# Edit .env.timeout with your preferred values
```

Key variables:
```bash
# Increase global timeout to 5 minutes
SNOW_API_TIMEOUT=300000

# Increase ML training timeout to 15 minutes
SNOW_ML_TRAINING_TIMEOUT=900000

# Increase retry attempts
SERVICENOW_MAX_RETRIES=5
```

### Method 2: Override All Timeouts

For very slow instances, force all operations to use a specific timeout:

```bash
# Force 10 minute timeout for everything
export SNOW_TIMEOUT_OVERRIDE=600000
```

## Timeout Detection

Snow-Flow automatically detects operation types and applies appropriate timeouts:

- **ML Operations**: Detected by tool names containing `ml_` or actions containing `train`/`predict`
- **Bulk Operations**: Detected when limit > 100 records
- **Deployments**: Detected by tool names containing `deploy`
- **Workflows**: Detected by workflow table references

## Retry Logic

### Automatic Retries

The following errors trigger automatic retries:
- Network errors (ECONNRESET, ETIMEDOUT, ECONNREFUSED)
- HTTP status codes: 408, 429, 502, 503, 504
- ServiceNow rate limiting
- Timeout errors

### Exponential Backoff

Retry delays increase exponentially:
- 1st retry: 2 seconds
- 2nd retry: 4 seconds  
- 3rd retry: 8 seconds
- Maximum delay: 30 seconds

### Non-Retryable Errors

These errors skip retries:
- HTTP 400-499 (except 408, 429)
- Authentication failures
- Permission errors
- Validation errors

## Troubleshooting Timeout Issues

### Symptom: Frequent timeouts during ML training

**Solution:**
```bash
export SNOW_ML_TRAINING_TIMEOUT=900000  # 15 minutes
export SNOW_ML_BATCH_SIZE=25  # Smaller batches
```

### Symptom: Timeout on large queries

**Solution:**
```bash
export SNOW_BULK_QUERY_TIMEOUT=600000  # 10 minutes
export SNOW_BATCH_DELAY=500  # More delay between batches
```

### Symptom: Widget deployment timeouts

**Solution:**
```bash
export SNOW_DEPLOYMENT_TIMEOUT=600000  # 10 minutes
export SERVICENOW_MAX_RETRIES=5  # More retries
```

### Symptom: General slow performance

**Solution:**
```bash
# Override all timeouts to 10 minutes
export SNOW_TIMEOUT_OVERRIDE=600000

# Reduce concurrent operations
export SNOW_MAX_CONCURRENT_REQUESTS=5

# Increase batch delays
export SNOW_BATCH_DELAY=1000
```

## Monitoring Timeouts

Enable detailed timeout logging:

```bash
export SNOW_TIMEOUT_DEBUG=true
export SNOW_TIMEOUT_WARNING_THRESHOLD=30000  # Warn for ops > 30s
```

This will log:
- Timeout configuration for each operation
- Retry attempts and delays
- Operations exceeding warning threshold
- Timeout calculation details

## Performance Tuning

### For Fast Instances

Reduce timeouts for better responsiveness:

```bash
export SNOW_API_TIMEOUT=60000  # 1 minute
export SNOW_RETRY_BASE_DELAY=1000  # 1 second
export SNOW_MAX_CONCURRENT_REQUESTS=20
```

### For Slow Instances

Increase timeouts and reduce load:

```bash
export SNOW_API_TIMEOUT=300000  # 5 minutes
export SNOW_ML_TRAINING_TIMEOUT=1200000  # 20 minutes
export SNOW_MAX_CONCURRENT_REQUESTS=5
export SNOW_BATCH_DELAY=1000
```

### For Development Instances

Balance between speed and reliability:

```bash
export SNOW_API_TIMEOUT=120000  # 2 minutes (default)
export SERVICENOW_MAX_RETRIES=3  # Standard retries
export SNOW_BATCH_DELAY=200  # Standard delay
```

## Examples

### Example 1: ML Training Configuration

```bash
# .env file for ML-heavy workloads
SNOW_ML_TRAINING_TIMEOUT=900000  # 15 minutes
SNOW_ML_BATCH_TIMEOUT=600000  # 10 minutes
SNOW_ML_BATCH_SIZE=30  # Smaller batches
SERVICENOW_MAX_RETRIES=4  # More retries
SNOW_BATCH_DELAY=500  # More delay
```

### Example 2: High-Volume Query Configuration

```bash
# .env file for data export/analysis
SNOW_BULK_QUERY_TIMEOUT=600000  # 10 minutes
SNOW_BATCH_OPERATION_TIMEOUT=600000  # 10 minutes
SNOW_MAX_CONCURRENT_REQUESTS=3  # Reduce concurrent load
SNOW_BATCH_DELAY=1000  # 1 second between batches
```

### Example 3: Widget Development Configuration

```bash
# .env file for widget/flow development
SNOW_DEPLOYMENT_TIMEOUT=300000  # 5 minutes
SNOW_API_TIMEOUT=120000  # 2 minutes
SERVICENOW_MAX_RETRIES=5  # More retries for deployments
```

## API Usage

### Using Timeout Manager in Code

```javascript
import { withRetry, OperationType } from './utils/timeout-manager.js';

// Automatic timeout and retry
const result = await withRetry(
  async () => {
    return await serviceNowAPI.call();
  },
  OperationType.ML_TRAINING,
  'Training incident classifier'
);
```

### Custom Operation Types

```javascript
import { getTimeoutConfig, OperationType } from './utils/timeout-manager.js';

// Get timeout config for operation
const config = getTimeoutConfig(OperationType.BULK_QUERY);
console.log(`Timeout: ${config.baseTimeout}ms, Retries: ${config.retryCount}`);
```

## Version History

- **v2.9.2**: Intelligent timeout management with retry logic
- **v2.9.1**: ML data fetching improvements
- **v2.9.0**: Smart default limits for queries

## Summary

The new timeout management system in v2.9.2 provides:

1. **Intelligent Defaults**: Operation-specific timeouts
2. **Automatic Retries**: With exponential backoff
3. **Full Configuration**: Environment variable control
4. **Error Recovery**: Graceful handling of timeout errors
5. **Performance Tuning**: Adapt to your instance speed

No more timeout errors! 🎉