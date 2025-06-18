require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const db = require('./db'); // Импортируем подключение к базе данных

// Подключаем контроллеры
const authController = require("./controllers/authController");
const studentController = require("./controllers/studentController");
const classController = require("./controllers/classController");
const gradeController = require("./controllers/gradeController");
const reportController = require("./controllers/reportController");
const teacherController = require("./controllers/teacherController");
const userController = require("./controllers/userController");
const subjectController = require("./controllers/subjectController");

const app = express();
app.use(cors());
app.use(express.json());

// Middleware: проверяем JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401); // нет токена

  jwt.verify(token, process.env.JWT_SECRET || "секрет", (err, user) => {
    if (err) return res.status(403).json({ message: "Неверный токен." });
    req.user = user;
    next();
  });
}

// Проверяем подключение к базе данных
async function connectDB() {
  try {
    // Используем pool для выполнения запроса
    const [rows] = await db.pool.query('SELECT 1');
    console.log('📦 База данных подключена успешно.');
  } catch (err) {
    console.error('❌ Ошибка подключения к базе данных:', err);
  }
}


// Обновляем маршруты для пользователей

// Подключаем контроллеры / маршруты
app.use('/api/auth', authController);
// CRUD для предметов
app.use('/api/subject', authenticateToken, subjectController);

app.use('/api/student', authenticateToken, studentController);
app.use('/api/class', authenticateToken, classController);
app.use('/api/grade', authenticateToken, gradeController);
app.use('/api/report', authenticateToken, reportController);
app.use('/api/teacher', authenticateToken, teacherController);
app.use('/api/user', authenticateToken, userController);



app.use(cors({
  origin: 'http://localhost:3000', // или ваш фронтенд-адрес
  credentials: true
}));
// Старт сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await connectDB(); // Асинхронно подключаемся к БД
  console.log(`🚀 Сервер работает на порту ${PORT}`);
});
