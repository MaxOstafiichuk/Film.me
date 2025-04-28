import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Userpage.css';

const LikedFilms = () => {
  const [films, setFilms] = useState([]);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState("");
  const [loading, setLoading] = useState(true);

  const handleDelete = (imdbID) => {
    axios.post('http://192.168.1.74:2000/remove_favorite', { imdbid: imdbID, Favorite: !true})
      .then(() => {
        setFilms(films => films.filter(film => film.imdbID !== imdbID));
        
      })
      .catch(error => {
        console.log(error);
      });
  };

  useEffect(() => {
    axios.get('http://192.168.1.74:2000/myfilms', { withCredentials: true })
      .then(response => {
        if (response.data.films) {
          setFilms(response.data.films);
        } else {
          setFilms([]);
        }
        setLoading(false);
      })
      .catch(error => {
        setError('Error fetching films');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading liked films...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="film-mosaic">
      {films.map((film) => (
        <div key={film.imdbID} className="film-card">
          <img className='image' src={film.Poster} alt={film.Title} />
          <h3 className='text'>{film.Title} ({film.Year})</h3>
          <p className='text'>{film.Plot}</p>
          <div className="film-card-footer">
            <button onClick={() => handleDelete(film.imdbID)} className='Remove-button'>Remove from favorites</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LikedFilms;