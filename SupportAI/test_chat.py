import requests
import json

url = "http://localhost:5000/chat"
headers = {"Content-Type": "application/json"}
data = {"message": "Hello"}

response = requests.post(url, headers=headers, json=data)
print(f"Status: {response.status_code}")
print(f"Response JSON:\n{json.dumps(response.json(), indent=2)}")
