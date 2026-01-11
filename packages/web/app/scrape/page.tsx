"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { jsPDF } from "jspdf";
import TopNav from "../components/TopNav";
import FileUpload from "../components/FileUpload";

type ResumeAnalysisResponse = {
  rating: number;
  feedback: string;
  matchPercentage: number;
  strengths: string[];
  weaknesses: string[];
  jobContent: string;
  resumeContent: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function ResumeAnalysisPage() {
  const [jobPostingUrl, setJobPostingUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      url,
      file,
    }: {
      url: string;
      file: File;
    }): Promise<ResumeAnalysisResponse> => {
      const formData = new FormData();
      formData.append("jobPostingUrl", url);
      formData.append("resume", file);

      const response = await fetch(`${apiBase}/api/resume/analyze`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ResumeAnalysisResponse | {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          "error" in payload ? payload.error : "analysis_failed"
        );
      }

      return payload as ResumeAnalysisResponse;
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async ({
      jobContent,
      resumeContent,
    }: {
      jobContent: string;
      resumeContent: string;
    }): Promise<{ optimizedResume: string; summary: string }> => {
      const response = await fetch(`${apiBase}/api/resume/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobContent, resumeContent }),
      });

      const payload = (await response.json()) as
        | { optimizedResume: string; summary: string }
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload ? payload.error : "optimization_failed"
        );
      }

      return payload as { optimizedResume: string; summary: string };
    },
  });

  const analysisReady = useMemo(() => {
    return Boolean(mutation.data?.jobContent && mutation.data?.resumeContent);
  }, [mutation.data?.jobContent, mutation.data?.resumeContent]);

  const handleOptimize = async () => {
    setError(null);
    if (!mutation.data) {
      setError("Please complete the analysis first.");
      return;
    }
    if (
      !window.confirm(
        "Optimize your resume to better match this role and download a PDF?"
      )
    ) {
      return;
    }

    optimizeMutation.mutate(
      {
        jobContent: mutation.data.jobContent,
        resumeContent: mutation.data.resumeContent,
      },
      {
        onSuccess: (data) => {
          const doc = new jsPDF({ unit: "pt", format: "letter" });
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 48;
          const usableWidth = pageWidth - margin * 2;
          const lineHeight = 16;
          const topOffset = 64;

          doc.setFont("times", "normal");
          doc.setFontSize(11);

          const paragraphs = data.optimizedResume
            .replace(/\r\n/g, "\n")
            .split("\n");
          const lines: string[] = [];
          paragraphs.forEach((paragraph) => {
            if (!paragraph.trim()) {
              lines.push("");
              return;
            }
            const wrapped = doc.splitTextToSize(paragraph, usableWidth);
            lines.push(...wrapped);
          });

          let y = topOffset;
          lines.forEach((line) => {
            if (y + lineHeight > pageHeight - margin) {
              doc.addPage();
              y = topOffset;
            }
            if (!line) {
              y += lineHeight;
              return;
            }
            doc.text(line, margin, y);
            y += lineHeight;
          });

          doc.save("optimized-resume.pdf");
        },
      }
    );
  };

  const onSubmit = () => {
    setError(null);
    if (!jobPostingUrl.trim()) {
      setError("Please enter a job posting URL.");
      return;
    }
    if (!resumeFile) {
      setError("Please upload your resume.");
      return;
    }
    mutation.mutate({ url: jobPostingUrl.trim(), file: resumeFile });
  };

  return (
    <Box>
      <TopNav />
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Analyze & Rate Your Resume
            </Typography>
            <Typography color="text.secondary">
              Upload your resume and provide a job posting URL to get an
              analysis and rating of how well your resume matches the position.
            </Typography>
          </Box>

          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <TextField
                label="Job Posting URL"
                placeholder="https://example.com/job-posting"
                value={jobPostingUrl}
                onChange={(event) => setJobPostingUrl(event.target.value)}
                fullWidth
                helperText="Enter the URL of the job posting you want to match"
              />

              <FileUpload
                file={resumeFile}
                onFileChange={setResumeFile}
                accept=".pdf,.doc,.docx"
                label="Upload Resume"
                maxSizeMB={5}
              />

              <Button
                variant="contained"
                color="primary"
                onClick={onSubmit}
                disabled={mutation.isPending}
                fullWidth
              >
                {mutation.isPending
                  ? "Analyzing..."
                  : "Analyze Resume"}
              </Button>

              {error && <Alert severity="warning">{error}</Alert>}
              {mutation.isError && (
                <Alert severity="error">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Analysis failed."}
                </Alert>
              )}
              {mutation.isSuccess && (
                <Alert severity="success">Analysis complete.</Alert>
              )}

              <Button
                variant="outlined"
                color="primary"
                onClick={handleOptimize}
                disabled={!analysisReady || optimizeMutation.isPending}
                fullWidth
              >
                {optimizeMutation.isPending
                  ? "Optimizing..."
                  : "Optimize & Download PDF"}
              </Button>

              {optimizeMutation.isError && (
                <Alert severity="error">
                  {optimizeMutation.error instanceof Error
                    ? optimizeMutation.error.message
                    : "Optimization failed."}
                </Alert>
              )}

              {optimizeMutation.data?.summary && (
                <Alert severity="info">
                  <Typography variant="subtitle2" gutterBottom>
                    Optimization summary
                  </Typography>
                  <Typography variant="body2">
                    {optimizeMutation.data.summary}
                  </Typography>
                </Alert>
              )}
            </Stack>
          </Paper>

          {mutation.data && (
            <Paper sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                <Typography variant="h6">Analysis Results</Typography>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Overall Rating
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {mutation.data.rating}/10
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Match Percentage
                  </Typography>
                  <Typography variant="h5">
                    {mutation.data.matchPercentage}%
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Feedback
                  </Typography>
                  <Typography>{mutation.data.feedback}</Typography>
                </Box>

                {mutation.data.strengths.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Strengths
                    </Typography>
                    <Stack component="ul" spacing={1} sx={{ pl: 2, m: 0 }}>
                      {mutation.data.strengths.map((strength, index) => (
                        <Typography component="li" key={index}>
                          {strength}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}

                {mutation.data.weaknesses.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Areas for Improvement
                    </Typography>
                    <Stack component="ul" spacing={1} sx={{ pl: 2, m: 0 }}>
                      {mutation.data.weaknesses.map((weakness, index) => (
                        <Typography component="li" key={index}>
                          {weakness}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
