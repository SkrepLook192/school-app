// backend/services/strategy/byFailingStudentsReport.js
const db = require("../../db"); // Подключаем MySQL2

class ByFailingStudentsReport {
  async generate() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT StudentID, COUNT(*) AS FailingCount
        FROM Grades
        WHERE GradeValue <= 2
        GROUP BY StudentID
        HAVING FailingCount > 1
        ORDER BY FailingCount DESC;
      `;
      db.query(query, (err, results) => {
        if (err) {
          console.error("Ошибка при генерации отчёта по неуспевающим студентам:", err);
          return reject({ message: "Ошибка при генерации отчёта по неуспевающим студентам" });
        }
        resolve(results);
      });
    });
  }
}

module.exports = new ByFailingStudentsReport();
