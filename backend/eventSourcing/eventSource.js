const connect = require("./database.js");
const {ObjectId} = require("mongodb");

module.exports = class EventSource {

    async getLatestFromRead(collection, id) {
        console.log("Get Document - Collection: " + collection + " | " + "id: " + id)
        const dbReadConnect = connect.getReadDb();
        let db = dbReadConnect.collection(collection)
        return await db.find({"_id": ObjectId(id)}).toArray()
    }

    async getNewEvents(collection, id, document) {
        console.log("Get Events -  Collection: " + collection + " | " + "id: " + id + " | " + "Document: " + document.length)
        const dbWriteConnect = connect.getWriteDb();
        let db = dbWriteConnect.collection(collection)
        if (document.length !== 0) {
            return await db.find({"_id": ObjectId(id), "Created": {$gt: document.lastUpdated}}).toArray()
        } else {
            return await db.find({"_id": ObjectId(id)}).toArray()
        }
    }

    updateRead(collection, id, document) {
        console.log("Update - Collection: " + collection + " | " + "id: " + id)
        const dbReadConnect = connect.getReadDb();
        let db = dbReadConnect.collection(collection)
        if (Object.keys(document).length === 0) {
            console.log("Remove")
            db.remove({"_id": ObjectId(id)})
        } else {
            db.updateOne({"_id": ObjectId(id)}, {$set: document}, function (err, res) {
                console.log("Update")
                if (err) {
                    console.log(err)
                } else {
                    console.log(res)
                }
            })
        }
    }

    createRead(collection, id, document) {
        console.log("Create - Collection: " + collection + " | " + "id: " + id)
        const dbReadConnect = connect.getReadDb();
        let db = dbReadConnect.collection(collection)
        if (Object.keys(document).length !== 0) {
            db.insertOne(document)
        }
    }

    async makeChanges(collection, id, reduceFN) {
        let post = await this.getLatestFromRead(collection, id)
        let store = await this.getNewEvents(collection, id, post)
        let compile
        if (store.length !== 0) {
            if (post.length !== 0) {
                compile = reduceFN(store, post)
                console.log(compile)
                this.updateRead(collection, id, compile)
            } else {
                compile = reduceFN(store)
                console.log(compile)
                this.createRead(collection, id, compile)
            }
        }
    }

    push(id){
        this.updateList.push(id)
    }

    async updateDatabase(collection, reduceFN) {
        // let id
        // while ((id = this.updateList.pop()) !== undefined) {
        //     this.makeChanges(collection, id, reduceFN)
        // }
        let promises = this.updateList.map((id) => {
            return this.makeChanges(collection, id, reduceFN)
        })
        await Promise.all(promises)
    }

    constructor() {
        this.updateList = []
    }
}