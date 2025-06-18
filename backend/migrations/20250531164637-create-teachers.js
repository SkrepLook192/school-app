"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Teachers", {
      TeacherID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      FullName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ClassroomNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      UserID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "UserID"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Teachers");
  }
};
