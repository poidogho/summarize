'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import TopNav from './components/TopNav';
import FileUpload from './components/FileUpload';

type ExtractResponse = {
  filename: string;
  mimetype: string;
  size: number;
  content: string;
  summary: string;
  keyAreas: string[];
};

type Tone = 'professional' | 'casual';

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export default function SummarizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [tone, setTone] = useState<Tone>('professional');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      uploadFile,
      toneValue,
    }: {
      uploadFile: File;
      toneValue: Tone;
    }): Promise<ExtractResponse> => {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('tone', toneValue);

      const response = await fetch(`${apiBase}/api/files/extract`, {
        method: 'POST',
        body: formData,
      });

      const payload = (await response.json()) as
        | ExtractResponse
        | {
            error?: string;
          };

      if (!response.ok) {
        throw new Error('error' in payload ? payload.error : 'upload_failed');
      }

      // Debug: log the response to check if keyAreas is present
      console.log('API Response:', payload);
      console.log('keyAreas:', (payload as ExtractResponse).keyAreas);

      return payload as ExtractResponse;
    },
  });

  const handleToneChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTone: Tone | null
  ) => {
    if (newTone !== null) {
      setTone(newTone);
    }
  };

  const onSubmit = () => {
    setError(null);
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }
    mutation.mutate({ uploadFile: file, toneValue: tone });
  };

  return (
    <Box>
      <TopNav />
      <Container maxWidth='md' sx={{ py: { xs: 4, md: 8 } }}>
        <Stack spacing={4}>
          <Box>
            <Typography variant='h4' gutterBottom>
              Summarize a Document
            </Typography>
            <Typography color='text.secondary'>
              Upload a document and get a bullet-point summary. Choose between
              professional or casual tone.
            </Typography>
          </Box>

          <Paper sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <FileUpload
                file={file}
                onFileChange={(newFile) => {
                  setFile(newFile);
                  setError(null);
                }}
                label='Choose Document'
                maxSizeMB={2}
              />

              <Box>
                <Typography variant='body2' color='text.secondary' gutterBottom>
                  Summary Tone
                </Typography>
                <ToggleButtonGroup
                  value={tone}
                  exclusive
                  onChange={handleToneChange}
                  aria-label='summary tone'
                  fullWidth
                >
                  <ToggleButton value='professional' aria-label='professional'>
                    Professional
                  </ToggleButton>
                  <ToggleButton value='casual' aria-label='casual'>
                    Casual
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Button
                variant='contained'
                color='primary'
                onClick={onSubmit}
                disabled={mutation.isPending}
                fullWidth
              >
                {mutation.isPending ? 'Summarizing...' : 'Summarize Document'}
              </Button>

              {error && <Alert severity='warning'>{error}</Alert>}
              {mutation.isError && (
                <Alert severity='error'>
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : 'Summarization failed.'}
                </Alert>
              )}
              {mutation.isSuccess && mutation.data && (
                <Alert severity='success'>
                  Summary generated successfully.
                </Alert>
              )}
            </Stack>
          </Paper>

          {mutation.data?.keyAreas && mutation.data.keyAreas.length > 0 && (
            <Paper sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant='h6' gutterBottom>
                Key Areas of Interest
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                Important areas to pay attention to in this document
              </Typography>
              <Stack spacing={1}>
                {mutation.data.keyAreas.map((area, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: 1.5,
                      backgroundColor: 'rgba(27, 58, 87, 0.06)',
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      component='span'
                      sx={{
                        marginRight: 1.5,
                        flexShrink: 0,
                        color: 'primary.main',
                        fontWeight: 600,
                      }}
                    >
                      •
                    </Typography>
                    <Typography component='span'>{area}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          )}

          {mutation.data?.summary && (
            <Paper sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant='h6' gutterBottom>
                Summary
              </Typography>
              <Box
                sx={{
                  backgroundColor: 'rgba(27, 58, 87, 0.06)',
                  borderRadius: 2,
                  padding: 3,
                }}
              >
                <Typography
                  sx={{
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                  }}
                >
                  {mutation.data.summary}
                </Typography>
              </Box>
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
