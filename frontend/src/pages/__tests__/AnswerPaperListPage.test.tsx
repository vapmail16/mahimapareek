import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AnswerPaperListPage from '../AnswerPaperListPage';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  answerPapersApi: {
    getAll: vi.fn(),
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
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('AnswerPaperListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    vi.mocked(api.answerPapersApi.getAll).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AnswerPaperListPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading answer papers/i)).toBeInTheDocument();
  });

  it('should display empty state when no answer papers exist', async () => {
    vi.mocked(api.answerPapersApi.getAll).mockResolvedValue([]);

    render(<AnswerPaperListPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no answer papers found/i)).toBeInTheDocument();
    });
  });

  it('should display list of answer papers', async () => {
    const mockAnswerPapers = [
      {
        id: '1',
        questionPaper: {
          id: 'qp1',
          title: 'Math Test',
          totalMarks: 100,
        },
        status: 'SUBMITTED',
        submittedAt: new Date('2025-12-18'),
      },
      {
        id: '2',
        questionPaper: {
          id: 'qp2',
          title: 'Science Quiz',
          totalMarks: 50,
        },
        status: 'GRADED',
        submittedAt: new Date('2025-12-17'),
        totalMarksObtained: 45,
        percentage: 90,
        grade: 'A',
      },
    ];

    vi.mocked(api.answerPapersApi.getAll).mockResolvedValue(mockAnswerPapers);

    render(<AnswerPaperListPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.answerPapersApi.getAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Math Test')).toBeInTheDocument();
      expect(screen.getByText('Science Quiz')).toBeInTheDocument();
    });

    // Check status badges (more specific - look for status in badge)
    const statusBadges = screen.getAllByText(/SUBMITTED|GRADED/i);
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('should display grade information for graded papers', async () => {
    const mockAnswerPaper = {
      id: '1',
      questionPaper: {
        id: 'qp1',
        title: 'Math Test',
        totalMarks: 100,
      },
      status: 'GRADED',
      submittedAt: new Date('2025-12-18'),
      totalMarksObtained: 85,
      percentage: 85,
      grade: 'A',
    };

    vi.mocked(api.answerPapersApi.getAll).mockResolvedValue([mockAnswerPaper]);

    render(<AnswerPaperListPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/85.0%/i)).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });

  it('should have link to upload new answer paper', async () => {
    vi.mocked(api.answerPapersApi.getAll).mockResolvedValue([]);

    render(<AnswerPaperListPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const uploadLink = screen.getByRole('link', { name: /upload answer paper/i });
      expect(uploadLink).toHaveAttribute('href', '/answer-papers/upload');
    });
  });
});

