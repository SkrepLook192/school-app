const db = require('../../db');

class GradeRepository {
  async getAll() {
    try {
      const [rows] = await db.pool.query(`
        SELECT 
          g.GradeID,
          g.GradeValue,
          g.StudentID,
          g.SubjectID,
          g.Quarter,
          s.Name AS SubjectName
        FROM Grades g
        LEFT JOIN Subjects s ON g.SubjectID = s.SubjectID
      `);
      return rows;
    } catch (err) {
      console.error("Ошибка при получении оценок:", err);
      throw { message: "Ошибка при получении оценок" };
    }
  }

  async createGrade(grade) {
    const { GradeValue, StudentID, SubjectID } = grade;
    // ставим «по-умолчанию» первую четверть
    const Quarter = grade.Quarter ?? 1;

    const [result] = await db.pool.query(
      // прокидываем Quarter и подставляем NOW() в DateIssued
      `INSERT INTO Grades
         (GradeValue, StudentID, SubjectID, Quarter, DateIssued)
       VALUES (?, ?, ?, ?, NOW())`,
      [GradeValue, StudentID, SubjectID, Quarter]
    );

    return {
      GradeID: result.insertId,
      GradeValue,
      StudentID,
      SubjectID,
      Quarter,
      DateIssued: new Date()
    };
  }

  async updateGrade(id, grade) {
    try {
      const { GradeValue, Comment, Quarter } = grade;
      const [result] = await db.pool.query(
        'UPDATE Grades SET GradeValue = ?, Comment = ?, Quarter = ? WHERE GradeID = ?',
        [GradeValue, Comment, Quarter, id]
      );
      
      if (result.affectedRows === 0) {
        throw { message: "Оценка не найдена" };
      }
      
      return { GradeID: id, GradeValue, Comment, Quarter };
    } catch (err) {
      console.error('Ошибка при обновлении оценки:', err);
      throw { message: err.message || "Ошибка при обновлении оценки" };
    }
  }

  async deleteGrade(id) {
    try {
      const [result] = await db.pool.query('DELETE FROM Grades WHERE GradeID = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw { message: "Оценка не найдена" };
      }
      
      return true;
    } catch (err) {
      console.error('Ошибка при удалении оценки:', err);
      throw { message: err.message || "Ошибка при удалении оценки" };
    }
  }
}

module.exports = new GradeRepository();