import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./pages/HomePage";
import BlogPage from "./pages/BlogPage";
import PostPage from "./pages/PostPage";
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
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<PostPage />} />
            <Route path="/question-papers" element={<QuestionPapersPage />} />
            <Route path="/question-papers/new" element={<QuestionPaperFormPage />} />
            <Route path="/question-papers/:id" element={<QuestionPaperDetailPage />} />
            <Route path="/question-papers/:id/edit" element={<QuestionPaperFormPage />} />
            <Route path="/question-papers/:paperId/questions/new" element={<QuestionFormPage />} />
            <Route path="/question-papers/:paperId/questions/:id/edit" element={<QuestionFormPage />} />
            <Route path="/answer-papers" element={<AnswerPaperListPage />} />
            <Route path="/answer-papers/upload" element={<AnswerPaperUploadPage />} />
            <Route path="/results/:answerPaperId" element={<ResultDetailPage />} />
            <Route path="/performance" element={<PerformanceDashboardPage />} />
            <Route path="/performance/:studentId" element={<PerformanceDashboardPage />} />
            <Route path="/question-papers/:questionPaperId/results" element={<QuestionPaperResultsPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

