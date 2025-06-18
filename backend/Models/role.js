const db = require('../db');

class Role {
  static async create(roleName) {
    const [result] = await db.query(
      'INSERT INTO Roles (RoleName) VALUES (?)',
      [roleName]
    );
    return { RoleID: result.insertId, RoleName: roleName };
  }

  static async findAll() {
    const [roles] = await db.query('SELECT * FROM Roles');
    return roles;
  }

  static async findById(roleId) {
    const [roles] = await db.query(
      'SELECT * FROM Roles WHERE RoleID = ?',
      [roleId]
    );
    return roles[0];
  }
}

module.exports = Role;