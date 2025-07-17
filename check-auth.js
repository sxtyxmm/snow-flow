const { ServiceNowOAuth } = require('./dist/utils/snow-oauth.js');

async function checkAuth() {
  const oauth = new ServiceNowOAuth();
  
  try {
    const isAuth = await oauth.isAuthenticated();
    console.log('Authenticated:', isAuth);
    
    if (isAuth) {
      const creds = await oauth.loadCredentials();
      console.log('Credentials loaded:', !!creds);
      if (creds) {
        console.log('Instance:', creds.instance);
        console.log('Client ID:', creds.clientId);
        console.log('Has Access Token:', !!creds.accessToken);
      }
    } else {
      console.log('Not authenticated. Run: snow-flow auth login');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAuth();