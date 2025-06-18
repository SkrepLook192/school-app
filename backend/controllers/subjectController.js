// controllers/subjectController.js
const express = require('express');
const router  = express.Router();
const subjectRepo = require('../services/repository/subjectRepository');
const teacherRepo = require('../services/repository/teacherRepository'); // для списка преподавателей

// Middleware: только для админа
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Доступ запрещён.' });
  }
  next();
}

class SubjectController {
  // GET /api/subject
  async getAll(req, res) {
    console.log('SubjectController.getAll запрос с query:', req.query);
    try {
      const page   = parseInt(req.query.page, 10) || 1;
      const limit  = parseInt(req.query.limit,10) || 10;
      const search = req.query.search || '';

      const { subjects, totalCount } =
        await subjectRepo.getAllSubjects(page, limit, search);

      res.set('X-Total-Count', totalCount);
      res.json(subjects);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Не удалось получить предметы' });
    }
  }

  // POST /api/subject
  async create(req, res) {
    try {
      const { Name, TeacherID } = req.body;
      if (!Name || !TeacherID) {
        return res.status(400).json({ message: 'Название и преподаватель обязательны' });
      }
      const newSubj = await subjectRepo.create(Name, TeacherID);
      res.status(201).json(newSubj);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка создания предмета' });
    }
  }

  // PUT /api/subject/:id
  async update(req, res) {
    try {
      const { Name, TeacherID } = req.body;
      const upd = await subjectRepo.update(req.params.id, Name, TeacherID);
      if (!upd) return res.status(404).json({ message: 'Предмет не найден' });
      res.json(upd);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка обновления предмета' });
    }
  }

  // DELETE /api/subject/:id
  async delete(req, res) {
    try {
      const ok = await subjectRepo.delete(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Предмет не найден' });
      res.sendStatus(204);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка удаления предмета' });
    }
  }
}

const controller = new SubjectController();

router.get   ('/',            adminMiddleware, controller.getAll.bind(controller));
router.post  ('/',            adminMiddleware, controller.create.bind(controller));
router.put   ('/:id',         adminMiddleware, controller.update.bind(controller));
router.delete('/:id',         adminMiddleware, controller.delete.bind(controller));

module.exports = router;
