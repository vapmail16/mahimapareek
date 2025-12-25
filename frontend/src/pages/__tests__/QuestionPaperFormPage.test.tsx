import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import QuestionPaperFormPage from '../QuestionPaperFormPage';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  questionPapersApi: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock useNavigate and useParams
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

const createWrapper = (initialEntries = ['/question-papers/new']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('QuestionPaperFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    // Default: no id (create mode)
    mockUseParams.mockReturnValue({});
  });

  it('should display create form for new paper', () => {
    render(<QuestionPaperFormPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/create question paper/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total marks/i)).toBeInTheDocument();
  });

  it('should display edit form when id is provided', async () => {
    const mockPaper = {
      id: '1',
      title: 'Test Paper',
      description: 'Test Description',
      subject: 'Math',
      totalMarks: 100,
      status: 'DRAFT',
    };

    // Set useParams to return id BEFORE rendering
    mockUseParams.mockReturnValue({ id: '1' });
    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);

    render(<QuestionPaperFormPage />, {
      wrapper: createWrapper(['/question-papers/1/edit']),
    });

    // Wait for the query to complete and form to populate
    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByText(/edit question paper/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for form fields to be populated via useEffect
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Test Paper');
    }, { timeout: 3000 });
  });

  it('should call create API on form submit for new paper', async () => {
    const mockCreatedPaper = { id: '1', title: 'New Paper' };
    vi.mocked(api.questionPapersApi.create).mockResolvedValue(mockCreatedPaper);

    render(<QuestionPaperFormPage />, { wrapper: createWrapper() });

    const titleInput = screen.getByLabelText(/title/i);
    const marksInput = screen.getByLabelText(/total marks/i);
    const submitButton = screen.getByRole('button', { name: /create paper/i });

    fireEvent.change(titleInput, { target: { value: 'New Paper' } });
    fireEvent.change(marksInput, { target: { value: '100' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.questionPapersApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Paper',
          totalMarks: 100,
        })
      );
    });
  });

  it('should call update API on form submit for existing paper', async () => {
    const mockPaper = {
      id: '1',
      title: 'Original Title',
      totalMarks: 100,
      status: 'DRAFT',
    };

    // Set useParams to return id BEFORE rendering - this is critical
    mockUseParams.mockReturnValue({ id: '1' });
    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);
    vi.mocked(api.questionPapersApi.update).mockResolvedValue({
      ...mockPaper,
      title: 'Updated Title',
    });

    render(<QuestionPaperFormPage />, {
      wrapper: createWrapper(['/question-papers/1/edit']),
    });

    // Wait for API call and form to load
    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText(/edit question paper/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for form to be populated
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Original Title');
    }, { timeout: 3000 });

    const titleInput = screen.getByLabelText(/title/i);
    const submitButton = screen.getByRole('button', { name: /update paper/i });

    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.questionPapersApi.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          title: 'Updated Title',
        })
      );
    });
  });

  it('should validate required fields', async () => {
    render(<QuestionPaperFormPage />, { wrapper: createWrapper() });

    const submitButton = screen.getByRole('button', { name: /create paper/i });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toBeInvalid();
  });
});

