import Dexie from "dexie";
import { REPOSITORY_PUBLIC_URL } from "./utils/Constants";


class DgtTestTrainer {
  constructor() {

}

  async init() {
    console.log("🚀 DgtTestTrainer inicializado");
        this.db = new Dexie("db");

        if(!this.db.tables.length){
          this.initDB();
        }




    
  }

  initDB() {
    this.db.version(2).stores({
          settings: "key" // clave primaria = key
    });

    const questionsData = fetch(REPOSITORY_PUBLIC_URL)
    .then(res => {
      console.log(res)
      return res.json()
    })
    .then(data => {
      console.log("Usuarios:", data);
    })
    .catch(err => console.error("Error cargando archivo:", err));



  }



}

export default DgtTestTrainer;
