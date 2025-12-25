import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ResultDetailPage from '../ResultDetailPage';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  resultsApi: {
    getResult: vi.fn(),
    exportCSV: vi.fn(),
  },
}));

// Mock useParams
const mockUseParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/results/1']}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ResultDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ answerPaperId: '1' });
  });

  it('should display loading state initially', () => {
    vi.mocked(api.resultsApi.getResult).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ResultDetailPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display result summary with total marks and percentage', async () => {
    const mockResult = {
      answerPaper: {
        id: '1',
        questionPaper: { title: 'Math Test' },
        status: 'GRADED',
      },
      totalMarksObtained: 85,
      totalMarks: 100,
      percentage: 85,
      grade: 'A',
      questionBreakdown: [],
    };

    vi.mocked(api.resultsApi.getResult).mockResolvedValue(mockResult);

    render(<ResultDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.resultsApi.getResult).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByText(/85 \/ 100/i)).toBeInTheDocument();
      // Percentage is displayed as "85.0%" due to toFixed(1)
      expect(screen.getByText('85.0%')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  it('should display question breakdown', async () => {
    const mockResult = {
      answerPaper: {
        id: '1',
        questionPaper: { title: 'Math Test' },
        status: 'GRADED',
      },
      totalMarksObtained: 50,
      totalMarks: 100,
      percentage: 50,
      grade: 'C',
      questionBreakdown: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'What is 2+2?',
          marks: 50,
          marksObtained: 50,
          isCorrect: true,
          feedback: 'Correct answer',
        },
        {
          questionId: 'q2',
          questionNumber: 2,
          questionText: 'What is 3+3?',
          marks: 50,
          marksObtained: 0,
          isCorrect: false,
          feedback: 'Incorrect answer',
        },
      ],
    };

    vi.mocked(api.resultsApi.getResult).mockResolvedValue(mockResult);

    render(<ResultDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.resultsApi.getResult).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
      expect(screen.getByText('What is 3+3?')).toBeInTheDocument();
    });

    // Check marks - there might be multiple instances
    const marks50 = screen.getAllByText(/50 \/ 50/i);
    expect(marks50.length).toBeGreaterThan(0);
    const marks0 = screen.getAllByText(/0 \/ 50/i);
    expect(marks0.length).toBeGreaterThan(0);
  });

  it('should display feedback for each question', async () => {
    const mockResult = {
      answerPaper: {
        id: '1',
        questionPaper: { title: 'Math Test' },
        status: 'GRADED',
      },
      totalMarksObtained: 50,
      totalMarks: 100,
      percentage: 50,
      grade: 'C',
      questionBreakdown: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'What is 2+2?',
          marks: 50,
          marksObtained: 50,
          feedback: 'Excellent work!',
        },
      ],
    };

    vi.mocked(api.resultsApi.getResult).mockResolvedValue(mockResult);

    render(<ResultDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.resultsApi.getResult).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByText('Excellent work!')).toBeInTheDocument();
    });
  });

  it('should display similarity score for long answer questions', async () => {
    const mockResult = {
      answerPaper: {
        id: '1',
        questionPaper: { title: 'Math Test' },
        status: 'GRADED',
      },
      totalMarksObtained: 75,
      totalMarks: 100,
      percentage: 75,
      grade: 'B',
      questionBreakdown: [
        {
          questionId: 'q1',
          questionNumber: 1,
          questionText: 'Explain the concept',
          marks: 100,
          marksObtained: 75,
          similarityScore: 85,
          feedback: 'Good explanation',
        },
      ],
    };

    vi.mocked(api.resultsApi.getResult).mockResolvedValue(mockResult);

    render(<ResultDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.resultsApi.getResult).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      // Similarity score text might be split across elements
      expect(screen.getByText(/similarity score/i)).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  it('should have export CSV button', async () => {
    const mockResult = {
      answerPaper: {
        id: '1',
        questionPaper: { title: 'Math Test' },
        status: 'GRADED',
      },
      totalMarksObtained: 100,
      totalMarks: 100,
      percentage: 100,
      grade: 'A+',
      questionBreakdown: [],
    };

    vi.mocked(api.resultsApi.getResult).mockResolvedValue(mockResult);

    render(<ResultDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.resultsApi.getResult).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    });
  });
});

