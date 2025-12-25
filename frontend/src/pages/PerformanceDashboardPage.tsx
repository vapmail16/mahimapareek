import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { resultsApi } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function PerformanceDashboardPage() {
  const { studentId } = useParams<{ studentId?: string }>();
  // In real app, get current user ID from auth context
  // For now, use studentId from params or default to "current"
  const currentStudentId = studentId || "current";

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["performance-summary", currentStudentId],
    queryFn: () => resultsApi.getPerformanceSummary(currentStudentId),
    enabled: !!currentStudentId,
  });

  const { data: recentResults, isLoading: resultsLoading } = useQuery({
    queryKey: ["student-results", currentStudentId],
    queryFn: () => resultsApi.getStudentResults(currentStudentId),
    enabled: !!currentStudentId,
  });

  if (summaryLoading || resultsLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">No performance data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8">Performance Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Papers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalPapers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.averagePercentage.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.averageGrade}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {summary.totalMarksObtained} / {summary.totalMarks}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      {Object.keys(summary.gradeDistribution).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary.gradeDistribution).map(([grade, count]) => (
                <div key={grade} className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">Grade {grade}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Results</h2>
        {!recentResults || recentResults.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No results available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentResults.slice(0, 10).map((result: any) => (
              <Card key={result.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{result.questionPaper?.title || "Unknown Paper"}</CardTitle>
                      <CardDescription>
                        Submitted: {new Date(result.submittedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {result.status === "GRADED" && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">{result.percentage?.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Grade: {result.grade}</p>
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

