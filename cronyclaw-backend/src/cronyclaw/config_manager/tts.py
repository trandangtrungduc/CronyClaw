# config_manager/tts.py
from pydantic import ValidationInfo, Field, model_validator
from typing import Literal, Optional, Dict, ClassVar
from .i18n import I18nMixin, Description


class EdgeTTSConfig(I18nMixin):
    """Configuration for Edge TTS."""

    voice: str = Field(..., alias="voice")

    DESCRIPTIONS: ClassVar[Dict[str, Description]] = {
        "voice": Description(
            en="Voice name to use for Edge TTS (use 'edge-tts --list-voices' to list available voices)",
            zh="Edge TTS 使用的语音名称（使用 'edge-tts --list-voices' 列出可用语音）",
        ),
    }


class Cosyvoice2TTSConfig(I18nMixin):
    """Configuration for Cosyvoice2 TTS."""

    client_url: str = Field(..., alias="client_url")
    mode_checkbox_group: str = Field(..., alias="mode_checkbox_group")
    sft_dropdown: str = Field(..., alias="sft_dropdown")
    prompt_text: str = Field(..., alias="prompt_text")
    prompt_wav_upload_url: str = Field(..., alias="prompt_wav_upload_url")
    prompt_wav_record_url: str = Field(..., alias="prompt_wav_record_url")
    instruct_text: str = Field(..., alias="instruct_text")
    stream: bool = Field(..., alias="stream")
    seed: int = Field(..., alias="seed")
    speed: float = Field(..., alias="speed")
    api_name: str = Field(..., alias="api_name")

    DESCRIPTIONS: ClassVar[Dict[str, Description]] = {
        "client_url": Description(
            en="URL of the CosyVoice Gradio web UI", zh="CosyVoice Gradio Web UI 的 URL"
        ),
        "mode_checkbox_group": Description(
            en="Mode checkbox group value", zh="模式复选框组值"
        ),
        "sft_dropdown": Description(en="SFT dropdown value", zh="SFT 下拉框值"),
        "prompt_text": Description(en="Prompt text", zh="提示文本"),
        "prompt_wav_upload_url": Description(
            en="URL for prompt WAV file upload", zh="提示音频文件上传 URL"
        ),
        "prompt_wav_record_url": Description(
            en="URL for prompt WAV file recording", zh="提示音频文件录制 URL"
        ),
        "instruct_text": Description(en="Instruction text", zh="指令文本"),
        "stream": Description(en="Streaming inference", zh="流式推理"),
        "seed": Description(en="Random seed", zh="随机种子"),
        "speed": Description(en="Speech speed multiplier", zh="语速倍数"),
        "api_name": Description(en="API endpoint name", zh="API 端点名称"),
    }


class IndexTTSConfig(I18nMixin):
    """Configuration for Index-TTS."""

    api_url: str = Field(..., alias="api_url")
    text_lang: str = Field(..., alias="text_lang")
    emotion_file: str = Field(..., alias="emotion_file")
    speaker_audio_path: str = Field(..., alias="speaker_audio_path")
    output_format: str = Field(..., alias="output_format")
    batch_size: str = Field(..., alias="batch_size")
    streaming_mode: str = Field(..., alias="streaming_mode")

    DESCRIPTIONS: ClassVar[Dict[str, Description]] = {
        "api_url": Description(
            en="URL of the Index-TTS API endpoint", zh="Index-TTS API 端点的 URL"
        ),
        "text_lang": Description(en="Language of the input text", zh="输入文本的语言"),
        "emotion_file": Description(
            en="Path to the emotion file for modulation", zh="用于调节的情感文件路径"
        ),
        "speaker_audio_path": Description(
            en="Path to reference speaker audio file", zh="参考发音人音频文件路径"
        ),
        "output_format": Description(
            en="Output media format (e.g., wav, mp3)", zh="输出媒体格式（如 wav，mp3）"
        ),
        "batch_size": Description(en="Batch size for processing", zh="处理批次大小"),
        "streaming_mode": Description(en="Enable streaming mode", zh="启用流式模式"),
    }


class SherpaOnnxTTSConfig(I18nMixin):
    """Configuration for Sherpa Onnx TTS."""

    vits_model: str = Field(..., alias="vits_model")
    vits_lexicon: Optional[str] = Field(None, alias="vits_lexicon")
    vits_tokens: str = Field(..., alias="vits_tokens")
    vits_data_dir: Optional[str] = Field(None, alias="vits_data_dir")
    vits_dict_dir: Optional[str] = Field(None, alias="vits_dict_dir")
    tts_rule_fsts: Optional[str] = Field(None, alias="tts_rule_fsts")
    max_num_sentences: int = Field(2, alias="max_num_sentences")
    sid: int = Field(1, alias="sid")
    provider: Literal["cpu", "cuda", "coreml"] = Field("cpu", alias="provider")
    num_threads: int = Field(1, alias="num_threads")
    speed: float = Field(1.0, alias="speed")
    debug: bool = Field(False, alias="debug")

    DESCRIPTIONS: ClassVar[Dict[str, Description]] = {
        "vits_model": Description(en="Path to VITS model file", zh="VITS 模型文件路径"),
        "vits_lexicon": Description(
            en="Path to lexicon file (optional)", zh="词典文件路径（可选）"
        ),
        "vits_tokens": Description(en="Path to tokens file", zh="词元文件路径"),
        "vits_data_dir": Description(
            en="Path to espeak-ng data directory (optional)",
            zh="espeak-ng 数据目录路径（可选）",
        ),
        "vits_dict_dir": Description(
            en="Path to Jieba dictionary directory (optional)",
            zh="结巴词典目录路径（可选）",
        ),
        "tts_rule_fsts": Description(
            en="Path to rule FSTs file (optional)", zh="规则 FST 文件路径（可选）"
        ),
        "max_num_sentences": Description(
            en="Maximum number of sentences per batch", zh="每批次最大句子数"
        ),
        "sid": Description(
            en="Speaker ID for multi-speaker models", zh="多说话人模型的说话人 ID"
        ),
        "provider": Description(
            en="Computation provider (cpu, cuda, or coreml)",
            zh="计算提供者（cpu、cuda 或 coreml）",
        ),
        "num_threads": Description(en="Number of computation threads", zh="计算线程数"),
        "speed": Description(en="Speech speed multiplier", zh="语速倍数"),
        "debug": Description(en="Enable debug mode", zh="启用调试模式"),
    }


class TTSConfig(I18nMixin):
    """Configuration for Text-to-Speech."""

    tts_model: Literal[
        "edge_tts",
        "cosyvoice2_tts",
        "index_tts",
        "sherpa_onnx_tts",
    ] = Field(..., alias="tts_model")

    edge_tts: Optional[EdgeTTSConfig] = Field(None, alias="edge_tts")
    cosyvoice2_tts: Optional[Cosyvoice2TTSConfig] = Field(None, alias="cosyvoice2_tts")
    index_tts: Optional[IndexTTSConfig] = Field(None, alias="index_tts")
    sherpa_onnx_tts: Optional[SherpaOnnxTTSConfig] = Field(
        None, alias="sherpa_onnx_tts"
    )

    DESCRIPTIONS: ClassVar[Dict[str, Description]] = {
        "tts_model": Description(
            en="Text-to-speech model to use", zh="要使用的文本转语音模型"
        ),
        "edge_tts": Description(en="Configuration for Edge TTS", zh="Edge TTS 配置"),
        "cosyvoice2_tts": Description(
            en="Configuration for Cosyvoice2 TTS", zh="Cosyvoice2 TTS 配置"
        ),
        "index_tts": Description(en="Configuration for IndexTTS", zh="IndexTTS 配置"),
        "sherpa_onnx_tts": Description(
            en="Configuration for Sherpa Onnx TTS", zh="Sherpa Onnx TTS 配置"
        ),
    }

    @model_validator(mode="after")
    def check_tts_config(cls, values: "TTSConfig", info: ValidationInfo):
        tts_model = values.tts_model

        if tts_model == "edge_tts" and values.edge_tts is not None:
            values.edge_tts.model_validate(values.edge_tts.model_dump())
        elif tts_model == "cosyvoice2_tts" and values.cosyvoice2_tts is not None:
            values.cosyvoice2_tts.model_validate(values.cosyvoice2_tts.model_dump())
        elif tts_model == "index_tts" and values.index_tts is not None:
            values.index_tts.model_validate(values.index_tts.model_dump())
        elif tts_model == "sherpa_onnx_tts" and values.sherpa_onnx_tts is not None:
            values.sherpa_onnx_tts.model_validate(values.sherpa_onnx_tts.model_dump())

        return values
