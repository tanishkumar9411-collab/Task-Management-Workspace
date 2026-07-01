const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const DB_FILE = path.join(__dirname, 'todo-database.json');

const crypto = require('crypto');

const readDatabase = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
    return [];
  }
  const data = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(data || '[]');
};

const writeDatabase = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.get('/api/todos', (req, res) => {
  try {
    const todos = readDatabase();
    todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

app.post('/api/todos', (req, res) => {
  try {
    const todos = readDatabase();
    
    const newTodo = {
      _id: crypto.randomBytes(8).toString('hex'),
      title: req.body.title,
      completed: false,
      createdAt: new Date().toISOString()
    };

    todos.push(newTodo);
    writeDatabase(todos);
    res.json(newTodo);
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

app.put('/api/todos/:id', (req, res) => {
  try {
    const todos = readDatabase();
    const todoIndex = todos.findIndex(item => item._id === req.params.id);

    if (todoIndex === -1) {
      return res.status(404).json('Todo not found');
    }

    todos[todoIndex].completed = !todos[todoIndex].completed;
    writeDatabase(todos);
    res.json(todos[todoIndex]);
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

app.delete('/api/todos/:id', (req, res) => {
  try {
    let todos = readDatabase();
    const todoExists = todos.some(item => item._id === req.params.id);

    if (!todoExists) {
      return res.status(404).json('Todo not found');
    }

    todos = todos.filter(item => item._id !== req.params.id);
    writeDatabase(todos);
    res.json({ msg: 'Todo removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json('Server error');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Local task server and local storage running on port ${PORT}`));