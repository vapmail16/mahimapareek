import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Upload, Brain, FileText, CheckCircle, BarChart3, Clock } from "lucide-react";

export default function AILandingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Brain className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
          AI-Powered Answer Evaluation
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Get instant, accurate feedback on your answers using advanced AI technology. 
          Upload your answer papers and receive detailed evaluation with similarity scores, 
          feedback, and grades in seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/answer-papers/upload">
            <Button size="lg" className="gap-2">
              <Upload className="h-5 w-5" />
              Upload Your Answers
            </Button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center">1. Upload Your Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Select a question paper and upload your answer files. 
                Support for PDF, images, and text files.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center">2. AI Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Our AI analyzes your answers using semantic similarity, 
                keyword matching, and advanced language models to provide 
                comprehensive evaluation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center">3. Get Results</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Receive detailed feedback, similarity scores, marks, 
                and grades instantly. View question-by-question breakdown 
                and export results.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Instant Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get results in seconds, not hours. No waiting for manual grading.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI-Powered Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced semantic similarity and natural language processing 
                for accurate evaluation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Detailed Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                View performance summaries, grade distributions, and 
                track your progress over time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Multiple Question Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Supports MCQ, short answers, long answers, and essay questions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Comprehensive Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Receive detailed feedback on each question with similarity 
                scores and improvement suggestions.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Easy Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Export your results to CSV format for record-keeping 
                and further analysis.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-card rounded-lg p-12 border">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Upload your answer papers now and experience the power of AI-driven evaluation. 
          Get instant, accurate feedback to improve your learning.
        </p>
        <Link to="/answer-papers/upload">
          <Button size="lg" className="gap-2">
            <Upload className="h-5 w-5" />
            Upload Answers Now
          </Button>
        </Link>
      </section>
    </div>
  );
}

