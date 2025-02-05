from flask import Flask, request, jsonify
import requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import re
from flair.models import TextClassifier
from flair.data import Sentence
import logging
from flask_cors import CORS
import time
from transformers import TFAutoModelForSequenceClassification, AutoTokenizer
import tensorflow as tf
from collections import OrderedDict
from wordcloud import WordCloud, STOPWORDS
from functools import lru_cache
# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow CORS

# Initialize global variables
classifier = TextClassifier.load('en-sentiment')

loaded_tf_model = TFAutoModelForSequenceClassification.from_pretrained("./fine-tuned-roberta-large-tf") 
tokenizer = AutoTokenizer.from_pretrained('./fine-tuned-roberta-large-tf') 

sources = [
    "cnn", "bbc-news", "financial-times", "the-new-york-times", "the-washington-post",
    "arabianbusiness", "gulf-business", "khaleej-times", "al-jazeera-english",
    "the-japan-times", "hindustan-times", 
    "the-sun", "daily-mail", "the-times-of-india", "the-economist",
]
sources_str = ",".join(sources)
newsapi_key = "c0d98afdc5954ea28b3ea7c404623b58"  # News API key

def get_news(keyword, days_old, sources_str):
    if sources_str == '':
        sources_str = sources
    list_of_articles = []
    yesterday = datetime.now() - timedelta(days=int(days_old))
    yesterday_str = yesterday.strftime('%Y-%m-%d')

    url = 'https://newsapi.org/v2/everything'
    # Parameters for newsapi
    params = {
        'q': keyword,
        'from': yesterday_str,
        'sortBy': 'publishedAt',
        'pageSize': 12,
        'language': 'en',
        'sources': sources_str,
        'apiKey': newsapi_key
    }

    try:  # Sending request to newsapi
        response = requests.get(url, params=params ,timeout=10)
        response.raise_for_status()
        articles = response.json().get('articles', [])
        for article in articles:
            list_of_articles.append(article['url'])
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching news: {e}")

    return list_of_articles

def clean_text(text):
    if not text:  # Check if text is empty or None
        return None
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^A-Za-z0-9\s.,!?]', '', text)
    return text.strip()

def make_word_cloud(text):
    wordcloud = WordCloud(
    width=800, 
    height=400, 
    background_color='white', 
    stopwords=STOPWORDS, 
    min_font_size=10
    ).generate(text)
    frequencies = wordcloud.words_
    count=0
    print("="*10)
    words=[]
    for word, frequency in frequencies.items():
        print(f"{word}: {frequency}")
        words.append(word)
        count+=1
        if count>10:
            return words



def summarize_webpage(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    max_retries = 2
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            for tag in soup(["script", "style", "header", "footer", "nav", "aside", "form"]):
                tag.decompose()

            paragraphs = soup.find_all('p')
            body_text = " ".join([para.get_text() for para in paragraphs])

            cleaned_text = clean_text(body_text)
            return cleaned_text

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching webpage (attempt {attempt + 1}/{max_retries}): {e}")
            time.sleep(2)

    logger.error(f"Failed to fetch webpage after {max_retries} attempts.")
    return None

def analyze_sentiment_flair(text):
    sentence = Sentence(text)
    classifier.predict(sentence)

    label = sentence.labels[0].value
    score = sentence.labels[0].score
    return label, score

def analyze_sentiment_llm(text):
    inputs = tokenizer(text, padding=True, truncation=True, max_length=128, return_tensors="tf") 
    logits = loaded_tf_model(**inputs).logits

    predicted_class_id = tf.argmax(logits, axis=-1)[0] 
    label_map = {0: 'POSITIVE', 1: 'NEGATIVE', 2: 'NEUTRAL'}
    return label_map[predicted_class_id.numpy()]

@lru_cache(maxsize=None)  # Cache all sentiment scores
def get_sentiment_score(text):
    label,score = analyze_sentiment_flair(text)
    return score if label == 'POSITIVE' else -score

from collections import OrderedDict

def most_extreme_words(text, top_n=8):
    if not text:  # Check if text is empty or None
        return [], []  # Return empty lists instead of None
    
    words = text.split()
    word_scores = [(word, get_sentiment_score(word)) for word in words]

    positive_words = [(word, score) for word, score in word_scores if score > 0]
    negative_words = [(word, score) for word, score in word_scores if score < 0]

    positive_words.sort(key=lambda x: x[1], reverse=True)
    negative_words.sort(key=lambda x: x[1])

    unique_positive_words = list(OrderedDict.fromkeys(word for word, _ in positive_words))[:top_n]
    unique_negative_words = list(OrderedDict.fromkeys(word for word, _ in negative_words))[:top_n]

    return unique_positive_words, unique_negative_words


@app.route('/llmanalyze', methods=['POST'])
def analyze_sentimentllm():
    data = request.json
    logger.info(f"Received data: {data}") 
    
    keyword = data['keyword']
    daysOld = data['daysOld']
    sources = data['sources']
    word_cloud_data = []
    list_of_articles = get_news(keyword, daysOld, sources)
    analysis_results = []
    positive_words=[]
    negative_words=[]

    for url in list_of_articles:
        cleaned_text = summarize_webpage(url)
        if cleaned_text:
            positive_words, negative_words = most_extreme_words(cleaned_text)
            word_cloud_data=make_word_cloud(cleaned_text)
            sentiment = analyze_sentiment_llm(cleaned_text)
            analysis_results.append({
                'url': url,
                'sentiment': sentiment,
                'score': 1,
                'words':word_cloud_data,
                'positive_words':positive_words,
                'negative_words':negative_words,
                
            })

    return jsonify({'results': analysis_results})
    


@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    data = request.json
    
    keyword = data['keyword']
    daysOld = data['daysOld']
    sources = data['sources']
    list_of_articles = get_news(keyword, daysOld, sources)
    analysis_results = []
    word_cloud_data = []
    positive_words=[]
    negative_words=[]

    for url in list_of_articles:
        cleaned_text = summarize_webpage(url)

        positive_words, negative_words = most_extreme_words(cleaned_text)
        print(positive_words)
        print(negative_words)
        if cleaned_text:
            word_cloud_data=make_word_cloud(cleaned_text)
            sentiment, score = analyze_sentiment_flair(cleaned_text)
            analysis_results.append({
                'url': url,
                'sentiment': sentiment,
                'score': score,
                'words':word_cloud_data,
                'positive_words':positive_words,
                'negative_words':negative_words,
            })

    return jsonify({
        'results': analysis_results
    })

if __name__ == '__main__':
    app.run(debug=True)
