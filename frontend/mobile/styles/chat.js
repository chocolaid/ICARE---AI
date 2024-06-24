import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    list: {
        flex: 1,
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    footer: {
        alignItems: 'center',
        width: '100%',
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    btnSend: {
        backgroundColor: '#ffffff',
        width: 40,
        height: 40,
        borderRadius: 360,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconSend: {
      width: 25,
      height: 25,
      alignSelf: 'center',
      tintColor: '#4544EA'
  },
  inputContainer: {
      borderBottomColor: '#F5FCFF',
      backgroundColor: 'rgba(68, 68, 234, 0.05)',
      borderRadius: 18,
      borderBottomWidth: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      marginRight: 10,
      elevation: 0.2,
      shadowColor: '#700B97',
      alignItems: 'center'
  },
  inputs: {
      marginLeft: 16,
      borderBottomColor: '#FFFFFF',
      flex: 1,
      paddingVertical: 10,
      color: 'white',
  },
  balloon: {
      maxWidth: 250,
      padding: 10,
      borderRadius: 20,
  },
  itemIn: {
      alignSelf: 'flex-start',
      backgroundColor: '#EBEBEB',
      borderRadius: 20,
      marginBottom: 10,
      padding: 1,
  },
  itemOut: {
      alignSelf: 'flex-end',
      backgroundColor: '#4544EA',
      borderRadius: 20,
      marginBottom: 10,
      padding: 1,
  },
  timeIn: {
      alignSelf: 'flex-end',
      margin: 5,
      fontSize: 12,
      color: '#808080',
      fontFamily: 'BloggerSans'
  },
  timeOut: {
      alignSelf: 'flex-end',
      margin: 5,
      fontSize: 12,
      color: 'white',
      fontFamily: 'BloggerSans'
  },
  item: {
      marginVertical: 0,
      flex: 1,
      flexDirection: 'row',
      padding: 0,
  },
  chatInfo: {
      display: 'flex',
      flexDirection: 'column'
  },
  chatImage: {
      height: 35,
      width: 35,
      marginRight: 15
  },
  chatName: {
      fontSize: 20,
      fontFamily: 'Blogger Sans-Bold'
  },
  chatDescription: {
      fontSize: 14,
      color: '#616161',
      fontFamily: 'Blogger Sans-Medium'
  },
  
  typingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  typingIndicatorText: {
    marginLeft: 5,
    fontSize: 14,
    color: 'gray',
  },
});

export {styles}