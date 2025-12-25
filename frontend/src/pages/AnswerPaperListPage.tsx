import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { answerPapersApi } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function AnswerPaperListPage() {
  const { data: answerPapers, isLoading } = useQuery({
    queryKey: ["answer-papers"],
    queryFn: () => answerPapersApi.getAll(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading answer papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">My Answer Papers</h1>
        <Link to="/answer-papers/upload">
          <Button>Upload Answer Paper</Button>
        </Link>
      </div>

      {!answerPapers || answerPapers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No answer papers found.</p>
          <Link to="/answer-papers/upload">
            <Button>Upload Your First Answer Paper</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {answerPapers.map((paper: any) => (
            <Card key={paper.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{paper.questionPaper?.title || "Unknown Paper"}</CardTitle>
                    <CardDescription>
                      Submitted: {new Date(paper.submittedAt).toLocaleDateString()}
                      {paper.questionPaper?.totalMarks && (
                        <span> • Total Marks: {paper.questionPaper.totalMarks}</span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        paper.status === "GRADED"
                          ? "bg-green-100 text-green-800"
                          : paper.status === "GRADING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {paper.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {paper.status === "GRADED" && (
                  <div className="mb-4 p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Marks Obtained</p>
                        <p className="text-2xl font-bold">
                          {Number(paper.totalMarksObtained || 0)} / {paper.questionPaper?.totalMarks || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Percentage</p>
                        <p className="text-2xl font-bold">{Number(paper.percentage || 0).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Grade</p>
                        <p className="text-2xl font-bold">{paper.grade || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Link to={`/answer-papers/${paper.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  {paper.status === "GRADED" && (
                    <Link to={`/results/${paper.id}`}>
                      <Button variant="outline" size="sm">
                        View Results
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

