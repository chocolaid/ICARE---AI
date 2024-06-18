import io
from google.oauth2 import service_account
from google.cloud import speech

client_file = 'sa-speech.json'
credentials = service_account.Credentials.from_service_account_file(client_file)
client = speech.SpeechClient(credentials=credentials)

#load the audio file
audio_file = 'google.mp3'
with io.open(audio_file, 'rb') as f:
    content = f.read()
    audio = speech.RecognitionAudio(content=content)
    pass

config = speech.RecognitionConfig(
    encoding = speech.RecognitionConfig.AudioEncoding.MP3,
    sample_rate_hertz=44100,
    language_code='en-US',
    model='video'
)

response = client.recognize(config=config, audio=audio)
print(response.results[0].alternatives)