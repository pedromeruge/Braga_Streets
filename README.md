# 🏙️ Braga Streets — Full-Stack Web Application

## 🎯 Project Results

#### Street Details Page

https://github.com/pedromeruge/ProjetoEW/assets/87565693/2465b94f-cc55-4f6c-850d-5892d6f552d5

#### Register/Login Page

https://github.com/pedromeruge/ProjetoEW/assets/87565693/7a984b73-f47f-4e60-b1a2-9db0d51aa19b

### Creating and Editing Streets

https://github.com/pedromeruge/ProjetoEW/assets/87565693/820c5d61-37a6-493f-b38f-35b82444b486

https://github.com/pedromeruge/ProjetoEW/assets/87565693/928b25c8-02a7-46af-aa10-6ec963cbfa6d

#### Import and Export Streets Data

https://github.com/pedromeruge/ProjetoEW/assets/87565693/972265ba-d509-4f0f-9696-6738f94eaf78


#### Comments

https://github.com/pedromeruge/ProjetoEW/assets/87565693/738f1713-d0f1-42df-bbe9-e5a948f35fb2

#### Documents
Project report (in portuguese): available [here](repo_description/report.md)

---

## 📖 Overview

This project implements a **full-stack web application for managing and exploring historical and geographical information about the streets of Braga**. The application was built around a provided dataset containing street descriptions, historical information and images, which was processed and imported into a MongoDB database.

Users can browse and search streets, view their historical information and locations, create and edit street records, and interact through comments and favourites. The application also includes **authentication and role-based access control**, with additional management permissions for administrators.

The system consists of an **Express.js REST API**, a **MongoDB database accessed through Mongoose**, and a server-rendered frontend using **Pug, JavaScript, Axios and jQuery**. Mapbox is integrated for geographical visualization and geocoding, and the application can be deployed using Docker.

---

## 🛠️ Setup

### Prerequisites

The project requires:

- **Node.js**
- **MongoDB**
- **Docker** (for containerized deployment)

Install the project dependencies from the project root:

```bash
npm install
```

### Database Setup

The provided dataset must first be processed and imported into MongoDB.

The project includes a Docker-based setup that initializes the database from the provided data:

```bash
sudo ./docker_setup.sh
```

This prepares the MongoDB database and populates it with the project's street data and associated information.

Once the database has been initialized, the application services can be started with:

```bash
sudo ./docker_servico.sh
```

The Docker configuration handles the communication between the application and MongoDB services.

---

## 🚀 Running the Application

After completing the setup, the web application can be accessed through the frontend service started by Docker.

The application communicates with the backend through its REST API. The API is responsible for authentication, data retrieval and modification, while the frontend handles the presentation and user interaction.

For development, the backend and frontend can also be run directly from the project source according to the configuration provided in the repository.

---

## 🏗️ Implementation details

### Backend & Database

The backend is implemented as a **REST API using Express.js**. It provides endpoints for the application's main resources, including streets, users, dates, places, entities and comments.

**Mongoose** is used as the MongoDB object-data modelling layer, providing the schemas and database operations used by the API.

The API supports the complete lifecycle of street data:

```text
GET     Retrieve streets and related information
POST    Create new records
PUT     Edit existing records
DELETE  Remove records
```

Authentication is implemented using **Passport and JSON Web Tokens (JWT)**. API endpoints use the authenticated user's role and ownership information to control access to operations, distinguishing between regular users and administrators.

The database is organized into separate collections for the main entities of the application, allowing street records to reference associated dates, places, entities, images and user-generated content.

### Frontend

The frontend is implemented using **JavaScript with Pug templates**. **Axios** is used to communicate with the REST API, while **jQuery** handles dynamic UI manipulation and user interactions.

The application provides pages for:

- Browsing and searching streets based on street names, associated places, dates and entities.
- Viewing detailed street information and historical images.
- Creating and editing street records.
- Displaying street locations through Mapbox.
- Managing comments, replies and favourites.
- Managing user accounts and administrator functionality.
- Importing and exporting all street data in a `.tar.gz` archive format.

### Mapbox Integration

**Mapbox** is used for both geographical visualization and geocoding.

When creating or editing a street, its geographical information can be obtained through the Mapbox API. The resulting coordinates are stored with the street data and used to display its location interactively.

### Docker

The complete application is containerized to simplify deployment and ensure that the required services can be started consistently.

The Docker configuration connects the application services to the MongoDB database while exposing the web application to the user.

--- 
## 👥 Authors

- Diogo Alexandre Correia Marques (a100897@uminho.pt)
- Ivan Sérgio Rocha Ribeiro (a100538@uminho.pt)
- Pedro Ferreira (a100709@uminho.pt)

Web Engineering Project — University of Minho, 2024/2025

