/**
 * Parses a note file in the rhythm game format
 * @param {string} fileContent - The content of the note file
 * @returns {Object} Parsed note data
 */
export const parseNoteFile = (fileContent) => {
    const lines = fileContent.split('\n');
    let noteStartTime = 0;
    let songStartTime = 0;
    let baseBpm = 0;
    let currentTime = 0;
    let totalNotes = 0;
    
    const parsedNotes = {
      t1: [],
      t2: [],
      t3: [],
      t4: []
    };
    
    // First parse the header information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#note_time')) {
        noteStartTime = parseFloat(line.split('|')[1]);
      } else if (line.startsWith('#song_time')) {
        songStartTime = parseFloat(line.split('|')[1]);
      } else if (line.startsWith('#song_bpms')) {
        baseBpm = parseFloat(line.split('|')[1]);
      } else if (line && !line.startsWith('#')) {
        // This is a note line, process it
        const parts = line.split('#')[0].trim().split('|');
        
        if (parts.length >= 4) {
          const keyCode = parts[0];
          const beat = parseFloat(parts[1]);
          const noteBpm = parseFloat(parts[2]) || baseBpm;
          const speed = parseFloat(parts[3]) || 1.0;
          
          // Calculate when this note should appear
          // In the original game: notes = 240 / bpm / beat
          const noteTimeInSeconds = 240 / noteBpm / beat;
          currentTime += noteTimeInSeconds;
          
          // Process which lanes have notes
          if (keyCode[0] === '1') {
            parsedNotes.t1.push({ time: currentTime + 2, y: 0, speed });
            totalNotes++;
          }
          if (keyCode[1] === '2') {
            parsedNotes.t2.push({ time: currentTime + 2, y: 0, speed });
            totalNotes++;
          }
          if (keyCode[2] === '3') {
            parsedNotes.t3.push({ time: currentTime + 2, y: 0, speed });
            totalNotes++;
          }
          if (keyCode[3] === '4') {
            parsedNotes.t4.push({ time: currentTime + 2, y: 0, speed });
            totalNotes++;
          }
        }
      }
    }
    
    return {
      noteStartTime,
      songStartTime,
      baseBpm,
      parsedNotes,
      totalNotes
    };
  };
  
  /**
   * Generate demo notes for testing
   * @param {number} bpm - The BPM to use for note timing
   * @returns {Object} Generated notes
   */
  export const generateDemoNotes = (bpm) => {
    const beatTime = 60 / bpm; // Time for one beat in seconds
    
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