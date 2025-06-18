const db = require('../db');  // Подключаем mysql2

// Получение всех учителей
const getAllTeachers = async () => {
  try {
    const query = 'SELECT * FROM Teachers';
    const [rows] = await db.promise().query(query);
    return rows;
  } catch (error) {
    console.error("Ошибка при получении учителей: ", error);
    throw error;
  }
};

// Добавление нового учителя
const createTeacher = async (fullName, classroomNumber, subjectID) => {
  try {
    const query = 'INSERT INTO Teachers (FullName, ClassroomNumber, SubjectID) VALUES (?, ?, ?)';
    const [result] = await db.promise().query(query, [fullName, classroomNumber, subjectID]);
    return { TeacherID: result.insertId, FullName: fullName, ClassroomNumber: classroomNumber, SubjectID: subjectID };
  } catch (error) {
    console.error("Ошибка при добавлении учителя: ", error);
    throw error;
  }
};

module.exports = { getAllTeachers, createTeacher };
