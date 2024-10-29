const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const axios = require("axios");
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const redis = require('redis');
const bcrypt = require('bcrypt');

const app = express();

const API_KEY = process.env.API_KEY;
const saltRounds = 4;
const Unregistered_user = { user_surname: "User"};

const redisClient = redis.createClient({
  url: 'redis://redis:6379'
});

const corsOptions = {
  origin: true, 
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type'],
  credentials: true,
};

app.use(cors(corsOptions));

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.connect(); // Ensure the client is connected

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'BoberBoing',
    resave: false,
    saveUninitialized: false,  // Prevent uninitialized sessions
    cookie: { maxAge: 60000 * 60, secure: false, httpOnly: true }  // Set cookie to expire after 60 minutes
}));

// Define the connection variable
const pool = mysql.createPool({
    host: 'Database',
    user: 'connect',
    password: 'Pop80bebe',
    database: 'app'
});

app.use((req, res, next) => {
    req.db = pool;
    next();
});

const authMiddleware = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).send('You are not logged in');
  }
  next();
};


app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// API Endpoints


app.post("/login", (req, res) => {
  const { user_number, user_password } = req.body;
  pool.promise().query(`SELECT * FROM users WHERE user_number = ?`, [user_number])
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.status(401).send('Invalid credentials');
      }
      const user = rows[0];
      bcrypt.compare(user_password, user.user_password, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error occurred during login');
        }
        if (result) {
          req.session.user = {
            id: user.user_id,
            user_number: user.user_number,
            user_surname: user.user_surname,
            user_name: user.user_name
          };
          console.log("Session set:", req.session.user);  // Log the session after login    
          res.send({ message: 'Logged in successfully' });
        } else {
          res.status(401).send('Invalid credentials');
        }
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error occurred during login');
    });
});

app.post("/register", (req, res) => {
  const { user_name, user_surname, user_number, user_password } = req.body;

  pool.promise().query(
    `SELECT * FROM users WHERE user_number = ? AND user_password = ?`,
      [user_number, user_password]
  ).then(([rows]) => {
    if (rows.length > 0) {
      const existing_user = rows[0];
      res.status(400).send(`User with number ${existing_user.user_number} already exists`); 
    } else {
      bcrypt.hash(user_password, saltRounds, (err, hash) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error during hashing!");
        } else {
          const query = "INSERT INTO users (user_name, user_surname, user_number, user_password) VALUES (?, ?, ?, ?)";
          pool.query(query, [user_name, user_surname, user_number, hash], (err, result) => {
            if (err) {
              console.log("Error: ", err);
              return res.send('Error occurred during registration.');
            }
            res.send({ message: 'Registered successfully' });
            console.log('User added:', result);
          });
          const film_query = "INSERT INTO user_films (user_id, films) VALUES ((SELECT user_id FROM users WHERE user_surname = ?), '[]')";
          pool.query(film_query, [user_surname], (err, result) => {
            if (err) {
              console.log("Error: ", err);
            } else {
              console.log('User film added:', result);
              }
          });
        }
      });
    }
  });
});

app.get("/myfilms", authMiddleware, async (req, res) => {
  const userId = req.session.user.id;
  const query = `SELECT films FROM user_films WHERE user_id = ?`;
  req.db.query(query, [userId], async (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send({ message: 'Error retrieving user films' });
    } else {
      if (result.length === 0) {
        // No results found, handle this case accordingly
        res.send({ films: [] });
      } else {
        const films = result[0].films;
        const filmData = [];
        console.log(films);
        for (const film of films) {
          try {
            const response = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${film}`);
            filmData.push(response.data);
          } catch (error) {
            console.error(`Error fetching film data for ${film}: ${error}`);
          }
        }

        res.send({ films: filmData });
      }
    }
  });
});

app.get("/user_creds", authMiddleware, (req, res) => {
  try {
    const result = res.json(req.session);
    return result;
  }
  catch(err) {
    console.log("Error: " + err);
  }
});


app.post("/send_films", authMiddleware, (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('You are not logged in');
  } else {
    const film = req.body;

    // Use the Favorite property from the request
    const liked = film.Favorite; // This will be true or false based on the request
    const user_id = req.session.user.id;

    const query = `UPDATE user_films SET films = JSON_ARRAY_APPEND(films, '$', ?) WHERE user_id = ?`;
    req.db.query(query, [film.imdbid, user_id], (err, result) => {
      if (err) {
        console.error(`Error adding movie to favorites: ${err}`);
        return res.status(500).send({ message: 'Error adding movie to favorites' });
      } else {
        console.log(`Movie added to favorites successfully! Affected rows: ${result.affectedRows}`);
        // Since we are adding a film, we should set Favorite to true
        res.send({ message: 'Movie added to favorites successfully', Favorite: true });
      }
    });
  }
});

app.post("/logout", (req, res) => {
  if (!req.session.user) {
    res.send({ message: 'You are not logged in' });
  } else {
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session:", err);
        return res.status(500).send('Error occurred during logout');
      }
      res.clearCookie("connect.sid");
      res.send({ message: 'Logged out successfully' });
    });
  }
});

app.post("/send_register", (req, res) => {
  const { user_name, user_surname, user_number, user_password } = req.body;

  req.db.promise().query(
    `SELECT * FROM users WHERE user_number = ? AND user_password = ?`,
      [user_number, user_password]
  ).then(([rows]) => {
    if (rows.length > 0) {
      const existing_user = rows[0];
      res.status(400).send(`User with number ${existing_user.user_number} already exists`); 
    } else {
      bcrypt.hash(user_password, saltRounds, (err, hash) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error during hashing!");
        } else {
          const query = "INSERT INTO users (user_name, user_surname, user_number, user_password) VALUES (?, ?, ?, ?)";
          req.db.query(query, [user_name, user_surname, user_number, hash], (err, result) => {
            if (err) {
              console.log("Error: ", err);
              return res.send('Error occurred during registration.');
            }
            res.send({ message: 'Registered successfully' });
            console.log('User added:', result);
          });
          const film_query = "INSERT INTO user_films (user_id, films) VALUES ((SELECT user_id FROM users WHERE user_surname = ?), '[]')";
          req.db.query(film_query, [user_surname], (err, result) => {
            if (err) {
              console.log("Error: ", err);
            } else {console.log('User film added:', result);
            }
          });
        }
      });
    }
  });
});

// this is for random movies 
/* app.get('/search', async (req, res) => {
  const apiUrl = `http://www.omdbapi.com/?apikey=${API_KEY}&type=movie&s=karate&r=json`;    
  const response = await axios.get(apiUrl);
  const movieList = response.data.Search;
  const randomizedMovieList = shuffleArray(movieList);
  res.json(randomizedMovieList.slice(0, 10)); // return 10 random movies
}); */

/* function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
} */


app.post("/remove_favorite", authMiddleware, async (req, res) => {
  try {
    if (!req.session.user) {
      throw new Error('You are not logged in');
    }
    const movieData = req.body; // get the JSON data from the request body
    console.log(movieData);
    console.log(movieData.Favorite);
    if (!movieData || !movieData.imdbid) {
      throw new Error('Invalid movie data');
    }
    // Check if the movie is already in the user's favorites
    if (!movieData.Favorite){
      const query = "SELECT * FROM user_films WHERE user_id = ? AND JSON_SEARCH(films, 'one', ?) IS NOT NULL";
      req.db.query(query, [req.session.user.id, movieData.imdbid], (err, result) => {
        if (err) {
          throw err;
      }
      
    });
    }
    // Movie is already in favorites, remove it
    const removeQuery = "UPDATE user_films SET films = JSON_REMOVE(films, JSON_UNQUOTE(JSON_SEARCH(films, 'one', ?))) WHERE user_id = ?";
    req.db.query(removeQuery, [movieData.imdbid, req.session.user.id], (err, result) => {
      if (err) {
        throw err;
      }
        res.send({ message: 'Movie removed from favorites successfully!', Favorite: !movieData.Favorite }); // Return a JSON response
      });
  } catch (err) {
    console.error('Error removing movie from favorites:', err);
    res.status(500).send({ message: `Error occurred while removing movie from favorites: ${err.message}` }); // Return a JSON response
  }
});

app.post("/result", authMiddleware, async (req, res) => {
  const { title, year } = req.body;

  if (!title) {
    return res.status(400).send({ message: "Please provide a movie title." });
  }

  try {
    const response = await axios.get(`http://www.omdbapi.com/?apikey=${API_KEY}&t=${title}&y=${year}`);

    if (response.data.Response === "False") {
      return res.status(404).send({ message: "Movie not found." });
    }

    // Check if session user exists
    if (!req.session.user || !req.session.user.id) {
      console.log("User session not found");
      return res.status(401).send({ message: 'You are not logged in.' });
    }

    const userId = req.session.user.id;

    // Log checking favorite state
    console.log("Checking if the movie is already in user's favorites...");
    const query = "SELECT * FROM user_films WHERE user_id = ? AND JSON_SEARCH(films, 'one', ?) IS NOT NULL";
    req.db.query(query, [userId, response.data.imdbID], (err, result) => {
      if (err) {
        console.error("Error checking favorites:", err);
        return res.status(500).send({ message: "Error occurred while checking favorites." });
      }

      let favoriteState = result.length > 0 ? 'FAVORITE' : 'NOT_FAVORITE';
      response.data.isFavorite = favoriteState === 'FAVORITE';
      console.log("IT IS FAVORITE");

      res.send({ movie: response.data, favoriteState });
    });
  } catch (error) {
    console.error("Error fetching data from OMDb API:", error);

    if (!res.headersSent) {
      return res.status(500).send({ message: "Error occurred while fetching movie data." });
    }
   }
  }
);

// Start the server
const PORT = process.env.PORT || 2000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://backend:${PORT}`);
});