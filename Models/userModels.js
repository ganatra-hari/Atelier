const mongoose = require('mongoose');

userSchema = new mongoose.Schema({
    fullName:{
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    pass:{
        type: String,
        required: true,
    },
    contact:{
        type: Number,
        required: true,
    },
    photo:{
        type: String,
        required: true,
    },
    gender:{
        type: String,
        enu: ['Male','Female'],
        required: true,
    },
},{timetamps: true})

const userModel = new mongoose.model('User',userSchema)

module.exports = {
    userModel,
}