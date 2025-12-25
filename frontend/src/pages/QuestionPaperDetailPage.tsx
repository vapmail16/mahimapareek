import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { questionPapersApi, questionsApi } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function QuestionPaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: paper, isLoading: paperLoading } = useQuery({
    queryKey: ["question-paper", id],
    queryFn: () => questionPapersApi.getById(id!),
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions", id],
    queryFn: () => questionsApi.getByPaper(id!),
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => questionsApi.delete(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", id] });
    },
  });

  if (paperLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading question paper...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Question paper not found.</p>
          <Link to="/question-papers">
            <Button className="mt-4">Back to Papers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{paper.title}</h1>
          <p className="text-muted-foreground">
            {paper.subject && <span>{paper.subject} • </span>}
            Total Marks: {paper.totalMarks} • Status: <span className="capitalize">{paper.status?.toLowerCase()}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/question-papers/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <Link to={`/question-papers/${id}/results`}>
            <Button variant="outline">View Results</Button>
          </Link>
          <Link to={`/question-papers/${id}/questions/new`}>
            <Button>Add Question</Button>
          </Link>
        </div>
      </div>

      {paper.description && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{paper.description}</p>
          </CardContent>
        </Card>
      )}

      {paper.instructions && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{paper.instructions}</p>
          </CardContent>
        </Card>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Questions</h2>
        {questionsLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        ) : !questions || questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No questions added yet.</p>
              <Link to={`/question-papers/${id}/questions/new`}>
                <Button>Add First Question</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question: any, index: number) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span>Q{question.questionNumber || index + 1}.</span>
                        <span className="text-sm font-normal text-muted-foreground">
                          ({question.questionType}) - {question.marks} marks
                        </span>
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/question-papers/${id}/questions/${question.id}/edit`}>
                        <Button variant="outline" size="sm">Edit</Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this question?")) {
                            deleteMutation.mutate(question.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{question.questionText}</p>
                  {question.options && question.options.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2">Options:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {question.options.map((option: string, optIndex: number) => (
                          <li key={optIndex} className="text-sm">{option}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {question.correctAnswer && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Correct Answer:</strong> {question.correctAnswer}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

