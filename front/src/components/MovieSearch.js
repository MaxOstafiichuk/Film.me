import React, { useState } from 'react';
import axios from 'axios';
import './MovieSearch.css';

const MovieSearch = () => {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [liked, setLiked] = useState('');
  
/*
  const handleMovies = async () => {
    try {
      const response = await axios.get('http://localhost:3000/search');
      setMovie(response.data);
      setError(null);
      } catch (error) {
        setError('Error searching for movies');
        setMovie(null);
      }
    }
  };  */

  const handleSearch = async () => {
    setSearching(true);
    try {
      const response = await axios.post('http://192.168.1.74:2000/result', { title, year });
      setMovie(response.data.movie);
      setLiked(response.data.movie.isFavorite);
      setError(null);
    } catch (error) {
      setError('Error searching for movie');
      setMovie(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFilm = async () => {
    try {
        if (liked) {
            const res = await axios.post('http://192.168.1.74:2000/remove_favorite', { imdbid: movie.imdbID, Favorite: movie.isFavorite });
            setLiked(res.Favorite);
            console.log(res.data); // Log the message from the response
        } else {
            const res = await axios.post('http://192.168.1.74:2000/send_films', { imdbid: movie.imdbID, Favorite: movie.isFavorite });
            setLiked(res.data.Favorite);
            console.log('Film sent successfully!', res.data); // Log success message or response data
        }
    } catch (error) {
        console.error('Error sending film:', error);
    }
  };

  const handleReset = () => {
    setTitle('');
    setYear('');
    setMovie(null);
    setError(null);
  };

  return (
    <div className="movie-search">
      {movie ? (
        <div>
          <h2>Movie Found!</h2>
          <div className="movie-info">
            <img src={movie.Poster} alt={movie.Title} />
            <h3>{movie.Title} ({movie.Year})</h3>
            <p>Ganre: {movie.Genre}</p>
            <p>Director: {movie.Director}</p>
            <p>Runtime: {movie.Runtime}</p>
            <p>Actors: {movie.Actors}</p>
            <p>{movie.Plot}</p>
          </div>
          <button onClick={handleReset}>Back to search</button>
          <p></p>
          <button onClick={handleSendFilm}>{liked ? 'Unlike' : 'Like'}</button>
        </div>
      ) : (
        <div>
          <h2>Search for a Movie</h2>
          <form>
            <input
              type="text"
              placeholder="Movie Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Movie Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
            <button onClick={handleSearch} disabled={searching}>
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default MovieSearch;