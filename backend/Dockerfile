FROM python:3.9-slim
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy proto files
COPY proto/ /app/proto/

# Generate python code from proto definitions
RUN python -m grpc_tools.protoc -I./proto --python_out=. --grpc_python_out=. ./proto/library.proto

# Copy the rest of the backend application's code
COPY backend/ .

# Make port 50051 available to the world outside this container
EXPOSE 50051

# Run the entrypoint script when the container launches
ENTRYPOINT ["./entrypoint.sh"]
