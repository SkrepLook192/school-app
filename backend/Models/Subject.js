const db = require('../db');

class Subject {
    static async create(name) {
      const [result] = await db.query(
        'INSERT INTO Subjects (Name) VALUES (?)',
        [name]
      );
      return { SubjectID: result.insertId, Name: name };
    }
  
    static async findAll() {
      const [subjects] = await db.query('SELECT * FROM Subjects');
      return subjects;
    }
  }
  
  module.exports = Subject;