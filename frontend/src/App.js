import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookList from './components/BookList';
import AddBook from './components/AddBook';
import BorrowBook from './components/BorrowBook';
import './App.css';

function App() {
    return (
        <Router>
            <div className="App">
                <nav>
                    <ul>
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        <li>
                            <Link to="/add-book">Add Book</Link>
                        </li>
                        <li>
                            <Link to="/borrow-book">Borrow/Return</Link>
                        </li>
                    </ul>
                </nav>

                <Routes>
                    <Route path="/" element={<BookList />} />
                    <Route path="/add-book" element={<AddBook />} />
                    <Route path="/borrow-book" element={<BorrowBook />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
