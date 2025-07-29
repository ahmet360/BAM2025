"""Test cases for the three API endpoints: Chat, STT, and TTS."""
import requests
import base64
import os

BASE_URL = "http://localhost:8000"

def test_chat_api():
    """Test the chat API endpoint."""
    print("Testing Chat API...")
    
    payload = {
        "message": "Hello, how are you today?"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {result.get('response', 'No response field')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    print("-" * 50)

def test_stt_api():
    """Test the speech-to-text API endpoint."""
    print("Testing Speech-to-Text API...")
    
    # Path to your WAV file in assets
    wav_file_path = "../frontend/src/assets/wikipediaOcelot.wav"
    
    if not os.path.exists(wav_file_path):
        print(f"WAV file not found at {wav_file_path}")
        print("Please ensure you have a WAV file in frontend/src/assets/")
        return
    
    try:
        with open(wav_file_path, 'rb') as audio_file:
            files = {
                'file': ('wikipediaOcelot.wav', audio_file, 'audio/wav')
            }
            
            response = requests.post(f"{BASE_URL}/speech-to-text", files=files)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Transcription: {result.get('transcription', 'No transcription field')}")
            else:
                print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    print("-" * 50)

def test_tts_api():
    """Test the text-to-speech API endpoint."""
    print("Testing Text-to-Speech API...")
    
    payload = {
        "text": "Hello, this is a test of the text to speech functionality."
    }
    
    try:
        response = requests.post(f"{BASE_URL}/text-to-speech", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            audio_base64 = result.get('audio', '')
            
            if audio_base64:
                # Decode and save the audio file
                audio_data = base64.b64decode(audio_base64)
                output_path = "test_output.wav"
                
                with open(output_path, 'wb') as f:
                    f.write(audio_data)
                
                print(f"Audio saved to {output_path}")
                print(f"Audio length: {len(audio_data)} bytes")
            else:
                print("No audio data received")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")
    
    print("-" * 50)

if __name__ == "__main__":
    print("Starting API Tests...")
    print("=" * 50)
    
    # Test all three APIs
    test_chat_api()
    test_stt_api()
    test_tts_api()
    
    print("All tests completed!")
