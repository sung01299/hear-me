import React, { useEffect, useState } from 'react';
import { Crown, TrendingUp } from 'lucide-react';
import '../RhythmGame/RhythmGame.css';
/**
 * Enhanced Game Result screen component
 */
const ResultScreen = ({
  score, 
  maxCombo, 
  songName,
  perfectCount = 0, 
  greatCount = 0, 
  goodCount = 0, 
  badCount = 0, 
  worstCount = 0, 
  missCount = 0
}) => {
  const [animateScore, setAnimateScore] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [rank, setRank] = useState('');

  // Calculate accuracy and rank
  useEffect(() => {
    const totalNotes = perfectCount + greatCount + goodCount + badCount + worstCount + missCount;
    if (totalNotes === 0) return;

    // Score animation
    const duration = 2000; // 2 seconds
    const increment = score / (duration / 20); // Update every 20ms
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        clearInterval(timer);
        setAnimateScore(score);
        // Show stats after score animation
        setTimeout(() => setShowStats(true), 300);
      } else {
        setAnimateScore(Math.floor(current));
      }
    }, 20);

    // Calculate rank based on accuracy
    const weightedScore = (
      (perfectCount * 1) + 
      (greatCount * 0.9) + 
      (goodCount * 0.7) + 
      (badCount * 0.4) + 
      (worstCount * 0.2)
    ) / totalNotes;
    
    let calculatedRank;
    if (weightedScore >= 0.95) calculatedRank = 'S';
    else if (weightedScore >= 0.9) calculatedRank = 'A';
    else if (weightedScore >= 0.8) calculatedRank = 'B';
    else if (weightedScore >= 0.7) calculatedRank = 'C';
    else calculatedRank = 'D';
    
    // Animate rank appearance
    setTimeout(() => setRank(calculatedRank), 2200);
    
    return () => clearInterval(timer);
  }, [score, perfectCount, greatCount, goodCount, badCount, worstCount, missCount]);

  // Calculate total hit notes
  const totalHitNotes = perfectCount + greatCount + goodCount + badCount + worstCount;
  const totalNotes = totalHitNotes + missCount;
  const accuracy = totalNotes ? Math.round((totalHitNotes / totalNotes) * 100) : 0;
  
  // Calculate percentages for the progress bars
  const getPercentage = (count) => {
    return totalNotes ? Math.round((count / totalNotes) * 100) : 0;
  };

  // Add stars to the background
  const renderStars = () => {
    return Array(20).fill().map((_, index) => {
      const style = {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        width: `${2 + Math.random() * 3}px`,
        height: `${2 + Math.random() * 3}px`,
      };
      return <div key={index} className="star" style={style} />;
    });
  };

  return (
    <div className="result-screen">
      {/* Background stars */}
      <div className="stars-container">
        {renderStars()}
      </div>

      {/* Main content container */}
      <div className="result-content-container">
        {/* Header */}
        <div className="result-header">
          <h1 className="result-title">Results</h1>
          <h2 className="result-song-name">{songName}</h2>
        </div>
        
        {/* Score and rank section */}
        <div className="result-main">
          <div className="result-score-section">
            <div className="result-score-label">Final Score</div>
            <div className="result-score-value animate-count">
              {animateScore.toLocaleString()}
            </div>
            <div className="result-accuracy">
              <TrendingUp size={16} />
              <span>Accuracy: {accuracy}%</span>
            </div>
          </div>
          
          <div className="result-rank-section">
            <div className={`result-rank-circle ${rank ? 'animate-scale-in' : ''}`} 
                 style={{ transform: rank ? 'scale(1)' : 'scale(0)' }}>
              <span className="result-rank-value">{rank}</span>
            </div>
            <div className="result-rank-label">Rank</div>
          </div>
        </div>

        {/* Stats section */}
        <div className={`result-stats-section ${showStats ? 'result-stats-show' : 'result-stats-hide'}`}>
          <div className="result-combo-section">
            <Crown size={20} className="result-crown-icon" />
            <span className="result-combo-label">Max Combo:</span>
            <span className="result-combo-value">{maxCombo}</span>
          </div>
          
          {/* Rating statistics with progress bars */}
          <div className="result-stat-row result-stat-perfect">
            <div className="result-stat-header">
              <span className="result-stat-label">PERFECT</span>
              <span>{perfectCount}</span>
            </div>
            <div className="result-stat-bar">
              <div className="result-stat-fill" style={{ width: `${getPercentage(perfectCount)}%` }}></div>
            </div>
          </div>
          
          <div className="result-stat-row result-stat-great">
            <div className="result-stat-header">
              <span className="result-stat-label">GREAT</span>
              <span>{greatCount}</span>
            </div>
            <div className="result-stat-bar">
              <div className="result-stat-fill" style={{ width: `${getPercentage(greatCount)}%` }}></div>
            </div>
          </div>
          
          <div className="result-stat-row result-stat-good">
            <div className="result-stat-header">
              <span className="result-stat-label">GOOD</span>
              <span>{goodCount}</span>
            </div>
            <div className="result-stat-bar">
              <div className="result-stat-fill" style={{ width: `${getPercentage(goodCount)}%` }}></div>
            </div>
          </div>
          
          <div className="result-stat-row result-stat-bad">
            <div className="result-stat-header">
              <span className="result-stat-label">BAD</span>
              <span>{badCount}</span>
            </div>
            <div className="result-stat-bar">
              <div className="result-stat-fill" style={{ width: `${getPercentage(badCount)}%` }}></div>
            </div>
          </div>
          
          <div className="result-stat-row result-stat-worst">
            <div className="result-stat-header">
              <span className="result-stat-label">WORST</span>
              <span>{worstCount}</span>
            </div>
            <div className="result-stat-bar">
              <div className="result-stat-fill" style={{ width: `${getPercentage(worstCount)}%` }}></div>
            </div>
          </div>
          
          <div className="result-stat-row result-stat-miss">
            <div className="result-stat-header">
              <span className="result-stat-label">MISS</span>
              <span>{missCount}</span>
            </div>
            <div className="result-stat-bar">
              <div className="result-stat-fill" style={{ width: `${getPercentage(missCount)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Return to lobby instruction */}
      <div className="result-return-instruction">
        <span className="space-key">⎵</span>
        Press SPACE to return to lobby
      </div>
    </div>
  );
};

export default ResultScreen;