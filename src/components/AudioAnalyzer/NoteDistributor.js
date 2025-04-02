    /**
 * BalancedNoteDistributor.js - Redistributes detected beats across lanes
 * 
 * This script takes a detected beats array and distributes them across
 * the four lanes (t1, t2, t3, t4) in a balanced, musical way.
 */

class NoteDistributor {
    constructor(config = {}) {
      // Default configuration
      this.config = {
        // Balance parameters
        targetDistribution: {
          't1': 0.28, // ~28% of notes in lane 1 (d key)
          't2': 0.26, // ~26% of notes in lane 2 (f key)
          't3': 0.24, // ~24% of notes in lane 3 (j key)
          't4': 0.22  // ~22% of notes in lane 4 (k key)
        },
        
        // Pattern generation parameters
        minConsecutiveSameLane: 1,    // Min notes in the same lane
        maxConsecutiveSameLane: 3,    // Max notes in the same lane
        patternLength: 8,             // Notes per pattern
        
        // Musical patterns - weights for different lane transitions
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
        
        // Note density parameters
        burstThreshold: 0.3,   // Time threshold to detect rapid note sequences
        lanePatternForBursts: ['t1', 't2', 't3', 't4'],  // Pattern for rapid sequences
        
        // Note grouping by frequency (bass hits tend to be on t1, etc.)
        frequencyBasedAssignment: 0.4,  // Weight of frequency-based assignment (0-1)
        
        // Difficulty progression
        increaseDifficultyOverTime: true,  // Make patterns more complex over time
        
        // Random seed for deterministic results
        seed: 12345
      };
      
      // Override defaults with provided config
      Object.assign(this.config, config);
      
      // Initialize the pseudorandom number generator with the seed
      this.random = this.createSeededRandom(this.config.seed);
      
      // Initialize distribution counters
      this.laneCounters = {
        't1': 0,
        't2': 0,
        't3': 0,
        't4': 0
      };
      
      // Track the last few lanes to avoid repetitive patterns
      this.recentLanes = [];
    }
    
    /**
     * Creates a seeded random number generator for deterministic results
     */
    createSeededRandom(seed) {
      return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    }
    
    distributeNotes(beatTimes) {
      // Sort beat times to ensure they're in order
      beatTimes.sort((a, b) => a - b);
      
      // Initialize output
      const result = {
        't1': [],
        't2': [],
        't3': [],
        't4': []
      };
      
      // If there are no beats, return empty result
      if (!beatTimes || beatTimes.length === 0) {
        return result;
      }
      
      // Analyze beat timing to detect bursts/rolls
      const timingPatterns = this.analyzeBeatTiming(beatTimes);
      
      // Generate initial distribution (all beats assigned to lanes)
      const initialDistribution = this.assignInitialLanes(beatTimes, timingPatterns);
      
      // Apply patterns and balance passes
      let assignedLanes = this.applyMusicalPatterns(initialDistribution, beatTimes);
      assignedLanes = this.balanceDistribution(assignedLanes, beatTimes);
      
      // Create the final output
      for (let i = 0; i < beatTimes.length; i++) {
        const time = beatTimes[i];
        const lane = assignedLanes[i];
        result[lane].push(time);
      }
      
      // Sort all lanes by time (just to be sure)
      Object.keys(result).forEach(lane => {
        result[lane].sort((a, b) => a - b);
      });
      
      return result;
    }
    
    analyzeBeatTiming(beatTimes) {
      const patterns = {
        bursts: [], // Groups of very close beats
        regularBeats: [] // Normal paced beats
      };
      
      // Detect bursts (sequences of rapid notes)
      let currentBurst = [];
      
      for (let i = 0; i < beatTimes.length; i++) {
        const currentTime = beatTimes[i];
        const nextTime = beatTimes[i + 1];
        
        // If this is the last beat or there's a significant gap to the next beat
        if (i === beatTimes.length - 1 || !nextTime || 
            nextTime - currentTime > this.config.burstThreshold) {
          
          // If we were building a burst, finalize it
          if (currentBurst.length > 0) {
            currentBurst.push(i);
            
            if (currentBurst.length >= 3) {
              // Only count as burst if 3+ beats in rapid succession
              patterns.bursts.push([...currentBurst]);
            } else {
              // Otherwise mark as regular beats
              currentBurst.forEach(idx => patterns.regularBeats.push(idx));
            }
            currentBurst = [];
          } else {
            patterns.regularBeats.push(i);
          }
        } else {
          // Beats are close together, potential burst
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
      
      // First pass - handle bursts with special patterns
      timingPatterns.bursts.forEach(burst => {
        const burstPattern = [...this.config.lanePatternForBursts];
        
        // For long bursts, repeat the pattern
        while (burstPattern.length < burst.length) {
          burstPattern.push(...this.config.lanePatternForBursts);
        }
        
        // Assign lanes for the burst
        for (let i = 0; i < burst.length; i++) {
          const beatIndex = burst[i];
          lanes[beatIndex] = burstPattern[i % burstPattern.length];
        }
      });
      
      // Second pass - assign lanes for regular beats
      const allLanes = ['t1', 't2', 't3', 't4'];
      let lastLane = null;
      let consecutiveSameLane = 0;
      
      timingPatterns.regularBeats.forEach(beatIndex => {
        if (!lanes[beatIndex]) { // Only assign if not already part of a burst
          let lane;
          
          // Avoid too many consecutive notes in the same lane
          if (lastLane && consecutiveSameLane < this.config.maxConsecutiveSameLane && 
              this.random() < 0.4) {
            lane = lastLane;
            consecutiveSameLane++;
          } else {
            // Pick a different lane
            const availableLanes = allLanes.filter(l => l !== lastLane);
            lane = availableLanes[Math.floor(this.random() * availableLanes.length)];
            consecutiveSameLane = 1;
          }
          
          lanes[beatIndex] = lane;
          lastLane = lane;
        }
      });
      
      // Fill any remaining unassigned lanes
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
      
      // Apply patterns in chunks (e.g., create 8-note patterns)
      for (let startIdx = 0; startIdx < beatTimes.length; startIdx += this.config.patternLength) {
        const endIdx = Math.min(startIdx + this.config.patternLength, beatTimes.length);
        const chunkSize = endIdx - startIdx;
        
        // Skip very small chunks
        if (chunkSize < 3) continue;
        
        // Determine if this section should be a special pattern
        const position = beatTimes[startIdx] / duration; // 0.0 to 1.0 through the song
        
        // Increase complexity as the song progresses
        const complexity = this.config.increaseDifficultyOverTime ? 
          0.3 + (position * 0.7) : 0.5;
        
        // Different pattern types
        if (this.random() < 0.3) {
          // Alternating pattern (e.g., t1,t3,t1,t3...)
          const lanes = ['t1', 't3'];
          for (let i = startIdx; i < endIdx; i++) {
            newLanes[i] = lanes[i % lanes.length];
          }
        } else if (this.random() < 0.3) {
          // Circular pattern (t1,t2,t3,t4,t1,t2...)
          const lanes = ['t1', 't2', 't3', 't4'];
          for (let i = startIdx; i < endIdx; i++) {
            newLanes[i] = lanes[(i - startIdx) % lanes.length];
          }
        } else if (this.random() < 0.2) {
          // Mirror pattern (t1,t2,t3,t4,t4,t3,t2,t1)
          const pattern = ['t1', 't2', 't3', 't4', 't4', 't3', 't2', 't1'];
          for (let i = startIdx; i < endIdx; i++) {
            newLanes[i] = pattern[(i - startIdx) % pattern.length];
          }
        } else {
          // Progressive transitions using the weights
          let currentLane = newLanes[startIdx] || 't1';
          newLanes[startIdx] = currentLane;
          
          for (let i = startIdx + 1; i < endIdx; i++) {
            // Get transition weights for current lane
            const weights = {};
            for (let targetLane of ['t1', 't2', 't3', 't4']) {
              const key = `${currentLane}_to_${targetLane}`;
              weights[targetLane] = this.config.transitionWeights[key] || 0.25;
            }
            
            // Adjust for recent history to avoid excessive repetition
            if (this.recentLanes.length > 2) {
              // Reduce probability of lanes that appeared very recently
              for (let j = 0; j < Math.min(3, this.recentLanes.length); j++) {
                const recentLane = this.recentLanes[this.recentLanes.length - 1 - j];
                weights[recentLane] *= (0.8 - (j * 0.2));
              }
            }
            
            // Select lane based on weights
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
            
            // Keep recentLanes at reasonable length
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
      
      // Count initial distribution
      newLanes.forEach(lane => {
        laneCounts[lane]++;
      });
      
      // Calculate target counts
      const totalBeats = beatTimes.length;
      const targetCounts = {
        't1': Math.round(this.config.targetDistribution.t1 * totalBeats),
        't2': Math.round(this.config.targetDistribution.t2 * totalBeats),
        't3': Math.round(this.config.targetDistribution.t3 * totalBeats),
        't4': Math.round(this.config.targetDistribution.t4 * totalBeats)
      };
      
      // Adjust for rounding errors
      const totalTargets = Object.values(targetCounts).reduce((sum, count) => sum + count, 0);
      if (totalTargets !== totalBeats) {
        const diff = totalBeats - totalTargets;
        // Add or remove from lane with biggest difference from target
        const lanes = ['t1', 't2', 't3', 't4'];
        lanes.sort((a, b) => {
          const aDiff = Math.abs(targetCounts[a] - laneCounts[a]);
          const bDiff = Math.abs(targetCounts[b] - laneCounts[b]);
          return bDiff - aDiff; // Sort descending by difference
        });
        
        targetCounts[lanes[0]] += diff;
      }
      
      // Find lanes that need more notes and those that have too many
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
      
      // Sort both arrays by difference (largest first)
      needMore.sort((a, b) => b.diff - a.diff);
      haveTooMany.sort((a, b) => b.diff - a.diff);
      
      // Rebalance - find notes to move from overrepresented lanes to underrepresented ones
      for (const { lane: targetLane, diff: neededCount } of needMore) {
        let remainingToMove = neededCount;
        
        // Try to take notes from overrepresented lanes
        for (const { lane: sourceLane, diff: availableCount } of haveTooMany) {
          if (remainingToMove <= 0) break;
          
          const toMove = Math.min(remainingToMove, availableCount);
          remainingToMove -= toMove;
          
          // Find toMove notes to change from sourceLane to targetLane
          let moved = 0;
          for (let i = 0; i < newLanes.length && moved < toMove; i++) {
            if (newLanes[i] === sourceLane) {
              // Don't create too many consecutive same lane notes
              const prevLane = i > 0 ? newLanes[i - 1] : null;
              const nextLane = i < newLanes.length - 1 ? newLanes[i + 1] : null;
              
              // Skip if both surrounding notes are already targetLane
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
      // Combine all notes into a single array
      const allTimes = [];
      Object.keys(notesDictionary).forEach(lane => {
        notesDictionary[lane].forEach(time => {
          allTimes.push(time);
        });
      });
      
      // Sort by time
      allTimes.sort((a, b) => a - b);
      
      // Redistribute
      return this.distributeNotes(allTimes);
    }
}
  
export default NoteDistributor;