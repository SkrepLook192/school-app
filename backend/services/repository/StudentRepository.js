const db = require('../../db');

class StudentRepository {
  async getAll() {
    try {
      const [rows] = await db.pool.execute('SELECT * FROM Students');
      return rows;
    } catch (err) {
      console.error("Ошибка при запросе:", err);
      throw { message: "Ошибка при получении студентов" };
    }
  }

  async getById(id) {
    try {
      const [rows] = await db.pool.execute('SELECT * FROM Students WHERE StudentID = ?', [id]);
      return rows[0];
    } catch (err) {
      console.error("Ошибка при запросе:", err);
      throw { message: "Ошибка при получении студента" };
    }
  }

  async createStudent(student) {
    try {
      const { FullName, ClassID, UserID } = student;
      const [result] = await db.pool.execute(
        'INSERT INTO Students (FullName, ClassID, UserID) VALUES (?, ?, ?)',
        [FullName, ClassID, UserID]
      );
      return { StudentID: result.insertId, FullName, ClassID, UserID };
    } catch (err) {
      console.error('Ошибка при добавлении студента:', err);
      throw { message: "Ошибка при создании студента" };
    }
  }

  async updateStudent(id, student) {
    try {
      const { FullName, ClassID, UserID } = student;
      const [result] = await db.pool.execute(
        'UPDATE Students SET FullName = ?, ClassID = ?, UserID = ? WHERE StudentID = ?',
        [FullName, ClassID, UserID, id]
      );
      return { StudentID: id, FullName, ClassID, UserID };
    } catch (err) {
      console.error('Ошибка при обновлении студента:', err);
      throw { message: "Ошибка при обновлении студента" };
    }
  }

  async deleteStudent(id) {
    try {
      const [result] = await db.pool.execute('DELETE FROM Students WHERE StudentID = ?', [id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Ошибка при удалении студента:', err);
      throw { message: "Ошибка при удалении студента" };
    }
  }
}

module.exports = new StudentRepository();