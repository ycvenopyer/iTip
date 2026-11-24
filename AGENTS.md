# iTip repository guide

## Project layout

- `frontend/` contains the Next.js pages, React components, and the same-origin API proxy.
- `backend/` contains Flask routes, the LangGraph workflow, PostgreSQL schema, and knowledge import.
- `docs/` contains the development guide, architecture and source credits, product requirements, database design, and workbench specifications. Keep `README.md` and `README-zh.md` aligned on setup and features.

## Development

- Use Python 3.12, Node.js 22, and PostgreSQL. Copy each service’s `.env.example` for local configuration. Keep actual environment files, database credentials, and user data out of Git.
- From the repository root, install `backend/requirements.txt`, run `python -m flask --app backend/app.py init-db`, then run `python -m flask --app backend/app.py ingest backend/knowledge_seed.json` and `python -m flask --app backend/app.py ingest-study` against a development database.
- Use `python -m flask --app backend/app.py run --port 5000` at the root and `npm run dev` under `frontend/` to start both services. See [docs/dev.md](docs/dev.md) for the complete commands.

## Change and verify

- Keep browser API calls relative to the frontend origin. Preserve session and conversation ownership checks in Flask and the AI SDK UI stream format for chat.
- Use parameterized PostgreSQL queries. Keep source identifiers, aliases, relationships, and HTTPS citations in sync when editing the starter corpus.
- Preserve stable catalog IDs and keep image credits and crop coordinates in sync. Exercise two accounts when verifying favorites and practice-calendar ownership. Keep table and endpoint changes aligned with [database design](docs/database.md) and the corresponding workbench specification.
- Run `npm run lint` and `npm run build` from `frontend/` for frontend changes. Exercise changed Flask routes against PostgreSQL and check `/api/health`. For retrieval changes, verify a known query returns relevant sources.
- For login and chat UI changes, verify desktop and mobile layouts. Check keyboard access, the authenticated route, and same-origin requests using development or synthetic data.
- Update [docs/dev.md](docs/dev.md) and the corresponding `.env.example` when changing deployment settings or environment variables.
