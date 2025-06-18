const express = require("express");
const router = express.Router();
const ReportContext = require("../services/strategy/reportContext");
const byClassReport = require("../services/strategy/byClassReport");
const bySubjectReport = require("../services/strategy/bySubjectReport");
const db = require("../db");  // Экспортирует { pool }
const byWorstSubjectReport = require("../services/strategy/byWorstSubjectReport");

const byFailingStudentsReport = require("../services/strategy/byFailingStudentsReport");
const byWorstTeacherReport = require("../services/strategy/byWorstTeacherReport");

// Отчёт по классам
router.get("/class", async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Доступ запрещён." });
    }
    
    const context = new ReportContext();
    context.setStrategy(byClassReport);
    const result = await context.generate();
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при формировании отчёта по классам" });
  }
});
router.get("/worst-subject", async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Доступ запрещён." });
    }

    const context = new ReportContext();
    context.setStrategy(byWorstSubjectReport);
    const result = await context.generate();
    res.json(result); // возвращает { SubjectName, AverageGrade }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка при формировании отчёта по сложному предмету" });
  }
});


// Отчёт по предметам
router.get("/subject", async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Доступ запрещён." });
    }

    const context = new ReportContext();
    context.setStrategy(bySubjectReport);
    const result = await context.generate();
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при формировании отчёта по предметам" });
  }
});

// Отчёт по неуспевающим студентам
router.get("/failing", async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Доступ запрещён." });
    }

    const [results] = await db.pool.query(`
      SELECT StudentID, COUNT(GradeValue) AS Count 
      FROM Grades 
      WHERE GradeValue = 2
      GROUP BY StudentID
    `);

    return res.json({ count: results.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при формировании отчёта по неуспевающим студентам" });
  }
});

// Отчёт по худшему учителю
router.get("/worst-teacher", async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Доступ запрещён." });
    }

    const [results] = await db.pool.query(`
      SELECT 
        Teachers.FullName AS name,
        AVG(Grades.GradeValue) AS average
      FROM Grades 
      JOIN Subjects ON Grades.SubjectID = Subjects.SubjectID
      JOIN Teachers ON Subjects.TeacherID = Teachers.TeacherID
      GROUP BY Teachers.TeacherID
      ORDER BY average ASC
      LIMIT 1
    `);

    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при формировании отчёта по худшему учителю" });
  }
});

module.exports = router;
