import requests
import json

base = "http://127.0.0.1:5000"

queries = [
    "My invoice is incorrect and I was charged twice!",
    "My website is down and I cannot access the dashboard",
    "This is not helpful, I want to speak to a human agent"
]

for q in queries:
    print(f"\n[QUERY]: {q}")
    r = requests.post(f"{base}/chat", json={"message": q}, timeout=90)
    d = r.json()
    print(f"  Category   : {d['category']}")
    print(f"  Sentiment  : {d['sentiment']}")
    print(f"  Confidence : {d['confidence']}")
    print(f"  Escalation : {d['escalation']}")
    print(f"  Issue      : {d['issue']}")
    print(f"  Response   : {d['response']}")
    print(f"  Reason     : {d['reason']}")

print("\n[STATS]:")
r = requests.get(f"{base}/stats")
print(json.dumps(r.json(), indent=2))
