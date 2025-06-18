const db = require('../db');  // Подключаем mysql2

// Получение всех студентов
const getAllStudents = async () => {
  try {
    const query = 'SELECT * FROM Students';
    const [rows] = await db.promise().query(query);
    return rows;
  } catch (error) {
    console.error("Ошибка при получении студентов: ", error);
    throw error;
  }
};

// Получение студента по ID
const getStudentById = async (id) => {
  try {
    const query = 'SELECT * FROM Students WHERE StudentID = ?';
    const [rows] = await db.promise().query(query, [id]);
    return rows[0];
  } catch (error) {
    console.error("Ошибка при получении студента: ", error);
    throw error;
  }
};

// Добавление студента
const createStudent = async (fullName, classID, userID) => {
  try {
    const query = 'INSERT INTO Students (FullName, ClassID, UserID) VALUES (?, ?, ?)';
    const [result] = await db.promise().query(query, [fullName, classID, userID]);
    return { StudentID: result.insertId, FullName: fullName, ClassID: classID, UserID: userID };
  } catch (error) {
    console.error("Ошибка при добавлении студента: ", error);
    throw error;
  }
};

module.exports = { getAllStudents, getStudentById, createStudent };
