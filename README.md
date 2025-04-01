# ReqIQ - Requirements Extraction and Analysis System

ReqIQ is a powerful AI-driven system designed to analyze textual and graphical inputs, extract functional and non-functional requirements, and structure them into standardized documents. It supports direct user inputs and uploaded files (PDFs) while incorporating public domain knowledge such as regulations and standards.

## Features

- **File Upload and Analysis**: Upload PDF files to extract key requirements.
- **AI Chat Interface**: Interact with an AI-powered system to ask questions about requirements.
- **Concurrent Processing**: Handle multiple files and users simultaneously.
- **Structured Output**: Generate structured requirement documents and user stories.

## Tech Stack

- **Frontend**: React with Material-UI for a modern and responsive UI.
- **Backend**: FastAPI for handling API requests and AI integration.
- **AI Integration**: Google Generative AI for advanced natural language processing.
- **PDF Processing**: `pdf2image` and `Pillow` for handling PDF content.

## Prerequisites

- Node.js (for the frontend)
- Python 3.9+ (for the backend)
- Google API Key for Generative AI (set in `.env` file)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Hack-O-Hire/LLM
```

### 2. Backend Setup

1. Create a virtual environment and activate it:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the root directory and add your Google API key:

   ```
   GOOGLE_API_KEY=your-google-api-key
   ```

4. Run the backend server:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 5000
   ```

### 3. Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd requirements-analyzer
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

### 4. Access the Application

- Open your browser and navigate to `http://localhost:3000`.

## API Endpoints

### Health Check

- **GET** `/health`
- Returns the status of the backend.

### File Upload

- **POST** `/upload`
- Accepts PDF files and extracts requirements.

### Chat

- **POST** `/chat`
- Accepts a query and returns an AI-generated response.

## Project Structure

```
LLM/
├── app.py                     # Backend API
├── requirements.txt           # Python dependencies
├── requirements-analyzer/     # Frontend React app
│   ├── src/
│   │   ├── App.tsx            # Main React component
│   │   ├── services/api.js    # API service for frontend
│   │   └── index.tsx          # React entry point
├── .gitignore                 # Git ignore file
└── README.md                  # Project documentation
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [Google Generative AI](https://cloud.google.com/generative-ai)
- [Material-UI](https://mui.com/)
