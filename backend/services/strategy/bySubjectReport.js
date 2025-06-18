// backend/services/strategy/bySubjectReport.js
const db = require("../../db");

class BySubjectReport {
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
      `);
      return rows;
    } catch (err) {
      console.error("Ошибка при генерации отчёта по предметам:", err);
      throw new Error("Ошибка при генерации отчёта по предметам");
    }
  }
}

module.exports = new BySubjectReport();
