class NoteDistributor {
    constructor(config = {}) {
      this.config = {
        targetDistribution: {
          't1': 0.28,
          't2': 0.26,
          't3': 0.24,
          't4': 0.22
        },
        
        minConsecutiveSameLane: 1,
        maxConsecutiveSameLane: 3,
        patternLength: 8,
        
        transitionWeights: {
          't1_to_t1': 0.2,
          't1_to_t2': 0.4,
          't1_to_t3': 0.3,
          't1_to_t4': 0.1,
          't2_to_t1': 0.3,
          't2_to_t2': 0.2,
          't2_to_t3': 0.4,
          't2_to_t4': 0.1,
          't3_to_t1': 0.2,
          't3_to_t2': 0.3,
          't3_to_t3': 0.2,
          't3_to_t4': 0.3,
          't4_to_t1': 0.3,
          't4_to_t2': 0.2,
          't4_to_t3': 0.4,
          't4_to_t4': 0.1
        },
        
        burstThreshold: 0.3,
        lanePatternForBursts: ['t1', 't2', 't3', 't4'],
        
        frequencyBasedAssignment: 0.4,
        
        increaseDifficultyOverTime: true,
        
        seed: 12345
      };
      
      Object.assign(this.config, config);
      
      this.random = this.createSeededRandom(this.config.seed);
      
      this.laneCounters = {
        't1': 0,
        't2': 0,
        't3': 0,
        't4': 0
      };
      
      this.recentLanes = [];
    }
    
    createSeededRandom(seed) {
      return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    }
    
    distributeNotes(beatTimes) {
      beatTimes.sort((a, b) => a - b);
      
      const result = {
        't1': [],
        't2': [],
        't3': [],
        't4': []
      };
      
      if (!beatTimes || beatTimes.length === 0) {
        return result;
      }
      
      const timingPatterns = this.analyzeBeatTiming(beatTimes);
      
      const initialDistribution = this.assignInitialLanes(beatTimes, timingPatterns);
      
      let assignedLanes = this.applyMusicalPatterns(initialDistribution, beatTimes);
      assignedLanes = this.balanceDistribution(assignedLanes, beatTimes);
      
      for (let i = 0; i < beatTimes.length; i++) {
        const time = beatTimes[i];
        const lane = assignedLanes[i];
        result[lane].push(time);
      }
      
      Object.keys(result).forEach(lane => {
        result[lane].sort((a, b) => a - b);
      });
      
      return result;
    }
    
    analyzeBeatTiming(beatTimes) {
      const patterns = {
        bursts: [],
        regularBeats: []
      };
      
      let currentBurst = [];
      
      for (let i = 0; i < beatTimes.length; i++) {
        const currentTime = beatTimes[i];
        const nextTime = beatTimes[i + 1];
        
        if (i === beatTimes.length - 1 || !nextTime || 
            nextTime - currentTime > this.config.burstThreshold) {
          
          if (currentBurst.length > 0) {
            currentBurst.push(i);
            
            if (currentBurst.length >= 3) {
              patterns.bursts.push([...currentBurst]);
            } else {
              currentBurst.forEach(idx => patterns.regularBeats.push(idx));
            }
            currentBurst = [];
          } else {
            patterns.regularBeats.push(i);
          }
        } else {
          if (currentBurst.length === 0) {
            currentBurst.push(i);
          }
          currentBurst.push(i + 1);
        }
      }
      
      return patterns;
    }
    
    assignInitialLanes(beatTimes, timingPatterns) {
      const lanes = new Array(beatTimes.length);
      
      timingPatterns.bursts.forEach(burst => {
        const burstPattern = [...this.config.lanePatternForBursts];
        
        while (burstPattern.length < burst.length) {
          burstPattern.push(...this.config.lanePatternForBursts);
        }
        for (let i = 0; i < burst.length; i++) {
          const beatIndex = burst[i];
          lanes[beatIndex] = burstPattern[i % burstPattern.length];
        }
      });
      
      const allLanes = ['t1', 't2', 't3', 't4'];
      let lastLane = null;
      let consecutiveSameLane = 0;
      
      timingPatterns.regularBeats.forEach(beatIndex => {
        if (!lanes[beatIndex]) { 
          let lane;
          
          if (lastLane && consecutiveSameLane < this.config.maxConsecutiveSameLane && 
              this.random() < 0.4) {
            lane = lastLane;
            consecutiveSameLane++;
          } else {
            const availableLanes = allLanes.filter(l => l !== lastLane);
            lane = availableLanes[Math.floor(this.random() * availableLanes.length)];
            consecutiveSameLane = 1;
          }
          
          lanes[beatIndex] = lane;
          lastLane = lane;
        }
      });
      
      for (let i = 0; i < lanes.length; i++) {
        if (!lanes[i]) {
          lanes[i] = allLanes[Math.floor(this.random() * allLanes.length)];
        }
      }
      
      return lanes;
    }
    
    applyMusicalPatterns(initialLanes, beatTimes) {
      const newLanes = [...initialLanes];
      const duration = beatTimes[beatTimes.length - 1] - beatTimes[0];
      
      for (let startIdx = 0; startIdx < beatTimes.length; startIdx += this.config.patternLength) {
        const endIdx = Math.min(startIdx + this.config.patternLength, beatTimes.length);
        const chunkSize = endIdx - startIdx;
        
        if (chunkSize < 3) continue;
        
        const position = beatTimes[startIdx] / duration;
        
        const complexity = this.config.increaseDifficultyOverTime ? 
          0.3 + (position * 0.7) : 0.5;
        
        if (this.random() < 0.3) {
          const lanes = ['t1', 't3'];
          for (let i = startIdx; i < endIdx; i++) {
            newLanes[i] = lanes[i % lanes.length];
          }
        } else if (this.random() < 0.3) {
          const lanes = ['t1', 't2', 't3', 't4'];
          for (let i = startIdx; i < endIdx; i++) {
            newLanes[i] = lanes[(i - startIdx) % lanes.length];
          }
        } else if (this.random() < 0.2) {
          const pattern = ['t1', 't2', 't3', 't4', 't4', 't3', 't2', 't1'];
          for (let i = startIdx; i < endIdx; i++) {
            newLanes[i] = pattern[(i - startIdx) % pattern.length];
          }
        } else {
          let currentLane = newLanes[startIdx] || 't1';
          newLanes[startIdx] = currentLane;
          
          for (let i = startIdx + 1; i < endIdx; i++) {
            const weights = {};
            for (let targetLane of ['t1', 't2', 't3', 't4']) {
              const key = `${currentLane}_to_${targetLane}`;
              weights[targetLane] = this.config.transitionWeights[key] || 0.25;
            }
            
            if (this.recentLanes.length > 2) {
              for (let j = 0; j < Math.min(3, this.recentLanes.length); j++) {
                const recentLane = this.recentLanes[this.recentLanes.length - 1 - j];
                weights[recentLane] *= (0.8 - (j * 0.2));
              }
            }
            
            const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
            let value = this.random() * total;
            let selectedLane = 't1';
            
            for (const [lane, weight] of Object.entries(weights)) {
              value -= weight;
              if (value <= 0) {
                selectedLane = lane;
                break;
              }
            }
            
            newLanes[i] = selectedLane;
            currentLane = selectedLane;
            this.recentLanes.push(selectedLane);
            
            if (this.recentLanes.length > 10) {
              this.recentLanes.shift();
            }
          }
        }
      }
      
      return newLanes;
    }
    
    balanceDistribution(lanes, beatTimes) {
      const newLanes = [...lanes];
      const laneCounts = { 't1': 0, 't2': 0, 't3': 0, 't4': 0 };
      
      newLanes.forEach(lane => {
        laneCounts[lane]++;
      });
      
      const totalBeats = beatTimes.length;
      const targetCounts = {
        't1': Math.round(this.config.targetDistribution.t1 * totalBeats),
        't2': Math.round(this.config.targetDistribution.t2 * totalBeats),
        't3': Math.round(this.config.targetDistribution.t3 * totalBeats),
        't4': Math.round(this.config.targetDistribution.t4 * totalBeats)
      };
      
      const totalTargets = Object.values(targetCounts).reduce((sum, count) => sum + count, 0);
      if (totalTargets !== totalBeats) {
        const diff = totalBeats - totalTargets;
        const lanes = ['t1', 't2', 't3', 't4'];
        lanes.sort((a, b) => {
          const aDiff = Math.abs(targetCounts[a] - laneCounts[a]);
          const bDiff = Math.abs(targetCounts[b] - laneCounts[b]);
          return bDiff - aDiff;
        });
        
        targetCounts[lanes[0]] += diff;
      }
      
      const needMore = [];
      const haveTooMany = [];
      
      for (const lane of ['t1', 't2', 't3', 't4']) {
        const diff = targetCounts[lane] - laneCounts[lane];
        if (diff > 0) {
          needMore.push({ lane, diff });
        } else if (diff < 0) {
          haveTooMany.push({ lane, diff: -diff });
        }
      }
      
      needMore.sort((a, b) => b.diff - a.diff);
      haveTooMany.sort((a, b) => b.diff - a.diff);
      
      for (const { lane: targetLane, diff: neededCount } of needMore) {
        let remainingToMove = neededCount;
        
        for (const { lane: sourceLane, diff: availableCount } of haveTooMany) {
          if (remainingToMove <= 0) break;
          
          const toMove = Math.min(remainingToMove, availableCount);
          remainingToMove -= toMove;
          
          let moved = 0;
          for (let i = 0; i < newLanes.length && moved < toMove; i++) {
            if (newLanes[i] === sourceLane) {
              const prevLane = i > 0 ? newLanes[i - 1] : null;
              const nextLane = i < newLanes.length - 1 ? newLanes[i + 1] : null;
              
              if (prevLane === targetLane && nextLane === targetLane) {
                continue;
              }
              
              newLanes[i] = targetLane;
              moved++;
              laneCounts[sourceLane]--;
              laneCounts[targetLane]++;
            }
          }
        }
      }
      
      return newLanes;
    }
    
    rebalanceExistingNotes(notesDictionary) {
      const allTimes = [];
      Object.keys(notesDictionary).forEach(lane => {
        notesDictionary[lane].forEach(time => {
          allTimes.push(time);
        });
      });
      
      allTimes.sort((a, b) => a - b);
      
      return this.distributeNotes(allTimes);
    }
}
  
export default NoteDistributor;