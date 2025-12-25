import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questionsApi, questionPapersApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

type QuestionType = "MCQ" | "SHORT_ANSWER" | "LONG_ANSWER" | "ESSAY";

export default function QuestionFormPage() {
  const params = useParams<{ paperId?: string; id?: string }>();
  // paperId can come from either :paperId or :id (when editing, id is the question id)
  // For new questions: /question-papers/:paperId/questions/new
  // For editing: /question-papers/:paperId/questions/:id/edit
  const paperId = params.paperId;
  const id = params.id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: paper, isLoading: paperLoading } = useQuery({
    queryKey: ["question-paper", paperId],
    queryFn: () => questionPapersApi.getById(paperId!),
    enabled: !!paperId,
  });

  const { data: question, isLoading: questionLoading } = useQuery({
    queryKey: ["question", id],
    queryFn: () => questionsApi.getById(id!),
    enabled: isEdit,
  });

  const [formData, setFormData] = useState({
    questionNumber: "",
    questionText: "",
    questionType: "MCQ" as QuestionType,
    marks: "",
    correctAnswer: "",
    answerKeywords: "",
    modelAnswer: "",
    options: [] as string[],
  });

  const [optionInputs, setOptionInputs] = useState<string[]>([""]);

  // Populate form if editing
  useEffect(() => {
    if (isEdit && question) {
      setFormData({
        questionNumber: question.questionNumber?.toString() || "",
        questionText: question.questionText || "",
        questionType: question.questionType || "MCQ",
        marks: question.marks?.toString() || "",
        correctAnswer: question.correctAnswer || "",
        answerKeywords: question.answerKeywords?.join(", ") || "",
        modelAnswer: question.modelAnswer || "",
        options: question.options || [],
      });
      if (question.options && question.options.length > 0) {
        setOptionInputs([...question.options, ""]);
      }
    }
  }, [isEdit, question]);

  const createMutation = useMutation({
    mutationFn: (data: any) => questionsApi.create(paperId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", paperId] });
      queryClient.invalidateQueries({ queryKey: ["question-paper", paperId] });
      navigate(`/question-papers/${paperId}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => questionsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", paperId] });
      queryClient.invalidateQueries({ queryKey: ["question", id] });
      navigate(`/question-papers/${paperId}`);
    },
  });

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...optionInputs];
    newOptions[index] = value;
    setOptionInputs(newOptions);
  };

  const addOption = () => {
    setOptionInputs([...optionInputs, ""]);
  };

  const removeOption = (index: number) => {
    const newOptions = optionInputs.filter((_, i) => i !== index);
    setOptionInputs(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const options = optionInputs.filter((opt) => opt.trim() !== "");
    const answerKeywords = formData.answerKeywords
      ? formData.answerKeywords.split(",").map((k) => k.trim())
      : undefined;

    const submitData: any = {
      questionNumber: formData.questionNumber ? parseInt(formData.questionNumber) : undefined,
      questionText: formData.questionText,
      questionType: formData.questionType,
      marks: parseInt(formData.marks),
      ...(formData.correctAnswer && { correctAnswer: formData.correctAnswer }),
      ...(answerKeywords && answerKeywords.length > 0 && { answerKeywords }),
      ...(formData.modelAnswer && { modelAnswer: formData.modelAnswer }),
      ...(options.length > 0 && { options }),
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (paperLoading || questionLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-muted-foreground">Question paper not found.</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">
        {isEdit ? "Edit Question" : "Add Question"}
      </h1>
      <p className="text-muted-foreground mb-8">
        Paper: <strong>{paper.title}</strong>
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="questionNumber">Question Number</Label>
                <Input
                  id="questionNumber"
                  type="number"
                  min="1"
                  value={formData.questionNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, questionNumber: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="marks">Marks *</Label>
                <Input
                  id="marks"
                  type="number"
                  min="1"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="questionType">Question Type *</Label>
              <select
                id="questionType"
                value={formData.questionType}
                onChange={(e) =>
                  setFormData({ ...formData, questionType: e.target.value as QuestionType })
                }
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="MCQ">MCQ</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="LONG_ANSWER">Long Answer</option>
                <option value="ESSAY">Essay</option>
              </select>
            </div>

            <div>
              <Label htmlFor="questionText">Question Text *</Label>
              <textarea
                id="questionText"
                value={formData.questionText}
                onChange={(e) =>
                  setFormData({ ...formData, questionText: e.target.value })
                }
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                required
              />
            </div>

            {/* MCQ Fields */}
            {formData.questionType === "MCQ" && (
              <>
                <div>
                  <Label>Options *</Label>
                  {optionInputs.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        required={index < 2}
                      />
                      {optionInputs.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeOption(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addOption} className="mt-2">
                    Add Option
                  </Button>
                </div>
                <div>
                  <Label htmlFor="correctAnswer">Correct Answer *</Label>
                  <Input
                    id="correctAnswer"
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData({ ...formData, correctAnswer: e.target.value })
                    }
                    required
                  />
                </div>
              </>
            )}

            {/* Short Answer Fields */}
            {formData.questionType === "SHORT_ANSWER" && (
              <>
                <div>
                  <Label htmlFor="correctAnswer">Correct Answer</Label>
                  <Input
                    id="correctAnswer"
                    value={formData.correctAnswer}
                    onChange={(e) =>
                      setFormData({ ...formData, correctAnswer: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="answerKeywords">Answer Keywords (comma-separated)</Label>
                  <Input
                    id="answerKeywords"
                    value={formData.answerKeywords}
                    onChange={(e) =>
                      setFormData({ ...formData, answerKeywords: e.target.value })
                    }
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </>
            )}

            {/* Long Answer and Essay Fields */}
            {(formData.questionType === "LONG_ANSWER" ||
              formData.questionType === "ESSAY") && (
              <div>
                <Label htmlFor="modelAnswer">Model Answer</Label>
                <textarea
                  id="modelAnswer"
                  value={formData.modelAnswer}
                  onChange={(e) =>
                    setFormData({ ...formData, modelAnswer: e.target.value })
                  }
                  className="w-full min-h-[150px] px-3 py-2 border rounded-md"
                  placeholder="Enter the model/expected answer for this question"
                />
              </div>
            )}

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit ? "Update" : "Create"} Question
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

