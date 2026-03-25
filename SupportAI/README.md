# SupportAI - AI Customer Support Automation System

## Setup Instructions

### 1. Prerequisities
- Python 3.8 or higher, installed on your system.
- [Ollama](https://ollama.com/), installed and running locally.

### 2. Pull the LLM Model
In your terminal, run the following command to download the required LLM model:
```bash
ollama pull llama3
```
*(You can also use 'mistral' - if you choose to, update the MODEL_NAME in `app.py` accordingly.)*

### 3. Install Python Dependencies
Navigate to the project directory and install the required Flask and requests libraries:
```bash
pip install -r requirements.txt
```

### 4. Run the Application
Start the Flask server:
```bash
python app.py
```

### 5. Access the Application
Open your web browser and go to:
- **Main Chat Interface**: [http://127.0.0.1:5000](http://127.0.0.1:5000)
- **New Landing Page**: [http://127.0.0.1:5000/landing](http://127.0.0.1:5000/landing)
- **Admin Dashboard**: [http://127.0.0.1:5000/admin](http://127.0.0.1:5000/admin) (Password: `accunity123`)

## How It Works
- **Intelligent Classification**: The AI classifies user queries into Billing, Technical, Account, or General support categories.
- **Sentiment Detection**: It analyzes the user's emotional state (Angry, Neutral, Happy).
- **Proactive Escalation**: The system automatically triggers an escalation if the user asks for an agent, is frustrated, if confidence is low, or if the user repeats an issue.
- **Contextual Memory**: Remembers the last 3 user queries to detect recurring issues and adapt its response accordingly.
- **Fail-Safe Processing**: If the local AI service is down, the system provides a graceful fallback response to maintain the user experience.
- **Analytics Dashboard**: Tracks session stats, query counts by category, and escalation rates.
