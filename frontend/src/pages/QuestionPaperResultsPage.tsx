import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { resultsApi, questionPapersApi } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function QuestionPaperResultsPage() {
  const { questionPaperId } = useParams<{ questionPaperId: string }>();

  const { data: questionPaper, isLoading: paperLoading } = useQuery({
    queryKey: ["question-paper", questionPaperId],
    queryFn: () => questionPapersApi.getById(questionPaperId!),
    enabled: !!questionPaperId,
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ["question-paper-results", questionPaperId],
    queryFn: () => resultsApi.getQuestionPaperResults(questionPaperId!),
    enabled: !!questionPaperId,
  });

  const { data: distribution } = useQuery({
    queryKey: ["grade-distribution", questionPaperId],
    queryFn: () => resultsApi.getGradeDistribution(questionPaperId!),
    enabled: !!questionPaperId,
  });

  const handleExportCSV = async () => {
    if (!questionPaperId) return;
    try {
      const blob = await resultsApi.exportQuestionPaperCSV(questionPaperId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `results-${questionPaperId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  if (paperLoading || resultsLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!questionPaper) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Question paper not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Results</h1>
          <p className="text-muted-foreground">{questionPaper.title}</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" disabled={!results || results.length === 0}>
          Export All Results
        </Button>
      </div>

      {/* Grade Distribution */}
      {distribution && distribution.total > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Submissions</p>
                <p className="text-2xl font-bold">{distribution.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Average Percentage</p>
                <p className="text-2xl font-bold">{distribution.averagePercentage.toFixed(1)}%</p>
              </div>
            </div>
            {Object.keys(distribution.grades).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(distribution.grades).map(([grade, count]) => (
                  <div key={grade} className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">Grade {grade}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Student Submissions</h2>
        {!results || results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No results yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {results.map((result: any) => (
              <Card key={result.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        {result.student?.name || result.student?.email || "Unknown Student"}
                      </CardTitle>
                      <CardDescription>
                        Submitted: {new Date(result.submittedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {result.status === "GRADED" && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">{result.percentage?.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Grade: {result.grade}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.totalMarksObtained} / {questionPaper.totalMarks} marks
                        </p>
                      </div>
                    )}
                    {result.status !== "GRADED" && (
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            result.status === "GRADING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {result.status}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {result.status === "GRADED" && (
                    <Link to={`/results/${result.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
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

