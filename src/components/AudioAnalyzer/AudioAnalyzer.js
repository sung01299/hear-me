import Meyda from 'meyda';

class AudioAnalyzer {
  constructor() {
    this.config = {
      energyThreshold: 0.15,
      rmsThreshold: 0.1,
      minTimeBetweenBeats: 0.2,
      
      frameSize: 1024,
      hopSize: 512,
      
      frequencyBands: [
        { min: 20, max: 250 },
        { min: 250, max: 1000 },
        { min: 1000, max: 4000 },
        { min: 4000, max: 20000 }
      ],
      
      minNoteSpacing: 0.2,
    };
    
    this.isAnalyzing = false;
    this.progress = 0;
    this.audioContext = null;

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
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      let arrayBuffer;
      if (audioFile instanceof File || audioFile instanceof Blob) {
        arrayBuffer = await audioFile.arrayBuffer();
      } else if (audioFile instanceof ArrayBuffer) {
        arrayBuffer = audioFile;
      } else {
        throw new Error("Invalid audio file format");
      }
      
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.updateProgress(10);
      
      const audioData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;
      
      const notesDictionary = {
        't1': [],
        't2': [],
        't3': [],
        't4': []
      };
      
      const frameSize = this.config.frameSize;
      const hopSize = this.config.hopSize;
      const numFrames = Math.floor((audioData.length - frameSize) / hopSize);
      
      let prevEnergy = 0;
      let prevRMS = 0;
      let lastBeatTime = -this.config.minTimeBetweenBeats;
      
      let energyHistory = [];
      const historySize = 43;
      
      for (let i = 0; i < numFrames; i++) {
        if (i % 100 === 0) {
          this.updateProgress(10 + Math.floor((i / numFrames) * 80));
        }
        
        const frameStart = i * hopSize;
        const frame = audioData.slice(frameStart, frameStart + frameSize);
        
        const frameTime = frameStart / sampleRate;
        
        const frameBuffer = new Float32Array(frameSize);
        for (let j = 0; j < frameSize; j++) {
          frameBuffer[j] = frame[j] || 0;
        }
        
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
            zcr: 0.5,
            spectralCentroid: 2000, 
            spectralFlatness: 0.5,  
            spectralRolloff: 2000   
          };
        }
        
        energyHistory.push(features.energy);
        if (energyHistory.length > historySize) {
          energyHistory.shift();
        }
        
        const avgEnergy = energyHistory.reduce((sum, e) => sum + e, 0) / energyHistory.length;
        
        const energyDelta = features.energy - prevEnergy;
        const rmsDelta = features.rms - prevRMS;
        
        const adaptiveThreshold = avgEnergy * 1.5;
        
        const energyOnset = energyDelta > this.config.energyThreshold && features.energy > adaptiveThreshold;
        const rmsOnset = rmsDelta > this.config.rmsThreshold;
        
        const isOnset = (energyOnset || rmsOnset) && 
                       (frameTime - lastBeatTime >= this.config.minTimeBetweenBeats);
        
        if (isOnset) {
          lastBeatTime = frameTime;
          
          let lane = 't2';
          
          if (typeof features.spectralCentroid === 'number' && !isNaN(features.spectralCentroid)) {
            const centroid = features.spectralCentroid;
            
            for (let j = 0; j < this.config.frequencyBands.length; j++) {
              const band = this.config.frequencyBands[j];
              if (centroid >= band.min && centroid < band.max) {
                lane = `t${j + 1}`;
                break;
              }
            }
          } else {
            const zcr = features.zcr || 0;
            if (zcr < 0.2) lane = 't1';
            else if (zcr < 0.4) lane = 't2';
            else if (zcr < 0.6) lane = 't3';
            else lane = 't4';
          }
          
          if (typeof features.energy === 'number' && 
              typeof features.spectralFlatness === 'number' && 
              !isNaN(features.energy) && 
              !isNaN(features.spectralFlatness)) {
            
            if (features.energy > 0.7 && features.spectralFlatness < 0.2) {
              lane = 't1';
            }
          }
          
          notesDictionary[lane].push(frameTime);
        }
        
        prevEnergy = features.energy;
        prevRMS = features.rms;
      }
      
      this.updateProgress(90);
      
      const processedNotes = this.postProcessNotes(notesDictionary);
      
      this.audioContext.close();
      this.audioContext = null;
      
      this.isAnalyzing = false;
      this.updateProgress(100);
      
      if (this.onComplete) {
        this.onComplete(processedNotes);
      }
      
      return processedNotes;
      
    } catch (error) {
      console.error("Error analyzing audio:", error);
      
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      
      this.isAnalyzing = false;
      this.updateProgress(0);
      
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
    
    Object.keys(notesDictionary).forEach(lane => {
      const sortedTimes = [...notesDictionary[lane]].sort((a, b) => a - b);
      
      const filteredTimes = [];
      
      for (let i = 0; i < sortedTimes.length; i++) {
        const currentTime = sortedTimes[i];
        
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
    
    Object.keys(notesDictionary).forEach(lane => {
      const count = notesDictionary[lane].length;
      stats.notesByLane[lane] = count;
      stats.totalNotes += count;
    });
    
    Object.keys(stats.notesByLane).forEach(lane => {
      stats.distribution[lane] = stats.totalNotes > 0 ? 
        Math.round((stats.notesByLane[lane] / stats.totalNotes) * 100) : 0;
    });
    
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
    
    if (stats.duration > 0) {
      const notesPerMinute = Math.round((stats.totalNotes / stats.duration) * 60);
      stats.density.notesPerMinute = notesPerMinute;
      
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