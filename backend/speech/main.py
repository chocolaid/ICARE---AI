from flask import Flask, request, jsonify
import os, uuid, io, base64, subprocess  # Import subprocess module
from werkzeug.utils import secure_filename
from google.oauth2 import service_account
from google.cloud import speech, texttospeech
from datetime import datetime

from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Upload folder
UPLOAD_FOLDER = 'audio'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SECRET_KEY'] = 'Shits!'

# Get the directory of the current script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def log_action(message):
    """Logs a message to the console with a timestamp."""
    print(f"[ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ] {message}")

@app.route('/audio-receiver', methods=['POST'])
def receiver():
    log_action("Starting audio-receiver processing...")
    try:
        audio_file = request.files['audio']
        log_action("Received audio file: " + audio_file.filename)
        audio_filename = secure_filename(audio_file.filename)
        audio_name = str(uuid.uuid1()) + '_' + audio_filename
        audio_path = os.path.join(app.config['UPLOAD_FOLDER'], audio_name)
        audio_file.save(audio_path)
        log_action(f"Saved audio file to: {audio_path}")

        # Convert the WAV audio file to a format accepted by Google
        converted_audio_name = audio_name.rsplit('.', 1)[0] + '_converted.wav'
        converted_audio_path = os.path.join(app.config['UPLOAD_FOLDER'], converted_audio_name)

        # Run ffmpeg to convert WAV to the required format
        log_action("Starting ffmpeg conversion...")
        subprocess.run(
            ['ffmpeg', '-i', audio_path, '-ac', '1', '-ar', '16000', converted_audio_path],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True
        )
        log_action("Finished ffmpeg conversion.")

        client_file = os.path.join(BASE_DIR, 'speech-text', 'sa-speech.json')
        credentials = service_account.Credentials.from_service_account_file(client_file)
        client = speech.SpeechClient(credentials=credentials)
        log_action("Google Speech-to-Text client initialized.")

        # Load the converted WAV audio file
        log_action("Loading audio file for transcription...")
        with io.open(converted_audio_path, 'rb') as f:
            content = f.read()
            audio = speech.RecognitionAudio(content=content)

        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code='en-US',
            model='video'
        )
        log_action("Starting transcription...")
        response = client.recognize(config=config, audio=audio)
        log_action("Transcription completed.")

        transcripts = []

        if not response.results:
            log_action("No transcription results found.")
            return jsonify({'error': 'No transcription results found'}), 500

        for result in response.results:
            transcripts.append(result.alternatives[0].transcript)
            log_action(f"Appended transcript: {result.alternatives[0].transcript}")

        audiome = transcripts[0] if transcripts else 'No transcript available'
        log_action(f"Returning transcript: {audiome}")
        return jsonify({'transcript': audiome})

    except Exception as e:
        log_action(f"Error in audio-receiver: {str(e)}")
        return jsonify({'error': 'Server error', 'message': str(e)}), 500

@app.route('/send-text/<string:text>')
def sendtext(text):
    log_action("Starting send-text processing...")
    try:
        client_file = os.path.join(BASE_DIR, 'speech-text', 'sa-speech.json')
        credentials = service_account.Credentials.from_service_account_file(client_file)
        client = texttospeech.TextToSpeechClient(credentials=credentials)
        log_action("Google Text-to-Speech client initialized.")

        inputs = text
        synthesis_input = texttospeech.SynthesisInput(text=inputs)
        voice = texttospeech.VoiceSelectionParams(language_code="en-US", ssml_gender=texttospeech.SsmlVoiceGender.MALE, name="en-US-Journey-D")
        audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

        log_action("Starting text-to-speech conversion...")
        response = client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)
        log_action("Text-to-speech conversion completed.")

        # Encode audio content to base64
        audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
        log_action("Encoding audio to base64...")
        return jsonify({'audio_base64': audio_base64})

    except Exception as e:
        log_action(f"Error in send-text: {str(e)}")
        return jsonify({'error': 'Server error', 'message': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=6767)