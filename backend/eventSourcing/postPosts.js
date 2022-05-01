const connect = require("../database.js");
const {ObjectId} = require("mongodb");

let EventSource = require('../eventSource.js');

let store = new EventSource()

exports.postPost = (req, res) => {
    //if(req.session.user){
    //     const dbConnect = connect.getReadDb();
    //
    //     dbConnect
    //     .collection("posts")
    //     .insertOne(req.body);
    //     res.sendStatus(200);
    //}
    //else{
    //     res.status(400).send("Can't POST post, not logged in");
    //}
    if (req.session.user || true) {
        const dbConnect = connect.getWriteDb();

        dbConnect
            .collection("posts")
            .insertOne(req.body)
            .then(async result => {
                store.push(result.insertedId.toString())
            })
            .catch(err => {
                console.log(err)
            });

        res.sendStatus(200);
    } else {
        res.status(400).send("Can't POST post, not logged in");
    }
}

// Post
// {
//     _id
//     Type
//     Title
//     Description
//     UserID
//     imdbID
//     Created
// }

setInterval(async function () {
    await store.updateDatabase("posts", reduce)
    // await delay(1000)
}, 5000);

// async function delay(ms) {
//     return await new Promise(resolve => setTimeout(resolve, ms));
// }

function reduce(eventStore, initial = {}) {
    return eventStore.reduce((post, event) => {
        if (event.Type === 'create') {
            post._id = event._id
            post.Title = event.Title
            post.Description = event.Description
            post.UserID = event.UserID
            post.imdbID = event.imdbID
            post.lastUpdated = event.Created
        } else if (event.Type === 'update') {
            post.Title = event.Title
            post.Description = event.Description
            post.lastUpdated = event.Created
        } else if (event.Type === 'updateTitle') {
            post.Title = event.Title
            post.lastUpdated = event.Created
        } else if (event.Type === 'updateDescription') {
            post.Description = event.Description
            post.lastUpdated = event.Created
        } else if (event.type === 'delete') {
            post = {}
        }
        return post
    }, initial)
}