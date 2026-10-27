<div align="center">

# Industrial-Hackathon-2k26 — SupportAI (AccUnity)

**AI-powered customer support automation — local LLMs, sentiment detection, proactive escalation.**

[![Stack](https://img.shields.io/badge/stack-Flask_·_Python_·_Ollama-8b5cf6?style=for-the-badge)](#how-it-works)
[![AI](https://img.shields.io/badge/LLM-local_·_llama3_or_mistral-3fb950?style=for-the-badge)](#how-it-works)
[![License: MIT](https://img.shields.io/badge/license-MIT-black?style=for-the-badge)](./SupportAI)

</div>

## About the project

Built for the 2026 industrial hackathon: **SupportAI (AccUnity)**, an
automated customer support system that runs on **local AI** (Ollama —
llama3 or mistral), with no dependency on cloud services for generating
responses.

The complete system lives in the [`SupportAI/`](./SupportAI) folder —
including its own operations README with setup instructions and the admin
dashboard.

## How it works

- **Intelligent classification** — the AI classifies each query into
  Billing, Technical, Account, or General support
- **Sentiment detection** — analyzes the user's emotional state
  (Angry, Neutral, Happy)
- **Proactive escalation** — automatically triggers escalation when the
  user asks for an agent, is frustrated, when response confidence is low,
  or when the issue repeats (email and WhatsApp notifications)
- **Contextual memory** — remembers the last 3 user queries to detect
  recurring issues and adapt its responses
- **Fail-safe processing** — if the local AI service goes down, the system
  falls back gracefully without breaking the user experience
- **Analytics dashboard** — session stats, queries by category, and
  escalation rates in the admin dashboard

## Quick start

```bash
cd SupportAI

# 1. Install and run Ollama locally, then pull the model:
ollama pull llama3

# 2. Install Python dependencies:
pip install -r requirements.txt

# 3. Run the application:
python app.py
```

Open in your browser:

| Interface | Address |
|---|---|
| Main chat | http://127.0.0.1:5000 |
| Landing page | http://127.0.0.1:5000/landing |
| Admin dashboard | http://127.0.0.1:5000/admin |

## Structure

```
SupportAI/
├── app.py                  # Flask application (API + routes)
├── templates/              # Chat, landing page, and admin
├── static/                 # UI, themes, and scripts
├── data/                   # Sessions, history, knowledge base, memory
├── test_api.py             # API tests
└── README.md               # Detailed operations instructions
```

## Context

This project is part of my portfolio of real projects — each one has its
own place in my [3D project city](https://arssystem.vercel.app) 🏙️.

---

**Aryan Sonsurkar** — Diploma in Computer Engineering (MSBTE).
