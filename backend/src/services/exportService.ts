import * as resultsService from './resultsService';
import logger from '../utils/logger';

/**
 * Export a single result to CSV format
 */
export const exportResultToCSV = async (
  answerPaperId: string,
  userId: string
): Promise<string> => {
  const result = await resultsService.getResult(answerPaperId, userId);

  // Build CSV header
  const headers = ['Question Number', 'Question', 'Marks', 'Marks Obtained', 'Feedback', 'Status'];
  const rows: string[][] = [headers];

  // Add question breakdown rows
  result.questionBreakdown.forEach(q => {
    const status = q.isCorrect !== undefined
      ? (q.isCorrect ? 'Correct' : 'Incorrect')
      : (q.similarityScore ? `${q.similarityScore}% similarity` : 'N/A');
    
    rows.push([
      q.questionNumber.toString(),
      escapeCSV(q.questionText),
      q.marks.toString(),
      q.marksObtained.toString(),
      escapeCSV(q.feedback || ''),
      status
    ]);
  });

  // Add summary row
  rows.push([]);
  rows.push(['Total', '', result.totalMarks.toString(), result.totalMarksObtained.toString(), '', '']);
  rows.push(['Percentage', '', '', result.percentage.toFixed(2) + '%', '', '']);
  rows.push(['Grade', '', '', result.grade, '', '']);

  // Convert to CSV string
  const csv = rows.map(row => row.map(cell => cell).join(',')).join('\n');

  logger.info('Result exported to CSV', {
    answerPaperId,
    userId
  });

  return csv;
};

/**
 * Export all results for a question paper to CSV format
 */
export const exportQuestionPaperResultsToCSV = async (
  questionPaperId: string,
  userId: string
): Promise<string> => {
  const results = await resultsService.getQuestionPaperResults(questionPaperId, userId);

  // Build CSV header
  const headers = ['Student Name', 'Student Email', 'Total Marks', 'Marks Obtained', 'Percentage', 'Grade', 'Graded At'];
  const rows: string[][] = [headers];

  // Add result rows
  // Type assertion needed because Prisma includes relations but TypeScript doesn't know
  for (const result of results) {
    const resultWithRelations = result as any;
    rows.push([
      escapeCSV(resultWithRelations.student?.name || 'N/A'),
      escapeCSV(resultWithRelations.student?.email || 'N/A'),
      resultWithRelations.questionPaper?.totalMarks?.toString() || '0',
      Number(result.totalMarksObtained || 0).toString(),
      Number(result.percentage || 0).toFixed(2) + '%',
      result.grade || 'N/A',
      result.gradedAt ? new Date(result.gradedAt).toISOString() : 'N/A'
    ]);
  }

  // Convert to CSV string
  const csv = rows.map(row => row.map(cell => cell).join(',')).join('\n');

  logger.info('Question paper results exported to CSV', {
    questionPaperId,
    userId,
    resultCount: results.length
  });

  return csv;
};

/**
 * Escape CSV cell value (handle commas, quotes, newlines)
 */
const escapeCSV = (value: string): string => {
  if (!value) return '';
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
};

