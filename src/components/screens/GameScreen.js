import React from 'react';
import { Crown, Music, BarChart2 } from 'lucide-react';
import '../RhythmGame/RhythmGame.css';

/**
 * Enhanced Main gameplay screen component
 */
const GameScreen = ({ 
  notes, score, combo, maxCombo, rating,
  keyStates, keyAnimations, effectAnimations, comboEffect, 
  missAnim, lastCombo, songName, bpm
}) => {
  // Key position constants
  const trackPositions = [
    { x: 'calc(50% - 120px)', y: 600 }, // Track 1 (D)
    { x: 'calc(50% - 40px)', y: 600 },  // Track 2 (F)
    { x: 'calc(50% + 40px)', y: 600 },  // Track 3 (J)
    { x: 'calc(50% + 120px)', y: 600 }, // Track 4 (K)
  ];

  // Get rating color class
  const getRatingColorClass = (rating) => {
    switch(rating) {
      case 'PERFECT': return 'rating-perfect';
      case 'GREAT': return 'rating-great';
      case 'GOOD': return 'rating-good';
      case 'BAD': return 'rating-bad';
      case 'WORST': return 'rating-worst';
      case 'MISS': return 'rating-miss';
      default: return '';
    }
  };

  return (
    <div className="game-container">
      {/* Animated Background */}
      <div className="game-bg-gradient">
        <div className="game-bg-scanlines"></div>
        <div className="game-bg-glow"></div>
      </div>
      
      {/* Song info */}
      <div className="game-song-info">
        <Music className="game-song-icon" size={18} />
        <div className="game-song-name">{songName}</div>
        <div className="game-song-bpm">BPM: {bpm}</div>
      </div>
      
      {/* Score and combo display */}
      <div className="game-score">
        <div className="game-score-value">{Math.floor(score)}</div>
        <div className="game-max-combo">
          <Crown size={14} className="game-crown-icon" />
          <span>Max Combo: {maxCombo}</span>
        </div>
      </div>
      
      {/* Rating display */}
      <div className="game-rating">
        <div 
          className={`game-rating-text ${getRatingColorClass(rating)}`}
          style={{ 
            opacity: rating ? 1 : 0,
            transform: `scale(${1 + comboEffect * 0.3})`,
          }}
        >
          {rating}
        </div>
      </div>
      
      {/* Combo display */}
      <div className="game-combo">
        <div 
          className="game-combo-value"
          style={{ 
            opacity: combo > 0 ? 1 : 0,
            transform: `scale(${1 + comboEffect * 0.2})`,
          }}
        >
          {combo > 0 && <span className="game-combo-x">×</span>}
          {combo}
        </div>
        
        {/* Lost combo display */}
        <div 
          className="game-lost-combo"
          style={{ 
            opacity: missAnim,
            transform: `translateY(${missAnim * 50}px) scale(${Math.max(0.5, 1 - missAnim)})`,
          }}
        >
          {lastCombo}
        </div>
      </div>
      
      {/* Lane dividers and visualizers */}
      <div className="game-lane-container">
        {[0, 1, 2, 3].map(index => (
          <div 
            key={`lane-${index}`} 
            className={`game-lane ${keyStates[index] ? 'game-lane-active' : ''}`}
            style={{
              left: trackPositions[index].x,
            }}
          >
            <div className="game-lane-glow"></div>
          </div>
        ))}
      </div>
      
      {/* Hit line */}
      <div className="game-hit-line">
        <div className="game-hit-line-inner"></div>
        <div className="game-hit-line-glow"></div>
      </div>
      
      {/* Notes */}
      <div className="game-notes-container">
        {notes.t1.map((note, index) => (
          <div 
            key={`t1-${index}`} 
            className="game-note game-note-t1"
            style={{ 
              left: trackPositions[0].x, 
              top: `${note.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="game-note-glow"></div>
          </div>
        ))}
        
        {notes.t2.map((note, index) => (
          <div 
            key={`t2-${index}`} 
            className="game-note game-note-t2"
            style={{ 
              left: trackPositions[1].x, 
              top: `${note.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="game-note-glow"></div>
          </div>
        ))}
        
        {notes.t3.map((note, index) => (
          <div 
            key={`t3-${index}`} 
            className="game-note game-note-t3"
            style={{ 
              left: trackPositions[2].x, 
              top: `${note.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="game-note-glow"></div>
          </div>
        ))}
        
        {notes.t4.map((note, index) => (
          <div 
            key={`t4-${index}`} 
            className="game-note game-note-t4"
            style={{ 
              left: trackPositions[3].x, 
              top: `${note.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="game-note-glow"></div>
          </div>
        ))}
      </div>
      
      {/* Key buttons */}
      {trackPositions.map((pos, index) => (
        <div 
          key={`key-${index}`}
          className={`game-key ${keyStates[index] ? 'game-key-pressed' : 'game-key-default'}`}
          style={{ 
            left: pos.x, 
            top: `${pos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="game-key-letter">
            {index === 0 ? 'D' : index === 1 ? 'F' : index === 2 ? 'J' : 'K'}
          </span>
          <div className="game-key-ring"></div>
        </div>
      ))}
      
      {/* Hit effects */}
      {trackPositions.map((pos, index) => (
        effectAnimations[index] < 5 && (
          <div 
            key={`effect-${index}`}
            className="game-hit-effect"
            style={{ 
              left: pos.x, 
              top: `${pos.y}px`,
              transform: 'translate(-50%, -50%)',
              opacity: 1 - (effectAnimations[index] / 5),
              scale: 1 + (1 - effectAnimations[index] / 5) * 0.5,
            }}
          >
            <div className="game-hit-effect-inner"></div>
          </div>
        )
      ))}
      
      {/* Control instructions */}
      <div className="game-controls">
        <div>Controls: D F J K</div>
      </div>
    </div>
  );
};

export default GameScreen;