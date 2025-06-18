// backend/services/strategy/reportContext.js
class ReportContext {
  constructor() {
    this.strategy = null;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async generate() {
    if (!this.strategy) {
      throw new Error("Стратегия не выбрана.");
    }
    return await this.strategy.generate();
  }
}

module.exports = ReportContext;
