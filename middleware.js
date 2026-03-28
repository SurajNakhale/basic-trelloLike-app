import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config.js";

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



 export const adminMiddleware = (req, res, next) => {
    let orgId = Number(req.query.orgId);

    const org = ORGNISATIONS.find(org => org.id == orgId);

    if(!org){
        res.status(400).json({
            message: "org does not exist",
        })
        return;
    }


    if(org.adminId != req.userId){
        res.status(401).json({
            message: "user is not admin of this org"
        })
        return;
    }

    req.orgId = orgId;
    next();

 }
