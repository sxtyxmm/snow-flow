# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Snow-flow seriously. If you discover a security vulnerability, please follow these steps:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [maintainer email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline
- Initial response: Within 48 hours
- Status update: Within 5 business days
- Fix timeline: Depends on severity

## Security Best Practices

### API Keys
- Never commit API keys to the repository
- Always use environment variables
- Rotate keys regularly
- Use OAuth2 when possible

### ServiceNow Credentials
- Use OAuth2 authentication in production
- Never hardcode credentials
- Implement least privilege principle
- Use service accounts, not personal accounts

### Data Protection
- All communication with ServiceNow uses HTTPS
- Credentials are never logged
- Sensitive data is not stored locally
- Memory is cleared after use

### Dependencies
- Regular dependency updates
- Security audits via `npm audit`
- Only trusted packages are used
- Lock files are committed

## Known Security Considerations

1. **Claude AI API**: All code generation happens via secure API calls
2. **ServiceNow API**: Uses official REST APIs with authentication
3. **Local Storage**: No sensitive data is persisted locally
4. **Logging**: Sensitive information is filtered from logs

## Compliance

This project follows:
- OWASP security guidelines
- Node.js security best practices
- ServiceNow platform security standards

## Contact

For security concerns, please contact the maintainers directly rather than using public channels.