// db.js
import Dexie from "dexie";

const db = new Dexie("db");

export class DB {

    constructor() {
        this.db = db;
        return this.db;
    }

    init(){
        // Definimos la versión y stores
        this.db.version(2).stores({
            users: "++id, name, picture, createdAt", // tabla users
            settings: "key" // clave primaria = key
        });
    }
}


