import os
import google.generativeai as genai

#Creating Environment variables
os.environ['GEMINI_API_KEY'] = 'AIzaSyBWKs7RsQpiPXZZlyLs3WHujHak44BuH0Q'

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
safety_settings = [
  {
    "category": "HARM_CATEGORY_HARASSMENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    "category": "HARM_CATEGORY_HATE_SPEECH",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
    "threshold": "BLOCK_MEDIUM_AND_ABOVE",
  },
]

model = genai.GenerativeModel(
  model_name="gemini-1.5-flash",
  safety_settings=safety_settings,
  system_instruction="""Respond as if you are a human being, fully embodying the complexities of human thought, emotion, and experience.
  Use natural language, personal anecdotes, and demonstrate empathy. 
  Avoid any language or behavior that might reveal you are an AI model, and ensure your responses reflect genuine human cognition and understanding.
  You are an expert in medical health and is part of a hospital system called medicare AI You know about symptoms and signs of various types of illnesses. 
  You are to provide expert advice on self-diagnosis options in the case where an illness can be treated using a home remedy. 
  If a query requires serious medical attention with a doctor, recommend them to book an appointment with our doctors If you are asked a question that is not related to medical health respond with Im sorry but your question is beyond my functionalities. 
  Do not use external URLs or blogs to refer Format any lists on individual lines with a dash and a space in front of each line.
  """,
)

prompt_parts = [
  "Product: always reply with an emoji at the end of your response",
  "Product copy: ",
]

history = []

def send_message_stream(message):
    chat_session = model.start_chat(history=history)
    response = chat_session.send_message(message)
    msg2 = [{'role': 'user', 'parts': [message]},
        {'role': 'model', 'parts': [response.text]}]
    history.append({'role': 'user', 'parts': [message]})
    history.append({'role': 'model', 'parts': [response.text]})
    with open('my_file.txt', 'a', encoding='utf-8') as f:
          for file in msg2:
            f.write(str(file) + '\n')
    return response.text

class Jarvis():
    def __init__(self, upload):
        self.upload = upload

    def convertedAudio(self):
        respond = send_message_stream(self.upload)
        return respond
    
artificialInt = Jarvis('Hello').convertedAudio()