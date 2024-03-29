const express = require('express');
const app = express();
const cors = require('cors');
const port = 3001; 
app.use(express.json());

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
  const filmQuery = `
    SELECT title, description, release_year, rental_rate, special_features
    FROM sakila.film
    WHERE film_id = ?;
  `;
  connection.query(filmQuery, filmId, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('Query results:', results);
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
      console.log('Query results:', results); 
      if (results.length > 0) {
        res.json(results); 
      } else {
        res.status(404).json({ error: 'Film not found' });
      }
    }
  });
});


app.get('/searchMoviesTitle/:movieTitle', (req, res) => {
  const movieTitle = req.params.movieTitle;
  const query = `SELECT film_id, title, description, release_year, rating, special_features, rental_rate FROM sakila.film
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


app.get('/searchMoviesActor/:movieActor', (req, res) => {
  const movieActor = req.params.movieActor;
  const query = `SELECT f.film_id, f.title, f.release_year, a.first_name FROM sakila.film f
  left join sakila.film_actor fa on f.film_id = fa.film_id
  left join sakila.actor a on fa.actor_id = a.actor_id
  WHERE a.first_name LIKE ?
  `;
  connection.query(query, [`%${movieActor}%`], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/searchMoviesGenre/:movieGenre', (req, res) => {
  const movieGenre = req.params.movieGenre;
  const query = `SELECT distinct f.film_id, f.title, f.release_year FROM sakila.film f 
  join sakila.film_category fc on f.film_id = fc.film_id
  join sakila.category c on fc.category_id = c.category_id
  join sakila.film_actor fa on f.film_id = fa.film_id
  join sakila.actor a on fa.actor_id = a.actor_id
  WHERE c.name LIKE ?
  `;
  connection.query(query, [`%${movieGenre}%`], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/modalFilmDetails/:filmId', (req, res) => {
  console.log('Request params:', req.params); 
  const filmId = req.params.filmId; 
  console.log('Film ID:', filmId); 
  const movieDetailsQuery = `
  SELECT distinct f.title, description, GROUP_CONCAT(CONCAT(a.first_name,' ',a.last_name) ORDER BY a.actor_id SEPARATOR ', ') AS actor_names, 
  c.name, f.release_year, f.rating, f.special_features, f.rental_rate FROM sakila.film f
  join sakila.film_category fc on f.film_id = fc.film_id
  join sakila.category c on fc.category_id = c.category_id
  join sakila.film_actor fa on f.film_id = fa.film_id
  join sakila.actor a on fa.actor_id = a.actor_id
  WHERE f.film_id = ?
  GROUP BY f.title, f.description, c.name, f.release_year, f.rating, f.special_features, f.rental_rate;
  `;
  connection.query(movieDetailsQuery, filmId, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('Query results:', results);
      if (results.length > 0) {
        res.json(results[0]);
      } else {
        res.status(404).json({ error: 'Film not found' });
      }
    }
  });
});

// rent button
app.post('/customerMovieRental/:customerID', (req, res) => {
  // Assuming `customer_id` and `inventory_id` are sent in the request body
  console.log('Request params:', req.params); 
  const customerID = req.params.customerID;
  // const inventoryID = req.params.inventoryID;
  //const { customer_id, inventory_id } = req.body;
  const customerMovieRental = 'INSERT INTO sakila.rental (rental_date, inventory_id, customer_id, return_date, staff_id) VALUES (?, ?, ?, ?, ?)';
  const values = ["02/08/2024", "200000", customerID, null, "1"]; // Assuming `return_date` can be NULL initially
  connection.query(customerMovieRental, values, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});
// rent button part 2
app.post('/test/:filmId', (res, req) => {
  console.log('Request params:', req.params); 
  const filmId = req.params.filmId; 
  console.log('Film ID:', filmId);
}
);


app.get('/showAllCustomers', (req, res) => {
  const query = `SELECT customer_id, first_name, last_name FROM sakila.customer;`;
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/filterByCustomersID/:custID', (req, res) => {
  const query = `SELECT customer_id, first_name, last_name FROM sakila.customer
  where customer_id = ?`;
  const custID = req.params.custID;
  connection.query(query, custID, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/filterByCustomersFirstName/:fName', (req, res) => {
  const query = `SELECT customer_id, first_name, last_name FROM sakila.customer c
  where c.first_name LIKE ?`;
  const fName = req.params.fName;
  connection.query(query, [`%${fName}%`], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.get('/filterByCustomersLastName/:lName', (req, res) => {
  const query = `SELECT customer_id, first_name, last_name FROM sakila.customer c
  where c.last_name LIKE ?`;
  const lName = req.params.lName;
  connection.query(query, [`%${lName}%`], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

// work on this later
app.post('/addMovieReview', (req, res) => {
  // Extracting data sent in the request body
  const { movieId, review, rating } = req.body;

  // Here you would typically insert the review into a database.
  // For demonstration, we'll just log it and return a success message.
  console.log(`Adding review for movie ID ${movieId}: ${review} with rating ${rating}`);

  // Responding with a success message
  res.status(201).json({ message: 'Review added successfully!' });
});


app.delete('/deleteCustomerById/:custID', (req, res) => {
  const query = `DELETE FROM sakila.customer WHERE customer_id LIKE ?`;
  const custID = req.params.custID;
  connection.query(query, [`%${custID}%`], (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (results.affectedRows > 0) {
        res.json({ message: `${results.affectedRows} customer(s) deleted successfully.` });
      } else {
        res.status(404).json({ message: 'No customers found with the given ID.' });
      }
    }
  });
});

app.post('/test', express.json(), (req, res) => {
  console.log('Received data:', req.body);
  const { user_address, user_district, user_city_id, user_postal_code, user_phone } = req.body;

  // Check if required fields are present in the request body
  if (!user_address || !user_district || !user_city_id || !user_postal_code || !user_phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const insertQuery = 'INSERT INTO sakila.address (address_id, address, district, city_id, postal_code, phone, location, last_update) VALUES (NULL, ?, ?, ?, ?, ?, ST_GeomFromText(\'POINT(1 2)\'), CURRENT_TIMESTAMP)';
  const values = [user_address, user_district, user_city_id, user_postal_code, user_phone];

  connection.query(insertQuery, values, (err, results) => {
    if (err) {
      console.error('Error inserting new customer: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ message: 'New customer added successfully' });
    }
  });
});

app.post('/addNewCustomerInfo', express.json(), async (req, res) => {
  console.log('Received data:', req.body);
  //const { user_address, user_district, user_city_id, user_postal_code, user_phone, user_first_name, user_last_name, user_email } = req.body;
  const { user_first_name, user_last_name, user_email, user_address, user_district, user_city_id, user_postal_code, user_phone } = req.body;

  // Check if required fields are present in the request body
  if (!user_address || !user_district || !user_city_id || !user_postal_code || !user_phone ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!user_first_name || !user_last_name || !user_email ) {
    return res.status(400).json({ error: 'Missing part 2 of customer' });
  }

 
  const insertAddressQuery = 'INSERT INTO sakila.address (address_id, address, district, city_id, postal_code, phone, location, last_update) VALUES (NULL, ?, ?, ?, ?, ?, ST_GeomFromText(\'POINT(1 2)\'), CURRENT_TIMESTAMP)';
  const addressValues = [user_address, user_district, user_city_id, user_postal_code, user_phone];

  try {
    const addressInsertResult = await new Promise((resolve, reject) => {
      connection.query(insertAddressQuery, addressValues, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

  
    const addressId = addressInsertResult.insertId;
    console.log('obtained Address ID:', addressId);

    
    const insertCustomerQuery = 'INSERT INTO sakila.customer (customer_id, store_id, first_name, last_name, email, address_id, active, create_date, last_update) VALUES (NULL, 1, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
    const customerValues = [user_first_name, user_last_name, user_email, addressId];

    connection.query(insertCustomerQuery, customerValues, (err, customerInsertResult) => {
      if (err) {
        console.error('Error inserting new customer: ', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.json({ message: 'New customer added successfully' });
      }
    });
  } catch (error) {
    console.error('Error inserting new address: ', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/getCustomerDetails/:custID', (req, res) => {
  const query = `SELECT c.customer_id, c.first_name, c.last_name, c.email, a.address, a.district, a.phone, a.postal_code, r.rental_id, r.rental_date, r.return_date FROM sakila.customer c
    join sakila.rental r on r.customer_id = c.customer_id
    join sakila.address a on c.address_id = a.address_id
    where store_id = 1 and c.customer_id = ?
    order by return_date DESC`;
  const custID = req.params.custID;
  connection.query(query, custID, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
});

app.put('/updateCustomerAddress/:movieId', (req, res) => {
  const movieId = req.params.movieId;
  const { title, description, release_year, rental_rate } = req.body;
  const updateQuery = `
    UPDATE sakila.film
    SET title = ?, description = ?, release_year = ?, rental_rate = ?
    WHERE film_id = ?;
  `;
  const values = [title, description, release_year, rental_rate, movieId];

  connection.query(updateQuery, values, (err, results) => {
    if (err) {
      console.error('Error updating movie: ', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ message: 'Movie updated successfully' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
