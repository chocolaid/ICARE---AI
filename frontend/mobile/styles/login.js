import { View, TextInput, Button, StyleSheet, Text, Image, TouchableOpacity, Modal, Dimensions} from 'react-native';

const styles = StyleSheet.create({
    body: {
      fontFamily: 'BloggerSans',
      backgroundColor: '#ffffff',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
  
    },
  
    container: {
      width: '100%',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center', 
      padding: 10,
    },
  
    input: {
      width: '80',
      height: "40px",
      marginRight: 30,
      marginLeft: 30,
      marginTop: 8,
      marginBottom: 8,
      padding: 12,
      borderRadius: 100,
      backgroundColor: '#f5f5f5',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    button2: {
      width: '80%',
      marginRight: 35,
      marginLeft: 35,
      marginTop: 8,
      marginBottom: 8,
      borderRadius: 100,
      backgroundColor: '#f5f5f5',
      color: 'black',
    },
    TextInput: {
      marginLeft: 10,
      marginRight: 10,
      width: '75%',
      borderWidth: 0, // Removes border
    },
    Title: {
      fontSize: 30,
      marginBottom: 0,
      marginTop: 35,
      marginRight: 35,
      marginLeft: 35,
      fontFamily: 'Blogger Sans-Bold',
      color: 'black',
    },
    SubTitle: {
      marginBottom: 0,
      marginBottom: 40,
      marginRight: 35,
      marginLeft: 35,
      fontSize: 16,
      color: '#616161',
      fontFamily: 'BloggerSans'
    },
    button: {
      width: '80%',
      marginRight: 40,
      marginLeft: 35,
      marginTop: 8,
      marginBottom: 8,
      borderRadius: 100,
      backgroundColor: '#4544EA',
    },
  
    horizontalLine: {
      width: '40%',
      height: 2,
      backgroundColor: '#e0e0e0',
    },
  });
  const modalStyles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      width: '100%',
    },
    modalContent: {
      width: Dimensions.get('window').width * 0.2,
      padding: 20,
      height: Dimensions.get('window').width * 0.2,
      backgroundColor: 'white',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorModalContent: {
      width: Dimensions.get('window').width * 0.8,
      padding: 20,
      backgroundColor: 'white',
      borderRadius: 10,
      justifyContent: 'center',
    },
    errorMessage: {
      fontSize: 14,
      width: '100%',
      color: '#616161',
      marginBottom: 20,
      marginTop: 10,
      fontFamily: 'Blogger Sans-Bold'
    },
    closeButton: {
      backgroundColor: '#4544EA',
      padding: 10,
      borderRadius: 5,
    },
    closeButtonText: {
      color: 'white',
      textAlign: 'center',
      fontFamily: 'Blogger Sans-Bold'
    },
    lottie: {
      width: 100,
      height: 100,
    },
  });
  export {modalStyles};
  export {styles};