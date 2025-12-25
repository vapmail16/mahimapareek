import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { resultsApi } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function ResultDetailPage() {
  const { answerPaperId } = useParams<{ answerPaperId: string }>();

  const { data: result, isLoading } = useQuery({
    queryKey: ["result", answerPaperId],
    queryFn: () => resultsApi.getResult(answerPaperId!),
    enabled: !!answerPaperId,
  });

  const handleExportCSV = async () => {
    if (!answerPaperId) return;
    try {
      const blob = await resultsApi.exportCSV(answerPaperId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `result-${answerPaperId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading result...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Result not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Result Details</h1>
          <p className="text-muted-foreground">
            {result.answerPaper.questionPaper?.title || "Question Paper"}
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          Export CSV
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Marks</p>
              <p className="text-3xl font-bold">
                {result.totalMarksObtained} / {result.totalMarks}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Percentage</p>
              <p className="text-3xl font-bold">{result.percentage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Grade</p>
              <p className="text-3xl font-bold">{result.grade}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <p className="text-3xl font-bold capitalize">
                {result.answerPaper.status?.toLowerCase()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Breakdown */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Question Breakdown</h2>
        <div className="space-y-4">
          {result.questionBreakdown.map((question: any, index: number) => (
            <Card key={question.questionId || index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>Q{question.questionNumber || index + 1}.</span>
                    <span className="text-base font-normal text-muted-foreground">
                      ({question.marks} marks)
                    </span>
                  </CardTitle>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        question.isCorrect === true
                          ? "bg-green-100 text-green-800"
                          : question.isCorrect === false
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {question.marksObtained} / {question.marks}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 font-medium">{question.questionText}</p>
                {question.similarityScore !== undefined && question.similarityScore !== null && (
                  <div className="mb-2">
                    <span className="text-sm text-muted-foreground">
                      Similarity Score: <strong>{question.similarityScore}%</strong>
                    </span>
                  </div>
                )}
                {question.feedback && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-semibold mb-1">Feedback:</p>
                    <p className="text-sm">{question.feedback}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

