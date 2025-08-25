import { Command } from 'commander';
import chalk from 'chalk';
import { ServiceNowOAuth } from '../utils/snow-oauth.js';
import { ServiceNowClient } from '../utils/servicenow-client.js';
import { Logger } from '../utils/logger.js';

const authLogger = new Logger('auth');

export function registerAuthCommands(program: Command) {
  const auth = program.command('auth').description('ServiceNow authentication management');

  auth
    .command('login')
    .description('Login to ServiceNow using OAuth 2.0')
    .option('--instance <instance>', 'ServiceNow instance (e.g., dev12345.service-now.com)')
    .option('--client-id <clientId>', 'OAuth Client ID')
    .option('--client-secret <clientSecret>', 'OAuth Client Secret')
    .action(async (options) => {
      const oauth = new ServiceNowOAuth();
      
      authLogger.info('🔑 Starting ServiceNow OAuth authentication...');
      
      // Get credentials from options or environment
      const instance = options.instance || process.env.SNOW_INSTANCE;
      const clientId = options.clientId || process.env.SNOW_CLIENT_ID;
      const clientSecret = options.clientSecret || process.env.SNOW_CLIENT_SECRET;
      
      if (!instance || !clientId || !clientSecret) {
        console.error('❌ Missing required OAuth credentials');
        authLogger.info('\n📝 Please provide:');
        authLogger.info('   --instance: ServiceNow instance (e.g., dev12345.service-now.com)');
        authLogger.info('   --client-id: OAuth Client ID');
        authLogger.info('   --client-secret: OAuth Client Secret');
        authLogger.info('\n💡 Or set environment variables:');
        authLogger.info('   export SNOW_INSTANCE=your-instance.service-now.com');
        authLogger.info('   export SNOW_CLIENT_ID=your-client-id');
        authLogger.info('   export SNOW_CLIENT_SECRET=your-client-secret');
        return;
      }
      
      // Start OAuth flow
      const result = await oauth.authenticate(instance, clientId, clientSecret);
      
      if (result.success) {
        authLogger.info('\n✅ Authentication successful!');
        authLogger.info('🎉 Snow-Flow is now connected to ServiceNow!');
        authLogger.info('\n📋 Next steps:');
        authLogger.info('   1. Test connection: snow-flow auth status');
        authLogger.info('   2. Start development: snow-flow swarm "create a widget for incident management"');
        
        // Test connection
        const client = new ServiceNowClient();
        const testResult = await client.testConnection();
        if (testResult.success) {
          authLogger.info(`\n🔍 Connection test successful!`);
          authLogger.info(`👤 Logged in as: ${testResult.data.name} (${testResult.data.user_name})`);
        }
      } else {
        console.error(`\n❌ Authentication failed: ${result.error}`);
        process.exit(1);
      }
    });

  auth
    .command('logout')
    .description('Logout from ServiceNow')
    .action(async () => {
      const oauth = new ServiceNowOAuth();
      authLogger.info('🔓 Logging out from ServiceNow...');
      await oauth.logout();
      authLogger.info('✅ Logged out successfully');
    });

  auth
    .command('status')
    .description('Show ServiceNow authentication status')
    .action(async () => {
      const oauth = new ServiceNowOAuth();
      authLogger.info('📊 ServiceNow Authentication Status:');
      
      const isAuthenticated = await oauth.isAuthenticated();
      const credentials = await oauth.loadCredentials();
      
      if (isAuthenticated && credentials) {
        console.log('   ├── Status: ✅ Authenticated');
        console.log(`   ├── Instance: ${credentials.instance}`);
        console.log('   ├── Method: OAuth 2.0');
        console.log(`   ├── Client ID: ${credentials.clientId}`);
        
        if (credentials.expiresAt) {
          const expiresAt = new Date(credentials.expiresAt);
          console.log(`   └── Token expires: ${expiresAt.toLocaleString()}`);
        }
        
        // Test connection
        const client = new ServiceNowClient();
        const testResult = await client.testConnection();
        if (testResult.success) {
          console.log(`\n🔍 Connection test: ✅ Success`);
          if (testResult.data.message) {
            console.log(`   ${testResult.data.message}`);
          }
          console.log(`🌐 Instance: ${testResult.data.email || credentials.instance}`);
        } else {
          console.log(`\n🔍 Connection test: ❌ Failed`);
          console.log(`   Error: ${testResult.error}`);
        }
      } else {
        console.log('   ├── Status: ❌ Not authenticated');
        console.log('   ├── Instance: Not configured');
        console.log('   └── Method: Not set');
        console.log('\n💡 Run "snow-flow auth login" to authenticate');
      }
    });
}