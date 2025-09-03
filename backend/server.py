import grpc
from concurrent import futures
import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
import library_pb2
import library_pb2_grpc
from google.protobuf.timestamp_pb2 import Timestamp
from datetime import datetime, timedelta
import logging
import re
import uuid

# --- Setup Logging ---
# In a real app, this would be more complex, e.g., using a library like structlog
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [%(request_id)s] - %(message)s'
)
logger = logging.getLogger(__name__)

# --- Setup Validation ---
EMAIL_REGEX = re.compile(r'[^@]+@[^@]+\.[^@]+')

def is_valid_email(email):
    """Checks if the provided string is a valid email format."""
    return EMAIL_REGEX.match(email)

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

    # --- Book RPCs ---
    def CreateBook(self, request, context):
        """
        Creates a new book record in the database.
        Args:
            request: The CreateBookRequest message.
            context: The gRPC request context.
        Returns:
            The newly created Book message.
        """
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}

        logger.info(f"CreateBook request received: {request.title}", extra=log_extra)

        # Validation
        if not all([request.title, request.author, request.isbn]):
            logger.warning("CreateBook validation failed: missing required fields.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Fields 'title', 'author', and 'isbn' are required.")
            return library_pb2.Book()

        quantity = request.quantity if request.quantity > 0 else 1

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO books (title, author, isbn, published_year, quantity, quantity_available) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                    (request.title, request.author, request.isbn, request.published_year, quantity, quantity)
                )
                book_id = cursor.fetchone()[0]
                conn.commit()

                new_book = library_pb2.Book(
                    id=str(book_id),
                    title=request.title,
                    author=request.author,
                    isbn=request.isbn,
                    published_year=request.published_year,
                    quantity=quantity,
                    quantity_available=quantity
                )
                logger.info(f"Successfully created book with ID {book_id}", extra=log_extra)
                return new_book
        except psycopg2.Error as e:
            logger.error(f"Database error in CreateBook: {e}", extra=log_extra)
            conn.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.Book()
        except Exception as e:
            logger.error(f"Unexpected error in CreateBook: {e}", extra=log_extra)
            conn.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"An unexpected error occurred.")
            return library_pb2.Book()
        finally:
            self.release_db_connection(conn)

    def GetBook(self, request, context):
        """
        Retrieves a single book record from the database by its ID.
        Args:
            request: The GetBookRequest message, containing the book ID.
            context: The gRPC request context.
        Returns:
            The requested Book message, or an empty message if not found.
        """
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}

        logger.info(f"GetBook request received for ID: {request.id}", extra=log_extra)

        # Validation
        try:
            book_id = int(request.id)
        except ValueError:
            logger.warning(f"GetBook validation failed: invalid ID format '{request.id}'.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Book ID must be a valid integer.")
            return library_pb2.Book()

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, title, author, isbn, published_year, quantity, quantity_available FROM books WHERE id = %s", (book_id,))
                book_data = cursor.fetchone()
                if book_data:
                    book_pb = library_pb2.Book(
                        id=str(book_data[0]),
                        title=book_data[1],
                        author=book_data[2],
                        isbn=book_data[3],
                        published_year=book_data[4],
                        quantity=book_data[5],
                        quantity_available=book_data[6]
                    )
                    logger.info(f"Successfully retrieved book with ID {book_id}", extra=log_extra)
                    return book_pb
                else:
                    logger.warning(f"Book with ID {book_id} not found.", extra=log_extra)
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Book not found")
                    return library_pb2.Book()
        except psycopg2.Error as e:
            logger.error(f"Database error in GetBook: {e}", extra=log_extra)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.Book()
        finally:
            self.release_db_connection(conn)

    def ListBooks(self, request, context):
        """
        Retrieves a list of all books from the database.
        Args:
            request: The ListBooksRequest message.
            context: The gRPC request context.
        Returns:
            A ListBooksResponse message containing a list of all books.
        """
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}

        logger.info("ListBooks request received", extra=log_extra)

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, title, author, isbn, published_year, quantity, quantity_available FROM books")
                books = cursor.fetchall()
                book_list = []
                for book in books:
                    book_list.append(library_pb2.Book(
                        id=str(book[0]),
                        title=book[1],
                        author=book[2],
                        isbn=book[3],
                        published_year=book[4],
                        quantity=book[5],
                        quantity_available=book[6]
                    ))

                logger.info(f"ListBooks request successful, returned {len(book_list)} books.", extra=log_extra)
                return library_pb2.ListBooksResponse(books=book_list)
        except psycopg2.Error as e:
            logger.error(f"Database error in ListBooks: {e}", extra=log_extra)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.ListBooksResponse()
        finally:
            self.release_db_connection(conn)

    def UpdateBook(self, request, context):
        """Updates an existing book's metadata."""
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}
        logger.info(f"UpdateBook request received for ID: {request.id}", extra=log_extra)

        # Validation
        if not all([request.id, request.title, request.author, request.isbn]):
            logger.warning("UpdateBook validation failed: missing required fields.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Fields 'id', 'title', 'author', and 'isbn' are required.")
            return library_pb2.Book()

        try:
            book_id = int(request.id)
        except ValueError:
            logger.warning(f"UpdateBook validation failed: invalid ID format '{request.id}'.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Book ID must be a valid integer.")
            return library_pb2.Book()

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE books SET title = %s, author = %s, isbn = %s, published_year = %s WHERE id = %s",
                    (request.title, request.author, request.isbn, request.published_year, book_id)
                )
                if cursor.rowcount == 0:
                    logger.warning(f"UpdateBook failed: book with ID {book_id} not found.", extra=log_extra)
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Book not found")
                    conn.rollback()
                    return library_pb2.Book()

                conn.commit()

                cursor.execute("SELECT id, title, author, isbn, published_year, quantity, quantity_available FROM books WHERE id = %s", (book_id,))
                book = cursor.fetchone()
                logger.info(f"Successfully updated book with ID {book_id}", extra=log_extra)
                return library_pb2.Book(id=str(book[0]), title=book[1], author=book[2], isbn=book[3], published_year=book[4], quantity=book[5], quantity_available=book[6])
        except psycopg2.Error as e:
            logger.error(f"Database error in UpdateBook: {e}", extra=log_extra)
            conn.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.Book()
        finally:
            self.release_db_connection(conn)

    def AdjustBookQuantity(self, request, context):
        """Adjusts the total quantity of a book and recalculates availability."""
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}
        logger.info(f"AdjustBookQuantity request for book ID: {request.book_id} to new quantity: {request.new_quantity}", extra=log_extra)

        # Validation
        try:
            book_id = int(request.book_id)
            if request.new_quantity < 0:
                raise ValueError("Quantity cannot be negative.")
        except (ValueError, TypeError):
            logger.warning("AdjustBookQuantity validation failed: invalid ID or quantity.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Invalid book ID or quantity format.")
            return library_pb2.Book()

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT quantity, quantity_available FROM books WHERE id = %s FOR UPDATE", (book_id,))
                book_quantities = cursor.fetchone()
                if not book_quantities:
                    logger.warning(f"AdjustBookQuantity failed: book with ID {book_id} not found.", extra=log_extra)
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Book not found")
                    return library_pb2.Book()

                old_quantity, old_quantity_available = book_quantities
                on_loan = old_quantity - old_quantity_available

                if request.new_quantity < on_loan:
                    logger.warning(f"AdjustBookQuantity validation failed for book ID {book_id}", extra=log_extra)
                    context.set_code(grpc.StatusCode.FAILED_PRECONDITION)
                    context.set_details(f"New quantity ({request.new_quantity}) cannot be less than the number of books currently on loan ({on_loan}).")
                    return library_pb2.Book()

                new_quantity_available = request.new_quantity - on_loan

                cursor.execute(
                    "UPDATE books SET quantity = %s, quantity_available = %s WHERE id = %s",
                    (request.new_quantity, new_quantity_available, book_id)
                )

                cursor.execute("SELECT id, title, author, isbn, published_year, quantity, quantity_available FROM books WHERE id = %s", (book_id,))
                book = cursor.fetchone()
                conn.commit()

                logger.info(f"Successfully adjusted quantity for book ID {book_id}", extra=log_extra)
                return library_pb2.Book(id=str(book[0]), title=book[1], author=book[2], isbn=book[3], published_year=book[4], quantity=book[5], quantity_available=book[6])
        except psycopg2.Error as e:
            logger.error(f"Database error in AdjustBookQuantity: {e}", extra=log_extra)
            conn.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.Book()
        finally:
            self.release_db_connection(conn)

    def DeleteBook(self, request, context):
        """Deletes a book, preventing deletion if any copies are on loan."""
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}
        logger.info(f"DeleteBook request received for ID: {request.id}", extra=log_extra)

        try:
            book_id = int(request.id)
        except ValueError:
            logger.warning(f"DeleteBook validation failed: invalid ID format '{request.id}'.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Book ID must be a valid integer.")
            return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT quantity, quantity_available FROM books WHERE id = %s FOR UPDATE", (book_id,))
                book_quantities = cursor.fetchone()
                if not book_quantities:
                    logger.warning(f"DeleteBook failed: book with ID {book_id} not found.", extra=log_extra)
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Book not found")
                    return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()

                if book_quantities[0] != book_quantities[1]:
                    logger.warning(f"DeleteBook failed: book ID {book_id} has copies on loan.", extra=log_extra)
                    context.set_code(grpc.StatusCode.FAILED_PRECONDITION)
                    context.set_details("Cannot delete book: one or more copies are currently on loan.")
                    return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()

                cursor.execute("DELETE FROM borrowings WHERE book_id = %s", (book_id,))
                cursor.execute("DELETE FROM books WHERE id = %s", (book_id,))
                conn.commit()
                logger.info(f"Successfully deleted book with ID {book_id}", extra=log_extra)
                return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()
        except psycopg2.Error as e:
            logger.error(f"Database error in DeleteBook: {e}", extra=log_extra)
            conn.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()
        finally:
            self.release_db_connection(conn)

    # --- Member RPCs ---
    def CreateMember(self, request, context):
        """Creates a new member."""
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}
        logger.info(f"CreateMember request received for: {request.name}", extra=log_extra)

        # Validation
        if not all([request.name, request.email]):
            logger.warning("CreateMember validation failed: missing name or email.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Fields 'name' and 'email' are required.")
            return library_pb2.Member()

        if not is_valid_email(request.email):
            logger.warning(f"CreateMember validation failed: invalid email format '{request.email}'.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Invalid email format.")
            return library_pb2.Member()

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO members (name, email, phone) VALUES (%s, %s, %s) RETURNING id",
                    (request.name, request.email, request.phone)
                )
                member_id = cursor.fetchone()[0]
                conn.commit()
                new_member = library_pb2.Member(id=str(member_id), name=request.name, email=request.email, phone=request.phone)
                logger.info(f"Successfully created member with ID {member_id}", extra=log_extra)
                return new_member
        except psycopg2.IntegrityError as e:
            logger.error(f"Database integrity error in CreateMember: {e}", extra=log_extra)
            conn.rollback()
            context.set_code(grpc.StatusCode.ALREADY_EXISTS)
            context.set_details("A member with this email already exists.")
            return library_pb2.Member()
        except psycopg2.Error as e:
            logger.error(f"Database error in CreateMember: {e}", extra=log_extra)
            conn.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.Member()
        finally:
            self.release_db_connection(conn)

    def GetMember(self, request, context):
        """Retrieves a single member by their ID."""
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}
        logger.info(f"GetMember request received for ID: {request.id}", extra=log_extra)

        try:
            member_id = int(request.id)
        except ValueError:
            logger.warning(f"GetMember validation failed: invalid ID format '{request.id}'.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Member ID must be a valid integer.")
            return library_pb2.Member()

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name, email, phone FROM members WHERE id = %s", (member_id,))
                member = cursor.fetchone()
                if member:
                    logger.info(f"Successfully retrieved member with ID {member_id}", extra=log_extra)
                    return library_pb2.Member(id=str(member[0]), name=member[1], email=member[2], phone=member[3])
                else:
                    logger.warning(f"Member with ID {member_id} not found.", extra=log_extra)
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Member not found")
                    return library_pb2.Member()
        except psycopg2.Error as e:
            logger.error(f"Database error in GetMember: {e}", extra=log_extra)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.Member()
        finally:
            self.release_db_connection(conn)

    def ListMembers(self, request, context):
        """Retrieves a list of all members."""
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}
        logger.info("ListMembers request received", extra=log_extra)

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name, email, phone FROM members")
                members = cursor.fetchall()
                member_list = []
                for member in members:
                    member_list.append(library_pb2.Member(id=str(member[0]), name=member[1], email=member[2], phone=member[3]))
                logger.info(f"ListMembers request successful, returned {len(member_list)} members.", extra=log_extra)
                return library_pb2.ListMembersResponse(members=member_list)
        except psycopg2.Error as e:
            logger.error(f"Database error in ListMembers: {e}", extra=log_extra)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.ListMembersResponse()
        finally:
            self.release_db_connection(conn)

    def UpdateMember(self, request, context):
        """Updates an existing member's details."""
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}
        logger.info(f"UpdateMember request received for ID: {request.id}", extra=log_extra)

        # Validation
        if not all([request.id, request.name, request.email]):
            logger.warning("UpdateMember validation failed: missing required fields.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Fields 'id', 'name', and 'email' are required.")
            return library_pb2.Member()
        if not is_valid_email(request.email):
            logger.warning(f"UpdateMember validation failed: invalid email format '{request.email}'.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Invalid email format.")
            return library_pb2.Member()
        try:
            member_id = int(request.id)
        except ValueError:
            logger.warning(f"UpdateMember validation failed: invalid ID format '{request.id}'.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Member ID must be a valid integer.")
            return library_pb2.Member()

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "UPDATE members SET name = %s, email = %s, phone = %s WHERE id = %s",
                    (request.name, request.email, request.phone, member_id)
                )
                if cursor.rowcount == 0:
                    logger.warning(f"UpdateMember failed: member with ID {member_id} not found.", extra=log_extra)
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Member not found")
                    conn.rollback()
                    return library_pb2.Member()

                conn.commit()
                logger.info(f"Successfully updated member with ID {member_id}", extra=log_extra)
                return library_pb2.Member(id=request.id, name=request.name, email=request.email, phone=request.phone)
        except psycopg2.IntegrityError as e:
            logger.error(f"Database integrity error in UpdateMember: {e}", extra=log_extra)
            conn.rollback()
            context.set_code(grpc.StatusCode.ALREADY_EXISTS)
            context.set_details("Another member with this email already exists.")
            return library_pb2.Member()
        except psycopg2.Error as e:
            logger.error(f"Database error in UpdateMember: {e}", extra=log_extra)
            conn.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.Member()
        finally:
            self.release_db_connection(conn)

    def DeleteMember(self, request, context):
        """Deletes a member, preventing deletion if they have active borrowings."""
        request_id = str(uuid.uuid4())
        log_extra = {'request_id': request_id}
        logger.info(f"DeleteMember request received for ID: {request.id}", extra=log_extra)

        try:
            member_id = int(request.id)
        except ValueError:
            logger.warning(f"DeleteMember validation failed: invalid ID format '{request.id}'.", extra=log_extra)
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details("Member ID must be a valid integer.")
            return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()

        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1 FROM borrowings WHERE member_id = %s AND return_date IS NULL", (member_id,))
                if cursor.fetchone():
                    logger.warning(f"DeleteMember failed: member ID {member_id} has active borrowings.", extra=log_extra)
                    context.set_code(grpc.StatusCode.FAILED_PRECONDITION)
                    context.set_details("Cannot delete member: this member has one or more books currently on loan.")
                    return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()

                # If no active borrowings, we can delete the member.
                # We also need to delete their borrowing history.
                cursor.execute("DELETE FROM borrowings WHERE member_id = %s", (member_id,))
                cursor.execute("DELETE FROM members WHERE id = %s", (member_id,))

                if cursor.rowcount == 0:
                     logger.warning(f"DeleteMember failed: member with ID {member_id} not found.", extra=log_extra)
                     context.set_code(grpc.StatusCode.NOT_FOUND)
                     context.set_details("Member not found")
                     conn.rollback()
                     return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()

                conn.commit()
                logger.info(f"Successfully deleted member with ID {member_id}", extra=log_extra)
                return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()
        except psycopg2.Error as e:
            logger.error(f"Database error in DeleteMember: {e}", extra=log_extra)
            conn.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"Database error: {e}")
            return library_pb2.google_dot_protobuf_dot_empty__pb2.Empty()
        finally:
            self.release_db_connection(conn)

    # --- Borrowing RPCs ---
    def BorrowBook(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Check if member exists
                cursor.execute("SELECT id FROM members WHERE id = %s", (request.member_id,))
                if not cursor.fetchone():
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Member not found.")
                    return library_pb2.Borrowing()

                # Check if book exists and is available, and lock the row
                cursor.execute("SELECT quantity_available FROM books WHERE id = %s FOR UPDATE", (request.book_id,))
                result = cursor.fetchone()
                if not result:
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Book not found.")
                    return library_pb2.Borrowing()

                if result[0] < 1:
                    context.set_code(grpc.StatusCode.FAILED_PRECONDITION)
                    context.set_details("No copies of the book are available for borrowing.")
                    return library_pb2.Borrowing()

                # Decrement available quantity
                cursor.execute("UPDATE books SET quantity_available = quantity_available - 1 WHERE id = %s", (request.book_id,))

                # Record the borrowing
                borrow_date = datetime.now()
                due_date = borrow_date + timedelta(days=14)

                borrow_date_ts = Timestamp()
                borrow_date_ts.FromDatetime(borrow_date)
                due_date_ts = Timestamp()
                due_date_ts.FromDatetime(due_date)

                cursor.execute(
                    "INSERT INTO borrowings (book_id, member_id, borrow_date, due_date) VALUES (%s, %s, %s, %s) RETURNING id",
                    (request.book_id, request.member_id, borrow_date, due_date)
                )
                borrowing_id = cursor.fetchone()[0]

                conn.commit()

                return library_pb2.Borrowing(
                    id=str(borrowing_id),
                    book_id=request.book_id,
                    member_id=request.member_id,
                    borrow_date=borrow_date_ts,
                    due_date=due_date_ts
                )
        except Exception as e:
            conn.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"An error occurred: {e}")
            return library_pb2.Borrowing()
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
                borrowing_record = cursor.fetchone()
                if not borrowing_record:
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("No active borrowing record found for this book and member.")
                    return library_pb2.Borrowing()

                borrowing_id = borrowing_record[0]

                # Update the return date
                return_date = datetime.now()
                cursor.execute(
                    "UPDATE borrowings SET return_date = %s WHERE id = %s",
                    (return_date, borrowing_id)
                )

                # Increment available quantity
                cursor.execute("UPDATE books SET quantity_available = quantity_available + 1 WHERE id = %s", (request.book_id,))

                conn.commit()

                # Get the updated borrowing record to return
                cursor.execute("SELECT book_id, member_id, borrow_date, return_date, due_date FROM borrowings WHERE id = %s", (borrowing_id,))
                record = cursor.fetchone()

                borrow_date_ts = Timestamp()
                borrow_date_ts.FromDatetime(record[2])
                return_date_ts = Timestamp()
                return_date_ts.FromDatetime(record[3])
                due_date_ts = Timestamp()
                due_date_ts.FromDatetime(record[4])

                return library_pb2.Borrowing(
                    id=str(borrowing_id),
                    book_id=str(record[0]),
                    member_id=str(record[1]),
                    borrow_date=borrow_date_ts,
                    return_date=return_date_ts,
                    due_date=due_date_ts
                )
        except Exception as e:
            conn.rollback()
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f"An error occurred: {e}")
            return library_pb2.Borrowing()
        finally:
            self.release_db_connection(conn)

    def ListBorrowedBooks(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT id, book_id, member_id, borrow_date, return_date, due_date FROM borrowings WHERE member_id = %s",
                    (request.member_id,)
                )
                borrowings = cursor.fetchall()
                borrowing_list = []
                for borrowing in borrowings:
                    borrow_date_ts = Timestamp()
                    borrow_date_ts.FromDatetime(borrowing[3])

                    return_date_ts = None
                    if borrowing[4]:
                        return_date_ts = Timestamp()
                        return_date_ts.FromDatetime(borrowing[4])

                    due_date_ts = Timestamp()
                    due_date_ts.FromDatetime(borrowing[5])

                    borrowing_list.append(library_pb2.Borrowing(
                        id=str(borrowing[0]),
                        book_id=str(borrowing[1]),
                        member_id=str(borrowing[2]),
                        borrow_date=borrow_date_ts,
                        return_date=return_date_ts,
                        due_date=due_date_ts
                    ))
                return library_pb2.ListBorrowedBooksResponse(borrowings=borrowing_list)
        finally:
            self.release_db_connection(conn)

    def GetBookDetails(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Get Book
                cursor.execute("SELECT id, title, author, isbn, published_year, quantity, quantity_available FROM books WHERE id = %s", (request.id,))
                book_data = cursor.fetchone()
                if not book_data:
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Book not found")
                    return library_pb2.GetBookDetailsResponse()

                book_pb = library_pb2.Book(id=str(book_data[0]), title=book_data[1], author=book_data[2], isbn=book_data[3], published_year=book_data[4], quantity=book_data[5], quantity_available=book_data[6])

                # Get Active Borrowings
                cursor.execute("""
                    SELECT b.id, b.borrow_date, b.due_date, m.id, m.name
                    FROM borrowings b
                    JOIN members m ON b.member_id = m.id
                    WHERE b.book_id = %s AND b.return_date IS NULL
                """, (request.id,))

                borrowings_list = []
                for row in cursor.fetchall():
                    borrow_date_ts = Timestamp(); borrow_date_ts.FromDatetime(row[1])
                    due_date_ts = Timestamp(); due_date_ts.FromDatetime(row[2])
                    borrowings_list.append(library_pb2.BorrowingDetails(
                        borrowing_id=str(row[0]),
                        borrow_date=borrow_date_ts,
                        due_date=due_date_ts,
                        member_id=str(row[3]),
                        member_name=row[4]
                    ))

                return library_pb2.GetBookDetailsResponse(book=book_pb, active_borrowings=borrowings_list)
        finally:
            self.release_db_connection(conn)

    def GetMemberDetails(self, request, context):
        conn = self.get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Get Member
                cursor.execute("SELECT id, name, email, phone FROM members WHERE id = %s", (request.id,))
                member_data = cursor.fetchone()
                if not member_data:
                    context.set_code(grpc.StatusCode.NOT_FOUND)
                    context.set_details("Member not found")
                    return library_pb2.GetMemberDetailsResponse()

                member_pb = library_pb2.Member(id=str(member_data[0]), name=member_data[1], email=member_data[2], phone=member_data[3])

                # Get Active Borrowings
                cursor.execute("""
                    SELECT b.id, b.borrow_date, b.due_date, bk.id, bk.title
                    FROM borrowings b
                    JOIN books bk ON b.book_id = bk.id
                    WHERE b.member_id = %s AND b.return_date IS NULL
                """, (request.id,))

                borrowings_list = []
                for row in cursor.fetchall():
                    borrow_date_ts = Timestamp(); borrow_date_ts.FromDatetime(row[1])
                    due_date_ts = Timestamp(); due_date_ts.FromDatetime(row[2])
                    borrowings_list.append(library_pb2.BorrowingDetails(
                        borrowing_id=str(row[0]),
                        borrow_date=borrow_date_ts,
                        due_date=due_date_ts,
                        book_id=str(row[3]),
                        book_title=row[4]
                    ))

                return library_pb2.GetMemberDetailsResponse(member=member_pb, active_borrowings=borrowings_list)
        finally:
            self.release_db_connection(conn)


from grpc_reflection.v1alpha import reflection

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    library_pb2_grpc.add_LibraryServicer_to_server(LibraryServicer(), server)

    # Enable server reflection
    SERVICE_NAMES = (
        library_pb2.DESCRIPTOR.services_by_name['Library'].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(SERVICE_NAMES, server)

    server.add_insecure_port('[::]:50051')
    server.start()
    print("Server started on port 50051, with reflection enabled.")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
