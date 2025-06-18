// backend/services/observer/adminObserver.js
class AdminObserver {
  constructor(role) {
    this.role = role;
  }

  update(message) {
    console.log(`${this.role} получил уведомление: ${message}`);
  }
}

module.exports = AdminObserver;
