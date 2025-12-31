"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import TopNav from "../components/TopNav";

type ScrapeResponse = {
  url: string;
  title: string | null;
  description: string | null;
  content?: string | null;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function ScrapePage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (targetUrl: string): Promise<ScrapeResponse> => {
      const response = await fetch(`${apiBase}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      const payload = (await response.json()) as ScrapeResponse | {
        error?: string;
      };

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "scrape_failed");
      }

      return payload as ScrapeResponse;
    },
  });

  const onSubmit = () => {
    setError(null);
    if (!url.trim()) {
      setError("Please enter a URL to scrape.");
      return;
    }
    mutation.mutate(url.trim());
  };

  return (
    <Box>
      <TopNav />
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Scrape a web page
            </Typography>
            <Typography color="text.secondary">
              Paste a URL and we will extract the title and description.
            </Typography>
          </Box>

          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <TextField
                label="URL"
                placeholder="https://example.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                fullWidth
              />

              <Button
                variant="contained"
                color="primary"
                onClick={onSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Scraping..." : "Scrape"}
              </Button>

              {error && <Alert severity="warning">{error}</Alert>}
              {mutation.isError && (
                <Alert severity="error">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Scrape failed."}
                </Alert>
              )}
              {mutation.isSuccess && (
                <Alert severity="success">Scrape complete.</Alert>
              )}
            </Stack>
          </Paper>

          {mutation.data && (
            <Paper sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={2}>
                <Typography variant="h6">Results</Typography>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    URL
                  </Typography>
                  <Typography>{mutation.data.url}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography>{mutation.data.title ?? "(none)"}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography>
                    {mutation.data.description ?? "(none)"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Content preview
                  </Typography>
                  <Typography>
                    {mutation.data.content
                      ? `${mutation.data.content.slice(0, 500)}${
                          mutation.data.content.length > 500 ? "..." : ""
                        }`
                      : "(none)"}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
