FROM python:3.9-slim
WORKDIR /app

# Copy requirements first for better caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy proto files and generate gRPC code
COPY proto/ /app/proto/
RUN python -m grpc_tools.protoc -I./proto --python_out=. --grpc_python_out=. ./proto/library.proto

# Copy the rest of the backend application's code
COPY backend/ .

# Set up the entrypoint script
RUN sed -i 's/\r$//' ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Make port 50051 available
EXPOSE 50051

# Run the entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
