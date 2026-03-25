import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config.js";
import { adminMiddleware, authMiddleware } from "./middleware.js";

let USERS = [
    // {
    //     id: 1,
    //     username: "jin",
    //     password: "123@jin",
    // },
    // {
    //     id: 2,
    //     username: "raze",
    //     password: "123@raze"
    // }
]

let ORGANISATIONS = [
    // {
    //     id: 1,
    //     title: "100xdevs",
    //     adminId: 1,
    //     members: [1, 2]
    // },
    // {
    //     id: 2,
    //     title: "xyzorg",
    //     adminId: 2,
    //     members: []
    // }
]

let BOARDS = [
    // {
    //     id: 1,
    //     orgId: 1,
    //     title: "ios backend"
    // },
    // {
    //     id: 2,
    //     orgId: 1,
    //     title: "frontend"
    // }
]

let ISSUES = [
    // {   
    //     id: 1,
    //     title: "add toggle dark mode function",
    //     boardId: 1,
    //     status: "IN_PROGRESS" // TODO || IN_PROGRESS || DONE || ARCHIVE
    // }
]

let USERID = 0;
let ORGANISATIONSID = 0;
let BOARDSID = 0;
let ISSUESID = 0;

const app = express();

app.use(express.json());
console.log("hither")
//create endpoints
app.post("/signup", (req, res) => {
    let { username, password } = req.body;
    console.log(username)
    let userExist = USERS.find(u => u.username = username);
    if(userExist){
        res.status(400).json({
            message: "user exists"
        });
        return;
    }

    USERS.push({
        id: USERID++,
        username,
        password
    })

    res.status(200).json({
        message: "signup successfull"
    })

})

app.post("/signin", (req, res) => {
    let { username, password } = req.body;

    let userExist = USERS.find(u => u.username == username && u.password == password);

    if(!userExist){
        res.status(400).json({
            message: "user does not exists"
        });
        return;
    }

    const token = jwt.sign({
        id: userExist.id
    }, JWT_SECRET)

    res.status(200).json({
        token: token
    })
})

//user can create org
app.post("/orgs",authMiddleware, (req, res) => {
    const { title, description } = req.body;
    let userId = req.userId;

    let orgExist = ORGANISATIONS.find(org => org.title == title && org.description == description);
    if(orgExist){
        res.status(400).json({
            message: "already exist"
        });
        return;
    }

    const newOrg = {
        id: ORGANISATIONSID++,
        title,
        description,
        adminId: userId,
        members: []
    }

    ORGANISATIONS.push(newOrg)

    res.status(200).json({
        message: "org created",
        id: newOrg.id
    })

})

//add members to the org  http://localhost:3000/add-member?OrgId=2
app.post("/add-members", authMiddleware, adminMiddleware, (req, res) => {
    const userId = req.userId;
    const orgId = req.query.orgId;

    const org = ORGANISATIONS.find(org => org.id == orgId);

    if(!org){
        res.status(400).json({
            message: "org not exists"
        })
        return;
    }

    if(!org.members.include(userId)){
        org.members.push(userId);
    }

    res.status(200).json({
        message: "new member added",
        id: userId
    })

})

//create board http://localhost:3000/boards?orgId=1
app.post("/boards",authMiddleware, adminMiddleware, (req, res) => {
    const orgId = req.query.orgId;
    const { title } = req.body;

    let boardExists = BOARDS.find(b => b.title == title && b.orgId == orgId);
    if(boardExists){
        res.status(400).json({
            message: "board already exists"
        })
        return;
    }

    let newBoard = {
        id: BOARDSID++,
        orgId,
        title
    }

    BOARDS.push(newBoard);

    res.status(200).json({
        message: "new board added"
    })

})

//create issues http://localhost:3000/issues?boardId=2
app.post("/issues", authMiddleware, (req, res) => {
    const boardId = req.query.boardId;

    const board = BOARDS.find(b => b.id == boardId);

    if (!board) {
        return res.status(400).json({
            message: "board does not exist"
        });
        
    }

    const { title } = req.body;

    let issueExists = ISSUES.find(i => i.title == title && i.boardId == boardId);
    if(issueExists){
        res.status(400).json({
            message: "issue already exists"
        })
        return;
    }

    let newIssue = {
        id: ISSUESID++,
        boardId,
        title,
        status: "UP_NEXT" // "IN_PROGRESS" || "DONE" || "ARCHIVE"
    }

    ISSUES.push(newIssue);

    res.status(200).json({
        message: "new issue created",
        issues: newIssue
    })
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


app.listen(3000, () => {
    console.log("server running on port 3000");
})