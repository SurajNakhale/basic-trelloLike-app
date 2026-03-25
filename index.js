import express from "express";

let USERS = [
    {
        id: 1,
        username: "jin",
        password: "123@jin",
    },
    {
        id: 2,
        username: "raze",
        password: "123@raze"
    }
]

let ORGANISATION = [
    {
        id: 1,
        title: "100xdevs",
        adminId: 1,
        members: [1, 2]
    },
    {
        id: 2,
        title: "xyzorg",
        adminId: 2,
        members: []
    }
]

let BOARD = [
    {
        id: 1,
        orgId: 1,
        title: "ios backend"
    },
    {
        id: 2,
        orgId: 1,
        title: "frontend"
    }
]

let ISSUE = [
    {   
        id: 1,
        title: "add toggle dark mode function",
        boardId: 1,
        status: "IN_PROGRESS" // TODO || IN_PROGRESS || DONE || ARCHIVE
    }
]

const app = express();

//create endpoints
app.post("/signup", (req, res) => {

})

app.post("/signin", (req, res) => {

})

//user can create
app.post("/orgs", (req, res) => {

})

//add members to the org
app.post("/add-members", (req, res) => {

})

//create board
app.post("/boards", (req, res) => {

})

//create issues
app.post("/issues", (req, res) => {

})


//get endpoints
//retrives boards org have
app.get("/dashboard", (req, res) => {

})

//retrives board with id
app.get("/board/:Id", (req, res) => {

})

//get all members in org
app.get("/members", (req, res) => {

})


//update board
app.put("/board", (req, res) => {

})

app.put("/issue", (req, res) => {

})



//delete endpoints
app.delete("/board", (req, res) => {

})

app.delete("/member", (req, res) => {

})

app.delete("/issue", (req, res) => {

})


app.post("")










app.listen(3000, () => {
    console.log("server running on port 3000");
})