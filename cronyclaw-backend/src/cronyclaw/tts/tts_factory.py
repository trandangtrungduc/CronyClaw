from typing import Type
from .tts_interface import TTSInterface

class TTSFactory:
    @staticmethod
    def get_tts_engine(engine_type, **kwargs) -> Type[TTSInterface]:
        if engine_type == "edge_tts":
            from .edge_tts import TTSEngine as EdgeTTSEngine

            return EdgeTTSEngine(kwargs.get("voice"))
        elif engine_type == "pyttsx3_tts":
            from .pyttsx3_tts import TTSEngine as Pyttsx3TTSEngine

            return Pyttsx3TTSEngine()
        elif engine_type == "cosyvoice2_tts":
            from .cosyvoice2_tts import TTSEngine as Cosyvoice2TTSEngine

            return Cosyvoice2TTSEngine(
                client_url=kwargs.get("client_url"),
                mode_checkbox_group=kwargs.get("mode_checkbox_group"),
                sft_dropdown=kwargs.get("sft_dropdown"),
                prompt_text=kwargs.get("prompt_text"),
                prompt_wav_upload_url=kwargs.get("prompt_wav_upload_url"),
                prompt_wav_record_url=kwargs.get("prompt_wav_record_url"),
                instruct_text=kwargs.get("instruct_text"),
                stream=kwargs.get("stream"),
                seed=kwargs.get("seed"),
                speed=kwargs.get("speed"),
                api_name=kwargs.get("api_name"),
            )
        elif engine_type == "index_tts":
            from .index_tts import TTSEngine as InTTSEngine
            return InTTSEngine(
                api_url=kwargs.get("api_url"),
                text_lang=kwargs.get("text_lang"),
                emotion_file=kwargs.get("emotion_file"),
                speaker_audio_path=kwargs.get("speaker_audio_path"),
                output_format=kwargs.get("output_format"),
                batch_size=kwargs.get("batch_size"),
                streaming_mode=kwargs.get("streaming_mode")
            )
        elif engine_type == "sherpa_onnx_tts":
            from .sherpa_onnx_tts import TTSEngine as SherpaOnnxTTSEngine

            return SherpaOnnxTTSEngine(**kwargs)
        else:
            raise ValueError(f"Unknown TTS engine type: {engine_type}")

if __name__ == "__main__":
    tts_engine = TTSFactory.get_tts_engine(
        "index_tts", 
        api_url="http://127.0.0.1:9880/tts"
    )
    tts_engine.generate_audio("This is a test of the index TTS engine.")
