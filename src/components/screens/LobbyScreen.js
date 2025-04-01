import React from 'react';
import { Music, ChevronUp, ChevronDown, BarChart2, Clock, Play } from 'lucide-react';
import '../RhythmGame/RhythmGame.css';

/**
 * Enhanced Lobby screen component for song selection
 * @param {Object} props - Component props
 * @param {Array} props.songs - List of available songs
 * @param {number} props.currentSong - Index of currently selected song
 */
const LobbyScreen = ({ songs, currentSong }) => {
  // Generate animated music notes
  const renderMusicNotes = () => {
    return Array(12).fill().map((_, index) => {
      const delay = index * 0.5;
      const size = 14 + Math.random() * 10;
      const opacity = 0.4 + Math.random() * 0.3;
      const left = Math.random() * 100;
      const duration = 15 + Math.random() * 15;
      
      const style = {
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        fontSize: `${size}px`,
        left: `${left}%`,
        opacity
      };
      
      return (
        <div key={index} className="lobby-floating-note" style={style}>
          {index % 2 === 0 ? '♪' : '♫'}
        </div>
      );
    });
  };

  return (
    <div className="lobby-container">
      <div className="lobby-background">
        <div className="lobby-bg-gradient"></div>
        <div className="lobby-bg-circles"></div>
        <div className="lobby-floating-notes">
          {renderMusicNotes()}
        </div>
      </div>
      
      <div className="lobby-content">
        <h1 className="lobby-title">
          <span className="lobby-title-main">Rhythm</span>
          <span className="lobby-title-sub">Master</span>
        </h1>
        
        <div className="lobby-song-container">
          <h2 className="lobby-song-header">
            <Music className="lobby-header-icon" />
            <span>Select Your Track</span>
          </h2>
          
          <div className="lobby-scroll-indicator top">
            <ChevronUp size={20} />
          </div>
          
          <div className="lobby-song-list">
            {songs.map((song, index) => (
              <div 
                key={index} 
                className={`lobby-song-item ${index === currentSong ? 'selected' : ''}`}
              >
                <div className="lobby-song-preview">
                  <div className="lobby-song-album" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/assets/backgrounds/${song.background || 'default.jpg'})` }}>
                    {index === currentSong && (
                      <div className="lobby-song-play-icon">
                        <Play size={24} />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="lobby-song-info">
                  <div className="lobby-song-name">{song.name}</div>
                  <div className="lobby-song-details">
                    <div className="lobby-song-bpm">
                      <BarChart2 size={14} />
                      <span>BPM: {song.bpm}</span>
                    </div>
                    <div className="lobby-song-duration">
                      <Clock size={14} />
                      <span>Notes: {song.lines}</span>
                    </div>
                  </div>
                </div>
                
                {index === currentSong && (
                  <div className="lobby-song-selected-indicator"></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="lobby-scroll-indicator bottom">
            <ChevronDown size={20} />
          </div>
        </div>
        
        <div className="lobby-instructions">
          <div className="lobby-key-instruction">
            <div className="lobby-key">
              <ChevronUp size={16} />
            </div>
            <div className="lobby-key">
              <ChevronDown size={16} />
            </div>
            <span>Select track</span>
          </div>
          
          <div className="lobby-key-instruction">
            <div className="lobby-key lobby-key-space">Space</div>
            <span>Start game</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;