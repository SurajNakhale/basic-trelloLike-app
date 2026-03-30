import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, DB_URL } from "./config.js";
import { authMiddleware, adminMiddleware } from "./middleware.js";
import  mongoose  from "mongoose";
import { User, Org, Board, Issue } from "./db.js";
import bcrypt from "bcrypt";

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
        //hash password
        let hashpass =await bcrypt.hash(password, 10);
    
        await User.create({
            username,
            password: hashpass
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

        let userExist = await User.findOne({ username });

        if(!userExist){
            res.status(400).json({
                message: "user does not exists"
            });
            return;
        }
        //compare password
        let isMatch =await bcrypt.compare(password, userExist.password);
        if(!isMatch){
            res.status(401).json({
                message: "pass incorrect"
            })
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
app.post("/org/:orgId/board",authMiddleware, adminMiddleware,  async (req, res) => {
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
app.post("/org/:orgId/board/:boardId/issues", authMiddleware, adminMiddleware, async(req, res) => {
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
app.get("/org/:orgId/dashboard", authMiddleware, adminMiddleware, async (req, res) => {
    const orgId = req.params.orgId;
    try{

        let org = await Org.findById(orgId)
            .populate("members", "username")
            .lean();
        
        let oresult = {
            id: org._id,
            title: org.title,
            description: org.description,
            members: org.members.map(x => {
                return {
                    id: x._id,
                    username: x.username
                }
            })
        }

        let boards = await Board.find({ orgId: orgId }).select("title").lean();
        let bresult = boards.map(x => ({
            id: x._id,
            title: x.title
        }))
        
        res.json({
            organisation: oresult,
            boards: bresult
        })
    }
    catch(err){
         res.status(500).json({
                error: err.message
         })
    }
})

//retrives board with id display board details along with issues
app.get("/org/:orgId/board/:boardId", authMiddleware, adminMiddleware, async (req, res) => {
    let { orgId, boardId } = req.params;

    try{

        let board = await Board.findOne({ _id: boardId, orgId});
        if(!board){
            res.status(400).json({
                message: "board does not exist"
            })
            return;
        }
    
        let issues = await Issue.find({ boardId }).select("title status").lean()
        let rissue = issues.map(x => ({
            id: x._id,
            title: x.title,
            status: x.status
        }))
    
        res.status(200).json({
            issues: rissue
        })
    }
    catch(err){
          res.status(500).json({
                error: err.message
         })
    }

})

//get all members in org 
app.get("/org/:orgId/members", authMiddleware,adminMiddleware,  async (req, res) => {
    const orgId = req.params.orgId;
    try{

        let org = await Org.findOne({ _id: orgId }).populate("members", "username").lean();
        if(!org){
            res.status(400).json({
                message: "org not exists"
            })
            return;
        }
    
        let members = org.members.map(x => ({
            id: x._id,
            username: x.username
        }))
    
        res.status(200).json({
            members: members
        })
    }
    catch(err){
             res.status(500).json({
                error: err.message
         })
    }
    
})


//update board
app.put("/org/:orgId/board/:boardId", authMiddleware, adminMiddleware, async (req, res) => {
    const boardId = req.params.boardId;
    const org = req.org;
    try{

        let board = await Board.findById({ _id: boardId, orgId: org._id});
        if(!board){
            res.status(400).json({
                message: "board does not exists"
            })
            return;
        }
    
        const { title } = req.body;
    
        await Board.updateOne({_id: board._id}, {$set: {title: title}})
        
        res.status(200).json({
            message: "board updated",
            boardId: board._id
        })
    }
    catch(err){
            res.status(500).json({
                error: err.message
         })
    }


})

//update issue status
app.put("/org/:orgId/board/:boardId/issue/:issueId", authMiddleware, adminMiddleware, async  (req, res) => {
    const boardId = req.params.boardId;
    const issueId = req.params.issueId;
    const { status } = req.body;
    let valid = ["UP_NEXT", "IN_PROGRESS", "DONE", "ARCHIVE"];
    if(!valid.includes(status)){
        res.status(401).json({
            message: "in valid status input!!"
        })
    }
    
    
    try{

        let issue = await Issue.findByIdAndUpdate(issueId, 
            {$set: {status: status}},
            {new: true}
        ).lean();
    
        res.status(200).json({
            message: "issue updated",
            title: issue.title,
            status: issue.status
        })
    }
    catch(err){
          res.status(500).json({
                error: err.message
         })
    }

})



//delete endpoints board
app.delete("/org/:orgId/board/:boardId",authMiddleware, adminMiddleware, async (req, res) => {
    const boardId = req.params.boardId;

    try{

        const board = await Board.findOneAndDelete({ _id: boardId, orgId: req.org._id});
        if(!board){
            res.status(400).json({
                message: "board does not exists"
            })
            return;
        }
    
        res.status(200).json({
            message: "boards deleted",
            board: board
        })
    }
    catch(err){
          res.status(500).json({
                error: err.message
         })
    }
})

//delete member of org
app.delete("/org/:orgId/member/:memberId",authMiddleware, adminMiddleware,  async (req, res) => {
    const memberId = req.params.memberId;
    const org = req.org;
   
    try{

        let result = await Org.updateOne({_id: org._id}, {$pull: {members: memberId}})
         if (result.modifiedCount === 0) {
            return res.status(404).json({
                message: "Member not found"
            });
        }
    
        res.status(200).json({
            message: "member removed",
            
        })
    }
    catch(err){
         res.status(500).json({
                error: err.message
         })
    }

})


//delete issue 
app.delete("/org/:orgId/board/:boardId/issue/:issueId", authMiddleware, adminMiddleware, async (req, res) => {
    const boardId = req.params.boardId;
    const issueId = req.params.issueId;

    try{
    
        let issue = await Issue.findOneAndDelete({_id: issueId, boardId: boardId});

        if(!issue){
            res.status(404).json({
                message: "issue does not exists"
            })
            return;
        }

        
        res.json({
            message: "issue deleted successfully"
        })
    }
    catch(err){
        res.status(500).json({
                error: err.message
         })
    }

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