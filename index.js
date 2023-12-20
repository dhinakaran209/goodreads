const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

//checking User details
app.post("/users/", async (request, response) => {
  const { username, password, name, gender, location } = request.body;
  const hashedPass = bcrypt.hash(password, 10);
  const getQuery = `SELECT  * FROM user WHERE username = '${username}'`;
  const dbGet = await db.get(getQuery);
  if (dbGet === undefined) {
    const insertQuery = `INSERT INTO user(username,password,name,gender,location) 
        VALUES(
            '${username}',
            '${hashedPass}',
            '${name}',
            '${gender}',
            '${location}'
        )`;
    await db.run(insertQuery);
    response.send("User Added Successfully");
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(checkUserQuery);
  if (dbUser === undefined) {
    response.send("Wrong Username");
  } else {
    const correctPass = await bcrypt.compare(password, dbUser.password);
    if (correctPass === true) {
      response.send("Login Success");
    } else {
      response.status(400);
      response.send("Invalid User");
    }
  }
});
