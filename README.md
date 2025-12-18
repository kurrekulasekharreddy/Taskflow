# TaskFlow - Task Manager SPA

A mobile-first Single Page Application (SPA) for task management built with vanilla JavaScript ES6 modules, Node.js/Express backend, and MongoDB database.

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
