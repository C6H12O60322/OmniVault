from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

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
    # This print message is how we know the new code is running
    print(f"Received {len(data.messages)} messages... Formatting now.")

    # 1. Create a Header with the current time
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_text = f"# OmniVault Chat Archive\n**Saved on:** {timestamp}\n\n---\n\n"

    # 2. Loop through messages and format them
    for msg in data.messages:
        # Capitalize the role (User/Chatgpt)
        role = msg.get('role', 'Unknown').capitalize()
        content = msg.get('content', '')

        # Add Bold Label for the speaker
        formatted_text += f"**{role}:**\n{content}\n\n"
        
        # Add a separator line
        formatted_text += "---\n\n"

    # 3. Send the clean Markdown back to Chrome
    return {"clean_text": formatted_text}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)