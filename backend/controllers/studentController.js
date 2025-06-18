const express = require("express");
const router = express.Router();
const db = require("../db");  // Подключаем mysql2

// Получение всех студентов
router.get("/", async (req, res) => {
  try {
    if (!["Admin", "Teacher"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещён." });
    }

    const [results] = await db.pool.execute('SELECT * FROM students');  // Используем execute с асинхронным запросом
    return res.json(results);  // Отправляем все результаты
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Получение студента по ID
router.get("/:id", async (req, res) => {
  try {
    if (!["Admin", "Teacher"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещён." });
    }

    const [results] = await db.pool.execute('SELECT * FROM students WHERE StudentID = ?', [req.params.id]);  // Используем execute с параметрами
    if (results.length === 0) {
      return res.status(404).json({ message: "Студент не найден." });
    }

    return res.json(results[0]);  // Отправляем найденного студента
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Поиск по полному имени
router.get("/search/:fullName", async (req, res) => {
  try {
    if (!["Admin", "Teacher"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещён." });
    }

    const searchQuery = `%${req.params.fullName}%`;  // Для поиска
    const [results] = await db.pool.execute('SELECT * FROM students WHERE FullName LIKE ?', [searchQuery]);  // Используем execute для поиска

    if (results.length === 0) {
      return res.status(404).json({ message: "Студент не найден." });
    }

    // Преобразуем для добавления средней оценки
    const formattedResults = results.map((s) => {
      const grades = s.Grades.map((g) => g.GradeValue);
      const avg = grades.length > 0
        ? grades.reduce((sum, v) => sum + v, 0) / grades.length
        : null;

      return {
        StudentID: s.StudentID,
        FullName: s.FullName,
        ClassID: s.ClassID,
        ClassName: s.Class ? s.Class.Name : null,
        AverageGrade: avg
      };
    });

    return res.json(formattedResults);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка сервера" });
  }
});

// Создание нового студента
router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Доступ запрещён." });
    }

    const { FullName, ClassID, UserID } = req.body;
    const [results] = await db.pool.execute('INSERT INTO students (FullName, ClassID, UserID) VALUES (?, ?, ?)', [FullName, ClassID, UserID]);  // Используем execute для добавления

    return res.status(201).json({ StudentID: results.insertId, FullName, ClassID, UserID });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при добавлении студента" });
  }
});

// Обновление студента
router.put("/:id", async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Доступ запрещён." });
    }

    const { FullName, ClassID, UserID } = req.body;
    const [results] = await db.pool.execute('UPDATE students SET FullName = ?, ClassID = ?, UserID = ? WHERE StudentID = ?', [FullName, ClassID, UserID, req.params.id]);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Студент не найден." });
    }

    return res.json({ StudentID: req.params.id, FullName, ClassID, UserID });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при обновлении студента" });
  }
});

// Удаление студента
router.delete("/:id", async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Доступ запрещён." });
    }

    const [results] = await db.pool.execute('DELETE FROM students WHERE StudentID = ?', [req.params.id]);

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Студент не найден." });
    }

    return res.sendStatus(204);  // Успешное удаление
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка при удалении студента" });
  }
});

module.exports = router;
