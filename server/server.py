from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from fpdf import FPDF
from fastapi.responses import FileResponse
import os

import re
app = FastAPI()

# Allow Chrome Extension to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatData(BaseModel):
    messages: list

@app.get("/")
def read_root():
    return {"status": "OmniVault Server is Running!"}

@app.post("/process-history")
def process_chat(data: ChatData):
    print(f"Received {len(data.messages)} messages... Formatting.")

    # 1. Create the Context Prompt (The new instruction)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    intro_prompt = (
        "Here is a conversation history I had with another AI model. "
        "Please read through it to understand the context, then confirm you are ready "
        "to continue the conversation from where we left off.\n\n"
        "--- START OF HISTORY ---\n\n"
    )

    formatted_text = intro_prompt + f"# OmniVault Archive ({timestamp})\n\n"

    # 2. Loop through messages
    for msg in data.messages:
        role = msg.get('role', 'Unknown').capitalize()
        content = msg.get('content', '')
        formatted_text += f"**{role}:**\n{content}\n\n---\n\n"

    formatted_text += "--- END OF HISTORY ---"

    return {"clean_text": formatted_text}


"""
# ... existing code ...
import re

# ... existing imports ...

def clean_text(text):
    # 1. Remove Emojis (Characters outside the Basic Multilingual Plane)
    #    FPDF cannot handle these at all.
    text = re.sub(r'[^\u0000-\uFFFF]', '', text)
    
    # 2. Replace "Fancy" formatting characters that crash FPDF
    #    This maps specific Unicode punctuation to safe ASCII equivalents
    replacements = {
        '\u2014': '--',   # Em Dash (—) -> --
        '\u2013': '-',    # En Dash (–) -> -
        '\u2018': "'",    # Left Smart Quote (‘) -> '
        '\u2019': "'",    # Right Smart Quote (’) -> '
        '\u201c': '"',    # Left Smart Double Quote (“) -> "
        '\u201d': '"',    # Right Smart Double Quote (”) -> "
        '\u2022': '-',    # Bullet Point (•) -> -
        '\u2026': '...',  # Ellipsis (…) -> ...
    }
    
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
        
    return text

@app.post("/download-pdf")
def download_pdf(data: ChatData):
    pdf = FPDF()
    pdf.add_page()
    
    # 1. Setup Font (use built-in to avoid encoding issues)
    pdf.set_font("Arial", size=12)

    # 2. Header
    pdf.set_font_size(16)
    pdf.cell(0, 10, txt="OmniVault Chat Export", ln=True, align='C')
    pdf.ln(10)

    # 3. Content Loop
    pdf.set_font_size(11)
    
    for msg in data.messages:
        role = msg.get('role', 'Unknown').capitalize()
        content = msg.get('content', '')

        # --- CLEAN THE TEXT ---
        final_role = clean_text(role)
        final_content = clean_text(content)
        
        # 4. Role Label (Blue)
        pdf.set_text_color(0, 50, 150)
        pdf.cell(0, 8, txt=f"[{final_role}]", ln=True)
        
        # 5. Message Body (Black)
        pdf.set_text_color(0, 0, 0)
        pdf.multi_cell(0, 6, txt=final_content)
        pdf.ln(5)
        
        # 6. Separator Line
        pdf.set_draw_color(200, 200, 200)
        pdf.cell(0, 0, border="T")
        pdf.ln(5)

    # 7. Save & Return
    filename = "chat_export.pdf"
    pdf.output(filename)
    return FileResponse(path=filename, filename=filename, media_type='application/pdf')
"""
@app.post("/download-pdf")
def download_pdf(data: ChatData):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # 1. Add Header
    pdf.set_font("Arial", "B", 16)
    pdf.cell(200, 10, txt="OmniVault Chat Export", ln=True, align='C')
    pdf.ln(10)

    # 2. Add Chat Content
    pdf.set_font("Arial", size=11)
    
    for msg in data.messages:
        role = msg.get('role', 'Unknown').capitalize()
        content = msg.get('content', '')
        
        # Role Label (Bold)
        pdf.set_font("Arial", "B", 11)
        pdf.multi_cell(0, 8, f"{role}:")
        
        # Message Content (Regular)
        # Note: FPDF struggles with emojis/Chinese characters by default.
        # We will use a simple encoding fix for now.
        pdf.set_font("Arial", "", 11)
        clean_content = content.encode('latin-1', 'replace').decode('latin-1')
        pdf.multi_cell(0, 6, clean_content)
        pdf.ln(5)
        
        # Separator
        pdf.cell(0, 0, border="T")
        pdf.ln(5)

    # 3. Save to a temporary file
    filename = "chat_export.pdf"
    pdf.output(filename)
    
    # 4. Return the file to the user
    return FileResponse(path=filename, filename=filename, media_type='application/pdf')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)