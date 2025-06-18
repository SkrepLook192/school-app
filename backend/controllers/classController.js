const express = require("express");
const router = express.Router();
const classRepository = require("../services/repository/classRepository");  // Импортируем класс репозиторий

// Получение всех классов с пагинацией и фильтрацией
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = req.query.search || "";
  const year = req.query.academicYear || "";

  try {
    const { classes, totalCount } = await classRepository.getAllClasses(
      page, limit, search, year
    );
    res.json({ classes, totalCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка на сервере" });
  }
});

// Получение класса по ID
router.get("/:id", async (req, res) => {
  try {
    const cls = await classRepository.getClassById(req.params.id);
    if (!cls) return res.status(404).json({ message: "Класс не найден" });
    res.json(cls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка на сервере" });
  }
});

// Создание нового класса
router.post("/", async (req, res) => {
  try {
    const { Name, AcademicYear, RoomNumber } = req.body;
    const newClass = await classRepository.createClass(Name, AcademicYear, RoomNumber);
    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при добавлении класса" });
  }
});

// Обновление класса
router.put("/:id", async (req, res) => {
  try {
    const { Name, AcademicYear, RoomNumber } = req.body;
    const updatedClass = await classRepository.updateClass(req.params.id, Name, AcademicYear, RoomNumber);
    if (!updatedClass) return res.status(404).json({ message: "Класс не найден" });
    res.json(updatedClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при обновлении класса" });
  }
});

// Удаление класса
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await classRepository.deleteClass(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Класс не найден" });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при удалении класса" });
  }
});

module.exports = router;
