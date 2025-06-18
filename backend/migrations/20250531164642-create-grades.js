"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Grades", {
      GradeID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      StudentID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Students",
          key: "StudentID"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      SubjectID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Subjects",
          key: "SubjectID"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      GradeValue: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      Comment: {
        type: Sequelize.STRING,
        allowNull: true
      },
      Quarter: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      DateIssued: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Grades");
  }
};
