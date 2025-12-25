import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

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

