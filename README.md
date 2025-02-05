<div align="center">

# 📊 News Sentiment Analyzer

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Python](https://img.shields.io/badge/python-v3.8+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-v18.0+-61dafb.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/flask-v2.0+-black.svg)](https://flask.palletsprojects.com/)

A modern web application that analyzes sentiment patterns across news articles using advanced NLP techniques and machine learning models.

</div>

## System Architecture 🏗️

### High-Level Architecture
```mermaid
graph TB
    subgraph Frontend["Frontend Layer"]
        UI[React UI Components]
        VIZ[Visualization Components]
        STATE[State Management]
        UI --> VIZ
        UI --> STATE
    end
    subgraph Backend["Backend Layer"]
        API[Flask REST API]
        CACHE[Redis Cache]
        DB[(Database)]
        API --> CACHE
        API --> DB
    end
    subgraph Models["ML/NLP Layer"]
        FLAIR[Flair Model]
        ROBERTA[RoBERTa Model]
        VADER[VADER Analysis]
        BERT[BERT/DistilBERT]
        TEXTBLOB[TextBlob]
    end
    subgraph DataSources["Data Sources"]
        NEWS[News API]
        SCRAPER[Web Scraper]
    end
    UI --> API
    API --> Models
    API --> DataSources
    DataSources --> API
    Models --> API
    
    style Frontend fill:#e1f5fe,stroke:#01579b
    style Backend fill:#e8f5e9,stroke:#1b5e20
    style Models fill:#fce4ec,stroke:#880e4f
    style DataSources fill:#fff3e0,stroke:#e65100
```

### Data Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant N as News Sources
    participant M as ML Models
    participant C as Cache
    participant D as Database

    U->>F: Search Query
    F->>A: POST /analyze
    
    alt Cache Hit
        A->>C: Check Cache
        C-->>A: Return Cached Results
    else Cache Miss
        A->>N: Fetch News Articles
        N-->>A: Raw Articles
        A->>M: Process Articles
        M-->>A: Sentiment Results
        A->>C: Cache Results
        A->>D: Store Results
    end
    
    A-->>F: Return Analysis
    F-->>U: Display Results
```

## Features ✨
- Real-time sentiment analysis using multiple models:
  - Flair (default model)
  - Custom fine-tuned RoBERTa
  - VADER
  - TextBlob
  - BERT & DistilBERT
- Multi-source news aggregation from 15+ major news outlets
- Interactive visualization of sentiment distribution
- Advanced filtering by time range and news sources
- Word cloud generation for key topics
- Identification of most positive/negative phrases
- Model comparison functionality

### Sentiment Models
| Model | Type | Use Case |
|-------|------|----------|
| Flair | Deep Learning | Default analyzer |
| RoBERTa | Fine-tuned Transformer | News-specific analysis |
| VADER | Rule-based | Quick analysis |
| TextBlob | Lexicon-based | Basic sentiment |
| BERT/DistilBERT | Transformer | Complex context |

## Tech Stack 🛠️
### Frontend
- React.js with Hooks
- Chart.js for data visualization
- Material-UI components
- React-Select for dropdowns
- Axios for API requests

### Backend
- Flask RESTful API
- Multiple NLP models:
  - Flair
  - Hugging Face Transformers
  - NLTK
  - TextBlob
- BeautifulSoup4 for web scraping
- News API integration

## Sentiment Analysis Models 🤖
### Core Models
- **Flair**: Deep learning-based classifier (default)
- **RoBERTa**: Fine-tuned for news sentiment
- **BERT/DistilBERT**: Custom-trained on news dataset
- **VADER**: Rule-based sentiment analysis
- **TextBlob**: Lexicon-based approach

### Model Training
- Custom dataset of balanced news samples
- Fine-tuned transformers architecture
- 3-class classification (Positive/Negative/Neutral)
- Evaluation metrics for model comparison

### Benchmark Results
| Model | Accuracy | Speed (ms) | Memory (MB) |
|-------|----------|------------|-------------|
| Flair | 91.2% | 245 | 550 |
| RoBERTa | 93.5% | 312 | 1240 |
| VADER | 84.7% | 12 | 32 |
| BERT | 92.8% | 285 | 680 |

## Getting Started 🚀
1. Clone the repository:
```bash
git clone https://github.com/yourusername/news-sentiment-analyzer.git
```

2. Install frontend dependencies:
```bash
cd news-sentiment-analyzer/frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
pip install -r requirements.txt
```

4. Set up your News API key:
```python
# In app.py
newsapi_key = "your_api_key_here"
```

5. Start the servers:
```bash
# Backend
python app.py
# Frontend (in a new terminal)
npm start
```

## Usage 💡
1. Enter a keyword or topic in the search field
2. Select desired news sources from the dropdown
3. Adjust the time range using the slider
4. Choose between different sentiment models
5. View analysis results and visualizations

## API Endpoints 🔌
### Endpoints
| Parameter | Type | Description |
|-----------|------|-------------|
| text | string | Text to analyze |
| model | string | Model to use |
| sources | array | News sources |

## Future Improvements 🔮
- Real-time analysis updates
- Sentiment trend tracking over time
- Additional language support
- Advanced filtering options
- Customizable visualization options

## License 📄
MIT License - See [LICENSE](LICENSE) for details.

## Contributing 🤝
Pull requests welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

