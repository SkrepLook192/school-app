// backend/services/strategy/byWorstSubjectReport.js
const db = require("../../db");

class ByWorstSubjectReport {
  async generate() {
    try {
      const [rows] = await db.pool.query(`
        SELECT 
          Subjects.Name AS SubjectName,
          AVG(Grades.GradeValue) AS AverageGrade
        FROM Grades
        JOIN Subjects ON Grades.SubjectID = Subjects.SubjectID
        GROUP BY Grades.SubjectID
        ORDER BY AverageGrade ASC
        LIMIT 1
      `);
      return rows[0] || null; // Возвращаем один предмет или null
    } catch (err) {
      console.error("Ошибка при генерации отчёта по сложному предмету:", err);
      throw new Error("Ошибка при генерации отчёта по сложному предмету");
    }
  }
}

module.exports = new ByWorstSubjectReport();
