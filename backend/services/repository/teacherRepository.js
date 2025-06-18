const db = require("../../db");

class TeacherRepository {
  // Получить всех учителей с пагинацией и фильтрацией
  async getAll(page = 1, limit = 10, search = '') {
    try {
      const offset = (page - 1) * limit;
      let query = "SELECT * FROM Teachers";
      let params = [];

      if (search) {
        query += " WHERE FullName LIKE ?";
        params.push(`%${search}%`);
      }

      query += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [rows] = await db.pool.query(query, params);
      const [totalCount] = await db.pool.query("SELECT COUNT(*) as count FROM Teachers");

      return {
        teachers: rows,
        totalCount: totalCount[0].count
      };
    } catch (err) {
      console.error("Ошибка при получении учителей:", err);
      throw { message: "Ошибка при получении списка учителей" };
    }
  }

  // Получить учителя по ID
  async getById(id) {
    try {
      const [rows] = await db.pool.query(
        "SELECT * FROM Teachers WHERE TeacherID = ?",
        [id]
      );
      return rows[0] || null;
    } catch (err) {
      console.error("Ошибка при получении учителя:", err);
      throw { message: "Ошибка при получении данных учителя" };
    }
  }

  // Создать нового учителя
  async createTeacher({ FullName, ClassroomNumber = null, UserID = null }) {
    try {
      const [result] = await db.pool.query(
        "INSERT INTO Teachers (FullName, ClassroomNumber, UserID) VALUES (?, ?, ?)",
        [FullName, ClassroomNumber, UserID]
      );

      return {
        TeacherID: result.insertId,
        FullName,
        ClassroomNumber,
        UserID,
      };
    } catch (err) {
      console.error("Ошибка при создании учителя:", err);
      throw {
        message: "Ошибка при создании учителя",
        code: err.code,
        details: err.sqlMessage || err.message,
      };
    }
  }

  // Обновить данные учителя
  async updateTeacher(id, { FullName, ClassroomNumber = null, UserID = null }) {
    try {
      const [result] = await db.pool.query(
        "UPDATE Teachers SET FullName = ?, ClassroomNumber = ?, UserID = ? WHERE TeacherID = ?",
        [FullName, ClassroomNumber, UserID, id]
      );

      if (result.affectedRows === 0) {
        return null; // Если не найдено обновление
      }

      return {
        TeacherID: id,
        FullName,
        ClassroomNumber,
        UserID,
      };
    } catch (err) {
      console.error("Ошибка при обновлении учителя:", err);
      throw {
        message: "Ошибка при обновлении данных учителя",
        code: err.code,
        details: err.sqlMessage || err.message,
      };
    }
  }

  // Удалить учителя
  async deleteTeacher(id) {
    try {
      const [result] = await db.pool.query(
        "DELETE FROM Teachers WHERE TeacherID = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return false; // Учитель не найден для удаления
      }

      return true; // Удаление прошло успешно
    } catch (err) {
      console.error("Ошибка при удалении учителя:", err);
      throw {
        message: "Ошибка при удалении учителя",
        code: err.code,
        details: err.sqlMessage || err.message,
      };
    }
  }
}

module.exports = new TeacherRepository();
