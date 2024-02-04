const express = require('express');
const app = express();
const cors = require('cors');
const port = 3001; // You can use any port you prefer

const mysql = require('mysql2');
app.use(cors());

const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '*_-wowza-shaw1289',
  database: 'sakila',
  //insecureAuth: true,
});

// connect to the mysql database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
  } else {
    console.log('Connected to MySQL');
  }
});


app.get('/topfivefilms', (req, res) => {
  const query = `SELECT f.film_id, f.title, c.name, count(f.film_id) as rented
  FROM sakila.film f
  join sakila.film_category fc on f.film_id = fc.film_id
  join sakila.category c on fc.category_id = c.category_id
  join sakila.inventory i on f.film_id = i.film_id
  join sakila.rental r on i.inventory_id = r.inventory_id
  group by f.film_id, f.title, c.name
  order by rented DESC
  limit 5;
`;
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/filmDetails/:filmId', (req, res) => {
  console.log('Request params:', req.params); 
  const filmId = req.params.filmId; 
  console.log('Film ID:', filmId); 
  const filmDetailsQuery = `
    SELECT title, description, release_year, rental_rate, special_features
    FROM sakila.film
    WHERE film_id = ?;
  `;
  connection.query(filmDetailsQuery, filmId, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('Query results:', results); // Added to log the query results
      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).json({ error: 'Film not found' });
      }
    }
  });
});

app.get('/topfiveactors', (req, res) => {
  const query = `SELECT a.actor_id, a.first_name, a.last_name, count(a.actor_id) as movies
  FROM sakila.actor a
  left join sakila.film_actor fa on a.actor_id = fa.actor_id
  group by a.actor_id, a.first_name, a.last_name
  order by movies DESC
  limit 5;
  `;
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/actorsdetails/:filmId', (req, res) => {
  console.log('Request params:', req.params); 
  const filmId = req.params.filmId; 
  console.log('Film ID:', filmId); 
  const actorsDetailsQuery = `
  WITH ActorFilmCounts AS (
    SELECT a.actor_id, a.first_name, a.last_name, COUNT(fa.film_id) AS movies
    FROM sakila.actor a
    LEFT JOIN sakila.film_actor fa ON a.actor_id = fa.actor_id
    GROUP BY a.actor_id, a.first_name, a.last_name
    ORDER BY movies DESC
    LIMIT 5
  )

    SELECT f.film_id, f.title, COUNT(r.rental_id) AS rental_count, a.first_name, a.last_name
    FROM sakila.film_actor fa
    JOIN ActorFilmCounts afc ON fa.actor_id = afc.actor_id
    JOIN sakila.film f ON fa.film_id = f.film_id
    JOIN sakila.film_category fc ON f.film_id = fc.film_id
    JOIN sakila.category c ON fc.category_id = c.category_id
    JOIN sakila.inventory i ON f.film_id = i.film_id
    JOIN sakila.rental r ON i.inventory_id = r.inventory_id
    join sakila.actor a on fa.actor_id = a.actor_id
    WHERE fa.actor_id = ? 
    GROUP BY f.film_id, f.title
    ORDER BY COUNT(r.rental_id) DESC
    LIMIT 5;
  `;
  connection.query(actorsDetailsQuery, filmId, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('Query results:', results); // Added to log the query results
      if (results.length > 0) {
        res.json(results); // Changed from res.json(results[0]) to res.json(results) to return all results
      } else {
        res.status(404).json({ error: 'Film not found' });
      }
    }
  });
});


app.get('/searchMoviesTitle/:movieTitle', (req, res) => {
  const movieTitle = req.params.movieTitle;
  const query = `SELECT title, description, release_year, rating, special_features, rental_rate FROM sakila.film
  WHERE title LIKE ?
  `;
  connection.query(query, [`%${movieTitle}%`], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
