# Security Policy

## Supported Versions

We actively maintain security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.4.x   | :x:                |
| < 1.4   | :x:                |

## Reporting a Vulnerability

The Snow-Flow team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings.

### Please DO NOT:
- Create public GitHub issues for security vulnerabilities
- Discuss security issues in public forums
- Share vulnerabilities on social media

### Please DO:
1. **Email us directly** at: `security@groeimetai.com`
2. **Include the following information:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Snow-Flow version affected
   - Your contact information (optional)

### What to expect:
- **24 hours**: Acknowledgment of your report
- **5 business days**: Initial assessment and severity classification
- **30 days**: Resolution or status update

## Security Considerations

### OAuth Credentials
- Store OAuth credentials securely in `.env` files
- Never commit credentials to version control
- Use environment variables in production
- Rotate credentials regularly

### ServiceNow Integration
- Snow-Flow uses OAuth 2.0 for secure authentication
- All API calls use HTTPS encryption
- Credentials are stored locally, never transmitted to third parties
- Session tokens have configurable expiration

### Data Privacy
- Snow-Flow processes ServiceNow data locally
- No data is sent to external services (except ServiceNow)
- Memory storage is local to your system
- Logs may contain sanitized request/response data

### Network Security
- All ServiceNow communication uses HTTPS
- Certificate validation is enforced
- No external network requests beyond ServiceNow APIs

## Best Practices

### For Users:
1. **Keep Snow-Flow updated** to the latest version
2. **Use OAuth authentication** (not basic auth)
3. **Set appropriate timeouts** in production
4. **Monitor logs** for suspicious activity
5. **Limit ServiceNow user permissions** to minimum required

### For Contributors:
1. **Follow secure coding practices**
2. **Validate all inputs** from ServiceNow APIs
3. **Use parameterized queries** for database operations
4. **Sanitize log outputs** to prevent credential leakage
5. **Review dependencies** for known vulnerabilities

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported via security@groeimetai.com
2. **Day 1**: Acknowledgment sent to reporter
3. **Day 5**: Initial assessment completed
4. **Day 30**: Fix developed and tested
5. **Day 35**: Security release published
6. **Day 42**: Public disclosure (after user notification)

## Security Updates

Security releases follow this format:
- **Critical**: Immediate patch release (e.g., 2.0.3)
- **High**: Weekly patch release
- **Medium**: Monthly minor release
- **Low**: Next major release

## Hall of Fame

We recognize security researchers who help improve Snow-Flow:

*No submissions yet - be the first!*

---

**Thank you for helping keep Snow-Flow and our community safe!**