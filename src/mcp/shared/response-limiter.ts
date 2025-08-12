/**
 * MCP Response Limiter
 * Prevents oversized responses that cause timeouts in Claude Code
 */

export class ResponseLimiter {
  private static readonly MAX_RESPONSE_SIZE = 50000; // 50KB max per response
  private static readonly MAX_ARRAY_ITEMS = 100;    // Max 100 items in arrays
  private static readonly MAX_TOKEN_ESTIMATE = 12500; // ~50KB / 4 chars per token

  /**
   * Limit response size to prevent timeouts
   */
  static limitResponse(data: any): { limited: any; wasLimited: boolean; originalSize?: number } {
    const originalString = JSON.stringify(data);
    const originalSize = originalString.length;
    
    // If response is small enough, return as-is
    if (originalSize <= this.MAX_RESPONSE_SIZE) {
      return { limited: data, wasLimited: false };
    }

    // Response too large - need to limit it
    const limited = this.limitObject(data);
    
    return {
      limited,
      wasLimited: true,
      originalSize
    };
  }

  /**
   * Recursively limit object size
   */
  private static limitObject(obj: any, depth: number = 0): any {
    // Don't go too deep
    if (depth > 5) {
      return '[DEPTH_LIMITED]';
    }

    // Handle null/undefined
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle primitives
    if (typeof obj !== 'object') {
      // Limit string length
      if (typeof obj === 'string' && obj.length > 1000) {
        return obj.substring(0, 1000) + '... [TRUNCATED]';
      }
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      if (obj.length > this.MAX_ARRAY_ITEMS) {
        return [
          ...obj.slice(0, this.MAX_ARRAY_ITEMS).map(item => this.limitObject(item, depth + 1)),
          `[... ${obj.length - this.MAX_ARRAY_ITEMS} more items]`
        ];
      }
      return obj.map(item => this.limitObject(item, depth + 1));
    }

    // Handle objects
    const limited: any = {};
    const keys = Object.keys(obj);
    
    // Limit number of keys
    const maxKeys = 50;
    const keysToProcess = keys.slice(0, maxKeys);
    
    for (const key of keysToProcess) {
      limited[key] = this.limitObject(obj[key], depth + 1);
    }
    
    if (keys.length > maxKeys) {
      limited._truncated = `${keys.length - maxKeys} more properties omitted`;
    }
    
    return limited;
  }

  /**
   * Create a summary response when data is too large
   */
  static createSummaryResponse(data: any, operation: string): any {
    const originalSize = JSON.stringify(data).length;
    const estimatedTokens = Math.ceil(originalSize / 4);
    
    return {
      content: [{
        type: 'text',
        text: `⚠️ Response too large (${estimatedTokens} tokens, ${originalSize} bytes)

Operation: ${operation}
Status: Success (data limited to prevent timeout)

Summary:
- Original size: ${(originalSize / 1024).toFixed(1)}KB
- Token estimate: ${estimatedTokens}
- Limit: ${this.MAX_TOKEN_ESTIMATE} tokens

💡 Tips to reduce response size:
1. Use specific field queries instead of '*'
2. Add pagination with smaller limits
3. Filter results more specifically
4. Use count operations instead of full data retrieval`
      }],
      _meta: {
        limited: true,
        originalSize,
        tokenEstimate: estimatedTokens
      }
    };
  }
}