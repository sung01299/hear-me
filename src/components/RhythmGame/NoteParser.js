export const parseNoteFile = (fileContent) => {
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

    const t1Notes = fileContent.t1;
    const t2Notes = fileContent.t2;
    const t3Notes = fileContent.t3;
    const t4Notes = fileContent.t4;

    t1Notes.forEach((noteTime) => {
      parsedNotes.t1.push({ time: noteTime + 2, y: 0, speed: 1 });
      totalNotes++;
    })

    t2Notes.forEach((noteTime) => {
      parsedNotes.t2.push({ time: noteTime + 2, y: 0, speed: 1 });
      totalNotes++;
    })

    t3Notes.forEach((noteTime) => {
      parsedNotes.t3.push({ time: noteTime + 2, y: 0, speed: 1 });
      totalNotes++;
    })

    t4Notes.forEach((noteTime) => {
      parsedNotes.t4.push({ time: noteTime + 2, y: 0, speed: 1 });
      totalNotes++;
    })
    
    return {
      noteStartTime,
      songStartTime,
      parsedNotes,
      totalNotes
    };
  };
  
  export const generateDemoNotes = (bpm) => {
    const beatTime = 60 / bpm;
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