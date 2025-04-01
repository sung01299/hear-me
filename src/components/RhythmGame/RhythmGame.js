import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2, Crown } from 'lucide-react';
import { parseNoteFile } from './NoteParser';
import LobbyScreen from '../screens/LobbyScreen';
import LoadingScreen from '../screens/LoadingScreen';
import GameScreen from '../screens/GameScreen';
import './RhythmGame.css';

// Main App Component
const RhythmGame = () => {
  const [gameState, setGameState] = useState('lobby'); // lobby, loading, ingame
  const [currentSong, setCurrentSong] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [rating, setRating] = useState('READY');
  // const [fever, setFever] = useState(1);
  // const [feverGauge, setFeverGauge] = useState(0);
  const [notes, setNotes] = useState({ t1: [], t2: [], t3: [], t4: [] });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [keyStates, setKeyStates] = useState([false, false, false, false]);
  const [keyAnimations, setKeyAnimations] = useState([0, 0, 0, 0]);
  const [effectAnimations, setEffectAnimations] = useState([5, 5, 5, 5]);
  const [comboEffect, setComboEffect] = useState(0);
  const [missAnim, setMissAnim] = useState(0);
  const [lastCombo, setLastCombo] = useState(0);
  // const [feverAnim, setFeverAnim] = useState(0);
  const [noteCount, setNoteCount] = useState(0);
  
  const songRef = useRef(null);
  const gameLoopRef = useRef(null);
  const gameStartTimeRef = useRef(0);
  const songStartTimeRef = useRef(0);
  const noteStartTimeRef = useRef(0);
  const comboTimeRef = useRef(0);
  const ratingTimeoutRef = useRef(null);
  const lastDebugTimeRef = useRef(0);
  
  // Debug helper to track state
  const debugState = () => {
    console.log("Current Game State (DEBUG):", {
      gameState,
      score,
      combo,
      maxCombo,
      // fever,
      // feverGauge,
      rating,
      noteCount,
      notesRemaining: {
        t1: notes.t1.length,
        t2: notes.t2.length,
        t3: notes.t3.length,
        t4: notes.t4.length
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
    'd': 0, // Track 1
    'f': 1, // Track 2
    'j': 2, // Track 3
    'k': 3  // Track 4
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
      audio.load();
      
      // Use progress indicator while parsing
      setLoadingProgress(10);
      
      // Parse the note data
      const { noteStartTime, songStartTime, baseBpm, parsedNotes, totalNotes } = parseNoteFile(fileContent);
      // console.log("Parsed note data:", { noteStartTime, songStartTime, baseBpm, totalNotes });
      
      setLoadingProgress(70);
      
      // Set important song timing information
      noteStartTimeRef.current = noteStartTime;
      songStartTimeRef.current = songStartTime;
      setNoteCount(totalNotes);
      
      // Set the notes
      setNotes(parsedNotes);
      
      setLoadingProgress(100);
      
      // Give a small delay to show 100% before starting
      setTimeout(() => {
        startGame();
      }, 500);
      
    } catch (error) {
      console.error("Error loading song:", error);
      // Fallback to demo notes if file loading fails
      const generatedNotes = generateDemoNotes(songData[currentSong].bpm);
      setNotes(generatedNotes);
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
    const noteSpeed = 2.8; // Similar to original game
    
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
    // setFever(1);
    // setFeverGauge(0);
    setComboEffect(0);
    setMissAnim(0);
    setLastCombo(0);
    
    // Force React to process these state updates by using a small timeout
    setTimeout(() => {
      console.log("Game state after reset:");
      console.log({
        score: 0,
        combo: 0,
        maxCombo: 0,
        rating: 'READY',
        // fever: 1,
        // feverGauge: 0
      });
    }, 0);
  };
  
  // Start the game loop
  const startGame = () => {
    debugState();
    setGameState('ingame');
    resetGameState();

    
    gameStartTimeRef.current = performance.now() / 1000;
    lastDebugTimeRef.current = gameStartTimeRef.current;
    
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
    
    // console.log("Game started!");
  };
  
  // Main game loop
  const gameLoop = (timestamp) => {
    // console.log("GAME LOOP !!!")
    const currentTime = timestamp / 1000 - gameStartTimeRef.current;
    
    // Update note positions
    updateNotes(currentTime);
    
    // Update visual effects
    updateEffects(currentTime);
    
    // Check for missed notes
    checkMissedNotes(currentTime);
    
    // Debug every ~5 seconds
    if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) !== Math.floor(lastDebugTimeRef.current)) {
      debugState();
      lastDebugTimeRef.current = currentTime;
    }
    
    // Continue the game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Update note positions based on current time
  const updateNotes = (currentTime) => {
    // Only update note positions if game is running
    // console.log("Updating notes...");
    // if (gameState !== 'ingame') return;
    // console.log("Current state", gameState);

    
    const baseSpeed = 2.8; // Base speed from original game
    const rateLine = 600;
    
    setNotes(prev => {
      // Skip update if no notes (optimization)
      if (prev.t1.length === 0 && prev.t2.length === 0 && 
          prev.t3.length === 0 && prev.t4.length === 0) {
        return prev;
      }
      
      const newNotes = {
        t1: prev.t1.map(note => ({
          ...note,
          y: rateLine + (currentTime - note.time) * 350 * baseSpeed * (note.speed || 1.0)
        })),
        t2: prev.t2.map(note => ({
          ...note,
          y: rateLine + (currentTime - note.time) * 350 * baseSpeed * (note.speed || 1.0)
        })),
        t3: prev.t3.map(note => ({
          ...note,
          y: rateLine + (currentTime - note.time) * 350 * baseSpeed * (note.speed || 1.0)
        })),
        t4: prev.t4.map(note => ({
          ...note,
          y: rateLine + (currentTime - note.time) * 350 * baseSpeed * (note.speed || 1.0)
        }))
      };

      // Debug: log the position of the first note in each track if it exists
      // if (prev.t1.length > 0 || prev.t2.length > 0 || prev.t3.length > 0 || prev.t4.length > 0) {
      //   // Only log occasionally to not flood the console
      //   if (Math.random() < 0.005) {
      //     console.log("Note positions:", 
      //       prev.t1.length > 0 ? Math.round(newNotes.t1[0].y) : "No t1 notes",
      //       prev.t2.length > 0 ? Math.round(newNotes.t2[0].y) : "No t2 notes",
      //       prev.t3.length > 0 ? Math.round(newNotes.t3[0].y) : "No t3 notes", 
      //       prev.t4.length > 0 ? Math.round(newNotes.t4[0].y) : "No t4 notes"
      //     );
      //   }
      // }
      
      return newNotes;
    });
  };
  
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
    
    // Update fever animation
    // if (feverGauge >= 128) {
    //   setFeverGauge(0);
    //   setFever(prev => Math.min(5, prev + 1));
    //   setFeverAnim(1);
      
    //   // Reset fever animation after 2 seconds
    //   setTimeout(() => {
    //     setFeverAnim(0);
    //   }, 2000);
    // }
    
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
  
  // Check for missed notes
  const checkMissedNotes = (currentTime) => {
    // Check if any notes have passed the hit line
    const missThreshold = 650; // Position of the hit line + some leeway
    
    setNotes(prev => {
      // Skip check if no notes (optimization)
      if (prev.t1.length === 0 && prev.t2.length === 0 && 
          prev.t3.length === 0 && prev.t4.length === 0) {
        return prev;
      }
      
      let missOccurred = false;
      
      const newNotes = {
        t1: prev.t1.filter(note => {
          if (note.y > missThreshold) {
            // Register a miss
            missOccurred = true;
            return false;
          }
          return true;
        }),
        t2: prev.t2.filter(note => {
          if (note.y > missThreshold) {
            missOccurred = true;
            return false;
          }
          return true;
        }),
        t3: prev.t3.filter(note => {
          if (note.y > missThreshold) {
            missOccurred = true;
            return false;
          }
          return true;
        }),
        t4: prev.t4.filter(note => {
          if (note.y > missThreshold) {
            missOccurred = true;
            return false;
          }
          return true;
        })
      };
      
      // Only call handleMiss once if any misses occurred
      if (missOccurred) {
        handleMiss();
      }
      
      return newNotes;
    });
  };
  
  // Handle missed notes
  const handleMiss = () => {
    const currentCombo = combo; // Capture current combo value
    setLastCombo(currentCombo);
    setCombo(0);
    setMissAnim(1);
    comboTimeRef.current = performance.now() / 1000 - gameStartTimeRef.current + 1;

    setRating('MISS');
    
    clearTimeout(ratingTimeoutRef.current);
    ratingTimeoutRef.current = setTimeout(() => {
      setRating('');
    }, 1000);
    
    // console.log("MISS occurred! Combo reset from", currentCombo, "to 0");
  };
  
  // Check if a note was hit when a key is pressed
  const checkNoteHit = (trackIndex) => {
    // Get the current time
    const currentTime = performance.now() / 1000 - gameStartTimeRef.current;

    // console.log("CURRENTTIME", currentTime)
    
    // Get the track array based on the index
    let trackNotes;
    switch (trackIndex) {
      case 0: trackNotes = 't1'; break;
      case 1: trackNotes = 't2'; break;
      case 2: trackNotes = 't3'; break;
      case 3: trackNotes = 't4'; break;
      default: return;
    }

    // console.log(notes);
    
    // Check if there are any notes in the hit range
    if (notes[trackNotes].length > 0) {
      const hitPosition = 600; // Position of the hit line
      const firstNote = notes[trackNotes][0];
      
      // Calculate how far the note is from the perfect hit position
      const noteY = firstNote.y;
      const distanceFromHitLine = Math.abs(noteY - hitPosition);

      // console.log("!!!!!", firstNote);
      // console.log("Key pressed:", trackIndex, "Note Y:", noteY, "Distance:", distanceFromHitLine);
      
      // If the note is within the hit window, register a hit
      const timeDiff = Math.abs(currentTime - firstNote.time);
      if (timeDiff < 1) { // Simplified hit detection
        
        // console.log("HIT DETECTED with distance:", timeDiff);
        
        // Evaluate the hit quality
        evaluateHit(timeDiff, trackIndex);
        
        // Remove the hit note
        setNotes(prev => {
          const newNotes = {...prev};
          newNotes[trackNotes] = newNotes[trackNotes].slice(1);
          return newNotes;
        });
        
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
    // console.log("Evaluating hit with distance:", timeDiff);
    
    // For the simplified version, we'll use pixel distance
    let hitRating = '';
    let scoreIncrease = 0;
    let comboIncrease = 0;
    // let feverIncrease = 0;
    
    // Evaluate based on distance from hit line
    if (timeDiff < 0.2) {
      hitRating = 'PERFECT';
      scoreIncrease = Math.round(100000 / (noteCount || 100));
      comboIncrease = 1;
      // feverIncrease = 1;
    } else if (timeDiff < 0.4) {
      hitRating = 'GREAT';
      scoreIncrease = Math.round((100000 / (noteCount || 100)) * 0.9);
      comboIncrease = 1;
      // feverIncrease = 1;
    } else if (timeDiff < 0.6) {
      hitRating = 'GOOD';
      scoreIncrease = Math.round((100000 / (noteCount || 100)) * 0.7);
      comboIncrease = 1;
      // feverIncrease = 1;
    } else if (timeDiff < 0.8) {
      hitRating = 'BAD';
      scoreIncrease = Math.round((100000 / (noteCount || 100)) * 0.4);
      comboIncrease = 0;
    } else {
      hitRating = 'WORST';
      scoreIncrease = Math.round((100000 / (noteCount || 100)) * 0.2);
      comboIncrease = 0;
      setLastCombo(combo);
      setCombo(0);
      setMissAnim(1);
    }
    
    // Capture current state values to use in calculations
    // const currentFever = fever;
    const currentCombo = combo;
    const currentMaxCombo = maxCombo;
    const currentScore = score;
    
    // Log values before update for debugging
    // console.log("State before update:", { 
    //   score: currentScore, 
    //   combo: currentCombo, 
    //   maxCombo: currentMaxCombo, 
    //   fever: currentFever 
    // });
    
    // console.log("Score Update:", 
    //   "Current Score:", currentScore, 
    //   "Increase:", scoreIncrease, 
    //   "Fever:", currentFever, 
    //   "Total Add:", scoreIncrease * currentFever
    // );
    
    // Update score - use a direct update
    // const newScore = currentScore + (scoreIncrease * currentFever);
    const newScore = currentScore + scoreIncrease;
    setScore(newScore);
    
    // Update combo if applicable
    if (comboIncrease > 0) {
      // const newCombo = currentCombo + (comboIncrease * currentFever);
      const newCombo = currentCombo + comboIncrease;
      // console.log("Combo Update:", "Current:", currentCombo, "New:", newCombo);
      setCombo(newCombo);
      
      // Update max combo if needed
      if (newCombo > currentMaxCombo) {
        // console.log("New Max Combo:", newCombo);
        setMaxCombo(newCombo);
      }
    }
    
    // Update fever gauge
    // const newFeverGauge = feverGauge + feverIncrease;
    // setFeverGauge(newFeverGauge);
    
    // Update rating
    setRating(hitRating);
    
    // Set combo effect time
    comboTimeRef.current = performance.now() / 1000 - gameStartTimeRef.current + 1;
    
    // Clear previous timeout and set new one
    clearTimeout(ratingTimeoutRef.current);
    ratingTimeoutRef.current = setTimeout(() => {
      setRating('');
    }, 1000);
    
    // Log complete update summary
    // console.log("Hit evaluation complete:", {
    //   rating: hitRating,
    //   scoreIncrease: scoreIncrease * currentFever,
    //   newScore: newScore,
    //   newCombo: comboIncrease > 0 ? currentCombo + (comboIncrease * currentFever) : 0
    // });
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
  } else {
    return <GameScreen 
      notes={notes}
      score={score}
      combo={combo}
      maxCombo={maxCombo}
      rating={rating}
      // fever={fever}
      // feverGauge={feverGauge}
      keyStates={keyStates}
      keyAnimations={keyAnimations}
      effectAnimations={effectAnimations}
      comboEffect={comboEffect}
      missAnim={missAnim}
      lastCombo={lastCombo}
      // feverAnim={feverAnim}
      songName={songData[currentSong].name}
      bpm={songData[currentSong].bpm}
    />;
  }
};

export default RhythmGame;