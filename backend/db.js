const mysql = require('mysql2/promise'); // Используем mysql2 с промисами
const dotenv = require('dotenv'); // Импортируем dotenv
dotenv.config(); // Загружаем переменные окружения из .env

const db = {};

// Создаем пул соединений с использованием mysql2
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '2033',
  database: process.env.DB_NAME || 'school',
  waitForConnections: true,
  connectionLimit: 10, // Максимальное количество соединений
  queueLimit: 0,
});

db.pool = pool; // Добавляем пул в объект db

module.exports = db; // Экспортируем объект db с пулом