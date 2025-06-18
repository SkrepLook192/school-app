const db = require('../db'); // Подключаем mysql2

// Получение всех классов
const getAllClasses = async () => {
  try {
    const query = "SELECT * FROM Classes";
    const [rows] = await db.promise().query(query); // Выполняем запрос
    return rows;
  } catch (error) {
    console.error("Ошибка при получении классов: ", error);
    throw error;
  }
};

// Получение класса по ID
const getClassById = async (id) => {
  try {
    const query = "SELECT * FROM Classes WHERE ClassID = ?";
    const [rows] = await db.promise().query(query, [id]);
    return rows[0]; // Возвращаем первый результат
  } catch (error) {
    console.error("Ошибка при получении класса по ID: ", error);
    throw error;
  }
};

// Создание нового класса
const createClass = async (name, academicYear) => {
  try {
    const query = "INSERT INTO Classes (Name, AcademicYear) VALUES (?, ?)";
    const [result] = await db.promise().query(query, [name, academicYear]);
    return { ClassID: result.insertId, Name: name, AcademicYear: academicYear };
  } catch (error) {
    console.error("Ошибка при добавлении нового класса: ", error);
    throw error;
  }
};

// Обновление класса
const updateClass = async (id, name, academicYear) => {
  try {
    const query = "UPDATE Classes SET Name = ?, AcademicYear = ? WHERE ClassID = ?";
    const [result] = await db.promise().query(query, [name, academicYear, id]);
    if (result.affectedRows === 0) {
      return null; // Класс не найден
    }
    return { ClassID: id, Name: name, AcademicYear: academicYear };
  } catch (error) {
    console.error("Ошибка при обновлении класса: ", error);
    throw error;
  }
};

// Удаление класса
const deleteClass = async (id) => {
  try {
    const query = "DELETE FROM Classes WHERE ClassID = ?";
    const [result] = await db.promise().query(query, [id]);
    return result.affectedRows > 0; // Возвращаем true, если класс был удален
  } catch (error) {
    console.error("Ошибка при удалении класса: ", error);
    throw error;
  }
};

// Экспортируем методы
module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
