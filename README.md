
# TaskFlow - Task Manager SPA

A mobile-first Single Page Application (SPA) for task management built with vanilla JavaScript ES6 modules, Node.js/Express backend, and MongoDB database.

## Academic Requirements Met

### CSS Requirements
- 10+ descendant selectors
- 10+ adjacent selectors
- 20+ class selectors
- 20+ ID selectors
- 15+ pseudo-element selectors (::before, ::after)
- 15+ pseudo-class selectors (:hover, :focus, :checked)

### JavaScript Requirements
- ES6 modules architecture (all imports/exports)
- 50+ event handlers (click, input, change, submit, scroll, etc.)
- 3+ ES6 classes with 5+ methods and 4+ attributes each:
  - `ApiService` - HTTP/fetch wrapper
  - `UIController` - UI management
  - `FormValidator` - Form validation
  - `DataManager` - Data state management
- Only 1 global function (DOMContentLoaded)
- Mix of function types: expressions, class methods, arrow functions, anonymous
- 12+ AJAX invocations using fetch API

### Database Requirements
- MongoDB with Mongoose ODM
- Full CRUD operations (Create, Retrieve, Update, Delete)
- Multiple collections: Tasks, Categories, Notes, Users

### Backend Requirements
- Node.js/Express server
- 10+ API routes across 5 route files
- Error handling and validation

### Application Features
- Mobile-first responsive design
- 11 distinct views (Dashboard, Tasks, Task Form, Categories, Category Form, Notes, Note Form, Calendar, Profile, Settings, Help, About)
- No page reloads (SPA navigation)
- Error-free console

## Project Architecture

### Backend (Node.js/Express)
```
src/
├── server.js              # Main Express server (port 5000)
├── models/                # Mongoose ODM models
│   ├── Task.js
│   ├── Category.js
│   ├── Note.js
│   └── User.js
└── routes/                # API route handlers
    ├── tasks.js           # Task CRUD operations
    ├── categories.js      # Category CRUD operations
    ├── notes.js           # Notes CRUD operations
    ├── users.js           # User CRUD operations
    └── stats.js           # Statistics endpoint
```

### Frontend (Vanilla JavaScript)
```
public/
├── index.html             # Single HTML page with 11+ views
├── css/
│   └── styles.css         # Comprehensive CSS with all required selectors
└── js/
    ├── app.js             # Main application with DOMContentLoaded
    └── modules/           # ES6 modules
        ├── ApiService.js      # HTTP/fetch wrapper class
        ├── UIController.js    # UI management class
        ├── FormValidator.js   # Form validation class
        └── DataManager.js     # Data state management class
```

## Getting Started

### Prerequisites

1. Node.js (v20 or higher)
2. MongoDB (Local installation or MongoDB Atlas account)

### Local MongoDB Setup

#### Option 1: Install MongoDB Locally

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Windows:**
Download from MongoDB Download Center (https://www.mongodb.com/try/download/community) and follow installation wizard.

#### Option 2: Use MongoDB Atlas (Cloud)

1. Sign up at MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Update `.env` with your Atlas connection string

### Installation

1. Clone or download the project

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

For local MongoDB:
```env
MONGODB_URI=mongodb://localhost:27017/taskflow
PORT=5000
NODE_ENV=development
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflow
PORT=5000
NODE_ENV=development
```

4. Start the application:
```bash
npm start
```

5. Access the application:
Open your browser to: http://localhost:5000

## Application Views

1. Dashboard - Overview with statistics and recent tasks
2. Tasks - Complete task list with filtering
3. Task Form - Create/edit tasks
4. Categories - Manage task categories
5. Category Form - Create/edit categories
6. Notes - Quick notes management
7. Note Form - Create/edit notes
8. Calendar - Task calendar view
9. Profile - User profile management
10. Settings - Application settings
11. Help/About - Documentation and information

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user

### Statistics
- `GET /api/stats` - Get task statistics

## Development

### Project Structure
```
taskflow/
├── public/                # Frontend files
├── src/                   # Backend files
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
└── README.md             # This file
```

### Technologies Used

**Frontend:**
- Vanilla JavaScript (ES6+ modules)
- CSS3 (Mobile-first, responsive)
- Fetch API for AJAX

**Backend:**
- Node.js
- Express.js
- Mongoose (MongoDB ODM)

**Database:**
- MongoDB

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/taskflow` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

## Notes

- The application is designed mobile-first
- All CSS requirements are met without relying on frameworks
- JavaScript uses only ES6 modules (no global functions except DOMContentLoaded)
- MongoDB connection must be configured before starting
- No console errors in production build

## Academic Compliance

This project fulfills all requirements for the Modern Web Development course:
- Mobile-first design
- No dead links or incomplete renderings
- Error-free console
- Extensive CSS usage (all selector requirements met)
- ES6 modules only
- Single global function (DOMContentLoaded)
- 50+ event handlers
- 3+ ES6 classes with 5+ methods each
- 12+ AJAX invocations
- MongoDB with Mongoose ODM
- Full CRUD operations
- 10+ API routes
- SPA with 11+ views

## License

Academic project - All rights reserved

## Author

Created for Modern Web Development Course
