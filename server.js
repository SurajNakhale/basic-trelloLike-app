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
//retrives boards org have http://localhost:3000/dashboard?orgId=2
app.get("/dashboard", authMiddleware,  (req, res) => {
    const userId = req.userId;
    const orgId = req.query.orgId;

    let org = ORGANISATIONS.find(x => x.id == orgId);
    
    if(!org || org.adminId != userId){
        res.status(400).json({
            message: "org does not exist or not valid admin"
        })
        return;
    }

    let organisation = {
            ...org,
            members: org.members.map(memberId => {
                const user = USERS.find(user => user.id == memberId);
                return {
                    id: user.id,
                    username: user.username
                }
            })
    }

    let boards = [];
    for(let i=0; i<BOARDS.length; i++){
        if(BOARDS.orgId == orgId){
            boards.push({
                id: BOARDS[i].id,
                title: BOARDS[i].title,
            });
        }
    }
    
    
    res.status(200).json({
        organisation: organisation,
        boards: boards
    })
})

//retrives board with id http://localhost:3000/board?id=2
app.get("/board", authMiddleware, (req, res) => {
    let userId = req.userId;
    let boardId = req.query.id;

    let boardExists = BOARDS.find(x => x.id == boardId);

    if(!boardExists){
        res.status(400).json({
            message: "board does not exist"
        })
        return;
    }

    let issues = [];
    for(let i=0; i<ISSUES.length; i++){
        if(ISSUES[i].boardId == boardId){
            issues.push({
                id: ISSUES[i].id,
                title: ISSUES[i].title,
                status: ISSUES[i].status,
            })
        }
    }

    res.status(200).json({
        issues: issues
    })

})

//get all members in org http://localhost:3000/members?orgId=2
app.get("/members", authMiddleware,  (req, res) => {
    const uerId = req.userId;
    const orgId = req.query.orgId;

    let orgExist = ORGANISATIONS.find(x => x.id == orgId);
    if(!orgExist){
        res.status(400).json({
            message: "org not exists"
        })
        return;
    }
    let member = [];

    for(let i=0; i<orgExist.members.length; i++){
        let userId = orgExist.members[i];
        let user = USERS.find(x => x.id == userId);

        member.push({
            id: user.id,
            username: user.username
        })
    }

    res.status(200).json({
        members: member
    })
    
})


//update board //http://localhost:3000/board?boardId=1
app.put("/board", authMiddleware, (req, res) => {
    const boardId = req.query.boardId;

    const boardExists = BOARDS.find(x => x.id == boardId);
    if(!boardExists){
        res.status(400).json({
            message: "board does not exists"
        })
        return;
    }

    const { title } = req.body;

    boardExists = {
        id: boardExists.id,
        title: title,
        orgId: boardExists.orgId
    }

    res.status(200).json({
        message: "board updated",
        boardId: boardExists.id
    })


})

// http://localhost:3000/issue?id=1
app.put("/issue", authMiddleware,  (req, res) => {
    const issueId = req.query.id;
    
    const issueExists = ISSUES.find(x=> x.id == issueId);
    if(!issueExists){
        res.status(400).json({
            message: "does not exists"
        })
        return;
    }

    const { status } = req.body;

    issueExists = {
        id: issueExists,
        title: issueExists.title,
        status: status,
        boardId: issueExists.boardId
    }


    res.status(400).json({
        message: "issue updated",
        title: userExist.title,
        status: userExist.status
    })
    
    

})



//delete endpoints http://localhost:3000/board?id=2;
app.delete("/board", (req, res) => {
    const boardId = req.query.id;

    const boardExists = BOARDS.find(x => x.id == boardId);
    if(!boardExists){
        res.status(400).json({
            message: "board does not exists"
        })
        return;
    }

    BOARDS = BOARDS.filter(x => x.id != boardExists.id)

    res.status(200).json({
        message: "boards deleted",
        id: boardExists.id,
        title: boardExists.title
    })
})

//http://localhost:3000/org/:id/member/:memberId
app.delete("/org/:id/member/:memberId", adminMiddleware, (req, res) => {
    const memberId = Number(req.query.id);

    //find org id
    let org = ORGANISATIONS.find(x => x.id = req.orgId )

    if(!org || !org.member.includes(memberId)){
        res.status(400).json({
            message: "org does not exist or member not exist",
        })
        return;
    }

    org.members = org.members.filter(x => x != memberId)

    res.status(200).json({
        message: "member deleted",
        members: org.members
    })

})


//http://localhost:3000/org/:orgId/board/:boardId/issue/:issueId
app.delete("/org/:orgId/board/:boardId/issue/:issueId", adminMiddleware, (req, res) => {
    const orgId = req.orgId;
    const boardId = Number(req.params.boardId);
    const issueId = Number(req.params.issueId);

    let org = ORGANISATIONS.find(x => x.id == orgId);
    if(!org){
        res.status(400).json({
            message: "org not exists"
        })
        return;
    }

    let board = BOARDS.find(x => x.orgId == orgId && x.id == boardId);
    if(!board){
        res.status(400).json({
            message: "board not exist"
        })
        return;
    }


    ISSUES = ISSUES.filter(x => 
        !(x.boardId == boardId && x.id == issueId)
    )

    res.status(200).json({
        message: "issue deleted successfully"
    })

})


app.listen(3000, () => {
    console.log("server running on port 3000");
})