# Team-Spectra

## **ICARE:** Documentation<br/>
Overview
ICARE is an AI-powered platform offering comprehensive medical assistance and emergency support. Utilizing advanced AI for voice, Image and text chat, ICARE detects accidents using device sensors and a well written algorithm that promptly notifies emergency services. We connect users with tailored care services in their area, prioritizing the well-being of loved ones with efficient and responsive medical support.

**Overview**
Jarvis is a sophisticated AI model designed to predict cancer using TensorFlow. It leverages deep learning techniques to analyze medical imaging and clinical data, providing accurate predictions to assist healthcare professionals.

**Features**<br/>
*High Accuracy:* Utilizes state-of-the-art deep learning algorithms.<br/>
*Scalable:* Can handle large datasets.
User-Friendly: Easy integration with existing healthcare systems.<br/>
**System Requirements**<br/>
*Operating System:* Linux, macOS, Windows
Python Version: 3.6 or higher<br/>
**Model Build Code:**
To check Jarvis Build code [Colab Notebook](https://colab.research.google.com/drive/1DF9E0Pj92Yb8F_1unNu5MZ7fbYCGiDnh)
**Quick Model Usage**
1. [Clone this Repo Link](https://github.com/DATICAN-UNDERGRADUATES-COMPETITION/Team-Spectra/tree/main/backend/cancerai)
2. Head to the cancerai directory on your machine
3. pip install -r requirements.txt or just install these packages
`tensorflow
scikit-learn
Pillow
numpy
matplotlib
pandas
Flask
flask-wtf
Werkzeug
python-dotenv
tf_keras`
4. python app.py (or Linux: python3 app.py) then head to your localhost:8900 or 127.0.0.1:8900 on your webrowser
5. 5. Upload any cancerous Jpeg Images and See the prediction 

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
`A VPS server running on the latest version of MAC OS or Ubuntu LTS with over 20GB of storage available that has support for GPU with access to root directory`<br/>

`Python3, NodeJS V22, latest version of GIT, Android Studio`<br/>
Clone the github repository using command:<br/>

`git clone https://github.com/DATICAN-UNDERGRADUATES-COMPETITION/Team-Spectra.git`<br/>

**Backend Server Setup:**<br/>

Navigate into the **Backend folder** using command:<br/>

`cd Team-Spectra/backend`<br/>

Run command: `chmod +x ./setup.sh && ./setup.sh` this will setup the backend server<br/>

Optionally you can navigate into the following directories and run the `setup shell scripts`.
<ul>
<li>nodeservers</li>
<li>cancerai</li>
<li>speech</li>
<li>webcancer.ai</li>
</ul>
<br/>
<br/>


## Frontend Setup:<br/>
Navigate into the **Frontend folder** using command:<br/>

`cd Team-Spectra/frontend/mobile/`<br/>

### Prerequisites

Before proceeding, make sure you have set up your development environment with the necessary tools:

1. **Android Setup:**
   - Android Studio with Android SDK installed.
   - Android device connected via USB or Android emulator running.

2. **iOS Setup:**
   - Xcode installed on macOS.

3. **Node.js & npm:**
   - Node.js installed on your machine.

### Command Setup

#### 1. Android

To generate a debug APK for Android, use the following command:

```bash
npm run android
```

This command performs the following tasks:
- Builds the JavaScript bundle.
- Compiles the Android app.
- Installs the app on the connected Android device or emulator.

#### 2. iOS

To build and run the iOS app, use the following command:

```bash
npx react-native run-ios --simulator="iPhone 11"
```

Replace `"iPhone 11"` with the simulator device name you want to run on, or you can use `"--device"` to run on a connected physical iOS device.

This command does the following:
- Builds the JavaScript bundle.
- Launches the iOS simulator or installs the app on the connected iOS device.

### Example Commands

Here’s how you can execute both commands:

```bash
# For Android
npm run android

# For iOS
npx react-native run-ios --simulator="iPhone 11"
```

###Building a release version of

### Prerequisites

Before proceeding, ensure you have completed the following prerequisites:

1. **Android Setup:**
   - Have Android Studio installed.
   - Set up signing configurations for your Android app.
   - Update `android/app/build.gradle` with signing configuration.

2. **iOS Setup:**
   - Have Xcode installed on macOS.
   - Create and configure a provisioning profile for your iOS app.

3. **Node.js & npm:**
   - Node.js installed on your machine.


### Building Release Versions

#### 1. Android Release Build

To build a release version of your Android app, follow these steps:

##### Step-by-Step Instructions:

1. **Generate a signing key and keystore (if not already done):**
   - You can generate a new keystore using `keytool` (included in JDK).

     ```bash
     keytool -genkeypair -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
     ```

   - Follow the prompts to set your keystore password and other required information.

2. **Place the keystore file in your project folder:**
   - Move `my-release-key.keystore` into the `android/app` directory of your React Native project.

3. **Configure `gradle.properties`:**
   - Edit `android/gradle.properties` or create it if it doesn't exist, and add the following (replace placeholders with your actual keystore information):

     ```properties
     MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
     MYAPP_RELEASE_KEY_ALIAS=my-key-alias
     MYAPP_RELEASE_STORE_PASSWORD=your_store_password
     MYAPP_RELEASE_KEY_PASSWORD=your_key_password
     ```

4. **Edit `android/app/build.gradle`:**
   - Update the signing configuration in `android/app/build.gradle` to use the keystore information:

     ```groovy
     ...
     android {
         ...
         signingConfigs {
             release {
                 storeFile file(MYAPP_RELEASE_STORE_FILE)
                 storePassword MYAPP_RELEASE_STORE_PASSWORD
                 keyAlias MYAPP_RELEASE_KEY_ALIAS
                 keyPassword MYAPP_RELEASE_KEY_PASSWORD
             }
         }
         buildTypes {
             release {
                 ...
                 signingConfig signingConfigs.release
             }
         }
     }
     ```

5. **Generate the APK:**
   - Run the following command in the root directory of your React Native project:

     ```bash
     cd android && ./gradlew assembleRelease
     ```

   - This command will generate an APK file at `android/app/build/outputs/apk/release/app-release.apk`.

#### 2. iOS Release Build

To build a release version of your iOS app, follow these steps:
read the todo.txt and upload the info.plist with the content

##### Step-by-Step Instructions:

1. **Open your project in Xcode:**
   - Navigate to the `ios` folder of your React Native project and open the `.xcworkspace` file in Xcode.

     ```bash
     open ios/Icare.xcworkspace
     ```

2. **Configure Signing & Capabilities:**
   - In Xcode, select your project in the Project Navigator, then select your target under `Targets`.
   - Go to `Signing & Capabilities` tab and select your team from the dropdown. Ensure a valid provisioning profile is selected.

3. **Select Release Configuration:**
   - Select `Generic iOS Device` as the build target device.

4. **Archive the App:**
   - Go to `Product` -> `Archive` in Xcode menu.
   - Follow the prompts to archive the app.

5. **Export the Archive:**
   - Once the archive is complete, Xcode Organizer will open.
   - Select the archived app and click `Distribute App`.
   - Follow the prompts to export the app for distribution.
