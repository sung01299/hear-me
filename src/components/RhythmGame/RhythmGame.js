import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2, Crown } from 'lucide-react';
import { parseNoteFile } from './NoteParser';
import LobbyScreen from '../screens/LobbyScreen';
import LoadingScreen from '../screens/LoadingScreen';
import GameScreen from '../screens/GameScreen';
import ResultScreen from '../screens/ResultScreen';
import './RhythmGame.css';

// Main App Component
const RhythmGame = () => {
  const [gameState, setGameState] = useState('lobby'); // lobby, loading, ingame
  const [currentSong, setCurrentSong] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [rating, setRating] = useState('READY');
  // const [notes, setNotes] = useState({ t1: [], t2: [], t3: [], t4: [] });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [keyStates, setKeyStates] = useState([false, false, false, false]);
  const [keyAnimations, setKeyAnimations] = useState([0, 0, 0, 0]);
  const [effectAnimations, setEffectAnimations] = useState([5, 5, 5, 5]);
  const [comboEffect, setComboEffect] = useState(0);
  const [missAnim, setMissAnim] = useState(0);
  const [lastCombo, setLastCombo] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [greatCount, setGreatCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [badCount, setBadCount] = useState(0);
  const [worstCount, setWorstCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  
  const songRef = useRef(null);
  const gameLoopRef = useRef(null);
  const gameStartTimeRef = useRef(0);
  const songStartTimeRef = useRef(0);
  const noteStartTimeRef = useRef(0);
  const songEndTimeRef = useRef(0);
  const comboTimeRef = useRef(0);
  const ratingTimeoutRef = useRef(null);
  const lastDebugTimeRef = useRef(0);

  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(score);
  const comboRef = useRef(combo);
  const maxComboRef = useRef(maxCombo);
  const ratingRef = useRef(rating);
  const notesRef = useRef({ t1: [], t2: [], t3: [], t4: [] });

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  
  useEffect(() => {
    comboRef.current = combo;
  }, [combo]);
  
  useEffect(() => {
    maxComboRef.current = maxCombo;
  }, [maxCombo]);
  
  useEffect(() => {
    ratingRef.current = rating;
  }, [rating]);
  
  // Debug helper to track state
  const debugState = () => {
    console.log("Current Game State (DEBUG):", {
      gameState: gameStateRef.current,
      score: scoreRef.current,
      combo: comboRef.current,
      maxCombo: maxComboRef.current,
      rating: ratingRef.current,
      notesRemaining: {
        t1: notesRef.current.t1.length,
        t2: notesRef.current.t2.length,
        t3: notesRef.current.t3.length,
        t4: notesRef.current.t4.length,
      }
    });
  };
  
  // Song data similar to the original
  const songData = [
    { name: "pupa", lines: 911, bpm: 202, noteFile: "pupa.txt", audioFile: "pupa.mp3", background: "bg_pupa.jpg" },
    { name: "light it up", lines: 911, bpm: 175, noteFile: "light it up.txt", audioFile: "light it up.mp3", background: "bg_light_it_up.jpg" },
    { name: "nacreous snowmelt", lines: 911, bpm: 101, noteFile: "nacreous snowmelt.txt", audioFile: "nacreous snowmelt.mp3", background: "bg_nacreous snowmelt.jpg" }
  ];

  // Key to track mapping
  const keyMapping = {
    'd': 0,
    'f': 1,
    'j': 2,
    'k': 3 
  };

  // Handle key press events
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key in keyMapping && gameState === 'ingame') {
        const trackIndex = keyMapping[key];
        
        // Update key states for visual effect
        setKeyStates(prev => {
          const newState = [...prev];
          newState[trackIndex] = true;
          return newState;
        });
        
        // Start key animation
        setKeyAnimations(prev => {
          const newAnims = [...prev];
          newAnims[trackIndex] = 1; // Start animation
          return newAnims;
        });
        
        // Check for note hits
        checkNoteHit(trackIndex);
      }
      
      // Lobby navigation
      if (gameState === 'lobby') {
        if (key === 'arrowup') {
          setCurrentSong(prev => Math.max(0, prev - 1));
        } else if (key === 'arrowdown') {
          setCurrentSong(prev => Math.min(songData.length - 1, prev + 1));
        } else if (key === ' ') {
          // Start loading the song
          setGameState('loading');
          loadSong(songData[currentSong].noteFile, songData[currentSong].audioFile);
        }
      }
      
      // Result screen navigation
      if (gameState === 'result') {
        if (key === ' ') {
          // Reset to lobby
          setGameState('lobby');
          setCurrentSong(0);
        }
      }
    };
    
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key in keyMapping) {
        const trackIndex = keyMapping[key];
        
        // Update key states
        setKeyStates(prev => {
          const newState = [...prev];
          newState[trackIndex] = false;
          return newState;
        });
        
        // Reset key animation
        setKeyAnimations(prev => {
          const newAnims = [...prev];
          newAnims[trackIndex] = 0;
          return newAnims;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, currentSong, combo, score, maxCombo]); // Added dependencies to ensure latest state values
  
  // Load song data
  const loadSong = async (noteFile, audioFile) => {
    try {
      setLoadingProgress(0);
      
      // Read the note file
      const notePath = `${process.env.PUBLIC_URL}/assets/notes/${noteFile}`;
      const audioPath = `${process.env.PUBLIC_URL}/assets/songs/${audioFile}`;

      const response = await fetch(notePath);
      if (!response.ok) {
        throw new Error(`Failed to load note file ${response.statusText}`);
      }
      const fileContent = await response.text();
      console.log("Note file loaded successfully");
      
      // Load the audio
      const audio = new Audio();
      audio.addEventListener('error', (e) => {
        console.error("Audio loading error:", e);
        console.error("Audio element error code:", audio.error ? audio.error.code : "Unknown error");
        setLoadingProgress(100);
      });

      audio.addEventListener('canplaythrough', () => {
        console.log("Audio loaded successfully");
        songRef.current = audio;
        setLoadingProgress(100);
      });

      audio.src = audioPath;

      // Get the audio's length
      const audioDuration = await new Promise((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => {
          resolve(audio.duration);
        });
        audio.addEventListener('error', (e) => {
          console.error("Audio loading error:", e);
          reject(e);
        });
        audio.load();
      });
      // songEndTimeRef.current = audioDuration;
      songEndTimeRef.current = 8;
      
      // Use progress indicator while parsing
      setLoadingProgress(10);
      
      // Parse the note data
      const { noteStartTime, songStartTime, parsedNotes, totalNotes } = parseNoteFile(fileContent);
      
      setLoadingProgress(70);
      
      // Set important song timing information
      noteStartTimeRef.current = noteStartTime;
      songStartTimeRef.current = songStartTime;
      setNoteCount(totalNotes);
      
      // Set the notes
      notesRef.current = parsedNotes;
      
      setLoadingProgress(100);
      
      // Give a small delay to show 100% before starting
      setTimeout(() => {
        startGame();
      }, 500);
      
    } catch (error) {
      console.error("Error loading song:", error);
      const generatedNotes = generateDemoNotes(songData[currentSong].bpm);
      notesRef.current = generatedNotes;
      setNoteCount(100); // Set a reasonable default note count
      setLoadingProgress(100);
      setTimeout(() => {
        startGame();
      }, 500);
    }
  };
  
  // Generate some demo notes for visualization (fallback)
  const generateDemoNotes = (bpm) => {
    // console.log("Generating demo notes with BPM:", bpm);
    const beatTime = 60 / bpm; // Time for one beat in seconds
    // const noteSpeed = 2.8; // Similar to original game
    
    const t1 = [];
    const t2 = [];
    const t3 = [];
    const t4 = [];
    
    // Generate 100 notes spread across 30 seconds with some patterns
    for (let i = 0; i < 100; i++) {
      const time = 3 + (i * beatTime * 0.5); // Start 3 seconds in, notes every half beat
      
      // Create some patterns - similar to original game
      if (i % 4 === 0) t1.push({ time, y: 0, speed: 1.0 });
      if (i % 4 === 1) t2.push({ time, y: 0, speed: 1.0 });
      if (i % 4 === 2) t3.push({ time, y: 0, speed: 1.0 });
      if (i % 4 === 3) t4.push({ time, y: 0, speed: 1.0 });
      
      // Add some double notes occasionally
      if (i % 8 === 0) t3.push({ time: time + 0.1, y: 0, speed: 1.0 });
      if (i % 12 === 0) t2.push({ time: time + 0.05, y: 0, speed: 1.0 });
    }
    
    return { t1, t2, t3, t4 };
  };
  
  // Reset game state for a new game - with explicit state updates
  const resetGameState = () => {
    console.log("Resetting game state...");
    // Reset all game state values with direct assignments
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setRating('READY');
    setComboEffect(0);
    setMissAnim(0);
    setLastCombo(0);
    
    setPerfectCount(0);
    setGreatCount(0);
    setGoodCount(0);
    setBadCount(0);
    setWorstCount(0);
    setMissCount(0);
  };

  useEffect(() => {
    if (gameState === 'ingame' && score === 0 && combo === 0) {
      console.log("Game State after rest:");
      debugState();
    }
  }, [gameState, score, combo]);
  
  // Start the game loop
  const startGame = () => {
    // debugState();
    setGameState('ingame');
    resetGameState();

    gameStartTimeRef.current = performance.now() / 1000;
    lastDebugTimeRef.current = gameStartTimeRef.current;
    console.log("Game start time:", gameStartTimeRef.current);
    console.log("Song start time:", songStartTimeRef.current);
    
    // Start the game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    // Play song with appropriate delay
    if (songRef.current) {
      const now = performance.now() / 1000 - gameStartTimeRef.current;
      const delay = songStartTimeRef.current - now;
      
      if (delay > 0) {
        setTimeout(() => {
          try {
            songRef.current.play().catch(err => {
              console.error("Error playing audio:", err);
            });
          } catch (err) {
            console.error("Error playing audio:", err);
          }
        }, delay * 1000);
      } else {
        try {
          songRef.current.currentTime = -delay;
          songRef.current.play().catch(err => {
            console.error("Error playing audio:", err);
          });
        } catch (err) {
          console.error("Error playing audio:", err);
        }
      }
    }
  };
  
  // Main game loop
  const gameLoop = (timestamp) => {
    // console.log("GAME LOOP !!!")
    const currentTime = timestamp / 1000 - gameStartTimeRef.current;

    updateNotesAndCheckMisses(currentTime);
    updateEffects(currentTime);
    
    // Debug every ~5 seconds
    if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) !== Math.floor(lastDebugTimeRef.current)) {
      console.log("Regular debugging...");
      lastDebugTimeRef.current = currentTime;
    }
    
    // Continue the game loop
    if (currentTime < songEndTimeRef.current) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      setGameState('result');
      console.log("Game ended!");
    }
  };

  const updateNotesAndCheckMisses = (currentTime) => {
    const baseSpeed = 1;
    const rateLine = 600;
    const missThreshold = 650;
    const missMaxThreshold = 700;

    let missOccurred = false;
    const notesRefCurrent = notesRef.current;

    ['t1', 't2', 't3', 't4'].forEach(trackKey => {
      const trackNotes = notesRefCurrent[trackKey];
      
      if (trackNotes.length === 0) return;

      let writeIndex = 0;
      const trackLength = trackNotes.length;

      for (let i = 0; i < trackLength; i++) {
        const note = trackNotes[i];
        const newY = rateLine + (currentTime - note.time) * 350 * baseSpeed * (note.speed || 1.0);

        if (newY > missThreshold && newY < missMaxThreshold) {
          missOccurred = true;
        } else if (newY >= missMaxThreshold) {
        } else {
          note.y = newY;
          trackNotes[writeIndex++] = note;
        }
      }
      if (writeIndex < trackLength) {
        trackNotes.length = writeIndex;
      }
    });

    if (missOccurred) {
      handleMiss();
    }
  }
  
  // Update visual effects
  const updateEffects = (currentTime) => {
    // Combo effect animation
    if (currentTime < comboTimeRef.current) {
      setComboEffect(prev => {
        return prev + (1 - prev) / 7;
      });
    } else {
      setComboEffect(prev => {
        return prev + (0 - prev) / 7;
      });
    }
    
    // Decrease miss animation
    if (missAnim > 0) {
      setMissAnim(prev => Math.max(0, prev - 0.05));
    }
    
    // Update key effect animations
    setEffectAnimations(prev => {
      return prev.map(anim => {
        if (anim < 5) {
          return Math.min(5, anim + 0.5);
        }
        return anim;
      });
    });
  };
  
  // Handle missed notes
  const handleMiss = () => {
    console.log("Handle MISS");
    setMissCount(prev => prev + 1);
    const currentCombo = combo; // Capture current combo value
    setLastCombo(currentCombo);
    setCombo(0);
    setMissAnim(1);
    comboTimeRef.current = performance.now() / 1000 - gameStartTimeRef.current + 1;

    setRating('MISS');
    
    clearTimeout(ratingTimeoutRef.current);
    ratingTimeoutRef.current = setTimeout(() => {
      setRating('');
    }, 100);
  };
  
  // Check if a note was hit when a key is pressed
  const checkNoteHit = (trackIndex) => {
    console.log("HIT!!!", trackIndex);
    // Get the current time
    const currentTime = performance.now() / 1000 - gameStartTimeRef.current;
    
    // Get the track array based on the index
    let trackNotes;
    switch (trackIndex) {
      case 0: trackNotes = 't1'; break;
      case 1: trackNotes = 't2'; break;
      case 2: trackNotes = 't3'; break;
      case 3: trackNotes = 't4'; break;
      default: return;
    }
    
    // Check if there are any notes in the hit range
    if (notesRef.current[trackNotes].length > 0) {
      // const hitPosition = 600; // Position of the hit line
      const firstNote = notesRef.current[trackNotes][0];
      
      // If the note is within the hit window, register a hit
      const timeDiff = Math.abs(currentTime - firstNote.time);
      if (timeDiff < 0.3) { // Simplified hit detection
        
        // Evaluate the hit quality
        evaluateHit(timeDiff, trackIndex);
        notesRef.current[trackNotes].shift();
        
        // Trigger effect animation
        setEffectAnimations(prev => {
          const newEffects = [...prev];
          newEffects[trackIndex] = 0; // Start animation
          return newEffects;
        });
      }
    }
  };
  
  // Evaluate hit quality and update score
  const evaluateHit = (timeDiff, trackIndex) => {
    // For the simplified version, we'll use pixel distance
    let hitRating = '';
    let scoreIncrease = 0;
    let comboIncrease = 0;
    // let feverIncrease = 0;
    
    // Evaluate based on distance from hit line
    if (timeDiff < 0.025) {
      hitRating = 'PERFECT';
      scoreIncrease = Math.round(100000 / (noteCount || 100));
      comboIncrease = 1;
      setPerfectCount(prev => prev + 1);
    } else if (timeDiff < 0.05) {
      hitRating = 'GREAT';
      scoreIncrease = Math.round((100000 / (noteCount || 100)) * 0.9);
      comboIncrease = 1;
      setGreatCount(prev => prev + 1);
    } else if (timeDiff < 0.1) {
      hitRating = 'GOOD';
      scoreIncrease = Math.round((100000 / (noteCount || 100)) * 0.7);
      comboIncrease = 1;
      setGoodCount(prev => prev + 1);
    } else if (timeDiff < 0.15) {
      hitRating = 'BAD';
      scoreIncrease = Math.round((100000 / (noteCount || 100)) * 0.4);
      comboIncrease = 0;
      setBadCount(prev => prev + 1);
    } else {
      hitRating = 'WORST';
      scoreIncrease = Math.round((100000 / (noteCount || 100)) * 0.2);
      comboIncrease = 0;
      setWorstCount(prev => prev + 1);
      setLastCombo(combo);
      setCombo(0);
      setMissAnim(1);
    }
    
    // Capture current state values to use in calculations
    const currentCombo = combo;
    const currentMaxCombo = maxCombo;
    const currentScore = score;
    
    // Update score - use a direct update
    const newScore = currentScore + scoreIncrease;
    setScore(newScore);
    
    // Update combo if applicable
    if (comboIncrease > 0) {
      const newCombo = currentCombo + comboIncrease;
      setCombo(newCombo);
      
      // Update max combo if needed
      if (newCombo > currentMaxCombo) {
        setMaxCombo(newCombo);
      }
    }
    
    // Update rating
    setRating(hitRating);
    
    // Set combo effect time
    comboTimeRef.current = performance.now() / 1000 - gameStartTimeRef.current + 1;
    
    // Clear previous timeout and set new one
    clearTimeout(ratingTimeoutRef.current);
    ratingTimeoutRef.current = setTimeout(() => {
      setRating('');
    }, 100);
  };
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      if (ratingTimeoutRef.current) {
        clearTimeout(ratingTimeoutRef.current);
      }
      if (songRef.current) {
        songRef.current.pause();
      }
    };
  }, []);
  
  // Render different game states
  if (gameState === 'lobby') {
    return <LobbyScreen 
      songs={songData} 
      currentSong={currentSong} 
    />;
  } else if (gameState === 'loading') {
    return <LoadingScreen 
      progress={loadingProgress} 
      songName={songData[currentSong].name} 
    />;
  } else if (gameState === 'ingame') {
    return <GameScreen 
      notes={notesRef.current}
      score={score}
      combo={combo}
      maxCombo={maxCombo}
      rating={rating}
      keyStates={keyStates}
      keyAnimations={keyAnimations}
      effectAnimations={effectAnimations}
      comboEffect={comboEffect}
      missAnim={missAnim}
      lastCombo={lastCombo}
      songName={songData[currentSong].name}
      bpm={songData[currentSong].bpm}
    />;
  } else {
    return <ResultScreen 
      score={score}
      maxCombo={maxCombo}
      songName={songData[currentSong].name}
      perfectCount={perfectCount}
      greatCount={greatCount}
      goodCount={goodCount}
      badCount={badCount}
      worstCount={worstCount}
      missCount={missCount}
    />;
  }
};

export default RhythmGame;