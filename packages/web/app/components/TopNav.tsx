"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "next/link";

export default function TopNav() {
  return (
    <AppBar position="static" elevation={0} color="transparent">
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(27, 58, 87, 0.08)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Typography variant="h6" color="primary" fontWeight={700}>
          Summarize
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button component={Link} href="/" color="primary">
            Upload
          </Button>
          <Button component={Link} href="/scrape" color="primary">
            Scrape
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
