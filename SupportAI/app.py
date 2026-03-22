import os
import json
import requests
import time
import re
from datetime import datetime, timedelta
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
    Enhanced parser with decision trace and escalation level support.
    """
    parsed = {
        "category": "General",
        "service": "General Support",
        "sentiment": "Neutral",
        "confidence": 50,
        "issue": "N/A",
        "response": "How can I help you today?",
        "escalation": "No",
        "escalation_level": "low",
        "decision_trace": "Default response - no analysis performed",
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
        "escalation_level": "escalation_level",
        "decision_trace": "decision_trace",
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

def calculate_confidence_score(parsed_data, user_input, is_repeated):
    """
    Logic-based confidence scoring system.
    Returns confidence score (0-100) based on multiple factors.
    """
    score = 50  # Base score
    
    # Factor 1: Category specificity (20 points)
    specific_categories = ["Billing", "Technical", "Account"]
    if parsed_data.get("category") in specific_categories:
        score += 20
    elif parsed_data.get("category") == "General":
        score += 5
    
    # Factor 2: Sentiment clarity (15 points)
    if parsed_data.get("sentiment") in ["Angry", "Happy"]:
        score += 15
    elif parsed_data.get("sentiment") == "Neutral":
        score += 8
    
    # Factor 3: Issue clarity (15 points)
    issue = parsed_data.get("issue", "").lower()
    if issue and issue != "n/a" and len(issue) > 10:
        score += 15
    elif issue and len(issue) > 5:
        score += 8
    
    # Factor 4: Service specificity (10 points)
    service = parsed_data.get("service", "").lower()
    specific_services = ["web development", "mobile app development", "digital marketing", "software solutions"]
    if any(svc in service for svc in specific_services):
        score += 10
    
    # Factor 5: User input quality (10 points)
    if len(user_input) > 20 and not any(word in user_input.lower() for word in ["help", "hello", "hi", "test"]):
        score += 10
    elif len(user_input) > 10:
        score += 5
    
    # Factor 6: Repetition penalty (20 points)
    if is_repeated:
        score -= 20
    
    # Factor 7: Decision trace quality (10 points)
    trace = parsed_data.get("decision_trace", "").lower()
    if len(trace) > 50 and any(keyword in trace for keyword in ["because", "since", "due to", "based on"]):
        score += 10
    
    return max(0, min(100, score))

def determine_escalation_level(parsed_data, confidence, is_repeated, user_input):
    """
    Determines escalation level (low, medium, high) based on multiple factors.
    """
    escalation_score = 0
    
    # High escalation indicators
    if parsed_data.get("sentiment") == "Angry":
        escalation_score += 30
    if confidence < 60:
        escalation_score += 25
    if is_repeated:
        escalation_score += 20
    if any(word in user_input.lower() for word in ["agent", "human", "manager", "supervisor", "not helpful", "frustrated"]):
        escalation_score += 35
    if "urgent" in user_input.lower() or "emergency" in user_input.lower():
        escalation_score += 30
    
    # Medium escalation indicators
    if confidence < 80:
        escalation_score += 15
    if parsed_data.get("category") == "Billing":
        escalation_score += 10
    if "complaint" in user_input.lower() or "unhappy" in user_input.lower():
        escalation_score += 15
    
    if escalation_score >= 50:
        return "high"
    elif escalation_score >= 25:
        return "medium"
    else:
        return "low"

def enhance_service_mapping(user_input, category):
    """
    Intelligent service mapping based on query content and category.
    """
    user_lower = user_input.lower()
    
    # Web Development indicators
    web_keywords = ["website", "web", "frontend", "backend", "html", "css", "javascript", "react", "vue", "angular", "django", "flask"]
    if any(keyword in user_lower for keyword in web_keywords):
        return "Web Development"
    
    # Mobile App Development indicators
    mobile_keywords = ["app", "mobile", "ios", "android", "iphone", "smartphone", "tablet", "react native", "flutter"]
    if any(keyword in user_lower for keyword in mobile_keywords):
        return "Mobile App Development"
    
    # Digital Marketing indicators
    marketing_keywords = ["marketing", "seo", "social media", "advertising", "campaign", "brand", "promotion", "google ads", "facebook"]
    if any(keyword in user_lower for keyword in marketing_keywords):
        return "Digital Marketing"
    
    # Software Solutions indicators
    software_keywords = ["software", "system", "application", "platform", "integration", "api", "database", "cloud", "automation"]
    if any(keyword in user_lower for keyword in software_keywords):
        return "Software Solutions"
    
    # Category-based fallback
    if category == "Technical":
        return "Software Solutions"
    elif category == "Billing":
        return "General Support"
    else:
        return "General Support"

def generate_decision_trace(parsed_data, confidence, escalation_level, is_repeated, user_input):
    """
    Generates a detailed decision trace explaining the AI's reasoning.
    """
    trace_parts = []
    
    # Category reasoning
    category = parsed_data.get("category", "General")
    if category == "Billing":
        trace_parts.append(f"Detected billing-related keywords in query")
    elif category == "Technical":
        trace_parts.append(f"Identified technical issues or system problems")
    elif category == "Account":
        trace_parts.append(f"Recognized account management or user access concerns")
    else:
        trace_parts.append(f"General inquiry - no specific category detected")
    
    # Sentiment reasoning
    sentiment = parsed_data.get("sentiment", "Neutral")
    if sentiment == "Angry":
        trace_parts.append(f"User expresses frustration or anger - requires careful handling")
    elif sentiment == "Happy":
        trace_parts.append(f"User appears satisfied or positive")
    else:
        trace_parts.append(f"User maintains neutral emotional tone")
    
    # Confidence reasoning
    if confidence >= 80:
        trace_parts.append(f"High confidence ({confidence}%) - query is clear and specific")
    elif confidence >= 60:
        trace_parts.append(f"Moderate confidence ({confidence}%) - query has some ambiguity")
    else:
        trace_parts.append(f"Low confidence ({confidence}%) - query is unclear or complex")
    
    # Escalation reasoning
    if escalation_level == "high":
        trace_parts.append(f"High escalation risk - immediate attention may be required")
    elif escalation_level == "medium":
        trace_parts.append(f"Medium escalation risk - monitor for further indicators")
    else:
        trace_parts.append(f"Low escalation risk - standard support protocol sufficient")
    
    # Repetition reasoning
    if is_repeated:
        trace_parts.append(f"User has mentioned this issue before - potential unresolved problem")
    
    # Service mapping reasoning
    service = parsed_data.get("service", "General Support")
    if service != "General Support":
        trace_parts.append(f"Mapped to {service} based on query content")
    
    return "; ".join(trace_parts)

def get_ai_response(user_input):
    """Calls Ollama API and returns enhanced structured response."""
    
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
Service: <most relevant service from company offerings>
Sentiment: <one of: Angry, Neutral, Happy>
Confidence: <integer from 0 to 100>
Issue: <one line summary of the user's issue>
Response: <2 to 4 line helpful response to the user>
Escalation: <Yes or No>
Escalation_Level: <low, medium, or high>
Decision_Trace: <detailed explanation of AI reasoning process>
Reason: <brief reason for the escalation decision>

User Query: {user_input}"""

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    try:
        # Timeout tuple: (connect_timeout, read_timeout)
        response = requests.post(OLLAMA_URL, json=payload, timeout=(5, 120))
        if response.status_code == 200:
            raw_output = response.json().get("response", "")
            parsed_data = parse_ollama_output(raw_output)
            
            # Enhanced service mapping
            parsed_data["service"] = enhance_service_mapping(user_input, parsed_data.get("category", "General"))
            
            # Logic-based confidence scoring
            confidence = calculate_confidence_score(parsed_data, user_input, is_repeated)
            parsed_data["confidence"] = confidence
            
            # Determine escalation level
            escalation_level = determine_escalation_level(parsed_data, confidence, is_repeated, user_input)
            parsed_data["escalation_level"] = escalation_level
            
            # Generate decision trace
            parsed_data["decision_trace"] = generate_decision_trace(parsed_data, confidence, escalation_level, is_repeated, user_input)
            
            # Enhanced escalation logic
            escalation_required = False
            escalation_reasons = []
            
            if any(word in user_input.lower() for word in ["agent", "not helpful", "human", "manager", "supervisor"]):
                escalation_required = True
                escalation_reasons.append("User explicitly requested agent or expressed frustration")
            
            if confidence < 75:
                escalation_required = True
                escalation_reasons.append("Low confidence in AI analysis")
            
            if escalation_level == "high":
                escalation_required = True
                escalation_reasons.append("High escalation risk detected")
                
            if is_repeated:
                escalation_required = True
                escalation_reasons.append("User repeating issue multiple times")
                parsed_data["response"] = prompt_prefix + parsed_data["response"]
            
            parsed_data["escalation"] = "Yes" if escalation_required else "No"
            parsed_data["reason"] = "; ".join(escalation_reasons) if escalation_reasons else "No escalation required"

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
            "escalation_level": "high",
            "decision_trace": "System failure - unable to process query; fallback mode activated",
            "reason": "Ollama service unavailable or timeout"
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
