import os
import json
import requests
import time
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Constants
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3" # or "mistral"
HISTORY_FILE = os.path.join(BASE_DIR, "data", "history.json")
MEMORY_FILE = os.path.join(BASE_DIR, "data", "memory.json")
DATA_DIR = os.path.join(BASE_DIR, "data")

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize memory and history if not present
if not os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, 'w') as f:
        json.dump([], f)

if not os.path.exists(MEMORY_FILE):
    with open(MEMORY_FILE, 'w') as f:
        json.dump([], f)

def get_memory():
    """Returns the last 3 user queries from memory."""
    try:
        with open(MEMORY_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def update_memory(query):
    """Updates memory with the latest user query, keeping only the last 3."""
    memory = get_memory()
    memory.append(query)
    if len(memory) > 3:
        memory = memory[-3:]
    with open(MEMORY_FILE, 'w') as f:
        json.dump(memory, f)

def log_interaction(query, response_data):
    """Logs the interaction into history.json."""
    try:
        with open(HISTORY_FILE, 'r') as f:
            history = json.load(f)
    except:
        history = []
    
    log_entry = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "query": query,
        "category": response_data.get("category", "General"),
        "escalation": response_data.get("escalation", "No")
    }
    history.append(log_entry)
    
    with open(HISTORY_FILE, 'w') as f:
        json.dump(history, f)

def check_repeated_issue(query):
    """Checks if the same issue was reported in the last 3 queries."""
    memory = get_memory()
    # Simple check for repeated query
    if query in memory:
        return True
    return False

def parse_ollama_output(raw_text):
    """
    Parses the raw text output from Ollama into a structured dictionary.
    Robust parser: scans all lines for known keys, handles preamble/extra text.
    """
    parsed = {
        "category": "General",
        "service": "General Support",
        "sentiment": "Neutral",
        "confidence": 50,
        "issue": "N/A",
        "response": "How can I help you today?",
        "escalation": "No",
        "reason": "N/A"
    }

    # Map of recognized keys (lowercase) to parsed dict keys
    key_map = {
        "category": "category",
        "service": "service",
        "sentiment": "sentiment",
        "confidence": "confidence",
        "issue": "issue",
        "response": "response",
        "escalation": "escalation",
        "reason": "reason"
    }

    lines = raw_text.strip().split('\n')
    current_key = None
    current_val_lines = []

    def flush():
        """Store accumulated multi-line value for the current key."""
        if current_key and current_val_lines:
            val = ' '.join(current_val_lines).strip()
            if current_key == "confidence":
                try:
                    parsed["confidence"] = int(''.join(filter(str.isdigit, val)) or '50')
                except:
                    parsed["confidence"] = 50
            else:
                parsed[current_key] = val

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if this line starts with a known key (e.g. "Category: Billing")
        matched = False
        if ':' in stripped:
            potential_key, potential_val = stripped.split(':', 1)
            normalized = potential_key.strip().lower()
            if normalized in key_map:
                flush()  # Save previous key's accumulated value
                current_key = key_map[normalized]
                current_val_lines = [potential_val.strip()]
                matched = True

        # If not a new key, append to the current key's value (multi-line responses)
        if not matched and current_key:
            current_val_lines.append(stripped)

    flush()  # Save the last key
    return parsed

def get_ai_response(user_input):
    """Calls Ollama API and returns structured response."""
    
    is_repeated = check_repeated_issue(user_input)
    prompt_prefix = "I see you're still facing this issue... " if is_repeated else ""
    
    prompt = f"""You are an AI Customer Support Assistant for an IT company.

The company provides:
- Web Development
- Mobile App Development
- Digital Marketing
- Software Solutions

Analyze the user query and respond ONLY in the exact format below. Do NOT add any extra text, greetings, or explanation outside the format.

Category: <one of: Billing, Technical, Account, General>
Service: <most relevant service from the company's offerings>
Sentiment: <one of: Angry, Neutral, Happy>
Confidence: <integer from 0 to 100>
Issue: <one line summary of the user's issue>
Response: <2 to 4 line helpful response to the user>
Escalation: <Yes or No>
Reason: <brief reason for the escalation decision>

User Query: {user_input}"""

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    try:
        # Timeout tuple: (connect_timeout, read_timeout)
        # llama3 on CPU can take up to 120 seconds — never use a short timeout
        response = requests.post(OLLAMA_URL, json=payload, timeout=(5, 120))
        if response.status_code == 200:
            raw_output = response.json().get("response", "")
            parsed_data = parse_ollama_output(raw_output)
            
            # Additional Escalation Checks (Manual overrides)
            if any(word in user_input.lower() for word in ["agent", "not helpful"]):
                parsed_data["escalation"] = "Yes"
                parsed_data["reason"] = "User explicitly requested agent or expressed frustration."
            
            if parsed_data["confidence"] < 75:
                parsed_data["escalation"] = "Yes"
                parsed_data["reason"] = "Low confidence in AI analysis."
                
            if is_repeated:
                parsed_data["response"] = prompt_prefix + parsed_data["response"]
                parsed_data["escalation"] = "Yes"
                parsed_data["reason"] = "User repeating issue multiple times."

            return parsed_data
        else:
            raise Exception("Ollama API returned error status.")
    except Exception as e:
        print(f"Fallback triggered due to: {e}")
        return {
            "category": "General",
            "service": "General Support",
            "sentiment": "Neutral",
            "confidence": 0,
            "issue": "N/A",
            "response": "We are facing technical issues. Please try again later.",
            "escalation": "Yes",
            "reason": "Ollama service unavailable or timeout."
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get("message", "")
    
    if not user_input:
        return jsonify({"error": "Empty message"}), 400
    
    # Get structured AI response
    response_data = get_ai_response(user_input)
    
    # Update memory
    update_memory(user_input)
    
    # Log interaction
    log_interaction(user_input, response_data)
    
    return jsonify(response_data)

@app.route('/stats', methods=['GET'])
def stats():
    try:
        with open(HISTORY_FILE, 'r') as f:
            history = json.load(f)
    except:
        history = []
        
    total_queries = len(history)
    category_counts = {}
    escalation_count = 0
    
    for entry in history:
        cat = entry.get("category", "General")
        category_counts[cat] = category_counts.get(cat, 0) + 1
        if entry.get("escalation") == "Yes":
            escalation_count += 1
            
    return jsonify({
        "total_queries": total_queries,
        "category_counts": category_counts,
        "escalation_count": escalation_count
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
