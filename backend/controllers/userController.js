const express = require('express');
const router = express.Router();
const UserRepository = require('../services/repository/userRepository');
const bcrypt = require('bcryptjs');

// Middleware для проверки Admin
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Доступ запрещён.' });
  }
  next();
}

class UserController {
  // GET /api/user
  async getAllUsers(req, res) {
    try {
      // 1. Чтение и валидация параметров
      let page = parseInt(req.query.page, 10);
      let limit = parseInt(req.query.limit, 10);
  
      page = isNaN(page) ? 1 : Math.max(1, page);
      limit = isNaN(limit) ? 10 : Math.max(1, Math.min(limit, 100));
  
      const search = req.query.search?.toString() || '';
      const role = req.query.role?.toString() || '';
  
      // 2. Новый блок: сортировка
      const sortBy = req.query.sortBy?.toString() || 'UserID';
      const order = req.query.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  
      // 3. Параллельные запросы
      const [users, total] = await Promise.all([
        UserRepository.getAll(page, limit, search, role, sortBy, order),
        UserRepository.getTotalCount(search, role)
      ]);
  
      // 4. Заголовки
      res.set({
        'X-Total-Count': total,
        'Access-Control-Expose-Headers': 'X-Total-Count',
        'X-Page': page,
        'X-Per-Page': limit,
        'X-Total-Pages': Math.ceil(total / limit)
      });
  
      // 5. Ответ
      res.json(users);
    } catch (err) {
      console.error('Ошибка в getAllUsers:', err);
  
      const errorResponse = {
        message: 'Не удалось получить список пользователей',
        error: err.message
      };
  
      if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.fullError = err;
      }
  
      res.status(500).json(errorResponse);
    }
  }
  


  // POST /api/user
  async createUser(req, res) {
    try {
      const { username, password, role } = req.body;
      if (!username || !password || !role) {
        return res.status(400).json({ message: 'Все поля обязательны' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = await UserRepository.createUser({
        username,
        passwordHash,
        role
      });

      res.status(201).json(newUser);
    } catch (err) {
      console.error('Ошибка в createUser:', err);
      res.status(500).json({ message: err.message || 'Ошибка сервера' });
    }
  }

  // PUT /api/user/:id/role
  async updateUserRole(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { role } = req.body;

      if (req.user.userId === userId) {
        return res.status(400).json({ message: 'Нельзя изменить свою роль' });
      }

      const updated = await UserRepository.updateRole(userId, role);
      if (!updated) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
      res.json({ message: 'Роль пользователя обновлена' });
    } catch (err) {
      console.error('Ошибка в updateUserRole:', err);
      res.status(500).json({ message: err.message || 'Ошибка сервера' });
    }
  }

  // PUT /api/user/:id
  async updateUser(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const { Username, Role, password } = req.body;

      const updates = {};
      if (Username) updates.Username = Username;
      if (Role)    updates.Role     = Role;
      if (password) {
        updates.PasswordHash = await bcrypt.hash(password, 12);
      }

      const updated = await UserRepository.updateUser(userId, updates);
      if (!updated) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
      res.json({ message: 'Пользователь обновлён' });
    } catch (err) {
      console.error('Ошибка в updateUser:', err);
      res.status(500).json({ message: err.message || 'Ошибка сервера' });
    }
  }
  // DELETE /api/user/:id
  async deleteUser(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (req.user.userId === userId) {
        return res.status(400).json({ message: 'Нельзя удалить себя' });
      }

      const deleted = await UserRepository.deleteUser(userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
      res.sendStatus(204);
    } catch (err) {
      console.error('Ошибка в deleteUser:', err);
      res.status(500).json({ message: err.message || 'Ошибка сервера' });
    }
  }
}

const controller = new UserController();

router.get('/',       adminMiddleware, controller.getAllUsers.bind(controller));
router.post('/',      adminMiddleware, controller.createUser.bind(controller));
router.put('/:id/role', adminMiddleware, controller.updateUserRole.bind(controller));
router.delete('/:id', adminMiddleware, controller.deleteUser.bind(controller));
router.put('/:id', adminMiddleware, controller.updateUser.bind(controller));
module.exports = router;
