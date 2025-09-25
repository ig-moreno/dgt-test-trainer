import DgtRepository from "./db/DgtRepository";

class DgtTestTrainer {
  constructor() {
    this.repo = new DgtRepository();
    // aquí podrías añadir más servicios en el futuro
    // this.auth = new AuthService();
    // this.stats = new StatsManager();
  }

  async init() {
    await this.repo.init();
    console.log("🚀 DgtTestTrainer inicializado");
  }
}

export default DgtTestTrainer;
