import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const ACCESS_TOKEN_KEY  = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Save tokens after OAuth callback
export const saveTokens = (access, refresh) => {
  Cookies.set(ACCESS_TOKEN_KEY,  access,  { expires: 1 });  // 1 day
  Cookies.set(REFRESH_TOKEN_KEY, refresh, { expires: 7 });  // 7 days
};

// Read tokens
export const getAccessToken  = () => Cookies.get(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => Cookies.get(REFRESH_TOKEN_KEY);

// Remove tokens on logout
export const clearTokens = () => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

// Check if user is logged in
export const isAuthenticated = () => {
  const token = getAccessToken();
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    // Check token hasn't expired
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Decode token to get user_id
export const getTokenPayload = () => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
};