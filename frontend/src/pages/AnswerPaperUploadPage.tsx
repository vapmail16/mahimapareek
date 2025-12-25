import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionPapersApi, answerPapersApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function AnswerPaperUploadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { data: papers, isLoading } = useQuery({
    queryKey: ["question-papers", "published"],
    queryFn: () => questionPapersApi.getAll({ status: "PUBLISHED" }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { questionPaperId: string }) => answerPapersApi.create(data),
    onSuccess: async (answerPaper) => {
      // Upload files if any selected
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          await answerPapersApi.uploadFile(answerPaper.id, file);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["answer-papers"] });
      navigate("/answer-papers");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaperId) {
      return;
    }
    createMutation.mutate({ questionPaperId: selectedPaperId });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

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
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Upload Answer Paper</h1>

      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="questionPaper">Select Question Paper *</Label>
              <select
                id="questionPaper"
                value={selectedPaperId}
                onChange={(e) => setSelectedPaperId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">-- Select a question paper --</option>
                {papers?.map((paper: any) => (
                  <option key={paper.id} value={paper.id}>
                    {paper.title} ({paper.totalMarks} marks)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Upload Files</Label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary transition-colors"
              >
                <p className="text-muted-foreground mb-4">
                  Drag and drop files here, or click to select
                </p>
                <input
                  type="file"
                  id="fileInput"
                  multiple
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.txt"
                  className="hidden"
                />
                <label htmlFor="fileInput">
                  <Button type="button" variant="outline" asChild>
                    <span>Choose Files</span>
                  </Button>
                </label>
                <p className="text-sm text-muted-foreground mt-2">
                  Supported formats: PDF, JPG, PNG, TXT (Max 10MB per file)
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold">Selected Files:</p>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || !selectedPaperId}
              >
                {createMutation.isPending ? "Submitting..." : "Submit Answer Paper"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

