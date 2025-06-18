"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      UserID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      Username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      PasswordHash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      Role: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Users");
  }
};
