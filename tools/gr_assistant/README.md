# GR Assistant Tools

Local, tool-augmented GR pipeline helpers. These tools provide deterministic
tensor computations and checks over FastAPI endpoints, with an orchestrator
client planned for later milestones.

## Setup
1) Create a virtual environment.
2) Install dependencies.

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r tools/gr_assistant/requirements.txt
```

## Run the tool server
```bash
uvicorn tools.gr_assistant.server:app --reload --port 8000
```

## Tests
```bash
pip install -r tools/gr_assistant/requirements-dev.txt
pytest tools/gr_assistant/tests
```

## Example call
```bash
curl -X POST http://127.0.0.1:8000/physics/metric-validate ^
  -H "Content-Type: application/json" ^
  -d "{\"coords\":[\"t\",\"x\",\"y\",\"z\"],\"g_dd\":[[-1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]}"
```

## Notes
- Endpoints are stateless; each request includes the full metric definition.
- This folder is standalone; it does not require the Node server to be running.
