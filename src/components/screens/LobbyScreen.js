import React, { useEffect } from 'react';
import { Music, ChevronUp, ChevronDown, Play, Upload, Disc } from 'lucide-react';
import '../aesthetics/RhythmGame.css';
import '../aesthetics/RhythmGameEffects.css';

const LobbyScreen = ({ songs, currentSong, handleFileUpload, isAnalyzing, startAnalysis, audioFile }) => {
  const [animatedNotes, setAnimatedNotes] = React.useState([]);

  useEffect(() => {
    const notes = Array(20).fill().map((_, index) => {
      const delay = Math.random() * 5;
      const duration = 15 + Math.random() * 10;
      const size = 20 + Math.random() * 20;
      const left = Math.random() * 100;
      const type = Math.random() > 0.5 ? '♪' : '♫';

      return { id: index, delay, duration, size, left, type };
    });

    setAnimatedNotes(notes);
  }, []);

  return (
    <div className="lobby-container">
      <div className="lobby-background bg-gradient"
        style={{
          backgroundImage: 'url("assets/background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
        <div className="lobby-bg-circles"></div>
        <div className="bg-grid"></div>
        
        {/* Animated floating notes */}
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
      </div>
      
      <div className="lobby-content">
        <h1 className="lobby-title">
          <span className="lobby-title-main">Hear Me</span>
          {/* <span className="lobby-title-sub">Master</span> */}
        </h1>
        
        <div className="lobby-song-container glass-dark">
          {/* <h2 className="lobby-song-header">
            <Music className="lobby-header-icon" />
            <span>Select Your Track</span>
          </h2> */}
          
          {/* <div className="lobby-scroll-indicator top">
            <ChevronUp size={20} />
          </div> */}
          
          <div className="lobby-song-list">
            {songs.map((song, index) => (
              <div 
                key={index} 
                className={`lobby-song-item ${index === currentSong ? 'selected' : ''}`}
              >
                {index === 0 
                  ? <div className="lobby-song-upload">
                      <div className="lobby-upload-icon">
                        <Upload size={24} className="upload-icon-svg" />
                      </div>
                      <div className="lobby-song-info-upload">
                        <div className="lobby-song-name">Upload Your Own Song</div>
                        <div className="lobby-song-upload-form">
                          <label className="upload-button neon-button">
                            <span>Choose File</span>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={handleFileUpload}
                              disabled={isAnalyzing}
                              className="file-input"
                            />
                          </label>
                          {/* {audioFile && (
                            <div className="selected-file">
                              {audioFile.name}
                            </div>
                          )} */}
                        </div>
                      </div>
                    </div>
                  : (
                    <div className="lobby-song-info">
                      <div className="lobby-song-preview">
                        <div className="lobby-song-album">
                          <Disc size={30} className="album-icon" />
                        </div>
                      </div>
                      
                      <div className="lobby-song-details">
                        <div className={`lobby-song-name${index===currentSong ? ' selected' : ''}`}>{song.name}</div>
                      </div>
                    </div>
                  )
                }        
                {index === currentSong && (
                  <div className="lobby-song-selected-indicator"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* <div className="lobby-scroll-indicator bottom">
            <ChevronDown size={20} />
          </div> */}
        </div>
        
        <div className="lobby-instructions glass-dark-instructions">
          <div className="lobby-key-instruction">
            <div className="lobby-key">
              <ChevronUp size={17} />
            </div>
            <div className="lobby-key">
              <ChevronDown size={17} />
            </div>
            <span style={{fontWeight: 'bold', fontSize: 17}}>Select track</span>
          </div>
          
          <div className="lobby-key-instruction">
            <div className="lobby-key lobby-key-space">Space</div>
            <span style={{fontWeight: 'bold', fontSize: 17}}>Start game</span>
          </div>
        </div>
      </div>
      
      {/* Visual effects layer */}
      <div className="lobby-visual-effect"></div>
    </div>
  );
};

export default LobbyScreen;