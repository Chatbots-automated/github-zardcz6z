import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../services/googleAuth';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code received');
        }

        const tokens = await getAccessToken(code);
        
        // Store tokens securely
        localStorage.setItem('googleAccessToken', tokens.access_token);
        localStorage.setItem('googleRefreshToken', tokens.refresh_token);
        localStorage.setItem('tokenExpiry', (Date.now() + (tokens.expires_in * 1000)).toString());

        // Redirect back to booking page
        navigate('/booking');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to authenticate');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-elida-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/booking')}
            className="w-full py-3 bg-elida-gold text-white rounded-lg hover:bg-elida-accent transition-colors"
          >
            Return to Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-elida-cream flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-elida-gold mx-auto mb-4" />
        <p className="text-gray-600">Authenticating with Google Calendar...</p>
      </div>
    </div>
  );
}