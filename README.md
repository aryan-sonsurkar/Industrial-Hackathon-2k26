<div align="center">

# Industrial-Hackathon-2k26 — SupportAI (AccUnity)

**Atendimento de suporte automatizado com IA local — classificação, sentimento e escalonamento proativo.**

[![Stack](https://img.shields.io/badge/stack-Flask_·_Python_·_Ollama-8b5cf6?style=for-the-badge)](#como-funciona)
[![AI](https://img.shields.io/badge/LLM-local_·_llama3_ou_mistral-3fb950?style=for-the-badge)](#como-funciona)
[![License: MIT](https://img.shields.io/badge/license-MIT-black?style=for-the-badge)](./SupportAI)

</div>

## Sobre o projeto

Projeto desenvolvido para o hackathon industrial de 2026: **SupportAI (AccUnity)**,
um sistema de atendimento de suporte automatizado que roda com **IA local**
(Ollama — llama3 ou mistral), sem depender de serviços de nuvem para gerar respostas.

O sistema completo está na pasta [`SupportAI/`](./SupportAI) — incluindo o
README de operação com instruções de instalação e o painel administrativo.

## Como funciona

- **Classificação inteligente** — a IA classifica cada consulta em Billing,
  Technical, Account ou General support
- **Detecção de sentimento** — analisa o estado emocional do usuário
  (Angry, Neutral, Happy)
- **Escalonamento proativo** — dispara escalonamento automático quando o
  usuário pede um atendente, está frustrado, quando a confiança da resposta
  é baixa ou quando o problema se repete (notificações por e-mail e WhatsApp)
- **Memória contextual** — lembra as últimas 3 consultas para detectar
  problemas recorrentes e adaptar a resposta
- **Fail-safe** — se o serviço de IA local cair, o sistema responde com
  fallback gracioso, sem quebrar a experiência
- **Painel de analytics** — estatísticas de sessão, consultas por categoria
  e taxa de escalonamento no dashboard administrativo

## Início rápido

```bash
cd SupportAI

# 1. Instale e rode o Ollama localmente, depois baixe o modelo:
ollama pull llama3

# 2. Instale as dependências Python:
pip install -r requirements.txt

# 3. Rode a aplicação:
python app.py
```

Abra no navegador:

| Interface | Endereço |
|---|---|
| Chat principal | http://127.0.0.1:5000 |
| Landing page | http://127.0.0.1:5000/landing |
| Painel admin | http://127.0.0.1:5000/admin |

## Estrutura

```
SupportAI/
├── app.py                  # Aplicação Flask (API + rotas)
├── templates/              # Chat, landing page e admin
├── static/                 # UI, temas e scripts
├── data/                   # Sessões, histórico, base de conhecimento, memória
├── test_api.py             # Testes da API
└── README.md               # Instruções detalhadas de operação
```

## Contexto

Este projeto faz parte do meu portfólio de projetos reais — cada um com seu
lugar na minha [cidade 3D de projetos](https://arssystem.vercel.app) 🏙️.

---

**Aryan Sonsurkar** — Diploma em Engenharia de Computação (MSBTE).
