import React from 'react';

/**
 * Game Result screen component
 */
const ResultScreen = ({
    score, maxCombo, rating, songName,
    perfectCount, greatCount, goodCount, badCount, worstCount, missCount
}) => {
    return (
        <div className="result-screen bg-gradient">
            {/* Background elements */}
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Gear/lane graphics would go here */}
                <div className="w-1/4 h-full bg-black/30 backdrop-blur-sm"></div>
            </div>

            {/* Result content */}
            <div className="result-content">
                <h1 className="result-title">Game Over</h1>
                <p className="result-message">Thanks for playing!</p>
                {/* Additional result details would go here */}
                <div className="result-details">
                    <div className="result-score">Score: {score}</div>
                    <div className="result-max-combo">Max Combo: {maxCombo}</div>
                    <div className="rating-count-perfect">Perfect: {perfectCount}</div>
                    <div className="rating-count-perfect">great: {greatCount}</div>
                    <div className="rating-count-perfect">good: {goodCount}</div>
                    <div className="rating-count-perfect">bad: {badCount}</div>
                    <div className="rating-count-perfect">worst: {worstCount}</div>
                    <div className="rating-count-perfect">miss: {missCount}</div>
                    <div className="result-rating">Rating: {rating}</div>
                    <div className="result-song-name">Song: {songName}</div>
                </div>
            </div>

            <div className="lobby-instructions">
                <p>Press SPACE to return to lobby</p>
            </div>
        </div>
    )
};

export default ResultScreen;