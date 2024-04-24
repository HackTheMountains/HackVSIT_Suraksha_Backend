# Backend Service for Image Analysis and Sentiment Detection
This repository contains the backend service for processing images and performing sentiment analysis. The service takes an imageURL, signed from AWS after image upload, along with latitude and longitude coordinates, and processes it through a series of steps before storing the results in a database.

## Functionality
* Image Processing: Receives signed imageURL along with location coordinates (latitude and longitude).
* Queue Management: Pushes the received data into a Redis queue for asynchronous processing.
* Worker Node: Pulls data from the queue and executes image analysis and sentiment detection tasks.
* Model Execution: Runs two models on the image: sentiment analysis and image description generation.
* Database Storage: Stores the results, including sentiment analysis and image description, in the database.
* Multiple Endpoints: Provides various endpoints for different functionalities in the worker node.
## Technology Stack
* Express.js: A minimalist web framework for Node.js, used for building robust APIs.
* Docker: Utilized for containerization, simplifying deployment and ensuring consistency across environments.
* AWS EC2: Hosts Docker containers, providing scalable and reliable infrastructure.
* Redis: Acts as a message broker for queuing tasks and managing job distribution.
* Sentiment Analysis Model: Analyzes the sentiment of textual content extracted from images.
* Image Description Model: Generates textual descriptions of images, providing context and understanding.
* PostgreSQL: A powerful open-source relational database, used for storing processed data efficiently.
