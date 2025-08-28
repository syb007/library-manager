import os
import psycopg2
import time
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
load_dotenv()

def get_db_connection():
    """Establishes a connection to the database with retries."""
    retries = 5
    while retries > 0:
        try:
            conn = psycopg2.connect(
                dbname=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                host=os.getenv("DB_HOST"),
                port=os.getenv("DB_PORT")
            )
            logging.info("Database connection successful.")
            return conn
        except psycopg2.OperationalError as e:
            logging.warning(f"Database connection failed: {e}. Retrying in 5 seconds...")
            retries -= 1
            time.sleep(5)
    logging.error("Could not connect to the database after several retries. Exiting.")
    raise Exception("Database connection failed")

def get_current_version(cursor):
    """Gets the current schema version from the database."""
    try:
        cursor.execute("SELECT version FROM schema_version")
        version = cursor.fetchone()[0]
        logging.info(f"Current database version is: {version}")
        return version
    except (psycopg2.errors.UndefinedTable, TypeError):
        logging.info("schema_version table not found or empty. Assuming version 0.")
        return 0

def set_current_version(cursor, version):
    """Sets the current schema version in the database."""
    cursor.execute("UPDATE schema_version SET version = %s", (version,))
    logging.info(f"Database version updated to: {version}")

def run_migrations():
    """Runs the database migrations."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Create schema_version table if it doesn't exist
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS schema_version (
                    version INT NOT NULL
                )
            """)
            cursor.execute("SELECT COUNT(*) FROM schema_version")
            if cursor.fetchone()[0] == 0:
                cursor.execute("INSERT INTO schema_version (version) VALUES (0)")

            conn.commit()

            current_version = get_current_version(cursor)

            migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
            migration_files = sorted(os.listdir(migrations_dir))

            for filename in migration_files:
                try:
                    version = int(filename.split('_')[0])
                except ValueError:
                    logging.warning(f"Could not parse version from filename: {filename}. Skipping.")
                    continue

                if version > current_version:
                    logging.info(f"Applying migration: {filename}")
                    with open(os.path.join(migrations_dir, filename), 'r') as f:
                        sql_script = f.read()
                        cursor.execute(sql_script)

                    set_current_version(cursor, version)
                    conn.commit()
                    logging.info(f"Successfully applied migration: {filename}")
    except Exception as e:
        logging.error(f"An error occurred during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    run_migrations()
    logging.info("Database migration process finished.")
