const db = require("../../db");

class ByClassReport {
  async generate() {
    try {
      const [rows] = await db.pool.query(`
        SELECT 
          Classes.Name AS className,
          AVG(Grades.GradeValue) AS average
        FROM Grades
        JOIN Students ON Grades.StudentID = Students.StudentID
        JOIN Classes ON Students.ClassID = Classes.ClassID
        GROUP BY Classes.ClassID
        ORDER BY average DESC
      `);
      return rows;
    } catch (err) {
      console.error("Ошибка при генерации отчета по классам:", err);
      throw new Error("Ошибка при генерации отчета по классам");
    }
  }
}

module.exports = new ByClassReport();
