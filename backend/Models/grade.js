const db = require('../db');  // Подключаем mysql2

// Получение всех оценок
const getAllGrades = async () => {
  try {
    const query = 'SELECT * FROM Grades';
    const [rows] = await db.promise().query(query);
    return rows;
  } catch (error) {
    console.error("Ошибка при получении оценок: ", error);
    throw error;
  }
};

// Добавление новой оценки
const createGrade = async (studentID, subjectID, gradeValue, comment, quarter) => {
  try {
    const query = 'INSERT INTO Grades (StudentID, SubjectID, GradeValue, Comment, Quarter) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.promise().query(query, [studentID, subjectID, gradeValue, comment, quarter]);
    return { GradeID: result.insertId, StudentID: studentID, SubjectID: subjectID, GradeValue: gradeValue, Comment: comment, Quarter: quarter };
  } catch (error) {
    console.error("Ошибка при добавлении оценки: ", error);
    throw error;
  }
};

module.exports = { getAllGrades, createGrade };
