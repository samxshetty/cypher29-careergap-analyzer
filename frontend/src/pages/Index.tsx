import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sun, Moon } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

// ✅ Configure PDF.js worker for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

// Theme toggle button
function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

export default function IndexPage() {
  const [resume, setResume] = useState<File | null>(null);
  const [resumePreviewText, setResumePreviewText] = useState<string | null>(null);
  const [resumeURL, setResumeURL] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);

  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const API_URL = import.meta.env.VITE_API_URL + "/analyze";


  const handleAnalyze = async () => {
    if (!resume) {
      alert("Please upload a resume first!");
      return;
    }
    if (!jdText && !jdUrl) {
      alert("Please provide JD text or URL!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("resume", resume);
      if (jdText.trim()) formData.append("jd_text", jdText);
      if (jdUrl.trim()) formData.append("jd_url", jdUrl);

      const resp = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Error calling backend. Please check the API URL or server status.");
    } finally {
      setLoading(false);
    }
  };

  const handleResumeChange = (file: File | null) => {
    setResume(file);
    if (file) {
      if (file.type === "application/pdf") {
        // ✅ Create Blob URL for PDF preview
        const url = URL.createObjectURL(file);
        setResumeURL(url);
        setResumePreviewText(null);
      } else {
        // ✅ Fallback for DOCX/TXT → show snippet
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setResumePreviewText(text?.slice(0, 1000));
        };
        reader.readAsText(file);
        setResumeURL(null);
      }
    } else {
      setResumeURL(null);
      setResumePreviewText(null);
    }
    setNumPages(null);
    setPageNumber(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Top bar with toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🧭 Career Gap Analyzer — Team Cypher29</h1>
          <ThemeToggle />
        </div>

        <p className="text-gray-600 dark:text-gray-300">
          Upload your <strong>Resume</strong> and a <strong>Job Description</strong>. Instantly see matched
          skills, missing skills, and a personalized learning path.
        </p>

        {/* Inputs side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Resume Section */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Upload Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => handleResumeChange(e.target.files ? e.target.files[0] : null)}
              />
              {resume && <p className="text-sm text-gray-500 mt-2">Selected: {resume.name}</p>}

              {/* PDF Preview */}
              {resumeURL && (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <Document
                    file={resumeURL}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    onLoadError={(err) => console.error("PDF load error:", err)}
                  >
                    <Page pageNumber={pageNumber} width={400} />
                  </Document>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber((p) => Math.max(p - 1, 1))}
                      disabled={pageNumber <= 1}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {pageNumber} of {numPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPageNumber((p) => (numPages ? Math.min(p + 1, numPages) : p))
                      }
                      disabled={pageNumber >= (numPages ?? 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {/* Text Preview */}
              {resumePreviewText && (
                <div className="mt-4 p-2 border rounded-md h-48 overflow-y-auto text-sm bg-gray-50 dark:bg-gray-900 dark:text-gray-200">
                  <p className="font-semibold">Preview:</p>
                  <pre className="whitespace-pre-wrap">{resumePreviewText}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* JD Section */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Provide Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Paste JD text here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="h-48"
              />
              <p className="text-center text-gray-500 dark:text-gray-400">OR</p>
              <Input
                placeholder="Paste JD URL here..."
                value={jdUrl}
                onChange={(e) => setJdUrl(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "🔍 Analyze Resume vs JD"}
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 Match Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span>Overall Match: {result.overall_match}%</span>
                </div>
                <Progress value={result.overall_match} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>✅ Matched Skills</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {result.matched_skills.length > 0 ? (
                    result.matched_skills.map((s: string, i: number) => (
                      <Badge
                        key={i}
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No matches found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>❌ Missing Skills</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {result.missing_skills.length > 0 ? (
                    result.missing_skills.map((s: string, i: number) => (
                      <Badge
                        key={i}
                        className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      >
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No gaps detected 🎉</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>📚 Personalized Learning Path</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.recommendations.length > 0 ? (
                  result.recommendations.map((rec: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg dark:border-gray-700">
                      <p className="font-semibold">{rec.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{rec.type}</p>
                      <p className="text-sm">{rec.why}</p>
                      {rec.link && (
                        <a
                          href={rec.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 text-sm"
                        >
                          Open Resource →
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recommendations available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
