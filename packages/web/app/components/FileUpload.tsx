'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  label?: string;
  maxSizeMB?: number;
}

export default function FileUpload({
  file,
  onFileChange,
  accept,
  label = 'Choose file',
  maxSizeMB = 2,
}: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setError(null);

    if (selectedFile) {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (selectedFile.size > maxSizeBytes) {
        setError(`File size exceeds ${maxSizeMB} MB limit.`);
        onFileChange(null);
        return;
      }
    }

    onFileChange(selectedFile);
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button
          variant="outlined"
          component="label"
          color="primary"
          sx={{ alignSelf: 'flex-start' }}
        >
          {label}
          <input
            type="file"
            hidden
            accept={accept}
            onChange={handleFileChange}
          />
        </Button>
        <Box sx={{ alignSelf: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {file ? file.name : 'No file selected'}
          </Typography>
        </Box>
      </Stack>
      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
    </Stack>
  );
}
