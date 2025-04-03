import React, { useEffect, useState } from 'react';
import { Music, Disc } from 'lucide-react';
import '../aesthetics/RhythmGame.css';
import '../aesthetics/RhythmGameEffects.css';

const LoadingScreen = ({ progress, songName }) => {
  const [animatedNotes, setAnimatedNotes] = useState([]);
  const [tips, setTips] = useState([
    "Try to maintain long combos for higher scores!",
    "Perfect hits give the most points. Timing is everything!",
    "Watch for the visual cues to help with rhythm.",
    "The D, F, J, K keys correspond to the four tracks.",
  ]);
  const [currentTip, setCurrentTip] = useState(0);
  
  useEffect(() => {
    const notes = Array(15).fill().map((_, index) => {
      const delay = Math.random() * 5;
      const duration = 10 + Math.random() * 10;
      const size = 16 + Math.random() * 12;
      const left = Math.random() * 100;
      const type = Math.random() > 0.5 ? '♪' : '♫';
      
      return { id: index, delay, duration, size, left, type };
    });
    
    setAnimatedNotes(notes);
    
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container bg-gradient"
      style={{
        backgroundImage: 'url("assets/background.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
      <div className="lobby-bg-circles"></div>
      <div className="loading-content">
        <h2 className="loading-title">
          <Disc className="loading-disc-icon animate-spin" size={32} />
          Loading Track
        </h2>
        
        <div className="loading-song-name">
          <Music size={18} className="loading-music-icon" />
          <span>"{songName}"</span>
        </div>

        <div className="loading-percentage"
          style={{fontSize: 35, fontStyle: 'bold'}}>
          {progress}%
        </div>
        
        <div className="loading-bar-container">
          <div className="loading-bar">
            <div 
              className="loading-progress-enhanced" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="loading-tip-container glass">
          <div className="loading-tip">
            <div className="tip-icon">💡</div>
            <div className="tip-text">{tips[currentTip]}</div>
          </div>
        </div>
      </div>
      
      {animatedNotes.map(note => (
        <div 
          key={note.id}
          className="floating-musical-note"
          style={{
            left: `${note.left}%`,
            animationDelay: `${note.delay}s`,
            animationDuration: `${note.duration}s`,
            fontSize: `${note.size}px`
          }}
        >
          {note.type}
        </div>
      ))}
      
      <div className="loading-visual-effect"></div>
    </div>
  );
};

export default LoadingScreen;