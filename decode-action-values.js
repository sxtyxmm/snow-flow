/**
 * Utility to decode ServiceNow Flow Designer action values
 * 
 * Use this to inspect and understand the structure of action values
 * from existing ServiceNow flows.
 */

const pako = require('pako');

/**
 * Decodes a Base64+gzip encoded action value from ServiceNow
 * 
 * @param {string} encodedValue - The value field from sys_hub_action_instance_v2
 * @returns {Object} Decoded value
 */
function decodeServiceNowValue(encodedValue) {
    try {
        // Remove any whitespace
        const cleanValue = encodedValue.trim();
        
        // Base64 decode
        const compressed = Buffer.from(cleanValue, 'base64');
        
        // Decompress with pako
        const decompressed = pako.ungzip(compressed, { to: 'string' });
        
        // Parse JSON
        const parsed = JSON.parse(decompressed);
        
        return {
            success: true,
            data: parsed,
            format: Array.isArray(parsed) ? 'parameter_array' : 'object'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            hint: 'Make sure the value is Base64-encoded gzipped JSON'
        };
    }
}

/**
 * Analyzes an action value and provides insights
 * 
 * @param {string} encodedValue - The encoded value to analyze
 * @returns {Object} Analysis results
 */
function analyzeActionValue(encodedValue) {
    const decoded = decodeServiceNowValue(encodedValue);
    
    if (!decoded.success) {
        return decoded;
    }
    
    const analysis = {
        ...decoded,
        analysis: {
            parameterCount: 0,
            parameters: [],
            hasFlowData: false,
            hasStaticValues: false,
            hasExpressions: false
        }
    };
    
    if (Array.isArray(decoded.data)) {
        analysis.analysis.parameterCount = decoded.data.length;
        
        decoded.data.forEach(param => {
            const paramInfo = {
                name: param.name,
                valueType: param.valueType || 'unknown',
                valueLength: param.value ? param.value.length : 0,
                isFlowData: param.valueType === 'fd_data',
                isStatic: param.valueType === 'static',
                isExpression: param.valueType === 'expression'
            };
            
            if (paramInfo.isFlowData) analysis.analysis.hasFlowData = true;
            if (paramInfo.isStatic) analysis.analysis.hasStaticValues = true;
            if (paramInfo.isExpression) analysis.analysis.hasExpressions = true;
            
            analysis.analysis.parameters.push(paramInfo);
        });
    }
    
    return analysis;
}

/**
 * Example values from real ServiceNow flows
 */
const exampleValues = {
    // Example 1: Simple static parameter
    staticParam: 'H4sIAAAAAAAAA1WOMQ6CMBhGX6W8uRgIFMRNjYmDi5ODiUP5+YtNS39ooTFx8O6WuLm95L3ve/kG0oMCTgKO5RwQBMIBIggBQhQjJAjlAQRfQHQQhCQMQxLEMYkCEgdhGAQJl7JeqQE6RqtOWFrPQJWGOvDBKNlxiJKGR0xCGEVxghFCCCOEQoQQJIzDkJAgRAj+AtKDFsxGaFpZKNdqhKaBRlXQWeFI3RppqJKmElKhGaR0JaQOzaBk4tCjFXRcvAr5xAAAAA==',
    
    // Example 2: Flow data reference
    flowDataParam: 'H4sIAAAAAAAAA1WPwQrCMAyGX0VyniDTOe1NQUQ8ePFQvJR2cYu0TWk6QcZ8d+smePA/fPn+P/kDIQxFLmXFCwwRipAdI8xOEGYow4yd0vQ4Q8y2sGMYI3ZaZCeMnTJM2BYzhmL7vhCVFLWwTmhqaV0L6ZwYqJay9kJb14PWrkZP4JWQpe9JXauBrJRoIZQlqrxQVZCFJzaFqJTQhXjJ2gsvbN9Kaz7yB8Mw5LUU3KaaxsT3/SiOk9hH6AOEft+PgiCKwzBJoogQjD5A6PeDMIqDIIn9JIxIFL2B8AaYOo5v4AEAAA==',
    
    // Example 3: Complex multi-parameter
    complexParam: 'H4sIAAAAAAAAA5VRQW7CMAz9L5JzQUkppVyhaWLaYRcOaJfKJE5rldhJ7RREVU/AjhtwBG7AETgCJ+DIddOyMW0S2qStyg5J/vvPz3/2fwEKUIAc5CgPUGECShBQLCSgBGUowaQI5YSIEhQmJSgLkINJAQqFbNnqdE3Nsu56S6FMrW67lqLblqE0jKZuW9QwrUqlRutOw9KNStNqGp1qh6JKl1ptRasoiqpT19VNv6s/aEbPJg4hNz3T0HpQhPH0u6YGLVW3lYqiPqiuX9e6+iMc1FQNu9tSa1SPsX9QfPxBKb3NQhzH3H0QzjfxvDgOSRjFcxKROIn8IApwzBHlHFFO8TwOEY5CHEc4DkkcxTgi8TykYRiFIY4jGoV0HoYUxyGNQhrHYUjDiMYhjX6Bt6PBaDgaDAbgfQCGYHh7O7wZguHgZjS4vh5ej66GI/DxBT4+vz6f/wEAAA=='
};

// Main execution
if (require.main === module) {
    console.log('ServiceNow Action Value Decoder\n');
    console.log('=' .repeat(50));
    
    // Analyze each example
    Object.entries(exampleValues).forEach(([name, value]) => {
        console.log(`\n${name}:`);
        console.log('-'.repeat(30));
        
        const analysis = analyzeActionValue(value);
        
        if (analysis.success) {
            console.log('✓ Successfully decoded');
            console.log(`Format: ${analysis.format}`);
            console.log(`Parameter count: ${analysis.analysis.parameterCount}`);
            
            if (analysis.analysis.parameters.length > 0) {
                console.log('\nParameters:');
                analysis.analysis.parameters.forEach((param, i) => {
                    console.log(`  ${i + 1}. ${param.name} (${param.valueType})`);
                });
            }
            
            console.log('\nValue types present:');
            console.log(`  - Static values: ${analysis.analysis.hasStaticValues ? '✓' : '✗'}`);
            console.log(`  - Flow data refs: ${analysis.analysis.hasFlowData ? '✓' : '✗'}`);
            console.log(`  - Expressions: ${analysis.analysis.hasExpressions ? '✓' : '✗'}`);
            
            console.log('\nRaw decoded data:');
            console.log(JSON.stringify(analysis.data, null, 2));
        } else {
            console.log(`✗ Failed to decode: ${analysis.error}`);
            console.log(`Hint: ${analysis.hint}`);
        }
    });
    
    // Interactive mode
    if (process.argv[2]) {
        console.log('\n\nDecoding provided value...\n');
        const inputValue = process.argv[2];
        const result = analyzeActionValue(inputValue);
        
        if (result.success) {
            console.log('Decoded successfully!');
            console.log(JSON.stringify(result.data, null, 2));
        } else {
            console.log('Decoding failed:', result.error);
        }
    } else {
        console.log('\n\nUsage: node decode-action-values.js [encoded_value]');
        console.log('Example: node decode-action-values.js "H4sIAAAAAAAAA..."');
    }
}

module.exports = {
    decodeServiceNowValue,
    analyzeActionValue
};