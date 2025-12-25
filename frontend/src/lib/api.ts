import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add Authorization header with accessToken
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 (unauthorized) - try to refresh token
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || 
                           originalRequest?.url?.includes('/auth/register') ||
                           originalRequest?.url?.includes('/auth/me') ||
                           originalRequest?.url?.includes('/auth/refresh');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token using cookie
        const refreshResponse = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Backend returns { success: true, data: { accessToken } }
        const newToken = refreshResponse.data.data?.accessToken;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear token and redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // For other errors, redirect to login if 401
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API types
export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  createdAt?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  data: User;
}

export interface MeResponse {
  success: boolean;
  data: User;
}

export interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

// Auth API endpoints
export const authApi = {
  /**
   * Register a new user
   * Backend returns { success: true, data: user }
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   * Backend returns { success: true, data: { user, accessToken } }
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Logout user
   * Clears refresh token cookie on backend
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /**
   * Get current user
   */
  getMe: async (): Promise<MeResponse> => {
    const response = await api.get<MeResponse>('/auth/me');
    return response.data;
  },

  /**
   * Refresh access token
   * Uses refresh token from HTTP-only cookie
   * Backend returns { success: true, data: { accessToken } }
   */
  refreshToken: async (): Promise<RefreshResponse> => {
    const response = await api.post<RefreshResponse>('/auth/refresh', {});
    return response.data;
  },
};

// API endpoints
export const categoriesApi = {
  getAll: () => api.get("/categories").then((res) => res.data.data),
  getBySlug: (slug: string) =>
    api.get(`/categories/${slug}`).then((res) => res.data.data),
};

export const postsApi = {
  getAll: (params?: { status?: string; categoryId?: string; authorId?: string }) =>
    api.get("/posts", { params }).then((res) => res.data.data),
  getBySlug: (slug: string) =>
    api.get(`/posts/${slug}`).then((res) => res.data.data),
};

export const questionPapersApi = {
  getAll: (params?: { educatorId?: string; status?: string }) =>
    api.get("/question-papers", { params }).then((res) => res.data.data),
  getById: (id: string) =>
    api.get(`/question-papers/${id}`).then((res) => res.data.data),
  create: (data: any) =>
    api.post("/question-papers", data).then((res) => res.data.data),
  update: (id: string, data: any) =>
    api.put(`/question-papers/${id}`, data).then((res) => res.data.data),
  delete: (id: string) =>
    api.delete(`/question-papers/${id}`).then((res) => res.data),
};

export const questionsApi = {
  getByPaper: (paperId: string) =>
    api.get(`/questions/paper/${paperId}`).then((res) => res.data.data),
  getById: (id: string) =>
    api.get(`/questions/${id}`).then((res) => res.data.data),
  create: (paperId: string, data: any) =>
    api.post(`/questions/paper/${paperId}`, data).then((res) => res.data.data),
  update: (id: string, data: any) =>
    api.put(`/questions/${id}`, data).then((res) => res.data.data),
  delete: (id: string) =>
    api.delete(`/questions/${id}`).then((res) => res.data),
};

export const answerPapersApi = {
  getAll: (params?: { studentId?: string; questionPaperId?: string; status?: string }) =>
    api.get("/answer-papers", { params }).then((res) => res.data.data),
  getById: (id: string) =>
    api.get(`/answer-papers/${id}`).then((res) => res.data.data),
  create: (data: any) =>
    api.post("/answer-papers", data).then((res) => res.data.data),
  uploadFile: (answerPaperId: string, file: File) => {
    const formData = new FormData();
    formData.append("files", file);
    return api.post(`/answer-papers/${answerPaperId}/files`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((res) => res.data.data);
  },
  getFiles: (answerPaperId: string) =>
    api.get(`/answer-papers/${answerPaperId}/files`).then((res) => res.data.data),
  deleteFile: (answerPaperId: string, fileId: string) =>
    api.delete(`/answer-papers/${answerPaperId}/files/${fileId}`).then((res) => res.data),
};

export const resultsApi = {
  getResult: (answerPaperId: string) =>
    api.get(`/results/${answerPaperId}`).then((res) => res.data.data),
  getStudentResults: (studentId: string) =>
    api.get(`/results/student/${studentId}`).then((res) => res.data.data),
  getQuestionPaperResults: (questionPaperId: string) =>
    api.get(`/results/question-paper/${questionPaperId}`).then((res) => res.data.data),
  getPerformanceSummary: (studentId: string) =>
    api.get(`/results/student/${studentId}/summary`).then((res) => res.data.data),
  getGradeDistribution: (questionPaperId: string) =>
    api.get(`/results/question-paper/${questionPaperId}/distribution`).then((res) => res.data.data),
  exportCSV: (answerPaperId: string) =>
    api.get(`/results/${answerPaperId}/export/csv`, { responseType: "blob" }),
  exportQuestionPaperCSV: (questionPaperId: string) =>
    api.get(`/results/question-paper/${questionPaperId}/export/csv`, { responseType: "blob" }),
};

