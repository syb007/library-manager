import grpc
from concurrent import futures
import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
import library_pb2
import library_pb2_grpc
from google.protobuf.timestamp_pb2 import Timestamp

load_dotenv()

# Database connection pool
db_pool = psycopg2.pool.SimpleConnectionPool(
    1, 10,
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT")
)

class LibraryServicer(library_pb2_grpc.LibraryServicer):
    def get_db_connection(self):
        return db_pool.getconn()

    def release_db_connection(self, conn):
        db_pool.putconn(conn)

    def CreateBook(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO books (title, author, isbn, published_year) VALUES (%s, %s, %s, %s) RETURNING id",
                    (request.title, request.author, request.isbn, request.published_year)
                )
                book_id = cursor.fetchone()[0]
                conn.commit()
                return library_pb2.Book(id=str(book_id), title=request.title, author=request.author, isbn=request.isbn, published_year=request.published_year)
        finally:
            self.release_db_connection(conn)

    def GetBook(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, title, author, isbn, published_year FROM books WHERE id = %s", (request.id,))
                book = cursor.fetchone()
                if book:
                    return library_pb2.Book(id=str(book[0]), title=book[1], author=book[2], isbn=book[3], published_year=book[4])
                else:
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Book not found")
                    return library_pb2.Book()
        finally:
            self.release_db_connection(conn)

    def ListBooks(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, title, author, isbn, published_year FROM books")
                books = cursor.fetchall()
                book_list = []
                for book in books:
                    book_list.append(library_pb2.Book(id=str(book[0]), title=book[1], author=book[2], isbn=book[3], published_year=book[4]))
                return library_pb2.ListBooksResponse(books=book_list)
        finally:
            self.release_db_connection(conn)

    def CreateMember(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO members (name, email, phone) VALUES (%s, %s, %s) RETURNING id",
                    (request.name, request.email, request.phone)
                )
                member_id = cursor.fetchone()[0]
                conn.commit()
                return library_pb2.Member(id=str(member_id), name=request.name, email=request.email, phone=request.phone)
        finally:
            self.release_db_connection(conn)

    def GetMember(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name, email, phone FROM members WHERE id = %s", (request.id,))
                member = cursor.fetchone()
                if member:
                    return library_pb2.Member(id=str(member[0]), name=member[1], email=member[2], phone=member[3])
                else:
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Member not found")
                    return library_pb2.Member()
        finally:
            self.release_db_connection(conn)

    def ListMembers(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name, email, phone FROM members")
                members = cursor.fetchall()
                member_list = []
                for member in members:
                    member_list.append(library_pb2.Member(id=str(member[0]), name=member[1], email=member[2], phone=member[3]))
                return library_pb2.ListMembersResponse(members=member_list)
        finally:
            self.release_db_connection(conn)

    def UpdateMember(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE members SET name = %s, email = %s, phone = %s WHERE id = %s",
                    (request.name, request.email, request.phone, request.id)
                )
                conn.commit()
                return library_pb2.Member(id=request.id, name=request.name, email=request.email, phone=request.phone)
        finally:
            self.release_db_connection(conn)

    def DeleteMember(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM members WHERE id = %s", (request.id,))
                conn.commit()
                return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()
        finally:
            self.release_db_connection(conn)

    def BorrowBook(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Check if the book is available
                cursor.execute("SELECT available FROM books WHERE id = %s", (request.book_id,))
                result = cursor.fetchone()
                if not result or not result[0]:
                    context.set_code(grpc.StatusCode.FAILED_PRECONDITION)
                    context.set_details("Book is not available for borrowing")
                    return library_pb2.Borrowing()

                # Record the borrowing
                borrow_date = Timestamp()
                borrow_date.GetCurrentTime()
                cursor.execute(
                    "INSERT INTO borrowings (book_id, member_id, borrow_date) VALUES (%s, %s, %s) RETURNING id",
                    (request.book_id, request.member_id, borrow_date.ToDatetime())
                )
                borrowing_id = cursor.fetchone()[0]

                # Mark the book as unavailable
                cursor.execute("UPDATE books SET available = FALSE WHERE id = %s", (request.book_id,))

                conn.commit()

                return library_pb2.Borrowing(id=str(borrowing_id), book_id=request.book_id, member_id=request.member_id, borrow_date=borrow_date)
        finally:
            self.release_db_connection(conn)

    def ReturnBook(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Find the active borrowing record
                cursor.execute(
                    "SELECT id FROM borrowings WHERE book_id = %s AND member_id = %s AND return_date IS NULL",
                    (request.book_id, request.member_id)
                )
                borrowing_id = cursor.fetchone()
                if not borrowing_id:
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("No active borrowing record found for this book and member")
                    return library_pb2.Borrowing()

                borrowing_id = borrowing_id[0]

                # Update the return date
                return_date = Timestamp()
                return_date.GetCurrentTime()
                cursor.execute(
                    "UPDATE borrowings SET return_date = %s WHERE id = %s",
                    (return_date.ToDatetime(), borrowing_id)
                )

                # Mark the book as available
                cursor.execute("UPDATE books SET available = TRUE WHERE id = %s", (request.book_id,))

                conn.commit()

                # Get the updated borrowing record
                cursor.execute("SELECT book_id, member_id, borrow_date, return_date FROM borrowings WHERE id = %s", (borrowing_id,))
                record = cursor.fetchone()

                borrow_timestamp = Timestamp()
                borrow_timestamp.FromDatetime(record[2])
                return_timestamp = Timestamp()
                return_timestamp.FromDatetime(record[3])


                return library_pb2.Borrowing(
                    id=str(borrowing_id),
                    book_id=str(record[0]),
                    member_id=str(record[1]),
                    borrow_date=borrow_timestamp,
                    return_date=return_timestamp
                )
        finally:
            self.release_db_connection(conn)

    def ListBorrowedBooks(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, book_id, member_id, borrow_date, return_date FROM borrowings WHERE member_id = %s",
                    (request.member_id,)
                )
                borrowings = cursor.fetchall()
                borrowing_list = []
                for borrowing in borrowings:
                    borrow_date = Timestamp()
                    borrow_date.FromDatetime(borrowing[3])
                    return_date = Timestamp()
                    if borrowing[4]:
                        return_date.FromDatetime(borrowing[4])
                    else:
                        return_date = None

                    borrowing_list.append(library_pb2.Borrowing(
                        id=str(borrowing[0]),
                        book_id=str(borrowing[1]),
                        member_id=str(borrowing[2]),
                        borrow_date=borrow_date,
                        return_date=return_date
                    ))
                return library_pb2.ListBorrowedBooksResponse(borrowings=borrowing_list)
        finally:
            self.release_db_connection(conn)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    library_pb2_grpc.add_LibraryServicer_to_server(LibraryServicer(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    print("Server started on port 50051")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
