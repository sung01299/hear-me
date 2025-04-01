import React from 'react';

/**
 * Loading screen component
 * @param {Object} props - Component props
 * @param {number} props.progress - Loading progress percentage (0-100)
 * @param {string} props.songName - Name of the song being loaded
 */
const LoadingScreen = ({ progress, songName }) => {
  return (
    <div className="loading-container">
      <h2 className="loading-title">Loading "{songName}"</h2>
      
      <div className="loading-bar">
        <div 
          className="loading-progress" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <p className="loading-percentage">{progress}%</p>
    </div>
  );
};

export default LoadingScreen;