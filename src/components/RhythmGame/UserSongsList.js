import React, { useState, useEffect } from 'react';
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getS3Client, awsConfig } from '../../awsConfig/awsConfig';

const UserSongsList = ({ onSelectSong }) => {
  const [userSongs, setUserSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchUserSongs();
  }, []);
  
  const fetchUserSongs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const s3Client = getS3Client();
      
      // List objects in the user_uploads folder
      const command = new ListObjectsV2Command({
        Bucket: awsConfig.bucketName,
        Prefix: 'user_uploads/',
        Delimiter: '/'
      });
      
      const response = await s3Client.send(command);
      
      // Process the response to extract song information
      const audioFiles = response.Contents.filter(item => 
        item.Key.endsWith('.mp3') || item.Key.endsWith('.wav')
      );
      
      // Get corresponding note files
      const noteFiles = response.Contents.filter(item => 
        item.Key.endsWith('.json')
      );
      
      // Create song entries with both files
      const songs = audioFiles.map(audioFile => {
        const baseName = audioFile.Key.replace(/\.[^.]+$/, '');
        const noteFile = noteFiles.find(note => 
          note.Key.startsWith(baseName)
        );
        
        // Extract song name from the key
        const songName = audioFile.Key.split('/').pop().split('-').slice(1).join('-').replace(/\.[^.]+$/, '');
        
        return {
          id: audioFile.Key,
          name: songName,
          audioKey: audioFile.Key,
          notesKey: noteFile ? noteFile.Key : null,
          lastModified: audioFile.LastModified
        };
      });
      
      // Filter out songs without note files
      const validSongs = songs.filter(song => song.notesKey);
      
      // Sort by most recently added
      validSongs.sort((a, b) => b.lastModified - a.lastModified);
      
      setUserSongs(validSongs);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user songs:', error);
      setError('Failed to load your songs. Please try again later.');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="user-songs-list">
      <h3>Your Songs</h3>
      
      {isLoading && <p>Loading your songs...</p>}
      {error && <p className="error">{error}</p>}
      
      {!isLoading && userSongs.length === 0 && (
        <p>You haven't uploaded any songs yet.</p>
      )}
      
      <ul className="songs-list">
        {userSongs.map((song) => (
          <li key={song.id} className="song-item">
            <button 
              onClick={() => onSelectSong(song.audioKey, song.notesKey)}
              className="song-select-button"
            >
              {song.name}
            </button>
          </li>
        ))}
      </ul>
      
      <button onClick={fetchUserSongs} className="refresh-button">
        Refresh List
      </button>
    </div>
  );
};

export default UserSongsList;