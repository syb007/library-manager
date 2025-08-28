import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import BookList from './components/BookList';
import AddBook from './components/AddBook';
import BorrowBook from './components/BorrowBook';
import MemberList from './components/MemberList';
import { AppBar, Toolbar, Typography, Button, Container, CssBaseline } from '@mui/material';

function App() {
    return (
        <Router>
            <CssBaseline />
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Neighborhood Library
                    </Typography>
                    <Button color="inherit" component={Link} to="/">Book List</Button>
                    <Button color="inherit" component={Link} to="/add-book">Add Book</Button>
                    <Button color="inherit" component={Link} to="/members">Members</Button>
                    <Button color="inherit" component={Link} to="/borrow-book">Borrow/Return</Button>
                </Toolbar>
            </AppBar>
            <Container component="main" sx={{ mt: 4, mb: 4 }}>
                <Routes>
                    <Route path="/" element={<BookList />} />
                    <Route path="/add-book" element={<AddBook />} />
                    <Route path="/borrow-book" element={<BorrowBook />} />
                    <Route path="/members" element={<MemberList />} />
                </Routes>
            </Container>
        </Router>
    );
}

export default App;
