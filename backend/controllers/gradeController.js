// backend/controllers/gradeController.js
const express = require("express");
const router = express.Router();
const gradeRepository = require("../services/repository/gradeRepository");
const GradeBook = require("../services/observer/gradeBook");
const AdminObserver = require("../services/observer/adminObserver");

// Инициализируем GradeBook и «навешиваем» AdminObserver
const gradeBook = new GradeBook();
gradeBook.attach(new AdminObserver("Завуч"));

// GET /api/grade — Admin и Teacher
router.get("/", async (req, res) => {
  try {
    if (!["Admin", "Teacher"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещён." });
    }
    const grades = await gradeRepository.getAll();
    return res.json(grades);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// POST /api/grade — Admin и Teacher
router.post("/", async (req, res) => {
  try {
    if (!["Admin", "Teacher"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещён." });
    }
    const newGrade = await gradeRepository.createGrade(req.body);
    const message = `Добавлена новая оценка ${newGrade.GradeValue} студенту ID=${newGrade.StudentID} по предмету ID=${newGrade.SubjectID}`;
    gradeBook.notify(message);
    return res.status(201).json(newGrade);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при добавлении оценки" });
  }
});

// PUT /api/grade/:id — Admin и Teacher
router.put("/:id", async (req, res) => {
  try {
    if (!["Admin", "Teacher"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещён." });
    }
    const updatedGrade = await gradeRepository.updateGrade(req.params.id, req.body);
    if (!updatedGrade) {
      return res.status(404).json({ message: "Оценка не найдена." });
    }
    const message = `Оценка ID=${req.params.id} обновлена на ${req.body.GradeValue}`;
    gradeBook.notify(message);
    return res.json(updatedGrade);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при обновлении оценки" });
  }
});

// DELETE /api/grade/:id — только Admin
router.delete("/:id", async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Доступ запрещён." });
    }
    const deleted = await gradeRepository.deleteGrade(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Оценка не найдена." });
    }
    const message = `Оценка ID=${req.params.id} удалена`;
    gradeBook.notify(message);
    return res.sendStatus(204);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при удалении оценки" });
  }
});

module.exports = router;
