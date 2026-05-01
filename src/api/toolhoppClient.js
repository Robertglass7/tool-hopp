import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Add interceptor to include token in headers
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('toolhopp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const toolhopp = {
  entities: {
    Tool: {
      list: async () => {
        const response = await apiClient.get('/tools');
        return response.data;
      },
      get: async (id) => {
        const response = await apiClient.get(`/tools/${id}`);
        return response.data;
      },
      create: async (data) => {
        const response = await apiClient.post('/tools', data);
        return response.data;
      },
      update: async (id, data) => {
        const response = await apiClient.patch(`/tools/${id}`, data);
        return response.data;
      }
    },
    Booking: {
      list: async () => {
        const response = await apiClient.get('/bookings');
        return response.data;
      },
      create: async (data) => {
        const response = await apiClient.post('/bookings', data);
        return response.data;
      },
      update: async (id, data) => {
        const response = await apiClient.patch(`/bookings/${id}`, data);
        return response.data;
      }
    },
    Message: {
      list: async () => {
        const response = await apiClient.get('/messages');
        return response.data;
      },
      create: async (data) => {
        const response = await apiClient.post('/messages', data);
        return response.data;
      }
    },
    Hopper: {
      filter: async () => {
        try {
          const response = await apiClient.get('/hopper/profile');
          return [response.data];
        } catch (e) {
          return [];
        }
      }
    },
    HopperTask: {
      filter: async () => {
        const response = await apiClient.get('/hopper/tasks');
        return response.data;
      }
    },
    EscrowAccount: {
      filter: async () => Promise.resolve([])
    },
    OwnerSubscription: {
      filter: async () => Promise.resolve([])
    },
    RenterSubscription: {
      filter: async () => Promise.resolve([])
    },
    User: {
      me: async () => {
        const response = await apiClient.get('/me');
        return response.data;
      }
    }
  },
  auth: {
    signup: async (data) => {
      const response = await apiClient.post('/auth/signup', data);
      if (response.data.token) {
        localStorage.setItem('toolhopp_token', response.data.token);
      }
      return response.data;
    },
    login: async (data) => {
      const response = await apiClient.post('/auth/login', data);
      if (response.data.token) {
        localStorage.setItem('toolhopp_token', response.data.token);
      }
      return response.data;
    },
    me: async () => {
      const response = await apiClient.get('/me');
      return response.data;
    },
    updateMe: async (data) => {
      const response = await apiClient.patch('/me', data);
      return response.data;
    },
    logout: () => {
      localStorage.removeItem('toolhopp_token');
      window.location.href = '/';
    },
    deleteAccount: async () => {
      const response = await apiClient.delete('/me');
      return response.data;
    },
    report: async (data) => {
      const response = await apiClient.post('/reports', data);
      return response.data;
    }
  },
  ai: {
    ask: async (prompt) => {
      const response = await apiClient.post('/ai/ask', { prompt });
      return response.data.response;
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      }
    }
  }
};
