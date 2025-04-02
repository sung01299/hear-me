import React, { useState, useEffect, useRef } from 'react';
import { Music, Volume2, Crown } from 'lucide-react';
import { parseNoteFile } from './NoteParser';
import LobbyScreen from '../screens/LobbyScreen';
import LoadingScreen from '../screens/LoadingScreen';
import GameScreen from '../screens/GameScreen';
import ResultScreen from '../screens/ResultScreen';

import AudioAnalyzer from '../AudioAnalyzer/AudioAnalyzer';
import './RhythmGame.css';
import NoteDistributor from '../AudioAnalyzer/NoteDistributor';

import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getS3Client, awsConfig } from '../../awsConfig/awsConfig';

// Main App Component
const RhythmGame = () => {
  const [gameState, setGameState] = useState('lobby'); // lobby, loading, ingame
  const [currentSong, setCurrentSong] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [rating, setRating] = useState('READY');
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

  const [audioFile, setAudioFile] = useState(null);
  const [notesFile, setNotesFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [stats, setStats] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [s3AudioKey, setS3AudioKey] = useState(null);
  const [s3NotesKey, setS3NotesKey] = useState(null);
  
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

  const analyzerRef = useRef(null);
  const audioRef = useRef(null);

  const songNameRef = useRef(null);
  const noteNameRef = useRef(null);

  const initializedRef = useRef(null);
  const [songList, setSongList] = useState([{ name: "Upload Your Own Song"}]);

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
  };
  
  // Song data similar to the original
  // const songData = [
  //   { name: "Upload Your Own Song"},
  //   // { name: "거리에서", lines: 911, bpm: 202, noteFile: "성시경 - 거리에서.json", audioFile: "성시경 - 거리에서.mp3", background: "bg_pupa.jpg" },
  //   // { name: "Don't Look Back in Anger", lines: 911, bpm: 175, noteFile: "Oasis - Dont Look Back In Anger.json", audioFile: "Oasis - Dont Look Back In Anger.mp3", background: "bg_light_it_up.jpg" },
  //   // { name: "nacreous snowmelt", lines: 911, bpm: 101, noteFile: "nacreous snowmelt.txt", audioFile: "nacreous snowmelt.mp3", background: "bg_nacreous snowmelt.jpg" }

  // ];
  let songData = songList;

  // Key to track mapping
  const keyMapping = {
    'd': 0,
    'f': 1,
    'j': 2,
    'k': 3 
  };

  useEffect(() => {
    console.log("!!!Initialize!!!");

    const controller = new AbortController();

    if (initializedRef.current) {
      console.log("Already initialized");
      return;
    }

    console.log("initializing first time!!!!!");
    initializedRef.current = 1;

    initialFetchSongsList();

    return () => {
      controller.abort();
    }

  }, []);

  const initialFetchSongsList = async () => {
    try {
      const s3Client = getS3Client();

      const command = new ListObjectsV2Command({
        Bucket: awsConfig.bucketName,
        Prefix: 'user_uploads/',
        Delimiter: '/'
      });

      const response = await s3Client.send(command);

      if (response.KeyCount > 0) {
        const audios = []
        const notes = []

        response.Contents.forEach(item => {
          if (item.Key.endsWith('.mp3')) {
            audios.push(item);
          } else if (item.Key.endsWith('.json')) {
            notes.push(item);
          }
        })

        const songs = audios.map(audioFile => {
          const baseName = audioFile.Key.replace(/\.[^.]+$/, '');
          const noteFile = notes.find(note => note.Key.startsWith(baseName));

          const songName = audioFile.Key.replace('user_uploads/', '').replace('.mp3', '');

          return {
            id: audioFile.Key,
            name: songName,
            audioKey: audioFile.Key,
            notesKey: noteFile ? noteFile.Key : null,
            lastModified: audioFile.LastModified
          }
        })

        const validSongs = songs.filter(song => song.notesKey);
        validSongs.sort((a, b) => b.lastModified - a.lastModified);

        validSongs.map(song => {
          const songDataToPush = {
            "name": song.name,
            "lines": 200,
            "bpm": 120,
            "noteFile": song.notesKey.replace('user_uploads/', ''),
            "audioFile": song.audioKey.replace('user_uploads/', ''),
          };
          // songData.push(songDataToPush);
          setSongList(prevSongList => [...prevSongList, songDataToPush]);
        })
      }
    } catch (error) {
      console.error("Error fetching songs list:", error);
    }
  }

  useEffect(() => {
    console.log("UPDATE REQUIRED!!!");
  }, [songList])

  useEffect(() => {
    const analyzer = new AudioAnalyzer();

    analyzer.setCallbacks({
      onProgress: (value) => {
        setProgress(value);
      },
      onComplete: (result) => {
        notesRef.current = result;
        setIsAnalyzing(false);

        const statistics = analyzer.generateStats(result);
        setStats(statistics);
      },
      onError: (error) => {
        setIsAnalyzing(false);
      }
    });

    analyzerRef.current = analyzer;

    return () => {};
  }, [])

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
          setCurrentSong(prev => Math.min(songList.length - 1, prev + 1));
        } else if (key === ' ') {
          // Start loading the song
          if (currentSong != 0) {
            setGameState('loading');
            loadSong(songList[currentSong].noteFile, songList[currentSong].audioFile)
          } else {
            console.log("Upload your own song");
          }
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
  }, [gameState, currentSong, combo, score, maxCombo, songList]); // Added dependencies to ensure latest state values

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setAudioFile(file);
    notesRef.current = null;
    setStats(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const newUrl = URL.createObjectURL(file);
    setAudioUrl(newUrl);

    try {
      const uniqueFileName = `user_uploads/${file.name}`;

      const s3Client = getS3Client();

      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
      });

      const uploadParams = {
        Bucket: awsConfig.bucketName,
        Key: uniqueFileName,
        Body: new Uint8Array(fileContent),
        ContentType: file.type,
      };

      setIsUploading(true);
      setUploadProgress(0);

      const command = new PutObjectCommand(uploadParams);
      const response = await s3Client.send(command);

      setS3AudioKey(uniqueFileName);
      setUploadProgress(100);
      setIsUploading(false);

      console.log('Audio uploaded successfully to S3', response, uniqueFileName);

      songNameRef.current = file.name.replace(".mp3", "");

    } catch (error) {
      console.error('Error uploading file to S3:', error);
      setIsUploading(false);
    }
  };

  const uploadNotesToS3 = async (notesData) => {
    if (!s3AudioKey) return;

    try {
      const notesJson = JSON.stringify(notesData);
      const blob = new Blob([notesJson], { type: 'application/json' });

      const notesKey = s3AudioKey.replace(/\.[^.]+$/, '.json');

      const s3Client = getS3Client();

      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(blob);
      });


      const uploadParams = {
        Bucket: awsConfig.bucketName,
        Key: notesKey,
        Body: new Uint8Array(fileContent),
        ContentType: 'application/json',
      };

      const command = new PutObjectCommand(uploadParams);
      const response = await s3Client.send(command);

      setS3NotesKey(notesKey);

      console.log("Notes uploaded successfully to S3", response, notesKey);

      noteNameRef.current = songNameRef.current;

      setSongList(prevSongList => [
        ...prevSongList,
        {
          "name": songNameRef.current,
          "lines": 200,
          "bpm": 120,
          "noteFile": `${noteNameRef.current}.json`,
          "audioFile": `${songNameRef.current}.mp3`
        }
      ]);

      songNameRef.current = null;
      noteNameRef.current = null;

    } catch (error) {
      console.error('Error uploading notes to S3:', error);
    }
  }

  const loadSongFromS3 = async (audioKey, notesKey) => {
    try {
      setLoadingProgress(0);

      const s3Client = getS3Client();

      const songName = audioKey;
      console.log("Song name:", songName);

      const notesCommand = new GetObjectCommand({
        Bucket: awsConfig.bucketName,
        Key: notesKey,
      });

      const notesResponse = await s3Client.send(notesCommand);
      const notesStream = notesResponse.Body;

      const notesContent = await new Response(notesStream).text();
      console.log("Note file loaded successfully");

      setLoadingProgress(40);

      const audioCommand = new GetObjectCommand({
        Bucket: awsConfig.bucketName,
        Key: audioKey,
      });

      const audioResponse = await s3Client.send(audioCommand);
      const audioStream = audioResponse.Body;

      const audioBlob = await new Response(audioStream).blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      audio.addEventListener('error', (e) => {
        console.error("Audio loading error:", e);
        setLoadingProgress(100);
      });
  
      audio.addEventListener('canplaythrough', () => {
        console.log("Audio loaded successfully from S3");
        songRef.current = audio;
        setLoadingProgress(80);
      });

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

      songEndTimeRef.current = audioDuration;
      setLoadingProgress(90);

      const { noteStartTime, songStartTime, parsedNotes, totalNotes } = parseNoteFile(notesContent);

      setLoadingProgress(100);

      setTimeout(() => {
        startGame();
      }, 1000);

    } catch (error) {
      console.error("Error loading song from S3: ", error);
      setLoadingProgress(100);
      const generateNotes = generateDemoNotes(120);
      notesRef.current = generateNotes;
      setNoteCount(100); // Set a reasonable default note count
      setTimeout(() => {
        startGame();
      }, 500);
    }
  }

  useEffect(() => {
    if (audioFile) {
      startAnalysis();
    }
  }, [audioFile]);

  const startAnalysis = async () => {
    if (!audioFile || isAnalyzing) return;

    setIsAnalyzing(true);
    
    try {
      const distributor = new NoteDistributor();
      const tempDictionary = await analyzerRef.current.analyzeAudio(audioFile);
      setNotesFile(distributor.rebalanceExistingNotes(tempDictionary));
    } catch(error) {
      console.error("Error during audio analysis:", error);
    }
  }

  useEffect(() => {
    if (notesFile) {
      uploadNotesToS3(notesFile);
    }
  }, [notesFile]);
  
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
      songEndTimeRef.current = 50;
      
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
      }, 1000);
      
    } catch (error) {
      console.error("Error loading song:", error);
      const generatedNotes = generateDemoNotes(songList[currentSong].bpm);
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
      console.log("Delay before playing:", delay);
      
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
    const currentTime = timestamp / 1000 - gameStartTimeRef.current;

    updateNotesAndCheckMisses(currentTime);
    updateEffects(currentTime);
    
    // Debug every ~5 seconds
    // if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) !== Math.floor(lastDebugTimeRef.current)) {
    //   console.log("Regular debugging...");
    //   lastDebugTimeRef.current = currentTime;
    // }
    
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

    // console.log("!!!!", notesRef.current);

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
    // console.log("Handle MISS");
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
    // console.log("HIT!!!", trackIndex);
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
      songs={songList} 
      currentSong={currentSong}
      handleFileUpload={handleFileUpload}
      isAnalyzing={isAnalyzing}
      startAnalysis={startAnalysis}
      audioFile={audioFile}
      loadSongFromS3={loadSongFromS3}
    />;
  } else if (gameState === 'loading') {
    return <LoadingScreen 
      progress={loadingProgress} 
      songName={songList[currentSong].name} 
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
      songName={songList[currentSong].name}
      bpm={songList[currentSong].bpm}
    />;
  } else {
    return <ResultScreen 
      score={score}
      maxCombo={maxCombo}
      songName={songList[currentSong].name}
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