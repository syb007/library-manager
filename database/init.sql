CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(255) UNIQUE NOT NULL,
  published_year INT,
  quantity INT NOT NULL DEFAULT 1,
  quantity_available INT NOT NULL DEFAULT 1
);

CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(255)
);

CREATE TABLE borrowings (
  id SERIAL PRIMARY KEY,
  book_id INT REFERENCES books(id),
  member_id INT REFERENCES members(id),
  borrow_date TIMESTAMP NOT NULL,
  return_date TIMESTAMP,
  due_date TIMESTAMP
);
