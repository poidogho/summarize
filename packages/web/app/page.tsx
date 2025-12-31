"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import TopNav from "./components/TopNav";

type ExtractResponse = {
  filename: string;
  mimetype: string;
  size: number;
  content: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (uploadFile: File): Promise<ExtractResponse> => {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const response = await fetch(`${apiBase}/api/files/extract`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ExtractResponse | {
        error?: string;
      };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "upload_failed");
      }

      return payload as ExtractResponse;
    },
  });

  const contentPreview = useMemo(() => {
    if (!mutation.data?.content) return null;
    return mutation.data.content.slice(0, 4000);
  }, [mutation.data?.content]);

  const onSubmit = () => {
    setError(null);
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    mutation.mutate(file);
  };

  return (
    <Box>
      <TopNav />
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Upload a file
            </Typography>
            <Typography color="text.secondary">
              Supported types: txt, md, csv, json, xml. Max size 2 MB.
            </Typography>
          </Box>

          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="outlined"
                  component="label"
                  color="primary"
                  sx={{ alignSelf: "flex-start" }}
                >
                  Choose file
                  <input
                    type="file"
                    hidden
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      setFile(nextFile);
                      setError(null);
                    }}
                  />
                </Button>
                <Box sx={{ alignSelf: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    {file ? file.name : "No file selected"}
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="contained"
                color="primary"
                onClick={onSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Reading file..." : "Extract content"}
              </Button>

              {error && <Alert severity="warning">{error}</Alert>}
              {mutation.isError && (
                <Alert severity="error">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Upload failed."}
                </Alert>
              )}
              {mutation.isSuccess && mutation.data && (
                <Alert severity="success">
                  Extracted {mutation.data.size} bytes from{" "}
                  {mutation.data.filename}.
                </Alert>
              )}
            </Stack>
          </Paper>

          {contentPreview && (
            <Paper sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" gutterBottom>
                Content preview
              </Typography>
              <Box
                component="pre"
                sx={{
                  backgroundColor: "rgba(27, 58, 87, 0.06)",
                  borderRadius: 2,
                  padding: 2,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  maxHeight: 360,
                  overflow: "auto",
                }}
              >
                {contentPreview}
              </Box>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
