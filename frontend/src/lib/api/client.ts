// src/lib/api/client.ts
import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://backend:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour ajouter le token et le tenant
apiClient.interceptors.request.use(
  async (config) => {
    // Ajouter le token
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    // ✅ Ajouter le tenant subdomain
    // Récupérer le tenant depuis la session ou depuis un cookie
    const tenantSubdomain = session?.user?.tenantId || 'demo';
    config.headers['x-tenant-subdomain'] = tenantSubdomain;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour rafraîchir le token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const session = await getSession();
        const refreshToken = session?.refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        await signOut({ callbackUrl: '/login' });
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;