import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import QuestionPaperDetailPage from '../QuestionPaperDetailPage';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  questionPapersApi: {
    getById: vi.fn(),
  },
  questionsApi: {
    getByPaper: vi.fn(),
    delete: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/question-papers/1']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('QuestionPaperDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    vi.mocked(api.questionPapersApi.getById).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<QuestionPaperDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading question paper/i)).toBeInTheDocument();
  });

  it('should display question paper details', async () => {
    const mockPaper = {
      id: '1',
      title: 'Math Test',
      subject: 'Mathematics',
      totalMarks: 100,
      status: 'PUBLISHED',
      description: 'Test description',
    };

    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);
    vi.mocked(api.questionsApi.getByPaper).mockResolvedValue([]);

    render(<QuestionPaperDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Math Test')).toBeInTheDocument();
      expect(screen.getByText(/mathematics/i)).toBeInTheDocument();
      expect(screen.getByText(/total marks: 100/i)).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });
  });

  it('should display questions when available', async () => {
    const mockPaper = {
      id: '1',
      title: 'Test Paper',
      totalMarks: 100,
      status: 'PUBLISHED',
    };

    const mockQuestions = [
      {
        id: 'q1',
        questionNumber: 1,
        questionText: 'What is 2+2?',
        questionType: 'MCQ',
        marks: 10,
        correctAnswer: '4',
      },
      {
        id: 'q2',
        questionNumber: 2,
        questionText: 'What is the capital of France?',
        questionType: 'SHORT_ANSWER',
        marks: 5,
        correctAnswer: 'Paris',
      },
    ];

    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);
    vi.mocked(api.questionsApi.getByPaper).mockResolvedValue(mockQuestions);

    render(<QuestionPaperDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
      expect(screen.getByText(/10 marks/i)).toBeInTheDocument();
      expect(screen.getByText(/5 marks/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no questions exist', async () => {
    const mockPaper = {
      id: '1',
      title: 'Test Paper',
      totalMarks: 100,
      status: 'PUBLISHED',
    };

    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);
    vi.mocked(api.questionsApi.getByPaper).mockResolvedValue([]);

    render(<QuestionPaperDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no questions added yet/i)).toBeInTheDocument();
      expect(screen.getByText(/add first question/i)).toBeInTheDocument();
    });
  });

  it('should display not found message when paper does not exist', async () => {
    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(null as any);

    render(<QuestionPaperDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/question paper not found/i)).toBeInTheDocument();
      expect(screen.getByText(/back to papers/i)).toBeInTheDocument();
    });
  });
});

