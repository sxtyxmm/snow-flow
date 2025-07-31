# ServiceNow OAuth Setup Guide for Snow-Flow

## Prerequisites
- ServiceNow instance with admin access
- OAuth plugin activated (com.snc.platform.security.oauth)

## Step 1: Create OAuth Application in ServiceNow

1. **Login** to your ServiceNow instance as an administrator

2. **Navigate** to: **System OAuth > Application Registry**

3. **Click** "New" to create a new OAuth application

4. **Select** "Create an OAuth API endpoint for external clients"

5. **Configure** the application with these settings:

   | Field | Value |
   |-------|-------|
   | Name | Snow-Flow OAuth Client |
   | Client ID | (auto-generated - copy this) |
   | Client Secret | (click lock icon to view - copy this) |
   | Redirect URL | See below for multiple URLs |
   | Token lifespan | 3600 |
   | Refresh token lifespan | 7776000 |
   | Type | Confidential |
   | Active | true |

6. **Add Multiple Redirect URLs** (for port flexibility):
   ```
   http://localhost:3000/callback
   http://localhost:3001/callback
   http://localhost:3002/callback
   http://localhost:3003/callback
   http://localhost:3004/callback
   http://localhost:3005/callback
   ```

7. **Grant Types** - Ensure these are selected:
   - ✅ Authorization Code
   - ✅ Refresh Token

8. **Save** the application

## Step 2: Configure Snow-Flow

1. **Update** your `.env` file with the OAuth credentials:
   ```env
   # ServiceNow OAuth Configuration
   SNOW_INSTANCE=your-instance.service-now.com
   SNOW_CLIENT_ID=your-client-id-from-registry
   SNOW_CLIENT_SECRET=your-client-secret-from-registry
   ```

2. **Test** the authentication:
   ```bash
   snow-flow auth login
   ```

## Step 3: User Permissions

Ensure your ServiceNow user has appropriate permissions:

1. **Roles needed for your ServiceNow user**:
   - `rest_api_explorer` - For API access
   - `sp_admin` - **Required** for Service Portal widget deployment with server scripts
   - `admin` - Alternative to sp_admin, provides broader system access

2. **OAuth Scopes** (handled automatically by Snow-Flow):
   - `useraccount` - Basic user information and read access
   - `admin` - Required for widget server script deployment and table modifications
   
   ⚠️ **Important**: The `admin` scope is required for deploying widgets with server scripts. Without this scope, server scripts will be cleared during deployment due to insufficient permissions.

## Troubleshooting

### "Missing redirect URL in application registration"
- Ensure the redirect URLs are added exactly as shown above
- URLs are case-sensitive and must match exactly
- Include the port number and `/callback` path

### "Invalid client credentials"
- Double-check the Client ID and Client Secret
- Ensure the OAuth application is set to "Active"
- Client secret may have special characters - copy carefully

### "Port already in use"
- Snow-Flow automatically tries ports 3000-3005
- Ensure these ports are included in your redirect URLs
- Close any applications using these ports

### "State parameter missing"
- This is handled automatically by Snow-Flow
- If you see this error, ensure you're using the latest version

### "Widget server script is empty after deployment"
- This indicates insufficient OAuth permissions
- Ensure your ServiceNow user has `sp_admin` role for Service Portal administration
- The OAuth application must request `admin` scope (handled automatically)
- Re-authenticate after updating permissions: `snow-flow auth logout` → `snow-flow auth login`

## Security Best Practices

1. **Never commit** your `.env` file to version control
2. **Rotate** client secrets periodically
3. **Use HTTPS** in production environments
4. **Limit** OAuth scopes to minimum required
5. **Monitor** OAuth application usage in ServiceNow

## Additional Configuration

### Custom OAuth Endpoints
If your instance uses custom OAuth endpoints, update the URLs in the code:
- Authorization: `/oauth_auth.do`
- Token: `/oauth_token.do`

### Proxy Support
If behind a corporate proxy, set environment variables:
```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

## Next Steps

Once authentication is working:
1. Run `snow-flow auth status` to verify connection
2. Start developing with `snow-flow swarm "your task"`
3. Use MCP server for direct API access: `snow-flow mcp`

---

For more help, see the [Snow-Flow documentation](./README.md) or run `snow-flow help`.