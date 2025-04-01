import React from 'react';
import { Music } from 'lucide-react';

/**
 * Lobby screen component for song selection
 * @param {Object} props - Component props
 * @param {Array} props.songs - List of available songs
 * @param {number} props.currentSong - Index of currently selected song
 */
const LobbyScreen = ({ songs, currentSong }) => {
  return (
    <div className="lobby-container bg-gradient">
      <h1 className="lobby-title">Rhythm Master</h1>
      
      <div className="lobby-song-list">
        <h2 className="text-2xl mb-4">Select a Song</h2>
        
        <div className="space-y-4">
          {songs.map((song, index) => (
            <div 
              key={index} 
              className={`lobby-song-item ${index === currentSong ? 'selected' : ''}`}
            >
              <Music className="mr-3" />
              <div>
                <div className="lobby-song-name">{song.name}</div>
                <div className="lobby-song-bpm">BPM: {song.bpm}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="lobby-instructions">
          <p>Use ↑↓ arrows to select a song</p>
          <p>Press SPACE to start</p>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;