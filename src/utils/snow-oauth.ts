#!/usr/bin/env node
/**
 * ServiceNow OAuth Authentication Utility with Dynamic Port
 * Handles OAuth2 flow for ServiceNow integration
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { createServer } from 'http';
import { URL } from 'url';
import axios from 'axios';
import net from 'net';
import crypto from 'crypto';

export interface ServiceNowAuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

export interface ServiceNowCredentials {
  instance: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

interface OAuthCredentials {
  instance: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class ServiceNowOAuth {
  private credentials?: OAuthCredentials;
  private tokenPath: string;
  private stateParameter?: string;
  private codeVerifier?: string;
  private codeChallenge?: string;

  constructor() {
    // Store tokens in user's home directory
    const configDir = join(process.env.HOME || process.env.USERPROFILE || '', '.snow-flow');
    this.tokenPath = join(configDir, 'auth.json');
  }

  /**
   * Generate a random state parameter for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  private generatePKCE() {
    // Generate code verifier (43-128 characters)
    this.codeVerifier = crypto.randomBytes(32).toString('base64url');
    
    // Generate code challenge (SHA256 hash of verifier)
    const hash = crypto.createHash('sha256');
    hash.update(this.codeVerifier);
    this.codeChallenge = hash.digest('base64url');
  }

  /**
   * Check if a specific port is available
   */
  private async checkPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.on('error', () => {
        resolve(false);
      });
      
      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });
    });
  }


  /**
   * Initialize OAuth flow - opens browser and handles callback
   */
  async authenticate(instance: string, clientId: string, clientSecret: string): Promise<ServiceNowAuthResult> {
    try {
      // Use fixed port 3005 for ServiceNow OAuth
      const port = 3005;
      const redirectUri = `http://localhost:${port}/callback`;
      
      // Check if port is available
      const isPortAvailable = await this.checkPortAvailable(port);
      if (!isPortAvailable) {
        console.error(`❌ Port ${port} is already in use!`);
        console.error(`💡 Please close any application using port ${port} and try again.`);
        return {
          success: false,
          error: `Port ${port} is already in use. Please free up the port and try again.`
        };
      }
      
      // Store credentials temporarily (remove trailing slash from instance)
      this.credentials = {
        instance: instance.replace(/\/$/, ''),
        clientId,
        clientSecret,
        redirectUri
      };

      console.log('🚀 Starting ServiceNow OAuth flow...');
      console.log(`📋 Instance: ${instance}`);
      console.log(`🔐 Client ID: ${clientId}`);
      console.log(`🔗 Redirect URI: ${redirectUri}`);

      // Generate state parameter for CSRF protection
      this.stateParameter = this.generateState();

      // Generate PKCE parameters
      this.generatePKCE();

      // Generate authorization URL
      const authUrl = this.generateAuthUrl(instance, clientId, redirectUri);
      
      console.log('\n🌐 Authorization URL generated:');
      console.log(`${authUrl}\n`);
      
      // Start local server to handle callback
      const authResult = await this.startCallbackServer(redirectUri, port);
      
      if (authResult.success && authResult.accessToken) {
        // Save tokens
        await this.saveTokens({
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken || '',
          expiresIn: authResult.expiresIn || 3600,
          instance: instance.replace(/\/$/, ''),
          clientId,
          clientSecret
        });
        
        console.log('\n✅ Authentication successful!');
        console.log('🔐 Tokens saved securely');
      }
      
      return authResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Authentication failed:', errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate ServiceNow OAuth authorization URL
   */
  private generateAuthUrl(instance: string, clientId: string, redirectUri: string): string {
    const baseUrl = `https://${instance}/oauth_auth.do`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'useraccount admin',
      state: this.stateParameter || '',
      code_challenge: this.codeChallenge || '',
      code_challenge_method: 'S256'
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Start local HTTP server to handle OAuth callback
   */
  private async startCallbackServer(redirectUri: string, port: number): Promise<ServiceNowAuthResult> {
    return new Promise((resolve) => {
      const server = createServer(async (req, res) => {
        try {
          const url = new URL(req.url!, `http://localhost:${port}`);
          
          if (url.pathname === '/callback') {
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');
            const state = url.searchParams.get('state');
            
            // Validate state parameter
            if (state !== this.stateParameter) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>❌ Security Error</h1>
                    <p>Invalid state parameter - possible CSRF attack</p>
                    <p>You can close this window.</p>
                  </body>
                </html>
              `);
              
              server.close();
              resolve({
                success: false,
                error: 'Invalid state parameter'
              });
              return;
            }
            
            if (error) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>❌ OAuth Error</h1>
                    <p>Error: ${error}</p>
                    <p>You can close this window.</p>
                  </body>
                </html>
              `);
              
              server.close();
              resolve({
                success: false,
                error: `OAuth error: ${error}`
              });
              return;
            }
            
            if (!code) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>❌ Missing Authorization Code</h1>
                    <p>No authorization code received.</p>
                    <p>You can close this window.</p>
                  </body>
                </html>
              `);
              
              server.close();
              resolve({
                success: false,
                error: 'No authorization code received'
              });
              return;
            }
            
            // Exchange code for tokens
            console.log('🔄 Exchanging authorization code for tokens...');
            const tokenResult = await this.exchangeCodeForTokens(code);
            
            if (tokenResult.success) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>✅ Authentication Successful!</h1>
                    <p>You can now close this window and return to the terminal.</p>
                    <p>Snow-Flow is now connected to ServiceNow!</p>
                  </body>
                </html>
              `);
              
              server.close();
              resolve(tokenResult);
            } else {
              res.writeHead(500, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body>
                    <h1>❌ Token Exchange Failed</h1>
                    <p>Error: ${tokenResult.error}</p>
                    <p>You can close this window.</p>
                  </body>
                </html>
              `);
              
              server.close();
              resolve(tokenResult);
            }
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          }
        } catch (error) {
          console.error('Callback server error:', error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          
          server.close();
          resolve({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });
      
      server.listen(port, () => {
        console.log(`🌐 OAuth callback server started on http://localhost:${port}`);
        console.log('🚀 Please open the authorization URL in your browser...');
        console.log('⏳ Waiting for OAuth callback...');
        
        // Auto-open browser if possible
        try {
          const { spawn } = require('child_process');
          const authUrl = this.generateAuthUrl(
            this.credentials!.instance,
            this.credentials!.clientId,
            redirectUri
          );
          
          // Try to open browser on macOS
          if (process.platform === 'darwin') {
            spawn('open', [authUrl]);
          } else if (process.platform === 'win32') {
            spawn('cmd', ['/c', 'start', authUrl]);
          } else if (process.platform === 'linux') {
            spawn('xdg-open', [authUrl]);
          } else {
            console.log('Unknown OS:', process.platform);
          }
        } catch (err) {
          console.log('⚠️  Could not auto-open browser. Please open the URL manually.');
        }
      });
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<ServiceNowAuthResult> {
    try {
      const tokenUrl = `https://${this.credentials!.instance}/oauth_token.do`;
      
      const response = await axios.post(tokenUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.credentials!.clientId,
        client_secret: this.credentials!.clientSecret,
        redirect_uri: this.credentials!.redirectUri,
        code_verifier: this.codeVerifier || ''
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const data = response.data;
      
      if (data.access_token) {
        return {
          success: true,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in
        };
      } else {
        return {
          success: false,
          error: 'No access token received'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Token exchange error:', errorMessage);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Save tokens to file
   */
  private async saveTokens(tokenData: any): Promise<void> {
    try {
      const configDir = join(process.env.HOME || process.env.USERPROFILE || '', '.snow-flow');
      await fs.mkdir(configDir, { recursive: true });
      
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expiresIn);
      
      const authData = {
        ...tokenData,
        expiresAt: expiresAt.toISOString()
      };
      
      await fs.writeFile(this.tokenPath, JSON.stringify(authData, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw error;
    }
  }

  /**
   * Load tokens from file
   */
  async loadTokens(): Promise<any> {
    try {
      const data = await fs.readFile(this.tokenPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const tokens = await this.loadTokens();
      if (!tokens) return false;
      
      // Check if token is expired
      const expiresAt = new Date(tokens.expiresAt);
      const now = new Date();
      
      return now < expiresAt;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get access token (refresh if needed)
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const tokens = await this.loadTokens();
      if (!tokens) return null;
      
      // Check if token is expired
      const expiresAt = new Date(tokens.expiresAt);
      const now = new Date();
      
      if (now >= expiresAt && tokens.refreshToken) {
        // Token expired, try to refresh
        console.log('🔄 Token expired, refreshing...');
        const refreshResult = await this.refreshAccessToken(tokens);
        
        if (refreshResult.success && refreshResult.accessToken) {
          // Update saved tokens
          await this.saveTokens({
            ...tokens,
            accessToken: refreshResult.accessToken,
            expiresIn: refreshResult.expiresIn || 3600
          });
          
          return refreshResult.accessToken;
        } else {
          console.error('❌ Token refresh failed:', refreshResult.error);
          return null;
        }
      }
      
      return tokens.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   */
  public async refreshAccessToken(tokens?: any): Promise<ServiceNowAuthResult> {
    try {
      // If no tokens provided, load from file
      if (!tokens) {
        tokens = await this.loadTokens();
        if (!tokens) {
          return {
            success: false,
            error: 'No tokens found to refresh'
          };
        }
      }
      
      const tokenUrl = `https://${tokens.instance}/oauth_token.do`;
      
      const response = await axios.post(tokenUrl, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: tokens.clientId,
        client_secret: tokens.clientSecret
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const data = response.data;
      
      if (data.access_token) {
        // Update saved tokens
        await this.saveTokens({
          ...tokens,
          accessToken: data.access_token,
          expiresIn: data.expires_in || 3600
        });
        
        return {
          success: true,
          accessToken: data.access_token,
          expiresIn: data.expires_in
        };
      } else {
        return {
          success: false,
          error: 'No access token received'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Logout - clear saved tokens
   */
  async logout(): Promise<void> {
    try {
      await fs.unlink(this.tokenPath);
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.log('No active session to logout from');
    }
  }

  /**
   * Load credentials (including tokens)
   */
  async loadCredentials(): Promise<ServiceNowCredentials | null> {
    try {
      const tokens = await this.loadTokens();
      if (!tokens) return null;
      
      return {
        instance: tokens.instance,
        clientId: tokens.clientId,
        clientSecret: tokens.clientSecret,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      };
    } catch (error) {
      return null;
    }
  }
}