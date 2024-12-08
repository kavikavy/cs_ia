const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto'); // For generating secure tokens
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const db = require('./connectdb');

const app = express();

// Configure session middleware
app.use(
  session({
    secret: 'qZ8hLgu%53(^,nN',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }, // Session expires after 1 hour
  })
);

// Middleware to parse JSON requests
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  console.log('Entering Authentication', req.session.userId);
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    next(); // User is authenticated, proceed
  } else {
    res.status(403).send('Access denied. Please log in.');
  }
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/home.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'protected', 'home.html'));
})

app.get('/consumption.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'protected', 'consumption.html'));
});

app.get('/friends.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'protected', 'friends.html'));
});

app.get('/leaderboard.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'protected', 'leaderboard.html'));
});

app.get('/recipes.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'protected', 'recipes.html'));
});

app.get('/add_consumption.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'protected', 'add_consumption.html'));
});

app.get('/challenges.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'protected', 'challenges.html'));
});

app.get('/add_challenge.html', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'protected', 'add_challenge.html'));
});

//API endpoint to handle registration
app.post('/api/signup', async (req, res) => {
  const { username, firstname, lastname, email, password } = req.body;

  try {
    // Check if the email exists in the database
    const query_email = await db.query('SELECT user_id FROM appuser WHERE email = $1', [email]);

    if (query_email.rows.length >= 1) {
      return res.status(404).send('Email ID already used, provide a different email address.');
    }

    const query_user = await db.query('SELECT user_id FROM appuser WHERE user_name = $1', [username]);

    if (query_user.rows.length >= 1) {
      return res.status(404).send('Username taken, provide a different username.');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO appuser (user_name,first_name,last_name, email,password) 
      VALUES ($1,$2,$3,$4,$5)`

    // Insert user into the database
    await db.query(query, [
      username,
      firstname,
      lastname,
      email,
      hashedPassword,
    ]);

    res.status(201).send('User registered successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user');
  }
});

// API endpoint to handle login
app.post('/api/signin', async (req, res) => {
  console.log(req.body);
  const { username, password } = req.body;

  try {
    // Query to fetch the user based on username
    console.log(`Login attempt for username: ${username}`);
    const result = await db.query('SELECT user_id, password FROM appuser WHERE user_name = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Validate the password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
      // Store userId in session
      req.session.userId = user.user_id;
      console.log(req.session.userId);
      return res.status(200).json({ message: 'Login successful' }); // Send redirect path
    } else {
      return res.status(404).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error during login' });
  }
});

// API endpoint to handle logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send({ message: 'Logout failed' });
    }
    res.send({ message: 'Logged out successfully' });
  });
});

// Password reset request route
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email exists in the database
    const result = await db.query('SELECT user_id FROM appuser WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(404).send('Email not found');
    }

    const userId = result.rows[0].user_id;

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiration = new Date(Date.now() + 3600000); // Token valid for 1 hour

    // Save the token and expiration in the database
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, tokenExpiration]
    );

    const resetLink = `http://localhost:3000/public/reset-password.html?token=${token}`;

    res.status(200).json({ message: 'Reset link generated: ', resetLink });
  } catch (err) {
    console.error('Error processing forgot password:', err.message);
    res.status(500).send('Internal server error');
  }
});

// Resetting Password
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Validate the token
    result = await db.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const userId = result.rows[0].user_id;
    console.log(userId);
    // Hash the new password (using bcrypt or similar)
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    result = await db.query('UPDATE appuser SET password = $1 WHERE user_id = $2', [hashedPassword, userId]);

    if (result.rowCount === 0) {
      return res.status(404).send('User ID not found for Update');
    }

    // Delete the used token
    await db.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

    res.status(201).json({ message: "Password reset completed successfully" });
  } catch (err) {
    console.error('Error resetting password:', err.message);
    res.status(500).send('Internal server error');
  }
});

app.get('/api/get-leaderboard', async (req, res) => {
  const filter=req.query.filter;
  try {
    const userId = req.userId; // Retrieve userId from session
    let dateCondition = '';
    if (filter === 'week') {
        dateCondition = `AND created_date >= current_date - INTERVAL '7 DAYS' `;
    } else if (filter === 'month') {
        dateCondition = `AND  cons.created_date >= current_date - INTERVAL '1 month' `;
    };

    let query = `SELECT RANK() OVER (ORDER BY SUM(cons.consumed_units * cc.co2_emissions) DESC) AS rank, au.user_name,  SUM(cons.consumed_units * cc.co2_emissions) AS total_emissions
                  FROM consumption cons
                  JOIN category cc ON cons.category_id = cc.category_id
                  JOIN appuser au ON cons.user_id = au.user_id
                  where 1=1 `
    query += dateCondition;
    query += `GROUP BY au.user_name`
  const result = await db.query(query);

  res.status(200).json(result.rows);
} catch (error) {
  console.error('Error fetching data:', error);
  res.status(500).send('Error fetching data from the database');
}
});


// Get current user
app.get('/api/current-user', isAuthenticated, (req, res) => {
  res.send({ userId: req.userId });
});

app.post('/api/add-challenge', async (req, res) => {
  const { challengeName, targetUnits, startDate, endDate, categoryName } = req.body;

  try {
    const chg_result = await db.query('SELECT challenge_name FROM challenges WHERE challenge_name = $1 and user_id= $2 ', [challengeName,req.session.userId]);

    if (chg_result.rows.length >= 1) {
      return res.status(500).send({ message: "Challenge name already exists, retry with another name" });
    }

    const cat_result = await db.query('SELECT category_name FROM challenges WHERE category_name = $1 and user_id= $2 and ( $3 between start_date and end_date or $4 between start_date and end_date or start_date between $3 and $4 or end_date between $3 and $4) ', [categoryName, req.session.userId,startDate,endDate]);

    if (cat_result.rows.length >= 1) {
      return res.status(500).send({ message: "Already challenge exist within specified period, use different range or different category type" });
    }

    const query = `INSERT INTO challenges (challenge_name, target_units,consumed_units, start_date, end_date, user_id, category_name) 
      VALUES ($1,$2,0,$3,$4,$5,$6)`

    // Insert challenge into the database
    await db.query(query, [
      challengeName,
      targetUnits,
      startDate,
      endDate,
      req.session.userId,
      categoryName,
    ]);

    //return res.redirect('/challenges.html');
    res.status(201).send({ message: "Challenge added successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: "An error occurred while adding the challenge. Please try again." });
  }
});

//Get user challenges
app.get('/api/get-challenges', async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await db.query('SELECT challenge_name, target_units, consumed_units,start_date, end_date, category_name ' +
      'FROM challenges cc ' +
      'WHERE user_id=$1 and end_date>=  current_date',
      [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data from the database');
  }
});

//Get Categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT category_name FROM category');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).send('Error fetching categories from the database');
  }
});

//Get measurement units
app.get('/api/get-category-unit', async (req, res) => {
  try {
    const categoryName = req.query.category;

    const result = await db.query(
      'SELECT distinct measurement_unit FROM category WHERE category_name = $1',
      [categoryName]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Category not found');
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category details:', error);
    res.status(500).send('Error fetching category details');
  }
});

//Get subcategories
app.get('/api/subcategories', async (req, res) => {
  const categoryName = req.query.category;
  try {
    const result = await db.query(
      'SELECT subcategory_name,measurement_unit FROM category WHERE category_name = $1',
      [categoryName]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).send('Error fetching subcategories from the database');
  }
});

// Add consumption data
app.post('/api/add-consumption', async (req, res) => {
  const { categoryName, subcategoryName, consumedUnits } = req.body;

  try {
    // Find category_id for the given category
    const categoryResult = await db.query(
      `SELECT category_id FROM category WHERE category_name= $1 and subcategory_Name=$2`,
      [categoryName, subcategoryName]
    );
    if (categoryResult.rows.length === 0) {
      return res.status(500).send({ message: "Category ID doesn't Exist" });
    }

    const category_id = categoryResult.rows[0].category_id;

    // Insert or update consumption 
    await db.query(
      `INSERT INTO consumption (user_id, category_id, consumed_units, created_date)
       VALUES ($1, $2, $3, current_date)
       ON CONFLICT (user_id, category_id,created_date) 
       DO UPDATE SET consumed_units = consumption.consumed_units + $3`,
      [req.session.userId, category_id, consumedUnits]
    );

    const chgupdate_Result = await db.query(
      `UPDATE challenges set consumed_units=consumed_units + $1 where user_id=$2 and category_name=$3 and 
      current_date between start_date and end_date`,
      [consumedUnits, req.session.userId,categoryName]
    );

    if (categoryResult.rows.length === 0) {
      res.status(201).send({ message: 'Consumption recorded successfully.' });
    }
    else {
      res.status(201).send({ message: 'Consumption recorded and challenge updated successfully.' });
    }
  } catch (error) {
    console.error('Error adding consumption data:', error);
    res.status(500).send({ message: 'Error saving consumption data to the database' });
  }
});

//Get user consumption data
app.get('/api/get-consumption', async (req, res) => {
  const userId = req.session.userId;
  try {
    const result = await db.query(`
            SELECT ct.category_name AS type,
              SUM(c.consumed_units) AS consumption,
              SUM(c.consumed_units * ct.co2_emissions) AS co2
            FROM consumption c
            JOIN category ct ON c.category_id = ct.category_id
            WHERE c.user_id = $1
            GROUP BY ct.category_name
        `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching consumption data:', error);
    res.status(500).send('Error fetching data from the database');
  }
});

// Fetch current user's friends
app.get('/api/friends', async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await db.query(
      `SELECT u.user_name
      FROM friends f
      JOIN appuser u ON (f.userid1 = u.user_id OR f.userid2 = u.user_id)
      WHERE (f.userid1 = $1 OR f.userid2 = $1) AND u.user_id != $1`,
      [userId]
    );
    const friends = result.rows.map(row => row.user_name);
    res.status(200).json(friends);
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).send('Error fetching friends');
  }
});

// Fetch friend requests for the current user
app.get('/api/friend-requests', async (req, res) => {
  const userId = req.session.userId;
  try {
    const result = await db.query(
      `SELECT sender_id FROM friend_requests WHERE recipient_id = $1 AND request_status = 'pending'`,
      [userId]
    );

    // Get usernames for each sender_id in the request
    const senderIds = result.rows.map(row => row.sender_id);

    // Fetch usernames based on sender_ids
    const usernamesResult = await db.query(
      `SELECT user_name, user_id FROM appuser WHERE user_id = ANY($1)`,
      [senderIds]
    );

    // Map sender IDs to their respective usernames
    const requests = usernamesResult.rows.map(row => ({
      userId: row.user_id,
      username: row.user_name,
    }));

    res.status(200).json(requests);  // Send the requests with both userId and username
  } catch (err) {
    console.error('Error fetching friend requests:', err);
    res.status(500).send('Error fetching friend requests');
  }
});

// Send a friend request
app.post('/api/friend-request', async (req, res) => {
  const { recipientUsername } = req.body;

  try {
    // Find the recipientId based on the username
    const recipientResult = await db.query(
      'SELECT user_id FROM appuser WHERE user_name = $1',
      [recipientUsername]
    );

    if (recipientResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const recipientId = recipientResult.rows[0].user_id;

    // Check if the request already exists in the pending state
    const existingRequest = await db.query(
      `SELECT * FROM friend_requests WHERE sender_id = $1 AND recipient_id = $2 AND request_status = 'pending'`,
      [req.session.userId, recipientId]
    );
    if (existingRequest.rows.length > 0) {
      return res.status(400).send('Friend request already sent');
    }

    // Insert the friend request
    await db.query(
      `INSERT INTO friend_requests (sender_id, recipient_id, request_status) VALUES ($1, $2, 'pending')`,
      [req.session.userId, recipientId]
    );
    res.status(200).send('Friend request sent');
  } catch (err) {
    console.error('Error sending friend request:', err);
    res.status(500).send('Error sending friend request');
  }
});

// Accept a friend request
app.post('/api/accept-friend-request', async (req, res) => {
  const { friendUsername } = req.body;

  try {
    let friendId;

    if (/^\d+$/.test(friendUsername)) {
      // If `friendUsername` is numeric, treat it as a user ID
      friendId = friendUsername;
    } else {
      // Otherwise, lookup the ID based on the username
      const friendResult = await db.query(
        'SELECT user_id FROM appuser WHERE user_name = $1',
        [friendUsername]
      );

      if (friendResult.rows.length === 0) {
        console.log('Friend not found:', friendUsername);
        return res.status(404).send('Friend not found');
      }

      friendId = friendResult.rows[0].user_id;
    }

    //console.log(`Accepting friend request from: ${friendId}`);

    // Check if the request exists and is pending
    const request = await db.query(
      `SELECT * FROM friend_requests WHERE sender_id = $1 AND recipient_id = $2 AND request_status = 'pending'`,
      [friendId, req.session.userId]
    );

    if (request.rows.length === 0) {
      console.log('No pending friend request found.');
      return res.status(400).send('No pending friend request');
    }

    // Update the request status to 'accepted'
    await db.query(
      `UPDATE friend_requests SET request_status = 'accepted' WHERE sender_id = $1 AND recipient_id = $2`,
      [friendId, req.session.userId]
    );

    // Create a new friendship
    await db.query(
      `INSERT INTO friends (userid1, userid2)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM friends WHERE (userid1 = $1 AND userid2 = $2) OR (userid1 = $2 AND userid2 = $1)
       )`,
      [req.session.userId, friendId]
    );

    res.status(200).send('Friend request accepted');
  } catch (err) {
    console.error('Error accepting friend request:', err);
    res.status(500).send('Error accepting friend request');
  }
});

// Decline a friend request
app.post('/api/decline-friend-request', async (req, res) => {
  const { friendUsername } = req.body;

  try {
    let friendId;

    if (/^\d+$/.test(friendUsername)) {
      // If `friendUsername` is numeric, treat it as a user ID
      friendId = friendUsername;
    } else {
      // Otherwise, lookup the ID based on the username
      const friendResult = await db.query(
        'SELECT user_id FROM appuser WHERE user_name = $1',
        [friendUsername]
      );

      if (friendResult.rows.length === 0) {
        console.log('Friend not found:', friendUsername);
        return res.status(404).send('Friend not found');
      }

      friendId = friendResult.rows[0].user_id;
    }

    // Remove the pending request from the friend_requests table
    await db.query(
      `DELETE FROM friend_requests WHERE sender_id = $1 AND recipient_id = $2 AND request_status = 'pending'`,
      [friendId, req.session.userId]
    );

    res.status(200).send('Friend request declined');
  } catch (err) {
    console.error('Error declining friend request:', err);
    res.status(500).send('Error declining friend request');
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log('Current directory:' + __dirname);

  // Public static files (accessible to everyone)
  app.use('/public', express.static(path.join(__dirname, 'public')));
  // Serve static files in "protected" folder only if authenticated
  app.use('/protected', isAuthenticated, express.static(path.join(__dirname, 'protected')));

});