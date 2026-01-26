# OmniVault

OmniVault is a lightweight FastAPI service plus a Chrome extension for collecting and formatting chat history into clean Markdown archives.

## What’s in this repo
- `server/` — FastAPI server that formats chat messages into Markdown.
- `extension/` — Chrome extension content scripts and UI.
- `business_plan.py`, `make_pdf.py` — scripts used to generate project PDFs.
- `OmniVault_Business_Plan.pdf`, `OmniVault_Implementation_Plan.pdf` — generated docs.

## Quick start (Windows)
1) Activate the virtual environment:
   ```
   .\.venv\Scripts\Activate.ps1
   ```
2) Run the server:
   ```
   python server\server.py
   ```
3) Test it in a browser:
   - `http://localhost:8000/` should return `{"status":"OmniVault Server is Running!"}`

If port 8000 is busy, run:
```
python -m uvicorn server.server:app --host 0.0.0.0 --port 8001
```

## API endpoints
- `GET /` — health check.
- `POST /process-history` — accepts `{"messages":[...]}` and returns formatted Markdown.

## Chrome extension (manual load)
1) Open Chrome → `chrome://extensions/`.
2) Enable **Developer mode**.
3) Click **Load unpacked** and select the `extension/` folder.
4) Use the extension and confirm it can call the local server.

## How the server works
- Accepts a list of message objects with `role` and `content`.
- Formats them into Markdown with timestamps and separators.
- Returns the formatted content in `clean_text`.

## Common issues
- **Port in use**: run on 8001 (see above).
- **CORS**: server allows all origins to support the extension.

## Contributing
If you’re new to Git or GitHub, see `AGENTS.md` for a guided workflow and explanations.
