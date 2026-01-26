from fpdf import FPDF

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, 'OmniVault AI Transfer - Technical Implementation Plan', 0, 1, 'C')
        self.ln(10)

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.set_fill_color(200, 220, 255)
        self.cell(0, 10, title, 0, 1, 'L', 1)
        self.ln(4)

    def chapter_body(self, body):
        self.set_font('Arial', '', 11)
        self.multi_cell(0, 6, body)
        self.ln()

    def code_block(self, code):
        self.set_font('Courier', '', 9)
        self.set_fill_color(240, 240, 240)
        self.multi_cell(0, 5, code, 1, 'L', True)
        self.ln()

pdf = PDF()
pdf.add_page()

# --- CONTENT SECTIONS ---

# 1. Architecture
pdf.chapter_title('1. The Architecture Stack')
pdf.chapter_body(
    "Frontend: Chrome Extension (Manifest V3)\n"
    "   - Language: JavaScript (Vanilla), HTML, CSS\n"
    "   - Role: Scrapes text from ChatGPT, Automates pasting into Gemini.\n\n"
    "Backend: Local Server\n"
    "   - Language: Python 3.10+\n"
    "   - Framework: FastAPI (Fast, modern, handles async)\n"
    "   - Role: Receives JSON data, cleans it, converts to Markdown."
)

# 2. Implementation Steps
pdf.chapter_title('2. Step-by-Step Implementation')
pdf.chapter_body(
    "Phase 1: Setup\n"
    "   - Create folders: /omnivault-extension and /omnivault-server\n"
    "   - Install libraries: pip install fastapi uvicorn beautifulsoup4\n\n"
    "Phase 2: The Scraper (Extension)\n"
    "   - Detect Active Chat: Listen for URL changes (chatgpt.com/c/...). Save URL.\n"
    "   - Scrape DOM: Find <div class='text-message'>. Extract text to JSON.\n"
    "   - Send to Python: POST request to localhost:8000.\n\n"
    "Phase 3: The Converter (Python)\n"
    "   - API Endpoint: /process-history\n"
    "   - Logic: Loop through JSON. Convert User/AI roles to Markdown (**You**: ...).\n\n"
    "Phase 4: The Injector (Automation)\n"
    "   - Open Gemini: Extension opens chrome.tabs.create({url: 'gemini.google.com'}).\n"
    "   - Paste & Send: Inject script to find contenteditable div, insert text, click Send."
)

# 3. Server Code
pdf.chapter_title('3. Backend Code (server.py)')
pdf.chapter_body('Save this as server.py and run with: uvicorn server:app --reload')
pdf.code_block(
"""from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Fix CORS errors (Mandatory for extensions)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatData(BaseModel):
    messages: list

@app.post("/process-history")
def process_chat(data: ChatData):
    formatted_text = "# Imported History\\n\\n"
    for msg in data.messages:
        role = msg.get('role', 'Unknown')
        content = msg.get('content', '')
        formatted_text += f"**{role.upper()}:** {content}\\n\\n---\\n\\n"
    
    return {"clean_text": formatted_text}
"""
)

# 4. Manifest Code
pdf.chapter_title('4. Extension Config (manifest.json)')
pdf.chapter_body('Save this in your extension folder.')
pdf.code_block(
"""{
  "manifest_version": 3,
  "name": "OmniVault AI Transfer",
  "version": "1.0",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": [
    "https://chatgpt.com/*",
    "https://gemini.google.com/*",
    "http://localhost:8000/*"
  ],
  "background": { "service_worker": "background.js" },
  "content_scripts": [
    { "matches": ["https://chatgpt.com/*"], "js": ["content_gpt.js"] },
    { "matches": ["https://gemini.google.com/*"], "js": ["content_gemini.js"] }
  ],
  "action": { "default_popup": "popup.html" }
}"""
)

# 5. Risks
pdf.chapter_title('5. Critical Gotchas')
pdf.chapter_body(
    "1. CORS Errors: Browsers block extensions from talking to localhost unless you configure CORS in FastAPI.\n"
    "2. Class Names: ChatGPT changes CSS class names often. Use generic selectors or update your scraper regularly.\n"
    "3. Input Box: Gemini uses a rich-text editor, not a simple input. You may need to use document.execCommand or ClipboardEvent to paste text programmatically."
)

# Output
pdf.output('OmniVault_Implementation_Plan.pdf')
print("Success! Generated 'OmniVault_Implementation_Plan.pdf' in your folder.")