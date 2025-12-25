import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PerformanceDashboardPage from '../PerformanceDashboardPage';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  resultsApi: {
    getPerformanceSummary: vi.fn(),
    getStudentResults: vi.fn(),
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

describe('PerformanceDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ studentId: '1' });
  });

  it('should display loading state initially', () => {
    vi.mocked(api.resultsApi.getPerformanceSummary).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<PerformanceDashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display performance summary', async () => {
    const mockSummary = {
      totalPapers: 5,
      averagePercentage: 85,
      averageGrade: 'A',
      totalMarksObtained: 425,
      totalMarks: 500,
      gradeDistribution: {
        'A+': 1,
        'A': 2,
        'B': 2,
      },
    };

    vi.mocked(api.resultsApi.getPerformanceSummary).mockResolvedValue(mockSummary);

    render(<PerformanceDashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.resultsApi.getPerformanceSummary).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/total papers/i)).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText(/average percentage/i)).toBeInTheDocument();
      expect(screen.getByText('85.0%')).toBeInTheDocument();
    });
  });

  it('should display grade distribution', async () => {
    const mockSummary = {
      totalPapers: 5,
      averagePercentage: 85,
      averageGrade: 'A',
      totalMarksObtained: 425,
      totalMarks: 500,
      gradeDistribution: {
        'A+': 1,
        'A': 2,
        'B': 2,
      },
    };

    vi.mocked(api.resultsApi.getPerformanceSummary).mockResolvedValue(mockSummary);
    vi.mocked(api.resultsApi.getStudentResults).mockResolvedValue([]);

    render(<PerformanceDashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.resultsApi.getPerformanceSummary).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/grade distribution/i)).toBeInTheDocument();
      // Check for grade labels (more specific than just numbers which might appear multiple times)
      expect(screen.getByText(/grade a\+/i)).toBeInTheDocument();
      expect(screen.getByText(/grade a$/i)).toBeInTheDocument();
      expect(screen.getByText(/grade b$/i)).toBeInTheDocument();
    });
  });

  it('should display recent results', async () => {
    const mockSummary = {
      totalPapers: 2,
      averagePercentage: 85,
      averageGrade: 'A',
      totalMarksObtained: 170,
      totalMarks: 200,
      gradeDistribution: {},
    };

    const mockResults = [
      {
        id: '1',
        questionPaper: { title: 'Math Test', totalMarks: 100 },
        status: 'GRADED',
        totalMarksObtained: 90,
        percentage: 90,
        grade: 'A',
        submittedAt: new Date('2025-12-18'),
      },
    ];

    vi.mocked(api.resultsApi.getPerformanceSummary).mockResolvedValue(mockSummary);
    vi.mocked(api.resultsApi.getStudentResults).mockResolvedValue(mockResults);

    render(<PerformanceDashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.resultsApi.getPerformanceSummary).toHaveBeenCalled();
      expect(api.resultsApi.getStudentResults).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Math Test')).toBeInTheDocument();
      expect(screen.getByText('90.0%')).toBeInTheDocument();
    });
  });
});

