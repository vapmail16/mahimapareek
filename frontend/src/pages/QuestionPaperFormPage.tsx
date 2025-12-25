import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionPapersApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

export default function QuestionPaperFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: paper, isLoading } = useQuery({
    queryKey: ["question-paper", id],
    queryFn: () => questionPapersApi.getById(id!),
    enabled: isEdit,
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    gradeLevel: "",
    totalMarks: "",
    durationMinutes: "",
    instructions: "",
    status: "DRAFT",
  });

  // Populate form if editing
  useEffect(() => {
    if (isEdit && paper) {
      setFormData({
        title: paper.title || "",
        description: paper.description || "",
        subject: paper.subject || "",
        gradeLevel: paper.gradeLevel || "",
        totalMarks: paper.totalMarks?.toString() || "",
        durationMinutes: paper.durationMinutes?.toString() || "",
        instructions: paper.instructions || "",
        status: paper.status || "DRAFT",
      });
    }
  }, [isEdit, paper]);

  const createMutation = useMutation({
    mutationFn: (data: any) => questionPapersApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["question-papers"] });
      navigate(`/question-papers/${data.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => questionPapersApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-papers"] });
      queryClient.invalidateQueries({ queryKey: ["question-paper", id] });
      navigate(`/question-papers/${id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      totalMarks: parseInt(formData.totalMarks) || 0,
      durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : undefined,
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading question paper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">
        {isEdit ? "Edit Question Paper" : "Create Question Paper"}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Paper Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Input
                  id="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalMarks">Total Marks *</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  min="1"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="durationMinutes">Duration (minutes)</Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? "Update" : "Create"} Paper
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

