"""Safely load Azure OpenAI secrets from a fixed path."""
import importlib.util
import sys
import os

SECRET_PATH = r"C:\Users\ahmtt\Documents\VS\API KEY\secret.py"

class Secret:
    """Secrets for Azure OpenAI (loaded at runtime)."""
    AZURE_OPENAI_DEPLOYMENT: str = ""
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_SPEECH_STT_KEY: str = ""
    AZURE_SPEECH_STT_ENDPOINT: str = ""
    AZURE_SPEECH_STT_REGION: str = ""
    AZURE_SPEECH_TTS_KEY: str = ""
    AZURE_SPEECH_TTS_ENDPOINT: str = ""
    AZURE_SPEECH_TTS_REGION: str = ""


def load_secrets() -> Secret:
    """Dynamically import secret.py from fixed path. Fail gracefully if missing."""
    if not os.path.exists(SECRET_PATH):
        raise RuntimeError(f"secret.py not found at {SECRET_PATH}. Please create it with your Azure OpenAI credentials.")
    try:
        spec = importlib.util.spec_from_file_location("secret", SECRET_PATH)
        secret = importlib.util.module_from_spec(spec)
        sys.modules["secret"] = secret
        spec.loader.exec_module(secret)
        s = Secret()
        s.AZURE_OPENAI_DEPLOYMENT = getattr(secret, "AZURE_OPENAI_DEPLOYMENT", "")
        s.AZURE_OPENAI_API_KEY = getattr(secret, "AZURE_OPENAI_API_KEY", "")
        s.AZURE_OPENAI_ENDPOINT = getattr(secret, "AZURE_OPENAI_ENDPOINT", "")
        s.AZURE_SPEECH_STT_KEY = getattr(secret, "AZURE_SPEECH_STT_KEY", "")
        s.AZURE_SPEECH_STT_ENDPOINT = getattr(secret, "AZURE_SPEECH_STT_ENDPOINT", "")
        s.AZURE_SPEECH_STT_REGION = getattr(secret, "AZURE_SPEECH_STT_REGION", "")
        s.AZURE_SPEECH_TTS_KEY = getattr(secret, "AZURE_SPEECH_TTS_KEY", "")
        s.AZURE_SPEECH_TTS_ENDPOINT = getattr(secret, "AZURE_SPEECH_TTS_ENDPOINT", "")
        s.AZURE_SPEECH_TTS_REGION = getattr(secret, "AZURE_SPEECH_TTS_REGION", "")
        if not all([
            s.AZURE_OPENAI_DEPLOYMENT,
            s.AZURE_OPENAI_API_KEY,
            s.AZURE_OPENAI_ENDPOINT,
            s.AZURE_SPEECH_STT_KEY,
            s.AZURE_SPEECH_STT_ENDPOINT,
            s.AZURE_SPEECH_STT_REGION,
            s.AZURE_SPEECH_TTS_KEY,
            s.AZURE_SPEECH_TTS_ENDPOINT,
            s.AZURE_SPEECH_TTS_REGION,
        ]):
            raise RuntimeError("secret.py is missing required fields. Please check your credentials.")
        return s
    except Exception as e:
        raise RuntimeError("Failed to load secrets from secret.py. Please check the file and try again. [REDACTED]") from None 