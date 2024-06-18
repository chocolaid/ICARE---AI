# Team-Spectra

## **ICARE:** Documentation<br/>
Overview
ICARE is an AI-powered platform offering comprehensive medical assistance and emergency support. Utilizing advanced AI for voice, Image and text chat, ICARE detects accidents using device sensors and a well written algorithm that promptly notifies emergency services. We connect users with tailored care services in their area, prioritizing the well-being of loved ones with efficient and responsive medical support.


## **Features**<br/>
**Emergency Alarm**:<br/> 
An in-built feature that can be customized by users to perform certain tasks when emergency mode is triggered. <br/>

**What's Emergency Mode?**<br/>
Emergency Mode is an integrated feature designed to be activated in response to accidents, chat queries, and voice interactions. It can be customized to perform tasks such as calling the nearest hospitals, sending distress messages to emergency contacts, and notifying nearby hospitals.<br/>

**Accident Detection**<br/>
Our system includes advanced accident detection capabilities, leveraging real-time data and sensors to swiftly identify incidents. This feature enables immediate alerts to emergency services, contacts emergency contacts, and notifies nearby hospitals, ensuring rapid response and assistance when it matters most.

**Live Voice Chat**: <br/>
Introducing Jarvis, a live voice assistant that responds to medical-related questions. Jarvis includes an in-built feature to trigger an emergency alarm when emergency services are needed. <br/>

**Cancer Detection from Shared Images**: <br/>
*CanceRx* is an AI-powered image chat scanner designed to detect six distinct types of cancer from shared images. Its goal is to assist users in early cancer detection, potentially improving treatment outcomes and saving lives. <br/>

**Live Chat**: <br/>
Powered by Jarvis, a live chat assistant that supports both images and text responses for medical queries. It includes an in-built feature to trigger an emergency alarm when emergency services are needed. <br/><br/>


## Setup Guide
**Requirements:**<br/>
`A VPS server running on Ubuntu v24.04 LTS with over 20GB of storage available that has support for GPU with access to root directory`<br/>

`Python3, NodeJS V22, latest version of GIT`

**Backend Server Setup:**<br/>

Clone the github repository using command:<br/>

`git clone https://github.com/DATICAN-UNDERGRADUATES-COMPETITION/Team-Spectra.git`<br/>

Navigate into the **Backend folder** using command:<br/>

`cd Team-Spectra/backend`<br/>

Run command: `chmod +x ./setup.sh && ./setup.sh` this will setup the backend server<br/>

Optional you can navigate into the following directories and run the `setup shell scripts`.
<ul>
<li>nodeservers</li>
<li>cancerai</li>
<li>speech</li>
</ul>
#



 `
tensorflow
scikit-learn
Pillow
numpy
keras
matplotlib
pandas
Flask
flask-wtf
Werkzeug
python-dotenv
tf_keras
 `
## References
**Dataset:** [HAM10000 Dataset](https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000)<br/>
**Input Dataset:** [HMINST_28_28_RGB.csv](https://www.kaggle.com/code/dhruv1234/ham10000-skin-disease-classification/input?select=hmnist_28_28_RGB.csv)

## Evaluate predictions

Testing the cancer prediction model [with link](https://colab.research.google.com/drive/1DF9E0Pj92Yb8F_1unNu5MZ7fbYCGiDnh#scrollTo=N0_ouFsoE_D2)

Contact
For more information, please contact sarafasatar@gmail.com.

## Setup Instructions

Please Read [This Instructions](https://github.com/DATICAN-UNDERGRADUATES-COMPETITION/Team-Spectra/tree/main/backend#icare)

Additional Resources
For further details and to run the model in an interactive environment, please refer to the Google Colab notebook.

Conclusion
Jarvis provides a reliable AI solution for cancer prediction, aiding early diagnosis and improving treatment outcomes. By following the steps outlined in this documentation, you can set up and deploy Jarvis effectively.
