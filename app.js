const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
const port = 5000;
let checkoutEncrypt = require('@cellulant/checkout_encryption');
// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'brandon',
  password: 'Jushman2323!',
  database: 'tastebites',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL as id ' + db.threadId);
  
  // SQL query to create the 'foods' table
  const createFoodsTableQuery = `
    CREATE TABLE IF NOT EXISTS foods (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      image VARCHAR(255)
    )
  `;
  
  // Execute the query to create the 'foods' table
  db.query(createFoodsTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating foods table: ' + err.stack);
      return;
    }
    console.log('Foods table created successfully');
    // Close the connection after the query is executed (optional)
    // db.end();
  });
  
  // SQL query to insert sample data into the 'foods' table
  const insertSampleDataQuery = `
    INSERT INTO foods (title, price, image) VALUES
      ('Shawarma', 200.00, '/images/food1.png'),
      ('Stir Fry', 300.00, '/images/food2.png'),
      ('Burger', 180.00, '/images/food3.png'),
      ('Pizza', 250.00, '/images/food4.png'),
      ('Chicken', 200.00, '/images/food5.png'),
      ('Fried Rice', 300.00, '/images/food6.png'),
      ('Fried Chicken', 180.00, '/images/food7.png'),
      ('Chicken Salad', 250.00, '/images/food8.png'),
      ('Chicken Wings', 200.00, '/images/food9.png'),
      ('Chicken Burger', 300.00, '/images/food10.png'),
      ('Chicken Shawarma', 180.00, '/images/food11.png'),
      ('Sushi Roll', 320.00, '/images/food12.png')
  `;

  // Execute the query to insert sample data into the 'foods' table
  db.query(insertSampleDataQuery, (err, result) => {
    if (err) {
      console.error('Error inserting sample data: ' + err.stack);
      return;
    }
    console.log('Sample data inserted into the foods table successfully');

    // Close the connection after the query is executed (optional)
    // db.end();
  });
});

// Set up middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Set up session middleware
app.use(session({
  secret: 'giantiss', // Change this to a secret string
  resave: false,
  saveUninitialized: true
}));

// Set up view engine
app.set('view engine', 'ejs');

// Middleware to serve static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/images', express.static(__dirname + '/public/images'));
app.use('/fonts', express.static(__dirname + '/public/fonts'));
app.use('/vendor', express.static(__dirname + '/public/vendor'));
app.use('/scss', express.static(__dirname + '/public/scss'));

// Middleware to create a cartCounter variable in all views
app.use((req, res, next) => {
  const cartItems = req.session.cartItems || [];
  const totalQuantity = cartItems.reduce((total, item) => total + parseInt(item.quantity), 0);
  res.locals.cartCounter = totalQuantity || 0; // Ensure default value is set if totalQuantity is undefined
  next();
});

// Routes

// Rest of your routes


// Routes
app.get('/', (req, res) => {
  //get 5 foods from the database ordered by id
  db.query('SELECT * FROM foods ORDER BY id DESC LIMIT 5', (err, result) => {
    if(err) throw err;
    res.render('index', {foods: result});
  });
});

app.get('/menu', (req, res) => {
    db.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
      }
      console.log('Connected to MySQL as id ' + db.threadId);
  
      const selectSampleDataQuery = `SELECT * FROM foods`;
  
      db.query(selectSampleDataQuery, (err, results) => {
        if (err) {
          console.error('Error selecting sample data: ' + err.stack);
          return;
        }
  
        console.log('Sample data from the foods table:');
        console.table(results); // Display the results in a table format
  
        // Render the menu.ejs template and pass the fetched data
        res.render('menu', { foods: results });
  
        // Close the connection after rendering the template (optional)
        // db.end();
      });
    });
  });

// Function to calculate the total price of items in the cart
function calculateTotalPrice(cartItems) {
  let totalPrice = 0;
  for (let i = 0; i < cartItems.length; i++) {
    if (cartItems[i].quantity && cartItems[i].price) {
      totalPrice += parseInt(cartItems[i].quantity) * parseFloat(cartItems[i].price);
    }
  }
  return totalPrice;
}

// Route to handle adding items to the cart
app.post('/add-to-cart', (req, res) => {
  const { id, title, price, quantity } = req.body;

  const cartItem = {
    id: id,
    title: title,
    price: price,
    quantity: quantity
  };

  if (!req.session.cartItems) {
    req.session.cartItems = [];
  }

  const existingItem = req.session.cartItems.find(item => item.id === cartItem.id);

  if (existingItem) {
    existingItem.quantity = parseInt(existingItem.quantity) + parseInt(cartItem.quantity);
  } else {
    req.session.cartItems.push(cartItem);
  }

  // Calculate total price of items in the cart and store in session
  req.session.totalPrice = calculateTotalPrice(req.session.cartItems);

  res.redirect('/menu');
});

// Route to display the cart
app.get('/cart', (req, res) => {
  const cartItems = req.session.cartItems || [];
  const totalPrice = req.session.totalPrice || 0;

  res.render('cart', { cartItems: cartItems, totalPrice: totalPrice });
});
  
// Route to handle removing items from the cart
app.post('/remove-item', (req, res) => {
  var id = req.body.id;
  cartItems = req.session.cartItems;

  for(let i = 0; i < cartItems.length; i++) {
    if(cartItems[i].id == id) {
      cartItems.splice(cartItems.indexOf(cartItems[i]), 1);
      break;
    }
  }
  // Recalculate total price
  req.session.totalPrice = calculateTotalPrice(req.session.cartItems);
  // Redirect back to cart
  res.redirect('/cart');
});

//other routes and configurations...
app.post('/checkout', (req, res) => {
// Initialize merchant variables
const accessKey = "<YOUR_ACCESS_KEY>"
const IVKey = "<YOUR_IV_KEY>";
const secretKey = "<YOUR_SECRET_KEY>";
const algorithm = "aes-256-cbc";

  // encrypt the payload
var payloadobj = {
  "msisdn":"+254725135903",
  "account_number":"oid39",
  "country_code":"KEN",
  "currency_code":"KES",
  "due_date":"2024-01-01 00:00:00",
  "fail_redirect_url":"https://webhook.site/6c933f61-d6da-4f8e-8a44-bf0323eb8ad6",
  "merchant_transaction_id":"txn_id_342",
  "callback_url":"https://webhook.site/6c933f61-d6da-4f8e-8a44-bf0323eb8ad6",
  "request_amount":"100",
  "success_redirect_url":"https://webhook.site/6c933f61-d6da-4f8e-8a44-bf0323eb8ad6",
  "service_code":"ABCDEXAMPLEONLINE",
}
const payloadStr = JSON.stringify(payloadObj);
  // Create object of the Encryption class  
  let encryption = new checkoutEncrypt.Encryption(IVKey, secretKey, algorithm);
  // Encrypt the payload
   // call encrypt method
 var result = encryption.encrypt(payloadStr);

 // print the result
 console.log(result);
});
// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
