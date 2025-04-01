import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const API_URL = "http://localhost:5000";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

// Helper function to format text with bullet points
const formatText = (text: string) => {
  return text
    .split("\n")
    .map((line) => {
      // Convert markdown bullet points to HTML
      if (line.trim().startsWith("*")) {
        return `<li>${line.trim().substring(1).trim()}</li>`;
      }
      // Convert markdown headers
      if (line.trim().startsWith("#")) {
        const matches = line.match(/^#+/);
        if (!matches) return `<p>${line}</p>`;
        const level = matches[0].length;
        return `<h${level}>${line.substring(level).trim()}</h${level}>`;
      }
      // Convert bold text
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return line ? `<p>${line}</p>` : "";
    })
    .join("\n");
};

interface FileAnalysis {
  file: File;
  requirements: string;
  status: "pending" | "analyzing" | "completed" | "error";
  error?: string;
}

function App() {
  const [files, setFiles] = useState<FileAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: FileAnalysis[] = Array.from(selectedFiles).map((file) => ({
      file,
      requirements: "",
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      files.forEach((fileAnalysis) => {
        formData.append("files", fileAnalysis.file);
      });

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update files with results
      const updatedFiles = files.map((fileAnalysis) => {
        const successResult = response.data.successful.find(
          (r: any) => r.filename === fileAnalysis.file.name
        );
        const failedResult = response.data.failed.find(
          (r: any) => r.filename === fileAnalysis.file.name
        );

        if (successResult) {
          return {
            ...fileAnalysis,
            requirements: successResult.extractedRequirements,
            status: "completed" as const,
          };
        } else if (failedResult) {
          return {
            ...fileAnalysis,
            status: "error" as const,
            error: failedResult.error,
          };
        }
        return fileAnalysis;
      });

      setFiles(updatedFiles);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChat = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!query.trim() || isChatting) return;

    setIsChatting(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/chat`, { query });
      setResponse(response.data.response);
      setQuery("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to get response");
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(45deg, #00395D 30%, #0053A0 90%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 2,
          }}
        >
          ReqIQ
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Hack-O-Hire
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={4}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            transition: "transform 0.2s",
            "&:hover": { transform: "translateY(-4px)" },
          }}
        >
          <Typography variant="h5" gutterBottom>
            Upload Essentials
          </Typography>
          <Box
            component="form"
            onSubmit={handleFileUpload}
            sx={{ width: "100%" }}
          >
            <Stack spacing={2}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{ minWidth: 200 }}
              >
                Choose PDF Files
                <VisuallyHiddenInput
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  onClick={(e) => e.stopPropagation()}
                />
              </Button>

              {files.length > 0 && (
                <List>
                  {files.map((fileAnalysis, index) => (
                    <React.Fragment key={index}>
                      <ListItem
                        secondaryAction={
                          <IconButton
                            edge="end"
                            onClick={() => removeFile(index)}
                            disabled={fileAnalysis.status === "analyzing"}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={fileAnalysis.file.name}
                          secondary={
                            fileAnalysis.status === "analyzing" ? (
                              <CircularProgress size={20} />
                            ) : fileAnalysis.status === "error" ? (
                              <Typography color="error">
                                {fileAnalysis.error}
                              </Typography>
                            ) : fileAnalysis.status === "completed" ? (
                              "Analysis completed"
                            ) : (
                              "Pending analysis"
                            )
                          }
                        />
                      </ListItem>
                      {fileAnalysis.requirements && (
                        <Box
                          sx={{
                            bgcolor: "#f8f9fa",
                            p: 3,
                            borderRadius: 1,
                            ml: 2,
                            mb: 2,
                            "& ul": {
                              listStyleType: "disc",
                              pl: 3,
                              "& li": {
                                mb: 1,
                              },
                            },
                            "& p": {
                              mb: 1,
                            },
                            "& strong": {
                              color: "#00395D",
                              fontWeight: 600,
                            },
                          }}
                          dangerouslySetInnerHTML={{
                            __html: formatText(fileAnalysis.requirements),
                          }}
                        />
                      )}
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}

              <Button
                variant="contained"
                type="submit"
                disabled={files.length === 0 || isUploading}
                sx={{
                  minWidth: 200,
                  bgcolor: "#00395D",
                  "&:hover": { bgcolor: "#0053A0" },
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {isUploading ? <CircularProgress size={24} /> : "Analyze All"}
              </Button>
            </Stack>
          </Box>
        </Paper>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            transition: "transform 0.2s",
            "&:hover": { transform: "translateY(-4px)" },
          }}
        >
          <Typography variant="h5" gutterBottom>
            Chat with AI
          </Typography>
          <Box component="form" onSubmit={handleChat} sx={{ width: "100%" }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about the requirements..."
                variant="outlined"
                disabled={isChatting}
                sx={{ bgcolor: "white" }}
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!query.trim() || isChatting}
                endIcon={
                  isChatting ? <CircularProgress size={20} /> : <SendIcon />
                }
                sx={{
                  minWidth: 150,
                  bgcolor: "#00395D",
                  "&:hover": { bgcolor: "#0053A0" },
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Send
              </Button>
            </Stack>
          </Box>
          {response && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                AI Response:
              </Typography>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  bgcolor: "#f8f9fa",
                  borderRadius: 1,
                  "& ul": {
                    listStyleType: "disc",
                    pl: 3,
                    "& li": {
                      mb: 1,
                    },
                  },
                  "& p": {
                    mb: 1,
                  },
                  "& strong": {
                    color: "#00395D",
                    fontWeight: 600,
                  },
                }}
                dangerouslySetInnerHTML={{ __html: formatText(response) }}
              />
            </Box>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}

export default App;
