import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, Image, TouchableOpacity, Modal } from 'react-native';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import LottieView from 'lottie-react-native';
import { styles, modalStyles } from '../styles/login';
import {getDatabase, ref, set, onValue} from 'firebase/database';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isErrorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isFullNameVisible, setIsFullNameVisible] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const auth = getAuth();
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '1001115187304-ku3nfcuu8b9kmf0mf8ot6djsklb47ajo.apps.googleusercontent.com',
    });
  }, []);

  const loading = () => {
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  const showErrorModal = (message) => {
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const hideErrorModal = () => {
    setErrorModalVisible(false);
    setErrorMessage('');
  };

  const handleLogin = async () => {
    loading();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      hideModal();
    } catch (error) {
      hideModal();
      showErrorModal(error.message);
    }
  };

  const handleCreateAccount = async () => {
    loading();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const db = getDatabase();
      const userRef = ref(db, 'users/' + auth.currentUser.uid);
      set(userRef, {
        fullName: fullName,
        email: email,
        password: password,
        uid: auth.currentUser.uid,
        activeStatus: '',
        phone: 'No number added',
        accountDate: new Date().toDateString(),
      });
      hideModal();
    } catch (error) {
      hideModal();
      showErrorModal(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    loading();
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const userInfo = await GoogleSignin.signIn();

      const idToken = userInfo.idToken;
      const credential = GoogleAuthProvider.credential(idToken);
      
      // Sign in with the credential
      const authInstance = getAuth();
      await signInWithCredential(authInstance, credential);
      const user = authInstance.currentUser;
      const { displayName, email, phoneNumber } = user;
      
      const userId = user.uid;
      
      const db = getDatabase();
      const userRef = ref(db, 'users/' + userId);
      set(userRef, {
        fullName: displayName,
        email: email,
        password: idToken,
        uid: userId,
        activeStatus: 'active',
        phone: 'No number added',
        accountDate: new Date().toDateString(),
      });
      hideModal();
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      showErrorModal(error.message);
    }
  };


  const handlePasswordReset = async () => {
    loading();
    try {
      await sendPasswordResetEmail(auth, email);
      hideModal();
      showErrorModal('Password reset email sent.');
    } catch (error) {
      hideModal();
      showErrorModal(error.message);
    }
  };

  const ContinueAuth = () => {
    if (isResetPassword) {
      handlePasswordReset();
    } else if (isSignup) {
      handleCreateAccount();
    } else {
      handleLogin();
    }
  };

  const switchAuthMode = () => {
    setIsSignup((prevState) => !prevState);
    toggleFullNameVisibility();
  };

  const toggleFullNameVisibility = () => {
    setIsFullNameVisible((prevState) => !prevState);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

  const toggleResetPasswordMode = () => {
    setIsResetPassword((prevState) => !prevState);
    if (!isResetPassword) {
      setFullName('');
      setPassword('');
    }
  };

  return (
    <View style={styles.body}>
      <Text style={styles.Title}>
        {isSignup ? 'Welcome!' : isResetPassword ? 'Reset Password' : 'Welcome back!'}
      </Text>
      <Text style={styles.SubTitle}>
        {isSignup ? 'Create a new account to get started.' : isResetPassword ? 'Enter your email to reset your password.' : "Let's login with your account details to continue."}
      </Text>

      <View style={styles.container}>
        {isFullNameVisible && !isResetPassword && (
          <View style={styles.input}>
            <Image source={require('../images/user.png')} resizeMode='center' style={{ width: 20, height: 20 }} />
            <TextInput
              style={styles.TextInput}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
        )}
        <View style={styles.input}>
          <Image source={require('../images/email.png')} resizeMode='center' style={{ width: 20, height: 20 }} />
          <TextInput
            style={styles.TextInput}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        {!isResetPassword && (
          <View style={styles.input}>
            <Image source={require('../images/lock.png')} resizeMode='center' style={{ width: 20, height: 20 }} />
            <TextInput
              style={styles.TextInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity onPress={isSignup ? togglePasswordVisibility : toggleResetPasswordMode}>
              <Image
                source={isSignup ? (isPasswordVisible ? require('../images/hide.png') : require('../images/show.png')) : require('../images/question.png')}
                resizeMode='center'
                style={{ width: 18, height: 18 }}
              />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.button} title="Continue" onPress={ContinueAuth}>
          <Text style={{ color: 'white', textAlign: 'center', padding: 10, fontSize: 16, fontFamily: 'Blogger Sans-Bold' }}>
            {isResetPassword ? 'Send Reset Email' : isSignup ? 'Create Account' : 'Login'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e0e0e0', marginLeft: 35 }} />
          <Text style={{ color: '#616161', marginHorizontal: 10 }}>OR</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e0e0e0', marginRight: 35 }} />
        </View>

        <TouchableOpacity style={styles.button2} title="Switch Auth" onPress={isResetPassword ? toggleResetPasswordMode : switchAuthMode}>
          <Text style={{ color: '#616161', textAlign: 'center', padding: 10, fontSize: 16, fontFamily: 'Blogger Sans-Bold' }}>
            {isResetPassword ? 'Back to Login' : isSignup ? 'Already have an account' : 'Create new account'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e0e0e0', marginLeft: 35 }} />
          <Text style={{ color: '#616161', marginHorizontal: 10 }}>Continue using</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: '#e0e0e0', marginRight: 35 }} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <TouchableOpacity style={{ backgroundColor: '#4544EA', borderRadius: 100, padding: 10, width: '40%', marginLeft: 35, marginRight: 8 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontFamily: 'Blogger Sans-Bold' }}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: '#f44336', borderRadius: 100, padding: 10, width: '40%', marginRight: 35 }} onPress={handleGoogleSignIn}>
            <Text style={{ color: 'white', textAlign: 'center', fontFamily: 'Blogger Sans-Bold' }}>Google</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal animationType='slide' transparent visible={isModalVisible} onRequestClose={hideModal}>
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalContent}>
            <LottieView source={require('../animations/loading.json')} autoPlay loop style={modalStyles.lottie} />
          </View>
        </View>
      </Modal>

      <Modal animationType='slide' transparent visible={isErrorModalVisible} onRequestClose={hideErrorModal}>
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.errorModalContent}>
            <Text style={{ fontSize: 18, color: 'black', fontFamily: 'Blogger Sans-Bold'}}>Error</Text>
            <Text style={modalStyles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity style={modalStyles.closeButton} onPress={hideErrorModal}>
              <Text style={modalStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Login;
