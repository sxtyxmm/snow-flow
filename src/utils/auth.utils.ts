import axios from 'axios';
import { ServiceNowStudioConfig } from '../types/servicenow-studio.types';
import logger from './logger';

export class AuthUtils {
  private static accessToken: string | null = null;
  private static tokenExpiry: number | null = null;

  static async getAuthHeaders(config: ServiceNowStudioConfig): Promise<Record<string, string>> {
    if (config.clientId && config.clientSecret) {
      const token = await this.getOAuthToken(config);
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
    }

    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private static async getOAuthToken(config: ServiceNowStudioConfig): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const baseUrl = config.instanceUrl.replace(/\/+$/, '');
      const tokenUrl = `${baseUrl}/oauth_token.do`;
      const response = await axios.post(tokenUrl, new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.clientId!,
        client_secret: config.clientSecret!
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      logger.info('OAuth token obtained successfully');
      return this.accessToken || '';
    } catch (error) {
      logger.error('Failed to obtain OAuth token', error);
      throw new Error('Authentication failed');
    }
  }

  static clearToken(): void {
    this.accessToken = null;
    this.tokenExpiry = null;
  }
}