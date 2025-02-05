import React, { useState,useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Bar } from 'react-chartjs-2'; 
import './App.css';
import 'chart.js/auto'; 
function App() {
  const [keyword, setKeyword] = useState('');
  const [daysOld, setDaysOld] = useState(7);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [overallSentiment, setOverallSentiment] = useState('');
  const [selectedSources, setSelectedSources] = useState([]);
  const [useNewLLM, setUseNewLLM] = useState(false);  // Toggle between default model and NewLLM
  const [positiveArticlesCount, setPositiveArticlesCount] = useState(0);
  const [negativeArticlesCount, setNegativeArticlesCount] = useState(0);
  const totalArticlesCount = positiveArticlesCount + negativeArticlesCount;
  const positivePercentage = totalArticlesCount > 0 ? (positiveArticlesCount / totalArticlesCount) * 100 : 0;
  const negativePercentage = totalArticlesCount > 0 ? (negativeArticlesCount / totalArticlesCount) * 100 : 0;

  useEffect(() => {
    
    setPositiveArticlesCount(results.filter(result => result.sentiment === "POSITIVE").length);
    setNegativeArticlesCount(results.filter(result => result.sentiment === "NEGATIVE").length);
  }, [results]); 
  const newsSources = [
    { value: "", label: "All Sources" },
    { value: "cnn", label: "CNN" },
    { value: "bbc-news", label: "BBC News" },
    { value: "financial-times", label: "Financial Times" },
    { value: "the-new-york-times", label: "The New York Times" },
    { value: "the-washington-post", label: "The Washington Post" },
    { value: "arabianbusiness", label: "Arabian Business" },
    { value: "gulf-business", label: "Gulf Business" },
    { value: "khaleej-times", label: "Khaleej Times" },
    { value: "al-jazeera-english", label: "Al Jazeera English" },
    { value: "the-japan-times", label: "The Japan Times" },
    { value: "hindustan-times", label: "Hindustan Times" },
    { value: "the-sun", label: "The Sun" },
    { value: "daily-mail", label: "Daily Mail" },
    { value: "the-times-of-india", label: "The Times of India" },
    { value: "the-economist", label: "The Economist" }
  ];

  const calculateOverallSentiment = (results) => {
    if (results.length === 0) return;

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    results.forEach((result) => {
      if (result.sentiment.toLowerCase() === 'positive') {
        positiveCount++;
      } else if (result.sentiment.toLowerCase() === 'negative') {
        negativeCount++;
      } else {
        neutralCount++;
      }
    });

    if (positiveCount > negativeCount && positiveCount > neutralCount) {
      setOverallSentiment('Positive');
    } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
      setOverallSentiment('Negative');
    } else {
      setOverallSentiment('Neutral');
    }
  };

  const handleSourceChange = (selectedOptions) => {
    setSelectedSources(selectedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setOverallSentiment('');

    if (!keyword.trim()) {
      setError('Please enter a keyword.');
      setLoading(false);
      return;
    }

    const apiUrl = useNewLLM ? 'http://127.0.0.1:5000/llmanalyze' : 'http://127.0.0.1:5000/analyze'; // Conditionally set the API URL

    try {
      const sources = selectedSources.map(option => option.value);

      const response = await axios.post(apiUrl, {
        keyword: keyword,
        daysOld: daysOld, 
        sources: sources,
        useNewLLM: useNewLLM
      });
      if (response.data.results && response.data.results.length > 0) {
        setResults(response.data.results);
        calculateOverallSentiment(response.data.results);
      } else {
        setError('No results found.');
      }
    } catch (error) {
      setError('There was an error! Please try again.');
      console.error('There was an error!', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDaysOldChange = (e, newValue) => {
    setDaysOld(newValue);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Sentiment Analyzer</h1>
      </header>

      <main className="app-main">
        <form className="form-container" onSubmit={handleSubmit}>
          <div className="keyword-input-container">
            <label htmlFor="keyword-input" className="input-label">
              Keyword or Topic:
            </label>
            <input
              type="text"
              id="keyword-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter a keyword or topic to analyze"
              className="input-field"
            />
          </div>

          <div className="days-input-container">
            <label htmlFor="days-slider" className="input-label">
              Analyze news from the past(days):
            </label>
            <Slider
              id="days-slider"
              value={daysOld}
              onChange={handleDaysOldChange}
              min={1}
              max={30}
              valueLabelDisplay="auto"
            />
          </div>

          <div className="source-dropdown">
            <label htmlFor="source-select" className="input-label">Sources:</label>
            <Select
              id="source-select"
              options={newsSources}
              isMulti
              value={selectedSources}
              onChange={handleSourceChange}
              className="dropdown"
            />
          </div>

          <FormControlLabel
            control={<Switch checked={useNewLLM} onChange={(e) => setUseNewLLM(e.target.checked)} />}
            label="Use NewsLLM for Analysis"
          />

          <button type="submit" className="analyze-button">Analyze</button>
        </form>

        {loading && <div className="loading-screen">Loading...</div>}
        {error && <div className="error-message">{error}</div>}
        {overallSentiment && (
          <div className={`overall-sentiment ${overallSentiment.toLowerCase()}`}>
            <h3>{overallSentiment}</h3>
          </div>
        )}

{results.length > 0 && (
  <div className="results-container">
    <h2>Analysis Results:</h2>
    {results.map((result, index) => (
      <div key={index} className="result-item">
        <a href={result.url} target="_blank" rel="noopener noreferrer" className="result-link">
          {result.url}
        </a>

        {/* Apply color based on sentiment */}
        <p >
          <strong>Sentiment:</strong> <strong style={{ color: result.sentiment === "POSITIVE" ? '#51cf66' : '#fa5252' }}>{result.sentiment}</strong>
        </p>

        <p><strong>Confidence Score:</strong> {result.score.toFixed(2)}</p>

        {/* Conditional rendering based on sentiment */}
        {result.sentiment === "POSITIVE" ? (
          <p><strong>Most Positive Words:</strong> {result.positive_words.join(' ')}</p>
        ) : result.sentiment === "NEGATIVE" ? (
          <p><strong>Most Negative Words:</strong> {result.negative_words.join(' ')}</p>
        ) : (
          // For Neutral sentiment
          <>
            <p><strong>Most Positive Words:</strong> {result.positive_words.join(', ')}
              {result.negative_words.join(', ')}</p>
          </>
        )}

        <p>
          <strong>Word Cloud:</strong>{" "}
          {result.words && result.words.length > 0 ? result.words.join(", ") : "No words available"}
        </p>
      </div>
    ))}


     {results.length > 0 && (
      <div className="chart-container" style={{ marginTop: '2rem', maxWidth: '800px' }}> 
  <h3>Sentiment Distribution</h3>
  {positiveArticlesCount >= 0 && negativeArticlesCount >= 0 && (
    <Bar
      data={{
        labels: [
          `Positive (${positiveArticlesCount} articles, ${positivePercentage.toFixed(2)}%)`,
          `Negative (${negativeArticlesCount} articles, ${negativePercentage.toFixed(2)}%)`,
        ],
        datasets: [
          {
            label: 'Number of Articles',
            data: [positiveArticlesCount, negativeArticlesCount],
            backgroundColor: ['#51cf66', '#fa5252'],
            borderColor: ['#51cf66', '#fa5252'],
            borderWidth: 1,
          },
        ],
      }}
      options={{
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      }}
    />
  )}
</div>

)}

  </div>
  
)}

      </main>

      <footer className="app-footer">
        <p>&copy; 2024 Sentiment Analyzer. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default App;
