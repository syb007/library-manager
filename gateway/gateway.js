const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PROTO_PATH = __dirname + '/../proto/library.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const library_proto = grpc.loadPackageDefinition(packageDefinition).library;

const client = new library_proto.Library('backend:50051', grpc.credentials.createInsecure());

// Book endpoints
app.post('/books', (req, res) => {
    client.createBook(req.body, (error, response) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(response);
        }
    });
});

app.get('/books/:id', (req, res) => {
    client.getBook({ id: req.params.id }, (error, response) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(response);
        }
    });
});

app.get('/books', (req, res) => {
    client.listBooks({}, (error, response) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(response);
        }
    });
});

// Member endpoints
app.post('/members', (req, res) => {
    client.createMember(req.body, (error, response) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(response);
        }
    });
});

// Borrowing endpoints
app.post('/borrow', (req, res) => {
    client.borrowBook(req.body, (error, response) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(response);
        }
    });
});

app.post('/return', (req, res) => {
    client.returnBook(req.body, (error, response) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(response);
        }
    });
});

app.get('/borrowed-books/:member_id', (req, res) => {
    client.listBorrowedBooks({ member_id: req.params.member_id }, (error, response) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(response);
        }
    });
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`API Gateway listening on port ${port}`);
});
