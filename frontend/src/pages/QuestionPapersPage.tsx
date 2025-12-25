import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { questionPapersApi } from "../lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function QuestionPapersPage() {
  const queryClient = useQueryClient();

  const { data: papers, isLoading } = useQuery({
    queryKey: ["question-papers"],
    queryFn: () => questionPapersApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionPapersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-papers"] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading question papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Question Papers</h1>
        <Link to="/question-papers/new">
          <Button>Create New Paper</Button>
        </Link>
      </div>

      {!papers || papers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No question papers found.</p>
          <Link to="/question-papers/new">
            <Button>Create Your First Paper</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper: any) => (
            <Card key={paper.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2">{paper.title}</CardTitle>
                <CardDescription>
                  {paper.subject && <span className="block">{paper.subject}</span>}
                  {paper.totalMarks && <span className="block">Total Marks: {paper.totalMarks}</span>}
                  <span className="block capitalize">{paper.status?.toLowerCase()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Link to={`/question-papers/${paper.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                  <Link to={`/question-papers/${paper.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this question paper?")) {
                        deleteMutation.mutate(paper.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

