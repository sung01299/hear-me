import Meyda from 'meyda';

class AudioAnalyzer {
  constructor() {
    this.config = {
      // Beat detection parameters
      energyThreshold: 0.15,
      rmsThreshold: 0.1,
      minTimeBetweenBeats: 0.2,
      
      // Analysis parameters
      frameSize: 1024,
      hopSize: 512,
      
      // Lane assignment parameters
      frequencyBands: [
        { min: 20, max: 250 },    // Bass (t1 - 'd' key)
        { min: 250, max: 1000 },  // Low-mid (t2 - 'f' key)
        { min: 1000, max: 4000 }, // High-mid (t3 - 'j' key)
        { min: 4000, max: 20000 } // Treble (t4 - 'k' key)
      ],
      
      // Additional parameters
      minNoteSpacing: 0.2,
    };
    
    // Analysis state
    this.isAnalyzing = false;
    this.progress = 0;
    this.audioContext = null;
    
    // Callbacks
    this.onProgress = null;
    this.onComplete = null;
    this.onError = null;
  }
  
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  
  setCallbacks(callbacks) {
    if (callbacks.onProgress) this.onProgress = callbacks.onProgress;
    if (callbacks.onComplete) this.onComplete = callbacks.onComplete;
    if (callbacks.onError) this.onError = callbacks.onError;
  }
  
  updateProgress(value) {
    this.progress = value;
    if (this.onProgress) {
      this.onProgress(value);
    }
  }
  
  async analyzeAudio(audioFile) {
    if (this.isAnalyzing) {
      return Promise.reject(new Error("Already analyzing an audio file"));
    }
    
    this.isAnalyzing = true;
    this.updateProgress(0);
    
    try {
      // Initialize audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Convert input to ArrayBuffer if it's a File or Blob
      let arrayBuffer;
      if (audioFile instanceof File || audioFile instanceof Blob) {
        arrayBuffer = await audioFile.arrayBuffer();
      } else if (audioFile instanceof ArrayBuffer) {
        arrayBuffer = audioFile;
      } else {
        throw new Error("Invalid audio file format");
      }
      
      // Decode the audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.updateProgress(10);
      
      // Extract audio data for analysis
      const audioData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;
      
      console.log(`Audio file loaded: ${duration.toFixed(2)} seconds, ${sampleRate}Hz`);
      
      // Initialize note dictionary
      const notesDictionary = {
        't1': [], // for key 'd'
        't2': [], // for key 'f'
        't3': [], // for key 'j'
        't4': []  // for key 'k'
      };
      
      // Calculate number of frames to analyze
      const frameSize = this.config.frameSize;
      const hopSize = this.config.hopSize;
      const numFrames = Math.floor((audioData.length - frameSize) / hopSize);
      
      // State variables for beat detection
      let prevEnergy = 0;
      let prevRMS = 0;
      let lastBeatTime = -this.config.minTimeBetweenBeats;
      
      // Running statistics for adaptive thresholding
      let energyHistory = [];
      const historySize = 43;
      
      // Process audio frame by frame
      for (let i = 0; i < numFrames; i++) {
        // Update progress every 100 frames
        if (i % 100 === 0) {
          this.updateProgress(10 + Math.floor((i / numFrames) * 80));
        }
        
        // Extract current frame
        const frameStart = i * hopSize;
        const frame = audioData.slice(frameStart, frameStart + frameSize);
        
        // Calculate frame time in seconds
        const frameTime = frameStart / sampleRate;
        
        // IMPORTANT: Create a proper Float32Array to avoid Meyda errors
        const frameBuffer = new Float32Array(frameSize);
        for (let j = 0; j < frameSize; j++) {
          frameBuffer[j] = frame[j] || 0; // Ensure no undefined values
        }
        
        // Extract audio features using Meyda
        let features;
        try {
          features = Meyda.extract([
            'energy',
            'rms',
            'zcr',
            'spectralCentroid',
            'spectralFlatness',
            'spectralRolloff'
          ], frameBuffer);
        } catch (error) {
          console.warn("Feature extraction error, using basic features", error);
          
          // Fallback to basic features calculated manually
          let energy = 0;
          let rms = 0;
          
          for (let j = 0; j < frameSize; j++) {
            energy += Math.abs(frameBuffer[j]);
            rms += frameBuffer[j] * frameBuffer[j];
          }
          
          energy /= frameSize;
          rms = Math.sqrt(rms / frameSize);
          
          features = {
            energy: energy,
            rms: rms,
            zcr: 0.5, // Default value
            spectralCentroid: 2000, // Default middle value
            spectralFlatness: 0.5,  // Default value
            spectralRolloff: 2000   // Default middle value
          };
        }
        
        // Update energy history for adaptive thresholding
        energyHistory.push(features.energy);
        if (energyHistory.length > historySize) {
          energyHistory.shift();
        }
        
        // Calculate average energy over the history window
        const avgEnergy = energyHistory.reduce((sum, e) => sum + e, 0) / energyHistory.length;
        
        // Calculate energy and RMS changes
        const energyDelta = features.energy - prevEnergy;
        const rmsDelta = features.rms - prevRMS;
        
        // Adaptive thresholding - beat is detected when energy is significantly above average
        const adaptiveThreshold = avgEnergy * 1.5;
        
        // Detect onset/beat using energy and RMS
        const energyOnset = energyDelta > this.config.energyThreshold && features.energy > adaptiveThreshold;
        const rmsOnset = rmsDelta > this.config.rmsThreshold;
        
        // Combined onset detection
        const isOnset = (energyOnset || rmsOnset) && 
                       (frameTime - lastBeatTime >= this.config.minTimeBetweenBeats);
        
        if (isOnset) {
          lastBeatTime = frameTime;
          
          // Determine which lane to use based on spectral content
          let lane = 't2'; // Default to lane 2 (f key) if we can't determine
          
          // Try to use spectral centroid if available
          if (typeof features.spectralCentroid === 'number' && !isNaN(features.spectralCentroid)) {
            const centroid = features.spectralCentroid;
            
            // Basic lane assignment based on spectral centroid
            for (let j = 0; j < this.config.frequencyBands.length; j++) {
              const band = this.config.frequencyBands[j];
              if (centroid >= band.min && centroid < band.max) {
                lane = `t${j + 1}`;
                break;
              }
            }
          } else {
            // Fallback lane assignment based on ZCR if centroid isn't available
            const zcr = features.zcr || 0;
            if (zcr < 0.2) lane = 't1';
            else if (zcr < 0.4) lane = 't2';
            else if (zcr < 0.6) lane = 't3';
            else lane = 't4';
          }
          
          // Advanced lane assignment using multiple features when available
          if (typeof features.energy === 'number' && 
              typeof features.spectralFlatness === 'number' && 
              !isNaN(features.energy) && 
              !isNaN(features.spectralFlatness)) {
            
            // For percussion-heavy sounds (likely kick drums)
            if (features.energy > 0.7 && features.spectralFlatness < 0.2) {
              lane = 't1'; // Bass lane - 'd' key
            }
          }
          
          // Add the beat time to the appropriate lane
          notesDictionary[lane].push(frameTime);
        }
        
        // Update previous values for next iteration
        prevEnergy = features.energy;
        prevRMS = features.rms;
        // prevZCR = features.zcr || 0;
      }
      
      this.updateProgress(90);
      
      // Sort all note times and ensure minimum spacing between notes in the same lane
      const processedNotes = this.postProcessNotes(notesDictionary);
      
      // Clean up
      this.audioContext.close();
      this.audioContext = null;
      
      // Finalize
      this.isAnalyzing = false;
      this.updateProgress(100);
      
      // Call completion callback if defined
      if (this.onComplete) {
        this.onComplete(processedNotes);
      }
      
      return processedNotes;
      
    } catch (error) {
      console.error("Error analyzing audio:", error);
      
      // Clean up
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      
      this.isAnalyzing = false;
      this.updateProgress(0);
      
      // Call error callback if defined
      if (this.onError) {
        this.onError(error);
      }
      
      return Promise.reject(error);
    }
  }
  
  postProcessNotes(notesDictionary) {
    const processedNotes = {
      't1': [],
      't2': [],
      't3': [],
      't4': []
    };
    
    // Process each lane
    Object.keys(notesDictionary).forEach(lane => {
      // Sort times
      const sortedTimes = [...notesDictionary[lane]].sort((a, b) => a - b);
      
      // Filter out notes that are too close to each other
      const filteredTimes = [];
      
      for (let i = 0; i < sortedTimes.length; i++) {
        const currentTime = sortedTimes[i];
        
        // Add if it's the first note or far enough from the previous note
        if (i === 0 || currentTime - filteredTimes[filteredTimes.length - 1] >= this.config.minNoteSpacing) {
          filteredTimes.push(currentTime);
        }
      }
      
      processedNotes[lane] = filteredTimes;
    });
    
    return processedNotes;
  }
  
  generateStats(notesDictionary) {
    if (!notesDictionary) return null;
    
    const stats = {
      totalNotes: 0,
      notesByLane: {},
      distribution: {},
      density: {},
      duration: 0
    };
    
    // Count notes in each lane
    Object.keys(notesDictionary).forEach(lane => {
      const count = notesDictionary[lane].length;
      stats.notesByLane[lane] = count;
      stats.totalNotes += count;
    });
    
    // Calculate distribution
    Object.keys(stats.notesByLane).forEach(lane => {
      stats.distribution[lane] = stats.totalNotes > 0 ? 
        Math.round((stats.notesByLane[lane] / stats.totalNotes) * 100) : 0;
    });
    
    // Find the duration of the track (time of the last note)
    let maxTime = 0;
    Object.values(notesDictionary).forEach(laneNotes => {
      if (laneNotes.length > 0) {
        const laneMax = Math.max(...laneNotes);
        if (laneMax > maxTime) {
          maxTime = laneMax;
        }
      }
    });
    stats.duration = maxTime;
    
    // Calculate notes per minute
    if (stats.duration > 0) {
      const notesPerMinute = Math.round((stats.totalNotes / stats.duration) * 60);
      stats.density.notesPerMinute = notesPerMinute;
      
      // Calculate difficulty based on notes per minute
      if (notesPerMinute < 60) {
        stats.density.difficulty = "Easy";
      } else if (notesPerMinute < 120) {
        stats.density.difficulty = "Medium";
      } else if (notesPerMinute < 200) {
        stats.density.difficulty = "Hard";
      } else {
        stats.density.difficulty = "Expert";
      }
    }
    
    return stats;
  }
  
  exportToJson(notesDictionary, filename = 'note-dictionary.json') {
    const dataStr = JSON.stringify(notesDictionary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', filename);
    linkElement.style.display = 'none';
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  }
}

export default AudioAnalyzer;