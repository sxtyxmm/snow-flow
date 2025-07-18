# Enhanced Flow Composer MCP Documentation

## Overview

The Enhanced Flow Composer MCP is a comprehensive integration of advanced ServiceNow flow creation capabilities with intelligent analysis, decision-making, and deployment features. This document provides complete information about the integrated solution.

## Architecture Overview

### Core Components

1. **Enhanced Flow Composer** (`/src/orchestrator/flow-composer.ts`)
   - Main orchestration engine
   - Intelligent artifact discovery and analysis
   - Natural language processing
   - Flow vs Subflow decision logic
   - Global scope strategy integration

2. **Flow vs Subflow Decision Engine** (`/src/orchestrator/flow-subflow-decision-engine.ts`)
   - Analyzes requirements to determine optimal flow structure
   - Provides confidence scores and rationale
   - Identifies subflow candidates

3. **Global Scope Strategy** (`/src/strategies/global-scope-strategy.ts`)
   - Intelligent scope selection
   - Fallback mechanisms
   - Compliance and permission validation

4. **Template Matching System** (`/src/orchestrator/flow-pattern-templates.ts`)
   - Pattern recognition for common flow types
   - Template-based flow generation
   - Consistency enforcement

5. **Validation Engine** (`/src/orchestrator/flow-validation-engine.ts`)
   - Comprehensive flow validation
   - Quality scoring
   - Recommendation generation

6. **Scope Manager** (`/src/managers/scope-manager.ts`)
   - Centralized scope management
   - Deployment context analysis
   - Permission validation

## MCP Tools Reference

### `snow_create_flow`
**FULLY AUTONOMOUS flow creation** - Parses natural language, discovers artifacts, creates missing components, links everything, deploys automatically.

#### Parameters
- `instruction` (required): Natural language instruction for the flow
- `deploy_immediately` (optional, default: true): Deploy the flow immediately after creation
- `create_missing_artifacts` (optional, default: true): Create missing artifacts as fallbacks
- `scope_preference` (optional, default: 'auto'): Preferred deployment scope ('global', 'application', 'auto')
- `enable_intelligent_analysis` (optional, default: true): Enable intelligent flow vs subflow analysis
- `validation_level` (optional, default: 'standard'): Level of validation ('basic', 'standard', 'comprehensive')

#### Example
```javascript
{
  "instruction": "Create a flow for iPhone 6 approval workflow with admin tasks and user notifications",
  "deploy_immediately": true,
  "scope_preference": "global",
  "enable_intelligent_analysis": true,
  "validation_level": "comprehensive"
}
```

#### Response
Returns comprehensive flow creation results including:
- Flow details and structure
- Intelligent analysis results
- Deployment status with scope information
- Recommendations and best practices

### `snow_intelligent_flow_analysis`
**INTELLIGENT ANALYSIS** - Performs comprehensive flow vs subflow analysis with decision rationale and recommendations.

#### Parameters
- `instruction` (required): Natural language instruction to analyze
- `include_templates` (optional, default: true): Include template matching analysis
- `include_validation` (optional, default: true): Include validation analysis

#### Example
```javascript
{
  "instruction": "Complex approval workflow with multiple stages and conditions",
  "include_templates": true,
  "include_validation": true
}
```

#### Response
Returns detailed analysis including:
- Decision analysis with confidence scores
- Complexity assessment
- Validation results
- Template matching results
- Subflow opportunities
- Recommendations

### `snow_scope_optimization`
**SCOPE OPTIMIZATION** - Analyzes and recommends optimal deployment scope with fallback strategies.

#### Parameters
- `artifact_type` (required): Type of artifact to analyze
- `artifact_data` (required): Artifact data for analysis
- `environment_type` (optional, default: 'development'): Target environment type

#### Example
```javascript
{
  "artifact_type": "flow",
  "artifact_data": {
    "name": "ApprovalWorkflow",
    "complexity": "high",
    "reusability": "high"
  },
  "environment_type": "production"
}
```

#### Response
Returns scope optimization recommendations including:
- Recommended scope with confidence
- Fallback strategy
- Validation results
- Deployment strategy
- Important considerations

### `snow_template_matching`
**TEMPLATE MATCHING** - Finds and applies best matching flow templates for common patterns.

#### Parameters
- `instruction` (required): Natural language instruction
- `template_categories` (optional): Template categories to search
- `minimum_confidence` (optional, default: 0.6): Minimum confidence threshold

#### Example
```javascript
{
  "instruction": "Approval workflow for catalog requests",
  "template_categories": ["approval", "fulfillment"],
  "minimum_confidence": 0.7
}
```

#### Response
Returns template matching results including:
- Matching templates with confidence scores
- Template features and capabilities
- Confidence breakdowns
- Usage recommendations

### Legacy Tools (Maintained for Backward Compatibility)

#### `snow_analyze_flow_instruction`
Analyzes flow instructions and provides structured insights.

#### `snow_discover_flow_artifacts`
Discovers required artifacts for flow implementation.

#### `snow_preview_flow_structure`
Previews flow structure before deployment.

#### `snow_deploy_composed_flow`
Deploys a previously composed flow with all artifacts.

## Intelligent Features

### 1. Flow vs Subflow Decision Logic

The system automatically analyzes requirements to determine whether to create a main flow or break functionality into subflows based on:

- **Complexity Analysis**: Evaluates the number of steps, conditions, and integrations
- **Reusability Assessment**: Identifies components that could be reused elsewhere
- **Maintainability Considerations**: Factors in long-term maintenance and updates
- **Performance Impact**: Considers execution efficiency and resource usage

#### Decision Criteria
- **Low Complexity + Low Reusability** → Main Flow
- **High Complexity + High Reusability** → Subflow Architecture
- **Medium Complexity** → Hybrid approach with selective subflows

### 2. Global Scope Strategy

Intelligent scope selection based on:

- **Artifact Type**: Different types have different optimal scopes
- **Reusability Level**: Higher reusability favors global scope
- **Compliance Requirements**: Regulatory and security considerations
- **Environment Type**: Development, testing, and production considerations

#### Scope Selection Logic
1. **Global Scope**: Maximum reusability and integration
2. **Application Scope**: Balanced approach with controlled access
3. **Fallback Mechanisms**: Automatic fallback when permissions insufficient

### 3. Template Matching

Advanced pattern recognition for:

- **Approval Workflows**: Standard approval patterns
- **Fulfillment Workflows**: Order processing and delivery
- **Notification Workflows**: Communication and alerting
- **Integration Workflows**: System-to-system communication
- **Utility Workflows**: Common utility functions

#### Matching Algorithm
- **Keyword Analysis**: Identifies relevant terms and phrases
- **Intent Recognition**: Understands the purpose and goals
- **Structure Analysis**: Analyzes required flow structure
- **Context Matching**: Considers ServiceNow context and best practices

### 4. Comprehensive Validation

Multi-level validation system:

- **Syntax Validation**: Ensures proper flow structure
- **Semantic Validation**: Verifies logical consistency
- **Best Practice Validation**: Checks against ServiceNow best practices
- **Performance Validation**: Identifies potential performance issues
- **Security Validation**: Ensures security compliance

#### Validation Levels
- **Basic**: Essential syntax and structure checks
- **Standard**: Comprehensive validation with best practices
- **Comprehensive**: Full validation with performance and security analysis

## Error Handling and Resilience

### Error Categories

1. **Authentication Errors**
   - Token expiration
   - Invalid credentials
   - Permission issues

2. **Network Errors**
   - Connection timeouts
   - ServiceNow instance unavailable
   - API rate limiting

3. **Validation Errors**
   - Invalid input parameters
   - Malformed instructions
   - Missing required data

4. **ServiceNow API Errors**
   - Resource not found
   - Server errors
   - API limitations

### Retry Logic

- **Exponential Backoff**: Intelligent retry with increasing delays
- **Selective Retry**: Only retries on recoverable errors
- **Circuit Breaker**: Prevents cascading failures
- **Fallback Mechanisms**: Graceful degradation when features unavailable

### Error Response Format

```json
{
  "content": [{
    "type": "text",
    "text": "❌ Operation Failed\n\n**Error Details:**\n...\n\n**Troubleshooting Steps:**\n..."
  }]
}
```

## Performance Optimization

### Caching Strategy

- **Artifact Cache**: Caches discovered artifacts for reuse
- **Template Cache**: Caches frequently used templates
- **Analysis Cache**: Caches analysis results for similar instructions
- **Scope Cache**: Caches scope decisions for similar contexts

### Resource Management

- **Connection Pooling**: Efficient ServiceNow API connections
- **Request Batching**: Combines multiple API calls where possible
- **Timeout Management**: Prevents resource exhaustion
- **Memory Optimization**: Efficient memory usage patterns

## Security Features

### Authentication Security

- **OAuth 2.0**: Secure authentication with ServiceNow
- **Token Management**: Secure token storage and refresh
- **Session Security**: Secure session management
- **Credential Protection**: Encrypted credential storage

### Input Validation

- **Parameter Validation**: Comprehensive input validation
- **Injection Prevention**: Prevents various injection attacks
- **Data Sanitization**: Cleans input data before processing
- **Output Encoding**: Ensures safe output formatting

## Deployment Strategies

### Environment-Specific Deployment

- **Development**: Optimized for experimentation and testing
- **Testing**: Focused on validation and quality assurance
- **Production**: Emphasizes stability and performance

### Scope-Based Deployment

- **Global Scope**: Maximum reusability and integration
- **Application Scope**: Controlled access and isolation
- **Hybrid Approach**: Combines global and application scopes

## Best Practices

### Flow Design

1. **Keep It Simple**: Start with simple flows and add complexity gradually
2. **Reusable Components**: Design components for reuse across flows
3. **Error Handling**: Include comprehensive error handling
4. **Documentation**: Document flow purpose and usage
5. **Testing**: Thoroughly test flows before deployment

### Instruction Writing

1. **Be Specific**: Provide clear, detailed instructions
2. **Include Context**: Mention relevant ServiceNow context
3. **Specify Requirements**: Clearly state all requirements
4. **Use Examples**: Include examples where helpful
5. **Mention Constraints**: Specify any limitations or constraints

### Performance Optimization

1. **Efficient Patterns**: Use efficient flow patterns
2. **Minimize Calls**: Reduce unnecessary API calls
3. **Optimize Conditions**: Write efficient condition logic
4. **Cache Results**: Cache frequently used data
5. **Monitor Performance**: Track flow execution metrics

## Troubleshooting Guide

### Common Issues

1. **Authentication Failures**
   - Solution: Re-authenticate with `snow-flow auth login`
   - Check OAuth credentials in .env file

2. **Permission Errors**
   - Solution: Contact ServiceNow administrator
   - Verify Flow Designer role assignment

3. **Network Issues**
   - Solution: Check internet connectivity
   - Verify ServiceNow instance accessibility

4. **Validation Failures**
   - Solution: Review instruction clarity
   - Simplify complex requirements

5. **Deployment Failures**
   - Solution: Check scope permissions
   - Verify deployment prerequisites

### Diagnostic Steps

1. **Check Authentication Status**
   ```bash
   snow-flow auth status
   ```

2. **Verify Connectivity**
   ```bash
   curl -I https://your-instance.service-now.com
   ```

3. **Review Logs**
   - Check application logs for detailed error information
   - Review ServiceNow system logs

4. **Test Basic Functionality**
   - Start with simple instructions
   - Use analysis tools before deployment

## Support and Resources

### Documentation

- [ServiceNow Flow Designer Documentation](https://docs.servicenow.com/bundle/utah-servicenow-platform/page/administer/flow-designer/concept/flow-designer.html)
- [ServiceNow API Documentation](https://docs.servicenow.com/bundle/utah-api-reference/page/integrate/inbound-rest/concept/c_RESTAPI.html)
- [OAuth 2.0 Authentication](https://docs.servicenow.com/bundle/utah-platform-security/page/administer/security/concept/c_OAuthApplications.html)

### Community Resources

- ServiceNow Community Forums
- ServiceNow Developer Portal
- ServiceNow GitHub Repositories

### Getting Help

1. **Check Documentation**: Review this documentation and ServiceNow docs
2. **Search Community**: Search ServiceNow community forums
3. **Contact Support**: Reach out to ServiceNow support
4. **Report Issues**: Report bugs and enhancement requests

## Version History

### v1.0.0 - Initial Release
- Basic flow creation capabilities
- Natural language processing
- ServiceNow API integration

### v1.1.0 - Enhanced Features
- Intelligent artifact discovery
- Template matching system
- Improved error handling

### v1.2.0 - Advanced Intelligence
- Flow vs Subflow decision logic
- Global scope strategy
- Comprehensive validation engine

### v1.3.0 - Integrated Solution
- Complete integration of all features
- Enhanced error handling and resilience
- Backward compatibility assurance
- Comprehensive testing strategy

## Conclusion

The Enhanced Flow Composer MCP represents a significant advancement in ServiceNow flow automation, providing:

- **Intelligent Analysis**: Advanced decision-making capabilities
- **Seamless Integration**: Smooth integration with ServiceNow
- **Comprehensive Validation**: Ensures quality and reliability
- **User-Friendly Interface**: Natural language processing
- **Enterprise-Ready**: Scalable and secure implementation

This integrated solution empowers users to create sophisticated ServiceNow workflows with minimal manual effort while maintaining high quality and adherence to best practices.