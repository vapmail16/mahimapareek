import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import QuestionPaperResultsPage from '../QuestionPaperResultsPage';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  resultsApi: {
    getQuestionPaperResults: vi.fn(),
    getGradeDistribution: vi.fn(),
    exportQuestionPaperCSV: vi.fn(),
  },
  questionPapersApi: {
    getById: vi.fn(),
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
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('QuestionPaperResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ questionPaperId: '1' });
  });

  it('should display loading state initially', () => {
    vi.mocked(api.questionPapersApi.getById).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<QuestionPaperResultsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display question paper title and results', async () => {
    const mockPaper = {
      id: '1',
      title: 'Math Test',
      totalMarks: 100,
    };

    const mockResults = [
      {
        id: 'ap1',
        student: { id: 's1', name: 'John Doe' },
        status: 'GRADED',
        totalMarksObtained: 85,
        percentage: 85,
        grade: 'A',
        submittedAt: new Date('2025-12-18'),
      },
      {
        id: 'ap2',
        student: { id: 's2', name: 'Jane Smith' },
        status: 'GRADED',
        totalMarksObtained: 90,
        percentage: 90,
        grade: 'A+',
        submittedAt: new Date('2025-12-17'),
      },
    ];

    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);
    vi.mocked(api.resultsApi.getQuestionPaperResults).mockResolvedValue(mockResults);

    render(<QuestionPaperResultsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
      expect(api.resultsApi.getQuestionPaperResults).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
      expect(api.resultsApi.getQuestionPaperResults).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByText('Math Test')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('85.0%')).toBeInTheDocument();
      expect(screen.getByText('90.0%')).toBeInTheDocument();
    });
  });

  it('should display grade distribution', async () => {
    const mockPaper = {
      id: '1',
      title: 'Math Test',
      totalMarks: 100,
    };

    const mockResults = [];
    const mockDistribution = {
      total: 10,
      grades: {
        'A+': 2,
        'A': 5,
        'B': 3,
      },
      averagePercentage: 85.5,
    };

    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);
    vi.mocked(api.resultsApi.getQuestionPaperResults).mockResolvedValue(mockResults);
    vi.mocked(api.resultsApi.getGradeDistribution).mockResolvedValue(mockDistribution);

    render(<QuestionPaperResultsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.resultsApi.getGradeDistribution).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByText(/grade distribution/i)).toBeInTheDocument();
      expect(screen.getByText('85.5%')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  it('should have export CSV button', async () => {
    const mockPaper = {
      id: '1',
      title: 'Math Test',
      totalMarks: 100,
    };

    const mockResults = [];

    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);
    vi.mocked(api.resultsApi.getQuestionPaperResults).mockResolvedValue(mockResults);
    vi.mocked(api.resultsApi.getGradeDistribution).mockResolvedValue({
      total: 0,
      grades: {},
      averagePercentage: 0,
    });

    render(<QuestionPaperResultsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      const exportButton = screen.getByRole('button', { name: /export all results/i });
      expect(exportButton).toBeInTheDocument();
      // Button should be disabled when no results
      expect(exportButton).toBeDisabled();
    });
  });

  it('should display empty state when no results', async () => {
    const mockPaper = {
      id: '1',
      title: 'Math Test',
      totalMarks: 100,
    };

    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);
    vi.mocked(api.resultsApi.getQuestionPaperResults).mockResolvedValue([]);
    vi.mocked(api.resultsApi.getGradeDistribution).mockResolvedValue({
      total: 0,
      grades: {},
      averagePercentage: 0,
    });

    render(<QuestionPaperResultsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no results yet/i)).toBeInTheDocument();
    });
  });
});

