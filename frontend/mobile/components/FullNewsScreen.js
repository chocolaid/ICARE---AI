// FullNewsScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';

const FullNewsScreen = ({ route }) => {
  const { article } = route.params;

  const handleReadMore = () => {
    Linking.openURL(article.url);
  };

  return (
    <ScrollView style={styles.container}>
      {article.urlToImage && (
        <Image source={{ uri: article.urlToImage }} style={styles.newsImage} />
      )}
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.source}>Source: {article.source.name}</Text>
      <Text style={styles.content}>
        {article.content ? article.content : 'Full content not available. Click below to read more.'}
      </Text>
      <TouchableOpacity onPress={handleReadMore}>
        <Text style={styles.readMore}>Read More</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  newsImage: {
    width: '100%',
    height: 200,
    borderRadius: 5,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  source: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 20,
  },
  content: {
    fontSize: 16,
    color: 'gray',
  },
  readMore: {
    fontSize: 16,
    color: 'blue',
    marginTop: 20,
  },
});

export default FullNewsScreen;
