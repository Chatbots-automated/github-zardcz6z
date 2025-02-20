const CLIENT_ID = '349983539029-5b79151i7jki1fn43rf4te7bvi3ndd58.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

export const getAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const getAccessToken = async (authCode: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: authCode,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OAuth Error:', data);
      throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

export const refreshAccessToken = async (refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OAuth Error:', data);
      throw new Error(`Failed to refresh token: ${JSON.stringify(data)}`);
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
};