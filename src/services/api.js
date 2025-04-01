import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; // Match your FastAPI port

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const sendChat = async (query) => {
  const response = await api.post("/chat", { query });
  return response.data;
};
