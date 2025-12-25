import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import QuestionPapersPage from '../QuestionPapersPage';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  questionPapersApi: {
    getAll: vi.fn(),
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
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('QuestionPapersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    vi.mocked(api.questionPapersApi.getAll).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<QuestionPapersPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading question papers/i)).toBeInTheDocument();
  });

  it('should display empty state when no papers exist', async () => {
    vi.mocked(api.questionPapersApi.getAll).mockResolvedValue([]);

    render(<QuestionPapersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no question papers found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first paper/i)).toBeInTheDocument();
    });
  });

  it('should display list of question papers', async () => {
    const mockPapers = [
      {
        id: '1',
        title: 'Math Test 1',
        subject: 'Mathematics',
        totalMarks: 100,
        status: 'PUBLISHED',
      },
      {
        id: '2',
        title: 'Science Quiz',
        subject: 'Science',
        totalMarks: 50,
        status: 'DRAFT',
      },
    ];

    vi.mocked(api.questionPapersApi.getAll).mockResolvedValue(mockPapers);

    render(<QuestionPapersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Math Test 1')).toBeInTheDocument();
      expect(screen.getByText('Science Quiz')).toBeInTheDocument();
      expect(screen.getByText(/total marks: 100/i)).toBeInTheDocument();
      expect(screen.getByText(/total marks: 50/i)).toBeInTheDocument();
    });
  });

  it('should have create new paper button', async () => {
    vi.mocked(api.questionPapersApi.getAll).mockResolvedValue([]);

    render(<QuestionPapersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const createButton = screen.getByRole('link', { name: /create your first paper/i });
      expect(createButton).toHaveAttribute('href', '/question-papers/new');
    });
  });

  it('should call delete API when delete button is clicked', async () => {
    const mockPapers = [
      {
        id: '1',
        title: 'Test Paper',
        totalMarks: 100,
        status: 'PUBLISHED',
      },
    ];

    vi.mocked(api.questionPapersApi.getAll).mockResolvedValue(mockPapers);
    vi.mocked(api.questionPapersApi.delete).mockResolvedValue({ success: true });

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<QuestionPapersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Paper')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    deleteButton.click();

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(api.questionPapersApi.delete).toHaveBeenCalledWith('1');
    });

    confirmSpy.mockRestore();
  });
});

