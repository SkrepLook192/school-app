const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db"); // Подключаем базу данных

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "секрет";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { Username, PasswordHash, Role } = req.body;

    // Проверяем, существует ли уже пользователь с таким Username
    const [results] = await db.pool.query("SELECT * FROM Users WHERE Username = ?", [Username]);

    if (results.length > 0) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(PasswordHash, salt);
  //sasa
    const roleValue = Role || "User";
    // Создаем нового пользователя
    const [newUser] = await db.pool.query(
      "INSERT INTO Users (Username, PasswordHash, Role) VALUES (?, ?, ?)",
      [Username, hashed, roleValue]
    );    
    return res.status(201).json({ UserID: newUser.insertId, Username, Role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при регистрации" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { Username, Password } = req.body;

    // Ищем пользователя в базе
    const [results] = await db.pool.query("SELECT * FROM Users WHERE Username = ?", [Username]);

    if (results.length === 0) {
      return res.status(401).json({ message: "Неверный логин или пароль" });
    }

    const user = results[0];

    // Проверка пароля
    const isMatch = await bcrypt.compare(Password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Неверный логин или пароль" });
    }

    // Генерация JWT токена
    const payload = {
      userId: user.UserID,
      role: user.Role,
      username: user.Username,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({ token, Username: user.Username, Role: user.Role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при логине" });
  }
});

module.exports = router;
