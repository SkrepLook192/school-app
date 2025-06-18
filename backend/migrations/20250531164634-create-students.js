"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Students", {
      StudentID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      FullName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      ClassID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Classes",
          key: "ClassID"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
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
    await queryInterface.dropTable("Students");
  }
};
