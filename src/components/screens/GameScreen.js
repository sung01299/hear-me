import React from 'react';
import { Crown } from 'lucide-react';

/**
 * Main gameplay screen component
 */
const GameScreen = ({ 
  notes, score, combo, maxCombo, rating,
  // fever, feverGauge, 
  keyStates, keyAnimations, effectAnimations, comboEffect, 
  missAnim, lastCombo, 
  // feverAnim, 
  songName, bpm
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
    <div className="game-container bg-gradient">
      {/* Background elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Gear/lane graphics would go here */}
        <div className="w-1/4 h-full bg-black/30 backdrop-blur-sm"></div>
      </div>
      
      {/* Song info */}
      <div className="game-song-info">
        <div className="game-song-name">{songName}</div>
        <div className="game-song-bpm">BPM: {bpm}</div>
      </div>
      
      {/* Score and combo display */}
      <div className="game-score">
        <div className="game-score-value">{Math.floor(score)}</div>
        <div className="game-max-combo">Max Combo: {maxCombo}</div>
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
          {combo}
        </div>
        
        {/* Lost combo display */}
        {/* <div 
          className="game-lost-combo"
          style={{ 
            opacity: missAnim,
            transform: `scale(${missAnim * 4})`,
          }}
        >
          {lastCombo}
        </div> */}
      </div>
      
      {/* Lane dividers */}
      <div className="game-lanes">
        <div className="game-lane-divider"></div>
        <div className="game-lane-divider"></div>
        <div className="game-lane-divider"></div>
      </div>
      
      {/* Hit line */}
      <div className="game-hit-line">
        <div className="game-hit-line-inner"></div>
      </div>
      
      {/* Notes */}
      <div className="absolute inset-0">
        {notes.t1.map((note, index) => (
          <div 
            key={`t1-${index}`} 
            className="game-note game-note-t1"
            style={{ 
              left: trackPositions[0].x, 
              top: `${note.y}px`,
              transform: 'translateX(-50%)'
            }}
          ></div>
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
          ></div>
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
          ></div>
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
          ></div>
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
            }}
          ></div>
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