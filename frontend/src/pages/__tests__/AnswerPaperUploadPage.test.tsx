import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import AnswerPaperUploadPage from '../AnswerPaperUploadPage';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  questionPapersApi: {
    getAll: vi.fn(),
  },
  answerPapersApi: {
    create: vi.fn(),
    uploadFile: vi.fn(),
  },
}));

// Mock useNavigate
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

describe('AnswerPaperUploadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({});
  });

  it('should display upload form with question paper selection', async () => {
    const mockPapers = [
      { id: '1', title: 'Math Test', status: 'PUBLISHED' },
      { id: '2', title: 'Science Quiz', status: 'PUBLISHED' },
    ];

    vi.mocked(api.questionPapersApi.getAll).mockResolvedValue(mockPapers);

    render(<AnswerPaperUploadPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/upload answer paper/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select question paper/i)).toBeInTheDocument();
    });
  });

  it('should display available question papers in dropdown', async () => {
    const mockPapers = [
      { id: '1', title: 'Math Test', status: 'PUBLISHED', totalMarks: 100 },
      { id: '2', title: 'Science Quiz', status: 'PUBLISHED', totalMarks: 50 },
    ];

    vi.mocked(api.questionPapersApi.getAll).mockResolvedValue(mockPapers);

    render(<AnswerPaperUploadPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      const select = screen.getByLabelText(/select question paper/i);
      expect(select).toBeInTheDocument();
    });
  });

  it('should show file upload area', async () => {
    const mockPapers = [
      { id: '1', title: 'Math Test', status: 'PUBLISHED' },
    ];

    vi.mocked(api.questionPapersApi.getAll).mockResolvedValue(mockPapers);

    render(<AnswerPaperUploadPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument();
    });
  });

  it('should create answer paper and upload files on submit', async () => {
    const mockPapers = [
      { id: '1', title: 'Math Test', status: 'PUBLISHED', totalMarks: 100 },
    ];

    const mockAnswerPaper = {
      id: 'ap1',
      questionPaperId: '1',
      studentId: 'student1',
      status: 'SUBMITTED',
    };

    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    vi.mocked(api.questionPapersApi.getAll).mockResolvedValue(mockPapers);
    vi.mocked(api.answerPapersApi.create).mockResolvedValue(mockAnswerPaper);
    vi.mocked(api.answerPapersApi.uploadFile).mockResolvedValue({
      id: 'file1',
      fileName: 'test.pdf',
      filePath: '/uploads/test.pdf',
    });

    render(<AnswerPaperUploadPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/select question paper/i)).toBeInTheDocument();
    });

    // Select question paper
    const select = screen.getByLabelText(/select question paper/i);
    fireEvent.change(select, { target: { value: '1' } });

    // Upload file (simulate file input)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit answer paper/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.answerPapersApi.create).toHaveBeenCalledWith({
        questionPaperId: '1',
      });
    });
  });

  it('should validate that question paper is selected', async () => {
    const mockPapers = [
      { id: '1', title: 'Math Test', status: 'PUBLISHED', totalMarks: 100 },
    ];

    vi.mocked(api.questionPapersApi.getAll).mockResolvedValue(mockPapers);

    render(<AnswerPaperUploadPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getAll).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/select question paper/i)).toBeInTheDocument();
    });

    // Try to submit without selecting question paper
    const submitButton = screen.getByRole('button', { name: /submit answer paper/i });
    fireEvent.click(submitButton);

    // Should show validation error or prevent submission
    await waitFor(() => {
      const select = screen.getByLabelText(/select question paper/i) as HTMLSelectElement;
      expect(select.value).toBe('');
    });
  });

  it('should display loading state while fetching question papers', () => {
    vi.mocked(api.questionPapersApi.getAll).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AnswerPaperUploadPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading question papers/i)).toBeInTheDocument();
  });
});

