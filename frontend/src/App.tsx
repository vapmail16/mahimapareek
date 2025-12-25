import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import BlogPage from "./pages/BlogPage";
import PostPage from "./pages/PostPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import QuestionPapersPage from "./pages/QuestionPapersPage";
import QuestionPaperFormPage from "./pages/QuestionPaperFormPage";
import QuestionPaperDetailPage from "./pages/QuestionPaperDetailPage";
import QuestionFormPage from "./pages/QuestionFormPage";
import AnswerPaperUploadPage from "./pages/AnswerPaperUploadPage";
import AnswerPaperListPage from "./pages/AnswerPaperListPage";
import ResultDetailPage from "./pages/ResultDetailPage";
import PerformanceDashboardPage from "./pages/PerformanceDashboardPage";
import QuestionPaperResultsPage from "./pages/QuestionPaperResultsPage";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<PostPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/question-papers"
                element={
                  <ProtectedRoute>
                    <QuestionPapersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/question-papers/new"
                element={
                  <ProtectedRoute>
                    <QuestionPaperFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/question-papers/:id"
                element={
                  <ProtectedRoute>
                    <QuestionPaperDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/question-papers/:id/edit"
                element={
                  <ProtectedRoute>
                    <QuestionPaperFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/question-papers/:paperId/questions/new"
                element={
                  <ProtectedRoute>
                    <QuestionFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/question-papers/:paperId/questions/:id/edit"
                element={
                  <ProtectedRoute>
                    <QuestionFormPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/answer-papers"
                element={
                  <ProtectedRoute>
                    <AnswerPaperListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/answer-papers/upload"
                element={
                  <ProtectedRoute>
                    <AnswerPaperUploadPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results/:answerPaperId"
                element={
                  <ProtectedRoute>
                    <ResultDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/performance"
                element={
                  <ProtectedRoute>
                    <PerformanceDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/performance/:studentId"
                element={
                  <ProtectedRoute>
                    <PerformanceDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/question-papers/:questionPaperId/results"
                element={
                  <ProtectedRoute>
                    <QuestionPaperResultsPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

