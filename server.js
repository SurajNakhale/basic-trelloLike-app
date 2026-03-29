import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, DB_URL } from "./config.js";
import { authMiddleware } from "./middleware.js";
import  mongoose  from "mongoose";
import { User, Org, Board, Issue } from "./db.js";

const app = express();


app.use(express.json());
console.log("hithere")


//create endpoints
app.post("/signup", async (req, res) => {
    let { username, password } = req.body;
    console.log(username);

    try{
        let userExist = await User.findOne({ username });
        if(userExist){
            res.status(400).json({
                message: "user exists"
            });
            return;
        }
    
        await User.create({
            username,
            password
        })
    
        res.status(200).json({
            message: "signup successfull"
        })
    }
    catch(err){
        res.status(500).json({
            error: err
        })
    }

})

app.post("/signin", async (req, res) => {
    let { username, password } = req.body;

    try{
        let userExist = await User.findOne({ username, password});

        if(!userExist){
            res.status(400).json({
                message: "user does not exists"
            });
            return;
        }

        const token = jwt.sign({
            userId: userExist._id
        }, JWT_SECRET)

        res.status(200).json({
            token: token
        })

    }
    catch(err){
        res.status(500).json({
            error: err
        })
    }
})

//user can create org
app.post("/orgs", authMiddleware, async (req, res) => {
    const { title, description } = req.body;
    let userId = req.userId;

    try{
        let orgExist =await Org.findOne({ title, description });
        if(orgExist){
            res.status(400).json({
                message: "already exist"
            });
            return;
        }
    
        let newOrg = await Org.create({
            title,
            description,
            adminId: userId,
            members: [userId]
        })
    
        res.json({
            message: "org created",
            id: newOrg._id
        })
    }
    catch(err){
        res.status(500).json({
            error: err.message
        })
    }

})

//add members to the org 
app.post("/org/:orgId/add-members/:id", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const orgId = req.params.orgId;
    const id = req.params.id

    try{
        let org = await Org.findById(orgId);
        if(!org){
            res.status(400).json({
                message: "org not exists"
            })
            return;
        }

        let valid = await User.findById(id);
        if(!valid){
            res.status(400).json({
                message: "user does not exists"
            })
            return;
        }
        
        await Org.updateOne(
            {_id: orgId},
            { $addToSet: {members: id}}
        );

        res.json({
            message: "new member added",
            id: id,
            username: valid.username
        })
    }
        catch(err){
            res.status(500).json({
                error: err.message
            })
        }

})

//create board 
app.post("/org/:orgId/board",authMiddleware, async (req, res) => {
    const orgId = req.params.orgId;
    const { title } = req.body;
    try{
        let org = await Org.findById(orgId);
        if(!org){
            res.status(400).json({
                message: "org not exists"
            })
            return;
        }


        let boardExists = await Board.findOne({ title, orgId: org._id});
        if(boardExists){
            res.status(400).json({
                message: "board already exists"
            })
            return;
        }

        let newBoard = await Board.create({
            title,
            orgId: org._id
        })

        res.status(200).json({
            message: "new board added",
            id: newBoard._id,
            title: newBoard.title
        })
    }
    catch(err){
         res.status(500).json({
                error: err.message
         })
    }

})

//create issues
app.post("/org/:orgId/board/:boardId/issues", authMiddleware, async(req, res) => {
    const orgId = req.params.orgId;
    const boardId = req.params.boardId;

    try{

        let org = await Org.findById(orgId);
       if(!org){
           res.status(400).json({
               message: "org not exists"
           })
           return;
       }
   
       const board = await Board.findById(boardId);
       if (!board) {
           return res.status(400).json({
               message: "board does not exist"
           });
           
       }
   
       const { title, status } = req.body;
        let validstatus = ["IN_PROGRESS", "UP_NEXT", "DONE", "ARCHIVE"];

        if(!validstatus.includes(status)){
            res.status(400).json({
                message: "invalid status code"
            })
            return;
        }

       let issueExists = await Issue.findOne({ title, boardId});
       if(issueExists){
           res.status(400).json({
               message: "issue already exists"
           })
           return;
       }
       
       let newIssue = await Issue.create({
           title,
           boardId,
           status
       })
   
       res.status(200).json({
           message: "new issue created",
           issues: newIssue
       })
    }
    catch(err){
        res.status(500).json({
                error: err.message
         })
    }

})


//get endpoints
//retrives boards org have 
app.get("/org/:orgId/dashboard", authMiddleware,  (req, res) => {
    const userId = req.userId;
    const orgId = Number(req.params.orgId);

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
        if(BOARDS[i].orgId == orgId){
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

//retrives board with id display board details along with issues
app.get("/org/:orgId/board/:boardId", authMiddleware, (req, res) => {
    let orgId = Number(req.params.orgId);
    let boardId = Number(req.params.boardId);

    let boardExists = BOARDS.find(x => x.id == boardId);
    if(!boardExists){
        res.status(400).json({
            message: "board does not exist"
        })
        return;
    }

    // let issues = [];
    // for(let i=0; i<ISSUES.length; i++){
    //     if(ISSUES[i].boardId == boardId){
    //         issues.push({
    //             id: ISSUES[i].id,   
    //             title: ISSUES[i].title,
    //             status: ISSUES[i].status,
    //         })
    //     }
    // }

    let issues = ISSUES
                .filter(x => x.boardId == boardId)
                .map(x => {
                    return {
                        id: x.id,
                        title: x.title,
                        status: x.status
                    }
                })

    res.status(200).json({
        issues: issues
    })

})

//get all members in org 
app.get("/org/:orgId/members", authMiddleware,  (req, res) => {
    const uerId = req.userId;
    const orgId = Number(req.params.orgId);

    let orgExist = ORGANISATIONS.find(x => x.id == orgId);
    if(!orgExist){
        res.status(400).json({
            message: "org not exists"
        })
        return;
    }

    // let member = [];
    // for(let i=0; i<orgExist.members.length; i++){
    //     let userId = orgExist.members[i];
    //     let user = USERS.find(x => x.id == userId);

    //     member.push({
    //         id: user.id,
    //         username: user.username
    //     })
    // }

    let members = orgExist.members.map(m => {
        let user = USERS.find(x => x.id == m);
        return {
            id: user.id,
            username: user.username
        }
    })

    res.status(200).json({
        members: members
    })
    
})


//update board
app.put("/org/:orgId/board/:boardId", authMiddleware, (req, res) => {
    const boardId = Number(req.params.boardId);
    const orgId = Number(req.params.orgId);

    let index = BOARDS.findIndex(x => x.id == boardId && x.orgId == orgId);
    if(index == -1){
        res.status(400).json({
            message: "board does not exists"
        })
        return;
    }

    const { title } = req.body;

    BOARDS[index] = {
        ...BOARDS[index],
        title
    }

    res.status(200).json({
        message: "board updated",
        boardId: BOARDS[index].id
    })


})

//update issue status
app.put("/org/:orgId/board/:boardId/issue/:issueId", authMiddleware,  (req, res) => {
    const orgId = Number(req.params.orgId);
    const boardId = Number(req.params.boardId);
    const issueId = Number(req.params.issueId);
    
    const index = ISSUES.findIndex(x=> x.id == issueId && x.boardId == boardId);
    if(index == -1){
        res.status(400).json({
            message: "does not exists"
        })
        return;
    }

    const { status } = req.body;

    ISSUES[index] = {
        ...ISSUES[index],
        status
    }


    res.status(200).json({
        message: "issue updated",
        title: ISSUES[index].title,
        status: ISSUES[index].status
    })

})



//delete endpoints board
app.delete("/org/:orgId/board/:boardId",authMiddleware, (req, res) => {
    const boardId = Number(req.params.boardId);

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

//delete member of board
app.delete("/org/:orgId/member/:memberId",authMiddleware, (req, res) => {
    const memberId = Number(req.params.memberId);
    const orgId = Number(req.params.orgId)

    //find org id
    let org = ORGANISATIONS.find(x => x.id == orgId )

    if(!org || !org.members.includes(memberId)){
        res.status(400).json({
            message: "org does not exist or member not exist",
        })
        return;
    }

    org.members = org.members.filter(x => x !== memberId)

    res.status(200).json({
        message: "member deleted",
        members: org.members
    })

})


//delete issue 
app.delete("/org/:orgId/board/:boardId/issue/:issueId", authMiddleware, (req, res) => {
    const orgId = Number(req.params.orgId);
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

async function main(){
    try{
        await mongoose.connect(DB_URL);
        console.log("mongodb connected!!");

        app.listen(3000, () => {
            console.log("server running on port 3000");
        })
    }
    catch(err){
        console.log(err)
    }
}

main();