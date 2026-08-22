import { useState, useEffect } from 'react';

export default function useAdminGuard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = () => {
      const token = localStorage.getItem('vnz_admin_token');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Handle case where token was saved as the string "undefined"
        if (token === 'undefined') throw new Error('Token is literally "undefined"');

        // Decode JWT payload using atob (handle base64url format)
        let payloadBase64 = token.split('.')[1];
        if (!payloadBase64) throw new Error('Token has no payload section');

        payloadBase64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        while (payloadBase64.length % 4) {
          payloadBase64 += '=';
        }
        const decodedPayload = JSON.parse(atob(payloadBase64));
        
        const isExpired = decodedPayload.exp < Date.now() / 1000;
        
        if (isExpired) {
          localStorage.removeItem('vnz_admin_token');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('useAdminGuard Error:', err);
        alert('Security guard error: ' + err.message);
        localStorage.removeItem('vnz_admin_token');
        setIsAuthenticated(false);
      }
      
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  return { isAuthenticated, isLoading };
}
