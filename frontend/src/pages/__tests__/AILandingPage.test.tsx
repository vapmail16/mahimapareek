import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AILandingPage from '../AILandingPage';

describe('AILandingPage', () => {
  const renderPage = () => {
    return render(
      <BrowserRouter>
        <AILandingPage />
      </BrowserRouter>
    );
  };

  it('should render the main heading', () => {
    renderPage();
    expect(screen.getByText(/AI-Powered Answer Evaluation/i)).toBeInTheDocument();
  });

  it('should display how it works section', () => {
    renderPage();
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
  });

  it('should display upload answer section', () => {
    renderPage();
    // Check for the section heading in the "How It Works" section
    const uploadSection = screen.getByText(/1\. Upload Your Answers/i);
    expect(uploadSection).toBeInTheDocument();
  });

  it('should display AI evaluation section', () => {
    renderPage();
    expect(screen.getByText(/AI Evaluation/i)).toBeInTheDocument();
  });

  it('should have a link to upload answers', () => {
    renderPage();
    const uploadLink = screen.getByRole('link', { name: /upload your answers/i });
    expect(uploadLink).toBeInTheDocument();
    expect(uploadLink).toHaveAttribute('href', '/answer-papers/upload');
  });
});

