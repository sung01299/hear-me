import React from 'react';
import { Music, Disc } from 'lucide-react';
import '../RhythmGame/RhythmGame.css';

/**
 * Enhanced Loading screen component
 * @param {Object} props - Component props
 * @param {number} props.progress - Loading progress percentage (0-100)
 * @param {string} props.songName - Name of the song being loaded
 */
const LoadingScreen = ({ progress, songName }) => {
  // Generate music notes for animation
  const renderMusicNotes = () => {
    return Array(8).fill().map((_, index) => {
      const delay = index * 0.7;
      const size = 16 + Math.random() * 8;
      const style = {
        animationDelay: `${delay}s`,
        fontSize: `${size}px`,
        left: `${5 + Math.random() * 90}%`
      };
      return (
        <div key={index} className="loading-note" style={style}>
          ♪
        </div>
      );
    });
  };

  return (
    <div className="loading-container">
      <div className="loading-content">
        <h2 className="loading-title">
          <Disc className="loading-disc-icon animate-spin" size={32} />
          Loading Track
        </h2>
        
        <div className="loading-song-name">
          <Music size={18} className="loading-music-icon" />
          <span>"{songName}"</span>
        </div>
        
        <div className="loading-bar-container">
          <div className="loading-bar">
            <div 
              className="loading-progress" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="loading-percentage">{progress}%</div>
        </div>
        
        <div className="loading-tip">
          Get ready to hit the notes with perfect timing!
        </div>
      </div>
      
      {/* Animated music notes */}
      <div className="loading-notes-container">
        {renderMusicNotes()}
      </div>
    </div>
  );
};

export default LoadingScreen;