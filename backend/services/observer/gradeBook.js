// backend/services/observer/gradeBook.js
class GradeBook {
  constructor() {
    this.observers = [];
  }

  attach(observer) {
    this.observers.push(observer);
  }

  detach(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(message) {
    this.observers.forEach(observer => observer.update(message));
  }
}

module.exports = GradeBook;
