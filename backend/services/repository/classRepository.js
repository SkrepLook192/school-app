const db = require("../../db");

class ClassRepository {
  /**
   * Возвращает постраничный список классов и общее число
   * @param {number} page      — номер страницы
   * @param {number} limit     — записей на страницу
   * @param {string} search    — поиск по Name
   * @param {string} academicYear — фильтр по году обучения
   */
  async getAllClasses(page = 1, limit = 10, search = "", academicYear = "") {
    // 1) Собираем базовый запрос и параметры фильтров
    let baseQuery = "FROM classes WHERE 1=1";
    const params    = [];

    if (search) {
      baseQuery += " AND Name LIKE ?";
      params.push(`%${search}%`);
    }
    if (academicYear) {
      baseQuery += " AND AcademicYear = ?";
      params.push(academicYear);
    }

    // 2) Сначала считаем общее количество по фильтру
    const countSql = `SELECT COUNT(*) AS count ${baseQuery}`;
    const [[{ count: totalCount }]] = await db.pool.execute(countSql, params);

    // 3) Потом — получаем страницу, ЛИМИТИРУЯ напрямую
    const offset = (Number(page) - 1) * Number(limit);
    const pageSql = `SELECT * ${baseQuery} LIMIT ${Number(limit)} OFFSET ${offset}`;
    const [classes] = await db.pool.execute(pageSql, params);

    return { classes, totalCount };
  }

  /**
   * Возвращает общее число классов (без пагинации)
   */
  async getTotalCount(search = "", academicYear = "") {
    let query = "SELECT COUNT(*) as count FROM classes WHERE 1=1";
    const params = [];

    if (search) {
      query += " AND Name LIKE ?";
      params.push(`%${search}%`);
    }
    if (academicYear) {
      query += " AND AcademicYear = ?";
      params.push(academicYear);
    }

    const [rows] = await db.pool.execute(query, params);
    return rows[0].count;
  }

  async getClassById(id) {
    const [rows] = await db.pool.execute(
      "SELECT * FROM classes WHERE ClassID = ?",
      [id]
    );
    return rows.length ? rows[0] : null;
  }

  async createClass(Name, AcademicYear, RoomNumber) {
    const [result] = await db.pool.execute(
      "INSERT INTO classes (Name, AcademicYear, RoomNumber) VALUES (?, ?, ?)",
      [Name, AcademicYear, RoomNumber]
    );
    return { ClassID: result.insertId, Name, AcademicYear, RoomNumber };
  }

  async updateClass(id, Name, AcademicYear, RoomNumber) {
    const [result] = await db.pool.execute(
      "UPDATE classes SET Name = ?, AcademicYear = ?, RoomNumber = ? WHERE ClassID = ?",
      [Name, AcademicYear, RoomNumber, id]
    );
    if (result.affectedRows === 0) return null;
    return { ClassID: id, Name, AcademicYear, RoomNumber };
  }

  async deleteClass(id) {
    const [result] = await db.pool.execute(
      "DELETE FROM classes WHERE ClassID = ?",
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = new ClassRepository();
