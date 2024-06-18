const express = require('express');
const https = require('https');
const app = express();
const port = 3301;
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const sentMessages = {};

// I had to add this one here because the pyhon version was giving me errors randomly so this is a temporary patch
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: './sa-speech.json',
});

app.use(bodyParser.json()); 


app.post('/synthesize', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).send({ error: 'Text is required' });
  }

  const request = {
    input: { text: text },
    voice: { languageCode: 'en-US', ssmlGender: 'MALE', name: 'en-US-Journey-D' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;
    const audioBase64 = audioContent.toString('base64');

    res.json({ audio_base64: audioBase64 });
  } catch (error) {
    console.error('ERROR:', error);
    res.status(500).send({ error: 'Failed to synthesize speech' });
  }
});


app.post('/send-sms', async (req, res) => {
  const { to, body, from, customReference, callbackUrl } = req.body;
  if (!to || !body || !from) {
    return res.status(400).json({ error: 'Missing required fields: to, body, from' });
  }
  const messageId = uuidv4();
  const modifiedBody = body.replace(/\n/g, '\\n');

  const postData = JSON.stringify({
    "body": modifiedBody,
    "from": from,
    "to": to,
    "api_token": "l50IHXlmQPsCzRaVBK0biaCrrz34JBv00ylg5QIhqZDUN1EIZ4jkADTqbVdb",
    "gateway": "direct-refund",
    "customer_reference": customReference || messageId,
    "callback_url": callbackUrl || 'https://www.airtimenigeria.com/api/reports/sms'
  })

  try {
    const response = await new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: 'www.bulksmsnigeria.com',
        path: '/api/v2/sms',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        }
      };

      const req = https.request(requestOptions, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const parsedResponse = JSON.parse(data);
            resolve({ response: parsedResponse, statusCode: response.statusCode });
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);

      req.write(postData);
      req.end();
    });

    sentMessages[messageId] = {
      to: to,
      body: body,
      from: from,
      status: response.response.data.status === 'success' ? 'sent' : 'failed',
      messageId: messageId,
      response: response.response
    };

    return res.status(response.statusCode).json(sentMessages[messageId]);
  } catch (error) {
    console.error('Error sending SMS:', error);
    return res.status(500).json({ error: 'Error sending SMS' });
  }
});

// Endpoint to get the status of a sent message
app.get('/message/:messageId', (req, res) => {
  const messageId = req.params.messageId;
  const message = sentMessages[messageId];
  if (message) {
    res.json(message);
  } else {
    res.status(404).json({ error: 'Message not found' });
  }
});

app.listen(port,'0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
