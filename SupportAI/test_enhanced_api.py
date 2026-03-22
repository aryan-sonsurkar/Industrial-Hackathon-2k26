import requests
import json

base = "http://127.0.0.1:5000"

# Enhanced test queries covering all new features
queries = [
    "My invoice is incorrect and I was charged twice!",
    "My website is down and I cannot access the dashboard",
    "This is not helpful, I want to speak to a human agent",
    "I need help building a React frontend for my e-commerce site",
    "Can you develop an iOS app for my startup?",
    "We need SEO optimization and Google Ads campaign management",
    "Looking for cloud integration with AWS and database solutions",
    "URGENT: My production server is down and we're losing money!",
    "I'm very frustrated with your service, this is unacceptable",
    "Hello, I need general information about your services"
]

print("=== Enhanced SupportAI API Test ===\n")

for i, q in enumerate(queries, 1):
    print(f"[TEST {i}]: {q}")
    try:
        r = requests.post(f"{base}/chat", json={"message": q}, timeout=90)
        d = r.json()
        
        print(f"  Category        : {d['category']}")
        print(f"  Service         : {d['service']}")
        print(f"  Sentiment       : {d['sentiment']}")
        print(f"  Confidence      : {d['confidence']}%")
        print(f"  Escalation      : {d['escalation']}")
        print(f"  Escalation Level: {d['escalation_level']}")
        print(f"  Issue           : {d['issue']}")
        print(f"  Response        : {d['response']}")
        print(f"  Decision Trace  : {d['decision_trace']}")
        print(f"  Reason          : {d['reason']}")
        print("-" * 80)
        
    except Exception as e:
        print(f"  ERROR: {e}")
        print("-" * 80)

print("\n[SESSION STATS]:")
try:
    r = requests.get(f"{base}/stats")
    stats = r.json()
    print(json.dumps(stats, indent=2))
except Exception as e:
    print(f"ERROR fetching stats: {e}")
