import React, { useEffect, useState } from 'react';
import { Crown, TrendingUp, Award, BarChart2 } from 'lucide-react';
import '../aesthetics/RhythmGame.css';
import '../aesthetics/RhythmGameEffects.css';

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
  const [stars, setStars] = useState([]);

  // Generate stars for the background
  useEffect(() => {
    const starArray = Array(30).fill().map((_, index) => {
      return {
        id: index,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: 1 + Math.random() * 3,
        animationDelay: Math.random() * 2,
        color: Math.random() > 0.8 ? '#8b5cf6' : '#ffffff'
      };
    });
    
    setStars(starArray);
  }, []);

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
    if (weightedScore >= 0.9) calculatedRank = 'S';
    else if (weightedScore >= 0.8) calculatedRank = 'A';
    else if (weightedScore >= 0.7) calculatedRank = 'B';
    else if (weightedScore >= 0.6) calculatedRank = 'C';
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

  // Get a color based on the rank
  const getRankColor = () => {
    switch(rank) {
      case 'S': return 'linear-gradient(45deg, #c026d3, #8b5cf6)';
      case 'A': return 'linear-gradient(45deg, #8b5cf6, #3b82f6)';
      case 'B': return 'linear-gradient(45deg, #3b82f6, #0ea5e9)';
      case 'C': return 'linear-gradient(45deg, #0ea5e9, #06b6d4)';
      default: return 'linear-gradient(45deg, #64748b, #475569)';
    }
  };

  return (
    <div className="result-screen bg-gradient"
      style={{
        backgroundImage: 'url("assets/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
      <div className="lobby-bg-circles"></div>
      {/* Background stars */}
      <div className="stars-container">
        {stars.map(star => (
          <div 
            key={star.id} 
            className="star" 
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              animationDelay: `${star.animationDelay}s`
            }} 
          />
        ))}
      </div>

      {/* Main content container */}
      <div className="result-content-container glass-dark">
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
            <div 
              className="result-rank-enhanced" 
              style={{ 
                transform: rank ? 'scale(1)' : 'scale(0)',
                background: getRankColor()
              }}
            >
              <span className="result-rank-text">{rank}</span>
            </div>
            <div className="result-rank-label"
            style={{
              transform: rank ? 'scale(1)' : 'scale(0)',
            }}>
              <Award size={14} className="rank-icon" />
              Rank
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className={`result-stats-section ${showStats ? 'result-stats-show' : 'result-stats-hide'}`}>
          <div className="result-combo-section">
            {/* <Crown size={20} className="result-crown-icon" /> */}
            <span className="result-combo-label">Max Combo:</span>
            <span className="result-combo-value">{maxCombo}</span>
          </div>
          
          {/* Rating statistics with progress bars */}
          <div className="result-stats-grid">
            <div className="result-stat-row result-stat-perfect">
              <div className="result-stat-header">
                <span className="result-stat-label">PERFECT</span>
                <span>{perfectCount}</span>
              </div>
              <div className="stat-bar-enhanced">
                <div 
                  className="stat-fill-enhanced" 
                  style={{ 
                    width: `${getPercentage(perfectCount)}%`,
                    background: 'linear-gradient(to right, #c026d3, #8b5cf6)'
                  }}
                ></div>
              </div>
            </div>
            
            <div className="result-stat-row result-stat-great">
              <div className="result-stat-header">
                <span className="result-stat-label">GREAT</span>
                <span>{greatCount}</span>
              </div>
              <div className="stat-bar-enhanced">
                <div 
                  className="stat-fill-enhanced" 
                  style={{ 
                    width: `${getPercentage(greatCount)}%`,
                    background: 'linear-gradient(to right, #8b5cf6, #3b82f6)'
                  }}
                ></div>
              </div>
            </div>
            
            <div className="result-stat-row result-stat-good">
              <div className="result-stat-header">
                <span className="result-stat-label">GOOD</span>
                <span>{goodCount}</span>
              </div>
              <div className="stat-bar-enhanced">
                <div 
                  className="stat-fill-enhanced" 
                  style={{ 
                    width: `${getPercentage(goodCount)}%`,
                    background: 'linear-gradient(to right, #3b82f6, #0ea5e9)'
                  }}
                ></div>
              </div>
            </div>
            
            <div className="result-stat-row result-stat-bad">
              <div className="result-stat-header">
                <span className="result-stat-label">BAD</span>
                <span>{badCount}</span>
              </div>
              <div className="stat-bar-enhanced">
                <div 
                  className="stat-fill-enhanced" 
                  style={{ 
                    width: `${getPercentage(badCount)}%`,
                    background: 'linear-gradient(to right, #0ea5e9, #06b6d4)'
                  }}
                ></div>
              </div>
            </div>
            
            <div className="result-stat-row result-stat-worst">
              <div className="result-stat-header">
                <span className="result-stat-label">WORST</span>
                <span>{worstCount}</span>
              </div>
              <div className="stat-bar-enhanced">
                <div 
                  className="stat-fill-enhanced" 
                  style={{ 
                    width: `${getPercentage(worstCount)}%`,
                    background: 'linear-gradient(to right, #f59e0b, #f97316)'
                  }}
                ></div>
              </div>
            </div>
            
            <div className="result-stat-row result-stat-miss">
              <div className="result-stat-header">
                <span className="result-stat-label">MISS</span>
                <span>{missCount}</span>
              </div>
              <div className="stat-bar-enhanced">
                <div 
                  className="stat-fill-enhanced" 
                  style={{ 
                    width: `${getPercentage(missCount)}%`,
                    background: 'linear-gradient(to right, #ef4444, #b91c1c)'
                  }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Statistics summary */}
          <div className="result-summary glass">
            <BarChart2 size={18} className="summary-icon" />
            <div className="result-summary-text">
              You hit <strong>{totalHitNotes}</strong> out of <strong>{totalNotes}</strong> notes with a max combo of <strong>{maxCombo}</strong>.
              {rank === 'S' && ' Outstanding performance!'}
              {rank === 'A' && ' Great job!'}
              {rank === 'B' && ' Good effort!'}
              {rank === 'C' && ' Keep practicing!'}
              {rank === 'D' && ' You can do better next time!'}
            </div>
          </div>
        </div>
      </div>

      {/* Return to lobby instruction */}
      <div className="result-return-instruction glass">
        <span className="space-key">⎵</span>
        Press SPACE to return to lobby
      </div>
    </div>
  );
};

export default ResultScreen;