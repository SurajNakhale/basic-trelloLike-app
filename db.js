import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    username: {type: String, required: true},
    password: String
})


const orgSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: String,
    adminId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
}, {timestamps: true})



const boardSchema = new mongoose.Schema({
    title: {type: String, required: true},
    orgId: {type: mongoose.Schema.Types.ObjectId, ref: 'Org'}
}, {timestamps: true})


let status = ["IN_PROGRESS", "UP_NEXT", "DONE", "ARCHIVE"];

const issueSchema = new mongoose.Schema({
    title: {type: String, required: true},
    boardId: {type: mongoose.Schema.Types.ObjectId, ref: 'Board'},
    status: {type: String, enum: status, default: 'UP_NEXT'}
}, {timestamps: true})


export const User = mongoose.model('User', userSchema);
export const Org = mongoose.model('Org', orgSchema);
export const Board = mongoose.model('Board', boardSchema);
export const Issue = mongoose.model('Issue', issueSchema);