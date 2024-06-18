import { StyleSheet } from "react-native";


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(125, 20, 10, 1)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    countdownContainer: {
      alignItems: 'center',
    },
    iconContainer: {
      backgroundColor: '#fff',
      padding: 10,
      borderRadius: 50,
      marginBottom: 10,
    },
    icon: {
      width: 40,
      height: 40,
    },
    countdownTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 10,
    },
    countdownTimer: {
      fontSize: 18,
      color: '#fff',
      marginBottom: 20,
    },
    countdownButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '80%',
      marginBottom: 20,
    },
    countdownButton: {
      flex: 1,
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 5,
      margin: 5,
      alignItems: 'center',
    },
    countdownButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: 'rgba(125, 20, 10, 1)',
    },
    optionsContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    noOptionsContainer: {
      alignItems: 'center',
      marginTop: 20,
    },
    noOptionsText: {
      fontSize: 16,
      color: '#fff',
      marginBottom: 10,
      textAlign: 'center',
    },
    OptionsText: {
      fontSize: 14,
      color: '#fff',
      marginBottom: 10,
      textAlign: 'center',
    },
    optionButton: {
      backgroundColor: '#fff',
      padding: 8,
      borderRadius: 5,
      marginBottom: 10,
      width: '80%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionButtonText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: 'rgba(125, 20, 10, 1)',
      marginHorizontal: 10,
    },
  });

export {styles}