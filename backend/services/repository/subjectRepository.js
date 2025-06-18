const db = require('../../db');

class SubjectRepository {
  // получить постранично список предметов + общее число
  async getAllSubjects(page = 1, limit = 10, search = '') {
    console.log('Ищу предметы в БД, page,limit,search ->', page, limit, search);

    const offset = (page - 1) * limit;
    let base = 'FROM subjects s JOIN teachers t ON s.TeacherID = t.TeacherID WHERE 1=1';
    const params = [];

    if (search) {
      base += ' AND s.Name LIKE ?';
      params.push(`%${search}%`);
    }

    // подсчёт общего числа
    const countSql = `SELECT COUNT(*) AS count ${base}`;
    const [[{ count: totalCount }]] = await db.pool.execute(countSql, params);

    // получение страницы
    const dataSql = `
      SELECT 
        s.SubjectID,
        s.Name,
        s.TeacherID,
        t.FullName AS TeacherName
      ${base}
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;
    const [rows] = await db.pool.execute(dataSql, params);
    console.log('Получил предметы:', rows);

    return { subjects: rows, totalCount };
  }

  async getById(id) {
    const [rows] = await db.pool.execute(
      `SELECT s.SubjectID, s.Name, s.TeacherID, t.FullName AS TeacherName
       FROM subjects s JOIN teachers t ON s.TeacherID = t.TeacherID
       WHERE s.SubjectID = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async create(name, teacherId) {
    const [res] = await db.pool.execute(
      'INSERT INTO subjects (Name, TeacherID) VALUES (?, ?)',
      [name, teacherId]
    );
    return { SubjectID: res.insertId, Name: name, TeacherID: teacherId };
  }

  async update(id, name, teacherId) {
    const [res] = await db.pool.execute(
      'UPDATE subjects SET Name = ?, TeacherID = ? WHERE SubjectID = ?',
      [name, teacherId, id]
    );
    if (res.affectedRows === 0) return null;
    return { SubjectID: id, Name: name, TeacherID: teacherId };
  }

  async delete(id) {
    const [res] = await db.pool.execute(
      'DELETE FROM subjects WHERE SubjectID = ?',
      [id]
    );
    return res.affectedRows > 0;
  }
}

module.exports = new SubjectRepository();
