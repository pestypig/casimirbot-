# Packages

Publishable packages so teams can integrate without cloning the repo.

SDK (Node 18+)
```
npm install casimir-sdk
```

CLI (Node 18+)
```
npm install -g casimir-cli
casimir verify --json adapter-request.json
```

Notes
- The CLI wraps `POST /api/agi/adapter/run` and `GET /api/agi/training-trace/export`.
- Default API base is `https://casimirbot.com` (override with `--url` or `CASIMIR_PUBLIC_BASE_URL`).
- Provide `--token` and `--tenant` when AGI auth/tenancy is enabled.
