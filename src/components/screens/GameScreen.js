import React, { useRef, useEffect } from 'react';
import './GameScreen.css';

const GameScreen = ({ 
  notes, 
  score, 
  combo, 
  maxCombo, 
  rating, 
  keyStates, 
  keyAnimations, 
  effectAnimations, 
  comboEffect, 
  missAnim, 
  lastCombo, 
  songName, 
  bpm 
}) => {
  const canvasRef = useRef(null);
  const trackWidth = 80;
  const trackGap = 10;
  const hitLineY = 600;
  const noteHeight = 20;
  
  // Draw the game screen
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match container
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw tracks
    const trackColors = ['#FF5555', '#55FF55', '#5555FF', '#FFFF55'];
    const startX = (canvas.width - (trackWidth * 4 + trackGap * 3)) / 2;
    
    for (let i = 0; i < 4; i++) {
      const trackX = startX + i * (trackWidth + trackGap);
      
      // Draw track background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(trackX, 0, trackWidth, canvas.height);
      
      // Draw hit line
      ctx.fillStyle = keyStates[i] ? '#FFFFFF' : '#AAAAAA';
      ctx.fillRect(trackX, hitLineY, trackWidth, 2);
      
      // Draw key effect
      if (effectAnimations[i] < 5) {
        const effectSize = 40 * (1 - effectAnimations[i] / 5);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (1 - effectAnimations[i] / 5) + ')';
        ctx.beginPath();
        ctx.arc(trackX + trackWidth / 2, hitLineY, effectSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw notes for this track
      ctx.fillStyle = trackColors[i];
      const trackKey = 't' + (i + 1);
      
      if (notes[trackKey]) {
        for (const note of notes[trackKey]) {
          if (note.y >= 0 && note.y <= canvas.height) {
            ctx.fillRect(trackX, note.y - noteHeight / 2, trackWidth, noteHeight);
          }
        }
      }
    }
    
    // Draw UI elements
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);
    
    // Draw combo
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${combo}x`, canvas.width / 2, 80);
    
    // Draw rating
    if (rating) {
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(rating, canvas.width / 2, 160);
    }
    
  }, [notes, score, combo, rating, keyStates, effectAnimations, keyAnimations, missAnim]);
  
  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="song-info">
          <h2>{songName}</h2>
          <p>BPM: {bpm}</p>
        </div>
        <div className="game-stats">
          <div className="score">{score}</div>
          <div className="combo-container">
            <span className="combo-label">Combo</span>
            <span className="combo-value" style={{ transform: `scale(${1 + comboEffect * 0.3})` }}>
              {combo}
            </span>
          </div>
          <div className="max-combo">Max: {maxCombo}</div>
        </div>
        <div className="rating" style={{ opacity: rating ? 1 : 0 }}>
          {rating}
        </div>
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="game-canvas"
        width={800}
        height={700}
      />
      
      {missAnim > 0 && (
        <div className="miss-overlay" style={{ opacity: missAnim }}>
          <div className="last-combo">Combo Lost: {lastCombo}</div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;