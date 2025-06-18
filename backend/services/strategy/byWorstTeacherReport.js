// backend/services/strategy/byWorstTeacherReport.js
const db = require("../../db"); // Подключаем MySQL2

class ByWorstTeacherReport {
  async generate() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT TeacherID, AVG(GradeValue) AS AverageGrade
        FROM Grades
        GROUP BY TeacherID
        ORDER BY AverageGrade ASC
        LIMIT 1;
      `;
      db.query(query, (err, results) => {
        if (err) {
          console.error("Ошибка при генерации отчёта по худшему учителю:", err);
          return reject({ message: "Ошибка при генерации отчёта по худшему учителю" });
        }
        resolve(results);
      });
    });
  }
}

module.exports = new ByWorstTeacherReport();
