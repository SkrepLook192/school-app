const db = require("../../db");

class UserRepository {
  // 1) возвращает страницу пользователей
  async getAll(page = 1, limit = 10, search = '', role = '', sortBy = 'UserID', order = 'ASC') {
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
  
    page = Math.max(1, page);
    limit = Math.max(1, Math.min(limit, 100));
  
    const offset = (page - 1) * limit;
  
    const where = [];
    const params = [];
  
    if (search) {
      where.push('Username LIKE ?');
      params.push(`%${search}%`);
    }
  
    if (role) {
      where.push('Role = ?');
      params.push(role);
    }
  
    let sql = 'SELECT UserID, Username, Role FROM Users';
  
    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }
  
    // 🔒 Белый список допустимых колонок
    const allowedSortFields = ['UserID', 'Username', 'Role'];
    const allowedOrder = ['ASC', 'DESC'];
  
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'UserID';
    const safeOrder = allowedOrder.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';
  
    // 📦 Вставка безопасной сортировки и пагинации
    sql += ` ORDER BY ${safeSortBy} ${safeOrder} LIMIT ${limit} OFFSET ${offset}`;
  
    console.log('[SQL]', sql);
    console.log('[PARAMS]', params);
  
    const [rows] = await db.pool.execute(sql, params);
    return rows;
  }
  
  
  // 2) считает общее число пользователей под те же условия
  async getTotalCount(search = '', role = '') {
    let sql     = 'SELECT COUNT(*) AS cnt FROM Users';
    const where = [];
    const params = [];

    if (search) {
      where.push('Username LIKE ?');
      params.push(`%${search}%`);
    }
    if (role) {
      where.push('Role = ?');
      params.push(role);
    }

    if (where.length) {
      sql += ' WHERE ' + where.join(' AND ');
    }

    const [[{ cnt }]] = await db.pool.execute(sql, params);
    return cnt;
  }

  // 3) получение по ID
  async getById(userId) {
    const [rows] = await db.pool.execute(
      'SELECT UserID, Username, Role FROM Users WHERE UserID = ?',
      [userId]
    );
    return rows[0] || null;
  }

  // 4) создание
  async createUser({ username, passwordHash, role }) {
    const [result] = await db.pool.execute(
      'INSERT INTO Users (Username, PasswordHash, Role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );
    return {
      UserID: result.insertId,
      Username: username,
      Role: role
    };
  }

  // 5) обновление роли
  async updateRole(id, newRole) {
    const [result] = await db.pool.execute(
      'UPDATE Users SET Role = ? WHERE UserID = ?',
      [newRole, id]
    );
    return result.affectedRows > 0;
  }

  // 6) удаление
  async deleteUser(id) {
    const [result] = await db.pool.execute(
      'DELETE FROM Users WHERE UserID = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
  // 7) обновление любых полей пользователя
  async updateUser(id, updates) {
    const sets = [];
    const params = [];

    if (updates.Username) {
      sets.push('Username = ?');
      params.push(updates.Username);
    }
    if (updates.Role) {
      sets.push('Role = ?');
      params.push(updates.Role);
    }
    if (updates.PasswordHash) {
      sets.push('PasswordHash = ?');
      params.push(updates.PasswordHash);
    }

    if (sets.length === 0) return false;

    const sql = `UPDATE Users SET ${sets.join(', ')} WHERE UserID = ?`;
    params.push(id);

    const [result] = await db.pool.execute(sql, params);
    return result.affectedRows > 0;
  }

}

module.exports = new UserRepository();
