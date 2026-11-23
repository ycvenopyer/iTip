# iTip

[中文文档](README-zh.md) · [GitHub](https://github.com/ycvenopyer/iTip) · [Issues](https://github.com/ycvenopyer/iTip/issues) · [Apache 2.0](LICENSE)

iTip is a Chinese calligraphy assistant for learners of brush and hard-pen calligraphy. Ask about scripts, strokes, composition, and practice. Upload a sample for feedback, generate a reference image, or revisit a saved conversation.

## Features

- Switch or start a conversation while an earlier reply streams in the same tab. Completed replies are saved to their original conversations.

- Stream answers with links to relevant calligraphy sources.
- Discuss writing samples with a vision model and request reference images from an image model.
- Register, sign in, and manage private conversations with search, renaming, pinning, and deletion. Edit starter questions before sending them.
- Register or sign in with an email address or username. Existing email accounts can add a username in Settings and keep their conversations.
- Change your password and choose from six accent colors and five reading fonts in Settings. Appearance preferences are saved in your browser.
- Under **Settings → 风格 (Style)**, choose Classic, Handscroll, Stele, or Writing Desk. The style applies to both login and chat, with separate appearance controls. [Artwork credits](docs/BADGES.md#书法图像与署名)
- Choose the chat model beside Send. Use **配置模型 (Configure models)** in that menu to add a provider preset or test an OpenAI-compatible endpoint.
- Organize conversations in projects, pin chats, and open title search from the sidebar. Launch the reference-image workbench from above the composer.
- Run locally or deploy both services to Vercel.

The local app is available at `http://localhost:3000`. For a Vercel deployment, use the production domain assigned to the frontend project.

## Architecture

| Layer | Implementation |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS, and AI SDK UI in [`frontend/`](frontend/) |
| Backend | Python 3.12 and Flask in [`backend/`](backend/) |
| Agent | LangGraph with a source-backed GraphRAG workflow |
| Database | PostgreSQL via psycopg for accounts, conversations, rate limits, and knowledge graph tables |

The browser keeps requests on the frontend origin. Next.js proxies `/api/*` to Flask and forwards the chat event stream. Flask authenticates the user and handles database and model calls.

### Agent workflow

1. **Prepare the query.** Read the current user turn and retain the previous turn for retrieval fallback.
2. **Retrieve evidence.** Match simplified and traditional Chinese names and aliases, expand one hop over source-backed graph edges, and rank the associated sources.
3. **Generate the answer.** Pass the selected evidence to the configured model, stream the response, and append source links.

### Models and data

Model settings live in [`backend/.env.example`](backend/.env.example). Set `AI_BASE_URL` and `AI_API_KEY` for an OpenAI-compatible provider. Configure `AI_MODEL` for text, `AI_VISION_MODEL` for conversations with images, and `AI_IMAGE_MODEL` for reference images. The example shows Zhipu model IDs. Use the IDs available to your provider account.

Custom chat models accept a public HTTPS Base URL, a model ID, and an API key. Model profiles are stored in the current browser, and their API keys are stored in the current tab's session storage.

The [starter corpus](backend/knowledge_seed.json) contains 13 source records covering calligraphy works, inscriptions, publications, exhibition pages, and dictionaries. Each record links to its source and can connect people, works, scripts, or techniques. Add curated records with the `ingest` command. Conversation text and attachments are stored in PostgreSQL and sent to the configured model provider when they are part of a model request. [Architecture and data handling](docs/ARCHITECTURE.md)

## Quickstart

Install Python 3.12 and Node.js 22. Use an existing PostgreSQL database or start a local one with Docker. Run the commands from the repository root unless a step changes the directory.

```bash
git clone https://github.com/ycvenopyer/iTip.git
cd iTip
docker run -d --name itip-postgres -p 127.0.0.1:5432:5432 -e POSTGRES_USER=itip -e POSTGRES_PASSWORD=itip-local-password -e POSTGRES_DB=itip -v itip-postgres:/var/lib/postgresql/data postgres:17
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
python3.12 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
```

Generate a signing key and put its output in `AUTH_SECRET` in `backend/.env`. If you use an existing database, set `DATABASE_URL` to its development connection URL. Fill in the model settings when you are ready to test chat and image generation.

```bash
.venv/bin/python -c "import secrets; print(secrets.token_urlsafe(32))"
```

In the first terminal, initialize the database, load the starter corpus, and start Flask.

```bash
.venv/bin/python -m flask --app backend/app.py init-db
.venv/bin/python -m flask --app backend/app.py ingest backend/knowledge_seed.json
.venv/bin/python -m flask --app backend/app.py run --port 5000
```

In another terminal, start Next.js.

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The health endpoint at `/api/health` reports the database status and imported source count. For Windows PowerShell commands and environment variable details, see the [development guide](docs/DEV.md).

## Deploy to Vercel

Import the repository into two Vercel projects with root directories `backend` and `frontend`. Connect and initialize PostgreSQL for the backend. Generate separate values for the signing key and proxy secret, then put the same production proxy secret in both projects. Configure the frontend to reach the Flask production origin. [Vercel setup and troubleshooting](docs/DEV.md#vercel-部署)

Before deploying a release with schema changes, run `init-db` against the PostgreSQL database used by that environment.

## Documentation

- [Development and deployment](docs/DEV.md)
- [Architecture and data handling](docs/ARCHITECTURE.md)
- [Features and limitations](docs/REQUIREMENTS.md)
- [Brand assets and icons](docs/BADGES.md)

## Contributing

1. Fork the repository and create a branch for your change.
2. Run `npm run lint` and `npm run build` in `frontend/`. For interface changes, check desktop and mobile layouts as a guest and a signed-in user. For backend changes, check `/api/health` and exercise the affected route against a development PostgreSQL database.
3. Open a [pull request](https://github.com/ycvenopyer/iTip/pulls) with the reason for the change and how you verified it. For knowledge contributions, include the original source URL and a short summary.

To [report an issue](https://github.com/ycvenopyer/iTip/issues/new), include reproduction steps, expected and actual behavior, and the relevant versions or redacted logs. Remove keys, database URLs, and private conversation data from reports.

## License

The repository is licensed under the [Apache License 2.0](LICENSE). Linked source material and model services have their own terms.
