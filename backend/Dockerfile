# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the dependencies file to the working directory
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application's code to the working directory
COPY . .

# Copy the entrypoint script and fix line endings
COPY entrypoint.sh .
RUN sed -i 's/\r$//' ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Make port 50051 available to the world outside this container
EXPOSE 50051

# Run the entrypoint script when the container launches
ENTRYPOINT ["./entrypoint.sh"]
