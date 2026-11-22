# iTip repository guide

## Project layout

- `frontend/` contains the Next.js pages, React components, and the same-origin API proxy.
- `backend/` contains Flask routes, the LangGraph workflow, PostgreSQL schema, and knowledge import.
- `docs/` contains the development and deployment guide, architecture, requirements, and asset notes. Keep `README.md` and `README-zh.md` aligned on setup and features.

## Development

- Use Python 3.12, Node.js 22, and PostgreSQL. Copy each service’s `.env.example` for local configuration. Keep actual environment files, database credentials, and user data out of Git.
- From the repository root, install `backend/requirements.txt`, run `python -m flask --app backend/app.py init-db`, then run `python -m flask --app backend/app.py ingest backend/knowledge_seed.json` against a development database.
- Use `python -m flask --app backend/app.py run --port 5000` at the root and `npm run dev` under `frontend/` to start both services. See [docs/DEV.md](docs/DEV.md) for the complete commands.

## Change and verify

- Keep browser API calls relative to the frontend origin. Preserve session and conversation ownership checks in Flask and the AI SDK UI stream format for chat.
- Use parameterized PostgreSQL queries. Keep source identifiers, aliases, relationships, and HTTPS citations in sync when editing the starter corpus.
- Run `npm run lint` and `npm run build` from `frontend/` for frontend changes. Exercise changed Flask routes against PostgreSQL and check `/api/health`. For retrieval changes, verify a known query returns relevant sources.
- Update [docs/DEV.md](docs/DEV.md) and the corresponding `.env.example` when changing deployment settings or environment variables.
