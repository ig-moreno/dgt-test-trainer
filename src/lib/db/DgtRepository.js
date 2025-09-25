import {IndexedDBService} from "./IndexedDBService.js";

class DgtRepository {
  constructor() {
    this.dbService = new IndexedDBService("DGTTestDB", 1);
  }

  async init() {
    await this.dbService.init([
      { name: "questions", options: { keyPath: "id" } },
      { name: "results", options: { keyPath: "id", autoIncrement: true } },
      { name: "progress", options: { keyPath: "user" } }
    ]);
  }

  // --- QUESTIONS ---
  async saveQuestion(question) {
    return this.dbService.add("questions", question);
  }

  async findQuestionById(id) {
    return this.dbService.get("questions", id);
  }

  async findAllQuestions() {
    return this.dbService.getAll("questions");
  }

  async updateQuestion(question) {
    return this.dbService.update("questions", question);
  }

  async removeQuestion(id) {
    return this.dbService.delete("questions", id);
  }

  // --- RESULTS ---
  async saveResult(result) {
    return this.dbService.add("results", result);
  }

  async findAllResults() {
    return this.dbService.getAll("results");
  }

  // --- PROGRESS ---
  async saveProgress(user, progress) {
    return this.dbService.update("progress", { user, ...progress });
  }

  async findProgressByUser(user) {
    return this.dbService.get("progress", user);
  }
}

export default DgtRepository;
