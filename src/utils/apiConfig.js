/**
 * Central API resolution utility for LeafSense.
 * 
 * Automatically routes API calls:
 *  - Local Dev (localhost / 127.0.0.1): uses relative '/api/vision/...' proxied by Vite to port 5001.
 *  - Deployed Production (Render / Vercel / Netlify): automatically routes directly to live Python Flask service.
 */
const LIVE_FLASK_URL = 'https://leafsense-vision-ai.onrender.com';

export function getVisionApiUrl(endpoint) {
  const customUrl = import.meta.env.VITE_VISION_API_URL;
  if (customUrl) {
    return `${customUrl.replace(/\/$/, '')}${endpoint}`;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `${LIVE_FLASK_URL}${endpoint}`;
    }
  }
  return endpoint;
}
