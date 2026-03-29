import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config.js";
import { Org } from "./db.js";
import mongoose from "mongoose";

export const authMiddleware = (req, res, next) => {
    try{

        const token  = req.headers.token;
        // const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, JWT_SECRET);

        if(!decoded){
            res.status(401).json({
                message: "invalid token!!"
            })
            return;
        }
    
        const userId = decoded.userId;
        req.userId = userId;
        next();

    }
    catch(err){
        res.status(500).json({
            error: err
        })
    }

}



 export const adminMiddleware = async (req, res, next) => {
    let orgId = req.params.orgId
    if(!mongoose.Types.ObjectId.isValid(orgId)){
        res.status(400).json({
            message: "invalid orgId!!"
        })
        return
    }
    try{

        const org = await Org.findById(orgId);
        if(!org){
            res.status(404).json({
                message: "org does not exist",
            })
            return;
        }

        if(org.adminId.toString() !== (req.userId)){
            res.status(403).json({
                message: "user is not admin of this org"
            })
            return;
        }
    
        req.org = org;
        next();
    }
    catch(err){
         res.status(500).json({
            message: "Internal server error",
            error: err.message
        });
    }

 }
