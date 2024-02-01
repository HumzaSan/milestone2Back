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


app.get('/films', (req, res) => {
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
  console.log('Request params:', req.params); // Added to log request parameters
  const filmId = req.params.filmId; // Changed from req.query.filmId to req.params.filmId
  console.log('Film ID:', filmId); // Added to log the extracted filmId
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


