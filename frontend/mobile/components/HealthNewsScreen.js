// HealthNewsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HealthNewsScreen = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNews, setFilteredNews] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    fetch('https://newsapi.org/v2/everything?q=health+&language=en&apiKey=3b464216d11942dbbe246ee0bdb39203')
      .then(response => response.json())
      .then(data => {
        setNews(data.articles);
        setFilteredNews(data.articles.filter(article => article.content)); // Filter out news with no content
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setLoading(false);
      });
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      setFilteredNews(news.filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.description.toLowerCase().includes(query.toLowerCase())
      ));
    } else {
      setFilteredNews(news.filter(article => article.content));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health News</Text>
      <TextInput
        style={styles.searchBar}
        placeholder="Search news..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={filteredNews}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('FullNews', { article: item })}>
              <View style={styles.newsItem}>
                {item.urlToImage && (
                  <Image source={{ uri: item.urlToImage }} style={styles.newsImage} />
                )}
                <View style={styles.textContainer}>
                  <Text style={styles.newsTitle}>{item.title}</Text>
                  <Text style={styles.newsDescription}>{item.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchBar: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  newsItem: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 20,
  },
  newsImage: {
    width: "100%",
    height: 200,
    borderRadius: 5,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  newsDescription: {
    fontSize: 14,
    color: 'gray',
  },
});

export default HealthNewsScreen;
