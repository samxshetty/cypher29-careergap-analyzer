import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function IndexPage() {
  const [resume, setResume] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const API_URL = "http://localhost:8000/analyze"; // backend

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
      alert("Error calling backend. Check if it's running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">🧭 Career Gap Analyzer — Team Cypher29</h1>
      <p className="text-gray-600">
        Upload your <strong>Resume</strong> and a <strong>Job Description</strong> (text or link).
        Instantly see matched skills, missing skills, and a personalized learning path.
      </p>

      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Upload Resume</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setResume(e.target.files ? e.target.files[0] : null)}
          />
          {resume && <p className="text-sm text-gray-500 mt-2">Selected: {resume.name}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Step 2: Provide Job Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Paste JD text here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
          <p className="text-center text-gray-500">OR</p>
          <Input
            placeholder="Paste JD URL here..."
            value={jdUrl}
            onChange={(e) => setJdUrl(e.target.value)}
          />
        </CardContent>
      </Card>

      <Button onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "🔍 Analyze Resume vs JD"}
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-6">
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

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>✅ Matched Skills</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {result.matched_skills.length > 0 ? (
                  result.matched_skills.map((s: string, i: number) => (
                    <Badge key={i} className="bg-green-100 text-green-800">
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
                    <Badge key={i} className="bg-red-100 text-red-800">
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
                  <div key={i} className="p-3 border rounded-lg">
                    <p className="font-semibold">{rec.title}</p>
                    <p className="text-sm text-gray-500">{rec.type}</p>
                    <p className="text-sm">{rec.why}</p>
                    {rec.link && (
                      <a
                        href={rec.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 text-sm"
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
  );
}
