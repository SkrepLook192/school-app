const express = require("express");
const router = express.Router();
const teacherRepository = require("../services/repository/teacherRepository");
const UserRepository = require("../services/repository/userRepository");

// Валидация данных при создании/обновлении
const validateTeacherData = (data) => {
  const errors = [];

  if (!data.FullName || typeof data.FullName !== "string" || data.FullName.trim() === "") {
    errors.push("Полное имя обязательно и должно быть непустой строкой");
  }

  if (data.UserID !== undefined && data.UserID !== null && isNaN(Number(data.UserID))) {
    errors.push("UserID должен быть числом или отсутствовать");
  }

  if (data.ClassroomNumber !== undefined && data.ClassroomNumber !== null && isNaN(Number(data.ClassroomNumber))) {
    errors.push("ClassroomNumber должен быть числом или отсутствовать");
  }

  if (errors.length) {
    throw {
      code: "VALIDATION_ERROR",
      message: "Неверные данные учителя",
      details: errors,
    };
  }

  return {
    FullName: data.FullName.trim(),
    UserID: data.UserID !== undefined && data.UserID !== null ? Number(data.UserID) : null,
    ClassroomNumber: data.ClassroomNumber !== undefined && data.ClassroomNumber !== null ? Number(data.ClassroomNumber) : null,
  };
};

// Получить всех учителей (Admin и Teacher)
router.get("/", async (req, res) => {
  try {
    if (!["Admin", "Teacher"].includes(req.user.role)) {
      return res.status(403).json({ message: "Доступ запрещён" });
    }

    const { teachers, totalCount } = await teacherRepository.getAll();
    res.json({ teachers, totalCount });
  } catch (err) {
    console.error("GET /api/teacher error:", err);
    res.status(500).json({
      message: "Не удалось получить список учителей",
      details: err.details,
    });
  }
});

// DELETE /api/teacher/:id
router.delete("/:id", async (req, res) => {
  console.log("DELETE /api/teacher/:id, id =", req.params.id);
  const teacherId = req.params.id;
  try {
    const result = await teacherRepository.deleteTeacher(teacherId);
    if (!result) {
      return res.status(404).json({ message: "Учитель не найден" });
    }
    return res.status(200).json({ message: "Учитель успешно удален" });
  } catch (err) {
    console.error("Ошибка при удалении учителя:", err);
    return res.status(500).json({ message: "Ошибка при удалении учителя" });
  }
});
// Редактировать учителя (Admin)
router.put("/:id", async (req, res) => {
  try {
    const { FullName, ClassroomNumber, UserID } = req.body;

    // Проверка обязательных полей
    if (!FullName) {
      return res.status(400).json({ message: "Полное имя обязательно" });
    }

    // Валидируем данные
    const updatedTeacherData = validateTeacherData({ FullName, ClassroomNumber, UserID });

    // Обновляем учителя
    const updatedTeacher = await teacherRepository.updateTeacher(req.params.id, updatedTeacherData);

    if (!updatedTeacher) {
      return res.status(404).json({ message: "Учитель не найден" });
    }

    res.json(updatedTeacher);
  } catch (err) {
    console.error("PUT /api/teacher/:id error:", err);
    res.status(500).json({
      message: "Не удалось обновить учителя",
      details: err.details || err.message,
    });
  }
});

// Создать нового учителя (Admin)
router.post("/", async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Доступ запрещён" });
    }

    // Валидируем FullName и ClassroomNumber, UserID
    const { FullName, UserID, ClassroomNumber } = validateTeacherData(req.body);

    // Если передан UserID, проверяем, что пользователь существует
    if (UserID !== null) {
      const user = await UserRepository.getById(UserID);
      if (!user) {
        return res.status(400).json({ message: `Пользователь с ID=${UserID} не найден` });
      }
    }

    const newTeacher = await teacherRepository.createTeacher({
      FullName,
      ClassroomNumber,
      UserID: UserID !== null ? UserID : null,
    });

    res.status(201).json(newTeacher);
  } catch (err) {
    console.error("POST /api/teacher error:", err);
    if (err.code === "VALIDATION_ERROR") {
      return res.status(400).json({
        message: err.message,
        details: err.details,
      });
    }
    res.status(500).json({
      message: "Не удалось создать учителя",
      details: err.details || err.message,
    });
  }
});

module.exports = router;
