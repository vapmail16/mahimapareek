import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import QuestionFormPage from '../QuestionFormPage';
import * as api from '../../lib/api';

// Mock the API
vi.mock('../../lib/api', () => ({
  questionsApi: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  questionPapersApi: {
    getById: vi.fn(),
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

const createWrapper = (initialEntries = ['/question-papers/1/questions/new']) => {
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

describe('QuestionFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    // Default: paperId for new question mode
    mockUseParams.mockReturnValue({ paperId: '1' });
  });

  it('should display create form for new question', async () => {
    const mockPaper = {
      id: '1',
      title: 'Test Paper',
      totalMarks: 100,
    };

    mockUseParams.mockReturnValue({ paperId: '1' });
    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);

    render(<QuestionFormPage />, { wrapper: createWrapper() });

    // Wait for paper to load first
    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByText(/add question/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/question text/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/question type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/marks/i)).toBeInTheDocument();
    });
  });

  it('should display all question types in dropdown', async () => {
    const mockPaper = {
      id: '1',
      title: 'Test Paper',
      totalMarks: 100,
    };

    mockUseParams.mockReturnValue({ paperId: '1' });
    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);

    render(<QuestionFormPage />, { wrapper: createWrapper() });

    // Wait for paper to load
    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      const typeSelect = screen.getByLabelText(/question type/i);
      expect(typeSelect).toBeInTheDocument();
    });

    // Check that all question types are available in the select
    const typeSelect = screen.getByLabelText(/question type/i) as HTMLSelectElement;
    expect(typeSelect.options[0].text).toBe('MCQ');
    expect(typeSelect.options[1].text).toBe('Short Answer');
    expect(typeSelect.options[2].text).toBe('Long Answer');
    expect(typeSelect.options[3].text).toBe('Essay');
  });

  it('should show MCQ options field when MCQ type is selected', async () => {
    const mockPaper = {
      id: '1',
      title: 'Test Paper',
      totalMarks: 100,
    };

    mockUseParams.mockReturnValue({ paperId: '1' });
    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);

    render(<QuestionFormPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/question type/i)).toBeInTheDocument();
    });

    // MCQ is already selected by default, so options should be visible
    // Check for the placeholder text instead of label since it's a dynamic array
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/option 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/correct answer/i)).toBeInTheDocument();
    });
  });

  it('should show answer keywords field for Short Answer type', async () => {
    const mockPaper = {
      id: '1',
      title: 'Test Paper',
      totalMarks: 100,
    };

    mockUseParams.mockReturnValue({ paperId: '1' });
    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);

    render(<QuestionFormPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/question type/i)).toBeInTheDocument();
    });

    const typeSelect = screen.getByLabelText(/question type/i);
    fireEvent.change(typeSelect, { target: { value: 'SHORT_ANSWER' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/answer keywords/i)).toBeInTheDocument();
    });
  });

  it('should show model answer field for Long Answer and Essay types', async () => {
    const mockPaper = {
      id: '1',
      title: 'Test Paper',
      totalMarks: 100,
    };

    mockUseParams.mockReturnValue({ paperId: '1' });
    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);

    render(<QuestionFormPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/question type/i)).toBeInTheDocument();
    });

    const typeSelect = screen.getByLabelText(/question type/i);
    fireEvent.change(typeSelect, { target: { value: 'LONG_ANSWER' } });

    await waitFor(() => {
      expect(screen.getByLabelText(/model answer/i)).toBeInTheDocument();
    });
  });

  it('should call create API on form submit for new question', async () => {
    const mockPaper = {
      id: '1',
      title: 'Test Paper',
      totalMarks: 100,
    };

    const mockCreatedQuestion = {
      id: 'q1',
      questionText: 'What is 2+2?',
      questionType: 'MCQ',
      marks: 10,
    };

    mockUseParams.mockReturnValue({ paperId: '1' });
    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);
    vi.mocked(api.questionsApi.create).mockResolvedValue(mockCreatedQuestion);

    render(<QuestionFormPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/question text/i)).toBeInTheDocument();
    });

    const questionTextInput = screen.getByLabelText(/question text/i);
    const marksInput = screen.getByLabelText(/marks/i);
    const submitButton = screen.getByRole('button', { name: /create question/i });

    fireEvent.change(questionTextInput, { target: { value: 'What is 2+2?' } });
    fireEvent.change(marksInput, { target: { value: '10' } });

    // MCQ is default, so correct answer field should already be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/correct answer/i)).toBeInTheDocument();
    });

    const correctAnswerInput = screen.getByLabelText(/correct answer/i);
    fireEvent.change(correctAnswerInput, { target: { value: '4' } });

    // Add at least one option for MCQ
    const optionInput = screen.getByPlaceholderText(/option 1/i);
    fireEvent.change(optionInput, { target: { value: 'Option 1' } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.questionsApi.create).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          questionText: 'What is 2+2?',
          questionType: 'MCQ',
          marks: 10,
        })
      );
    });
  });

  it('should validate required fields', async () => {
    const mockPaper = {
      id: '1',
      title: 'Test Paper',
      totalMarks: 100,
    };

    mockUseParams.mockReturnValue({ paperId: '1' });
    vi.mocked(api.questionPapersApi.getById).mockResolvedValue(mockPaper);

    render(<QuestionFormPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(api.questionPapersApi.getById).toHaveBeenCalledWith('1');
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/question text/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /create question/i });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    const questionTextInput = screen.getByLabelText(/question text/i);
    expect(questionTextInput).toBeInvalid();
  });
});

