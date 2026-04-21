import re
import os
import time
from pathlib import Path
import requests
from loguru import logger
from .tts_interface import TTSInterface

class TTSEngine(TTSInterface):
    def __init__(
        self,
        api_url: str = "http://127.0.0.1:9880/tts",
        text_lang: str = "en",
        emotion_file: str = "../../index-tts/examples/03_low_3.aac",
        speaker_audio_path: str = "../../index-tts/examples/chu_zit_cut.wav",
        output_format: str = "mp3",
        batch_size: str = "1",
        streaming_mode: str = "false"
    ):
        self.api_url = api_url
        self.text_lang = text_lang
        self.emotion_file = emotion_file
        self.speaker_audio_path = speaker_audio_path
        self.output_format = output_format
        self.batch_size = batch_size
        self.streaming_mode = streaming_mode

    def _resolve_api_file_path(self, api_file_path: str) -> str | None:
        """
        Resolve an API-returned file path into an existing absolute path.

        IndexTTS responses often return paths relative to the IndexTTS process
        working directory (e.g. "outputs/x.wav"). The backend may run from a
        different cwd, so we probe a few likely roots.
        """
        raw_path = Path(api_file_path)
        if raw_path.is_absolute():
            if raw_path.exists():
                return str(raw_path)
            return None

        backend_root = Path(__file__).resolve().parents[3]
        default_index_tts_root = (backend_root / "../../index-tts").resolve()
        env_index_tts_root = os.getenv("INDEX_TTS_ROOT")
        configured_index_tts_root = (
            Path(env_index_tts_root).expanduser().resolve()
            if env_index_tts_root
            else default_index_tts_root
        )

        candidate_roots = [
            configured_index_tts_root,
            Path.cwd(),
            Path.cwd().parent,
            backend_root,
            backend_root.parent,
            backend_root.parent / "index-tts",
        ]
        # Keep candidate roots stable while avoiding duplicate probes.
        deduped_roots = []
        seen_roots = set()
        for root in candidate_roots:
            root_str = str(root)
            if root_str not in seen_roots:
                deduped_roots.append(root)
                seen_roots.add(root_str)

        # Preserve compatibility with older APIs that returned "outputs/*".
        relative_candidates = [raw_path, Path("index-tts") / raw_path]

        # Some setups may create the file a moment after returning JSON.
        for _ in range(5):
            for root in deduped_roots:
                for rel in relative_candidates:
                    candidate = (root / rel).resolve()
                    if candidate.exists():
                        return str(candidate)
            time.sleep(0.2)

        return None

    def generate_audio(self, text, file_name_no_ext=None):
        file_ext = "mp3" if self.output_format.lower() == "mp3" else "wav"
        file_name = self.generate_cache_file_name(file_name_no_ext, file_ext)

        cleaned_text = re.sub(r"\[.*?\]", "", text)  

        data = {
            "text": cleaned_text
        }

        try:
            logger.info(f"Sending request to TTS API: {self.api_url}")
            response = requests.post(self.api_url, json=data, timeout=500)
            if response.status_code == 200:
                try:
                    json_resp = response.json()
                    if "file_path" in json_resp: 
                        api_file_path = json_resp["file_path"]
                        resolved_file_path = self._resolve_api_file_path(api_file_path)
                        logger.info(f"Audio file path from API: {api_file_path}")
                        if resolved_file_path:
                            logger.info(f"Resolved audio file path: {resolved_file_path}")
                            return resolved_file_path
                        logger.error(
                            "IndexTTS returned a file path that does not exist on backend host: "
                            f"{api_file_path}. Set INDEX_TTS_ROOT or run backend where that path is accessible."
                        )
                        return None
                except ValueError:
                    with open(file_name, "wb") as audio_file:
                        audio_file.write(response.content)
                    logger.info(f"Audio file saved locally: {file_name}")
                    return file_name

            else:
                logger.error(f"Error: Failed to generate audio. Status code: {response.status_code}, response: {response.text}")
                return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e}")
            return None
