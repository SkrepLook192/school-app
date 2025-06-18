const db = require('../db');  // Подключаем mysql2

// Получение всех пользователей
const getAllUsers = async () => {
  try {
    const query = 'SELECT * FROM Users';
    const [rows] = await db.promise().query(query);
    return rows;
  } catch (error) {
    console.error("Ошибка при получении пользователей: ", error);
    throw error;
  }
};

// Получение пользователя по ID
const getUserById = async (id) => {
  try {
    const query = 'SELECT * FROM Users WHERE UserID = ?';
    const [rows] = await db.promise().query(query, [id]);
    return rows[0]; // Возвращаем первого пользователя
  } catch (error) {
    console.error("Ошибка при получении пользователя по ID: ", error);
    throw error;
  }
};

// Создание нового пользователя
const createUser = async (username, passwordHash, role) => {
  try {
    const query = 'INSERT INTO Users (Username, PasswordHash, Role) VALUES (?, ?, ?)';
    const [result] = await db.promise().query(query, [username, passwordHash, role]);
    return { UserID: result.insertId, Username: username, Role: role };
  } catch (error) {
    console.error("Ошибка при создании пользователя: ", error);
    throw error;
  }
};

module.exports = { getAllUsers, getUserById, createUser };
