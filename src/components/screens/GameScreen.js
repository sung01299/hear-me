import React, { useRef, useEffect } from 'react';
import '../aesthetics/GameScreen.css';
import '../aesthetics/RhythmGameEffects.css';

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
}) => {
  const canvasRef = useRef(null);
  const [bgImage, setBgImage] = React.useState(null);
  const trackWidth = 80;
  const trackGap = 10;
  const hitLineY = 600;
  const noteHeight = 20;

  useEffect(() => {
    const img = new Image();
    img.src = 'assets/background.jpg';
    img.onload = () => {
      setBgImage(img);
    };
  }, []);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground(ctx, canvas);
    
    const trackColors = ['#FF5599', '#55FFBB', '#5599FF', '#FFDD55'];
    const startX = (canvas.width - (trackWidth * 4 + trackGap * 3)) / 2;
    
    for (let i = 0; i < 4; i++) {
      const trackX = startX + i * (trackWidth + trackGap);
      
      const trackGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      trackGradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
      trackGradient.addColorStop(0.9, `rgba(${i === 0 ? '255, 85, 153' : i === 1 ? '85, 255, 187' : i === 2 ? '85, 153, 255' : '255, 221, 85'}, 0.2)`);
      trackGradient.addColorStop(1, `rgba(${i === 0 ? '255, 85, 153' : i === 1 ? '85, 255, 187' : i === 2 ? '85, 153, 255' : '255, 221, 85'}, 0.3)`);
      
      ctx.fillStyle = trackGradient;
      ctx.fillRect(trackX, 0, trackWidth, canvas.height);
      
      ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(trackX, 0);
      ctx.lineTo(trackX, canvas.height);
      ctx.moveTo(trackX + trackWidth, 0);
      ctx.lineTo(trackX + trackWidth, canvas.height);
      ctx.stroke();
      
      const hitLineGradient = ctx.createLinearGradient(trackX, hitLineY, trackX + trackWidth, hitLineY);
      hitLineGradient.addColorStop(0, keyStates[i] ? trackColors[i] : `rgba(255, 255, 255, 0.6)`);
      hitLineGradient.addColorStop(0.5, keyStates[i] ? '#FFFFFF' : `rgba(255, 255, 255, 0.8)`);
      hitLineGradient.addColorStop(1, keyStates[i] ? trackColors[i] : `rgba(255, 255, 255, 0.6)`);
      
      ctx.fillStyle = hitLineGradient;
      ctx.fillRect(trackX, hitLineY, trackWidth, 2);
      
      if (keyStates[i]) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = trackColors[i];
        ctx.fillRect(trackX, hitLineY, trackWidth, 2);
        ctx.shadowBlur = 0;
      }
      
      if (effectAnimations[i] < 5) {
        const effectSize = 50 * (1 - effectAnimations[i] / 5);
        
        ctx.fillStyle = `rgba(${i === 0 ? '255, 85, 153' : i === 1 ? '85, 255, 187' : i === 2 ? '85, 153, 255' : '255, 221, 85'}, ${0.8 - effectAnimations[i] / 5})`;
        ctx.beginPath();
        ctx.arc(trackX + trackWidth / 2, hitLineY, effectSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = `rgba(${i === 0 ? '255, 85, 153' : i === 1 ? '85, 255, 187' : i === 2 ? '85, 153, 255' : '255, 221, 85'}, ${0.6 - effectAnimations[i] / 5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(trackX + trackWidth / 2, hitLineY, effectSize, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      const trackKey = 't' + (i + 1);
      
      if (notes[trackKey]) {
        for (const note of notes[trackKey]) {
          if (note.y >= 0 && note.y <= canvas.height) {
            const noteGradient = ctx.createLinearGradient(trackX, note.y - noteHeight / 2, trackX, note.y + noteHeight / 2);
            noteGradient.addColorStop(0, trackColors[i]);
            noteGradient.addColorStop(1, `rgba(${i === 0 ? '255, 85, 153' : i === 1 ? '85, 255, 187' : i === 2 ? '85, 153, 255' : '255, 221, 85'}, 0.7)`);
            
            ctx.fillStyle = noteGradient;
            
            const cornerRadius = 4;
            ctx.beginPath();
            ctx.moveTo(trackX + cornerRadius, note.y - noteHeight / 2);
            ctx.lineTo(trackX + trackWidth - cornerRadius, note.y - noteHeight / 2);
            ctx.quadraticCurveTo(trackX + trackWidth, note.y - noteHeight / 2, trackX + trackWidth, note.y - noteHeight / 2 + cornerRadius);
            ctx.lineTo(trackX + trackWidth, note.y + noteHeight / 2 - cornerRadius);
            ctx.quadraticCurveTo(trackX + trackWidth, note.y + noteHeight / 2, trackX + trackWidth - cornerRadius, note.y + noteHeight / 2);
            ctx.lineTo(trackX + cornerRadius, note.y + noteHeight / 2);
            ctx.quadraticCurveTo(trackX, note.y + noteHeight / 2, trackX, note.y + noteHeight / 2 - cornerRadius);
            ctx.lineTo(trackX, note.y - noteHeight / 2 + cornerRadius);
            ctx.quadraticCurveTo(trackX, note.y - noteHeight / 2, trackX + cornerRadius, note.y - noteHeight / 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 8;
            ctx.shadowColor = trackColors[i];
            ctx.fill();
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(trackX + cornerRadius, note.y - noteHeight / 2);
            ctx.lineTo(trackX + trackWidth - cornerRadius, note.y - noteHeight / 2);
            ctx.quadraticCurveTo(trackX + trackWidth, note.y - noteHeight / 2, trackX + trackWidth, note.y - noteHeight / 2 + cornerRadius);
            ctx.lineTo(trackX + trackWidth, note.y - noteHeight / 2 + 4);
            ctx.lineTo(trackX, note.y - noteHeight / 2 + 4);
            ctx.lineTo(trackX, note.y - noteHeight / 2 + cornerRadius);
            ctx.quadraticCurveTo(trackX, note.y - noteHeight / 2, trackX + cornerRadius, note.y - noteHeight / 2);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    }
    
    if (rating) {
      let ratingColor;
      switch (rating) {
        case 'PERFECT': ratingColor = '#00FFAA'; break;
        case 'GREAT': ratingColor = '#00AAFF'; break;
        case 'GOOD': ratingColor = '#FFAA00'; break;
        case 'BAD': ratingColor = '#FF5500'; break;
        case 'WORST': ratingColor = '#FF0000'; break;
        case 'MISS': ratingColor = '#FF0000'; break;
        default: ratingColor = '#FFFFFF';
      }
      
      ctx.font = 'bold 48px Ubuntu';
      ctx.textAlign = 'center';
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = ratingColor;
      ctx.fillStyle = ratingColor;
      ctx.fillText(rating, canvas.width / 2, 160);
      ctx.shadowBlur = 0;
    }
    
  }, [notes, score, combo, rating, keyStates, effectAnimations, keyAnimations, missAnim, bgImage]);
  
  const drawBackground = (ctx, canvas) => {

    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.height
    );
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
    gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const hitAreaGradient = ctx.createLinearGradient(0, hitLineY - 50, 0, hitLineY + 50);
    hitAreaGradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
    hitAreaGradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)');
    hitAreaGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    
    ctx.fillStyle = hitAreaGradient;
    ctx.fillRect(0, hitLineY - 50, canvas.width, 100);
  };
  
  return (
    <div className="game-screen">
      <div className="game-header glass-dark">
        <div className="song-info">
          <h2>{songName}</h2>
        </div>
        <div className="game-stats">
          <div className="score">{score}</div>
          <div className="combo-container">
            <span className="combo-label">Combo</span>
            <span className="combo-value" style={{ 
              transform: `scale(${1 + comboEffect * 0.3})`,
              color: combo > 10 ? '#00FFAA' : combo > 5 ? '#00AAFF' : '#ff66cc'
            }}>
              {combo}
            </span>
          </div>
          <div className="max-combo">Max: {maxCombo}</div>
        </div>
        <div className={`rating ${rating.toLowerCase()}`} style={{ opacity: rating ? 1 : 0 }}>
        </div>
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="game-canvas"
        width={800}
        height={700}
      />
      
      {missAnim > 0 && (
        <div className="miss-overlay" style={{ opacity: 0 }}>
          <div className="last-combo">Combo Lost: {lastCombo}</div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;