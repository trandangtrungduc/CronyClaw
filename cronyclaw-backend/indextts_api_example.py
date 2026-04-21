import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from indextts.infer_v2 import IndexTTS2

# Initialize FastAPI
app = FastAPI()

tts2 = IndexTTS2(
    cfg_path="checkpoints/config.yaml", 
    model_dir="checkpoints", 
    use_fp16=False, 
    use_cuda_kernel=True, 
    use_deepspeed=True
)

DEFAULT_EMO_FILE = "examples/09_happy_3.aac" 

class TextRequest(BaseModel):
    text: str

@app.post("/tts")
async def tts(request: TextRequest):
    text = request.text

    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    if not os.path.exists(DEFAULT_EMO_FILE):
        raise HTTPException(status_code=400, detail="Default emotion file not found")

    try:
        emo_name = os.path.splitext(os.path.basename(DEFAULT_EMO_FILE))[0]
        out_path = f"outputs/chun_{emo_name}.wav"
        
        tts2.infer(
            spk_audio_prompt="examples/chun.wav", 
            text=text,
            output_path=out_path,
            emo_audio_prompt=DEFAULT_EMO_FILE,
            verbose=True
        )
        
        return {"message": "Audio generated successfully", "file_path": out_path}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9880)