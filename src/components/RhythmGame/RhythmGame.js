import React, { useState, useEffect, useRef } from 'react';
import { parseNoteFile } from './NoteParser';
import LobbyScreen from '../screens/LobbyScreen';
import LoadingScreen from '../screens/LoadingScreen';
import GameScreen from '../screens/GameScreen';
import ResultScreen from '../screens/ResultScreen';

import AudioAnalyzer from '../AudioAnalyzer/AudioAnalyzer';
import NoteDistributor from '../AudioAnalyzer/NoteDistributor';

import { PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getS3Client, awsConfig } from '../../awsConfig/awsConfig';

import '../aesthetics/RhythmGame.css';
import '../aesthetics/RhythmGameEffects.css';
import '../aesthetics/EnhancedScreenStyles.css';


const RhythmGame = () => {
  const [gameState, setGameState] = useState('lobby');
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
  const [audioUrl, setAudioUrl] = useState(null);
  
  const songRef = useRef(null);
  const gameLoopRef = useRef(null);
  const gameStartTimeRef = useRef(0);
  const songStartTimeRef = useRef(0);
  const noteStartTimeRef = useRef(0);
  const songEndTimeRef = useRef(0);
  const comboTimeRef = useRef(0);
  const ratingTimeoutRef = useRef(null);
  const lastDebugTimeRef = useRef(0);

  const s3AudioKeyRef = useRef(null);

  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(score);
  const comboRef = useRef(combo);
  const maxComboRef = useRef(maxCombo);
  const ratingRef = useRef(rating);
  const notesRef = useRef({ t1: [], t2: [], t3: [], t4: [] });

  const analyzerRef = useRef(null);

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
  
  const debugState = () => {
  };
  
  const keyMapping = {
    'd': 0,
    'f': 1,
    'j': 2,
    'k': 3 
  };

  useEffect(() => {
    const controller = new AbortController();

    if (initializedRef.current) {
      return;
    }

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

        validSongs.forEach(song => {
          const songDataToPush = {
            "name": song.name,
            "noteFile": song.notesKey.replace('user_uploads/', ''),
            "audioFile": song.audioKey.replace('user_uploads/', ''),
          };
          setSongList(prevSongList => [...prevSongList, songDataToPush]);
        })
      }
    } catch (error) {
      console.error("Error fetching songs list:", error);
    }
  }

  useEffect(() => {
  }, [songList])

  useEffect(() => {
    const analyzer = new AudioAnalyzer();

    analyzer.setCallbacks({
      onProgress: (value) => {
      },
      onComplete: (result) => {
        notesRef.current = result;
        setIsAnalyzing(false);

      },
      onError: (error) => {
        setIsAnalyzing(false);
      }
    });

    analyzerRef.current = analyzer;

    return () => {};
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key in keyMapping && gameState === 'ingame') {
        const trackIndex = keyMapping[key];
        
        setKeyStates(prev => {
          const newState = [...prev];
          newState[trackIndex] = true;
          return newState;
        });
        
        setKeyAnimations(prev => {
          const newAnims = [...prev];
          newAnims[trackIndex] = 1;
          return newAnims;
        });
        
        checkNoteHit(trackIndex);
      }
      
      if (gameState === 'lobby') {
        if (key === 'arrowup') {
          setCurrentSong(prev => Math.max(0, prev - 1));
        } else if (key === 'arrowdown') {
          setCurrentSong(prev => Math.min(songList.length - 1, prev + 1));
        } else if (key === ' ') {
          if (currentSong !== 0) {
            setGameState('loading');
            loadSongAndNotesFromS3(songList[currentSong].audioFile, songList[currentSong].noteFile);
          } else {
          }
        }
      }
      
      if (gameState === 'result') {
        if (key === ' ') {
          setGameState('lobby');
          setCurrentSong(0);
        }
      }
    };
    
    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key in keyMapping) {
        const trackIndex = keyMapping[key];
        
        setKeyStates(prev => {
          const newState = [...prev];
          newState[trackIndex] = false;
          return newState;
        });
        
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
  }, [gameState, currentSong, combo, score, maxCombo, songList]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    s3AudioKeyRef.current = `user_uploads/${file.name}`;
    setAudioFile(file);
    notesRef.current = null;

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

      const command = new PutObjectCommand(uploadParams);
      const response = await s3Client.send(command);

      songNameRef.current = file.name.replace(".mp3", "");

    } catch (error) {
      console.error('Error uploading file to S3:', error);
    }
  };

  const uploadNotesToS3 = async (notesData) => {
    if (!s3AudioKeyRef.current) return;

    try {
      const notesJson = JSON.stringify(notesData);
      const blob = new Blob([notesJson], { type: 'application/json' });

      const notesKey = s3AudioKeyRef.current.replace(/\.[^.]+$/, '.json');

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

      noteNameRef.current = songNameRef.current;

      setSongList(prevSongList => [
        ...prevSongList,
        {
          "name": songNameRef.current,
          "noteFile": `${noteNameRef.current}.json`,
          "audioFile": `${songNameRef.current}.mp3`
        }
      ]);

    } catch (error) {
      console.error('Error uploading notes to S3:', error);
    }
  }

  const loadSongAndNotesFromS3 = async (audioFileName, notesFileName) => {
    try {
      setLoadingProgress(0);

      const s3Client = getS3Client();

      const audioCommand = new GetObjectCommand({
        Bucket: awsConfig.bucketName,
        Key: `user_uploads/${audioFileName}`,
      });

      const notesCommand = new GetObjectCommand({
        Bucket: awsConfig.bucketName,
        Key: `user_uploads/${notesFileName}`,
      });

      const audioResponse = await s3Client.send(audioCommand);
      const notesResponse = await s3Client.send(notesCommand);
      setLoadingProgress(50);

      const audioArrayBuffer = await streamToArrayBuffer(audioResponse.Body);
      const blob = new Blob([audioArrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio();
      audio.addEventListener('error', (e) => {
        console.error("Audio loading error:", e);
        console.error("Audio element error code:", audio.error ? audio.error.code : "Unknown error");
        setLoadingProgress(100);
      });
      audio.addEventListener('canplaythrough', () => {
        songRef.current = audio;
        setLoadingProgress(100);
      });

      audio.src = audioUrl;

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
      
      const notesStringBuffer = await streamToString(notesResponse.Body);
      const jsonNotesData = JSON.parse(notesStringBuffer);
      
      const { noteStartTime, songStartTime, parsedNotes, totalNotes } = parseNoteFile(jsonNotesData);
      
      songStartTimeRef.current = songStartTime;
      songEndTimeRef.current = audioDuration + 2;
      noteStartTimeRef.current = noteStartTime;
      notesRef.current = parsedNotes;
      setNoteCount(totalNotes);

      setLoadingProgress(100);

      setTimeout(() => {
        startGame();
      }, 700);
      
    } catch (error) {
      console.error("Error loading song and notes from S3: ", error);
      const generatedNotes = generateDemoNotes(120);
      notesRef.current = generatedNotes;
      setNoteCount(100);
      setLoadingProgress(100);
      setTimeout(() => {
        startGame();
      }, 1000);
    }
  }

  async function streamToArrayBuffer(stream) {
    const chunks = [];
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }

    const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result.buffer;
  }

  async function streamToString(stream) {
    const chunks = [];
    const reader = stream.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); 
      }
    } finally {
      reader.releaseLock();
    }

    const totalLength = chunks.reduce((acc, val) => acc + val.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder().decode(result);
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
  
  const generateDemoNotes = (bpm) => {
    const beatTime = 60 / 120;
    const t1 = [];
    const t2 = [];
    const t3 = [];
    const t4 = [];
    
    for (let i = 0; i < 100; i++) {
      const time = 3 + (i * beatTime * 0.5);
      
      if (i % 4 === 0) t1.push({ time, y: 0, speed: 1.0 });
      if (i % 4 === 1) t2.push({ time, y: 0, speed: 1.0 });
      if (i % 4 === 2) t3.push({ time, y: 0, speed: 1.0 });
      if (i % 4 === 3) t4.push({ time, y: 0, speed: 1.0 });
      
      if (i % 8 === 0) t3.push({ time: time + 0.1, y: 0, speed: 1.0 });
      if (i % 12 === 0) t2.push({ time: time + 0.05, y: 0, speed: 1.0 });
    }
    
    return { t1, t2, t3, t4 };
  };
  
  const resetGameState = () => {
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
      debugState();
    }
  }, [gameState, score, combo]);
  
  const startGame = () => {
    setTimeout(() => {
      setGameState('ingame');
      resetGameState();

      gameStartTimeRef.current = performance.now() / 1000;
      lastDebugTimeRef.current = gameStartTimeRef.current;
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      
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

      setTimeout(() => {
        if (rating === 'READY') {
          setRating('');
        }
      }, 500);
    }, 2000);
  };
  
  const gameLoop = (timestamp) => {
    const currentTime = timestamp / 1000 - gameStartTimeRef.current;

    updateNotesAndCheckMisses(currentTime);
    updateEffects(currentTime);
    
    if (currentTime < songEndTimeRef.current) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      setGameState('result');
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
  
  const updateEffects = (currentTime) => {
    if (currentTime < comboTimeRef.current) {
      setComboEffect(prev => {
        return prev + (1 - prev) / 7;
      });
    } else {
      setComboEffect(prev => {
        return prev + (0 - prev) / 7;
      });
    }
    
    if (missAnim > 0) {
      setMissAnim(prev => Math.max(0, prev - 0.05));
    }
    
    setEffectAnimations(prev => {
      return prev.map(anim => {
        if (anim < 5) {
          return Math.min(5, anim + 0.5);
        }
        return anim;
      });
    });
  };
  
  const handleMiss = () => {
    setMissCount(prev => prev + 1);
    const currentCombo = combo;
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
  
  const checkNoteHit = (trackIndex) => {
    const currentTime = performance.now() / 1000 - gameStartTimeRef.current;
    
    let trackNotes;
    switch (trackIndex) {
      case 0: trackNotes = 't1'; break;
      case 1: trackNotes = 't2'; break;
      case 2: trackNotes = 't3'; break;
      case 3: trackNotes = 't4'; break;
      default: return;
    }
    
    if (notesRef.current[trackNotes].length > 0) {
      const firstNote = notesRef.current[trackNotes][0];
      
      const timeDiff = Math.abs(currentTime - firstNote.time);
      if (timeDiff < 0.3) {
        
        evaluateHit(timeDiff, trackIndex);
        notesRef.current[trackNotes].shift();
        
        setEffectAnimations(prev => {
          const newEffects = [...prev];
          newEffects[trackIndex] = 0;
          return newEffects;
        });
      }
    }
  };
  
  const evaluateHit = (timeDiff, trackIndex) => {
    let hitRating = '';
    let scoreIncrease = 0;
    let comboIncrease = 0;
    
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
    
    const currentCombo = combo;
    const currentMaxCombo = maxCombo;
    const currentScore = score;
    
    const newScore = currentScore + scoreIncrease;
    setScore(newScore);
    
    if (comboIncrease > 0) {
      const newCombo = currentCombo + comboIncrease;
      setCombo(newCombo);
      
      if (newCombo > currentMaxCombo) {
        setMaxCombo(newCombo);
      }
    }
    
    setRating(hitRating);
    
    comboTimeRef.current = performance.now() / 1000 - gameStartTimeRef.current + 1;
    
    clearTimeout(ratingTimeoutRef.current);
    ratingTimeoutRef.current = setTimeout(() => {
      setRating('');
    }, 200);
  };
  
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
  
  if (gameState === 'lobby') {
    return <LobbyScreen 
      songs={songList} 
      currentSong={currentSong}
      handleFileUpload={handleFileUpload}
      isAnalyzing={isAnalyzing}
      startAnalysis={startAnalysis}
      audioFile={audioFile}
    />;
  } else if (gameState === 'loading') {
    return <LoadingScreen 
      progress={loadingProgress} 
      songName={songList[currentSong].name} 
    />;
  } else if (gameState === 'gameStarting' || gameState === 'ingame') {
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