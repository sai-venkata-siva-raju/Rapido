const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

const userSchema= new mongoose.Schema({
fullname:{
    firstname:{
        type:String,
        required:true,
        minlength:[3,"firstname should be at least 3 characters"],
    },
    lastname:{
        type:String,
        required:true,
        minlength:[3,"lastname should be at least 3 characters"],
    }
},
email:{
    type:String,
    required:true,
    unique:true,
    match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,"Please fill a valid email address"]
},
password:{
    type:String,
    required:true,
    select:false,
    min:[6,"password should be at least 6 characters"],
},socketid:{
    type:String,
    default:"",
},
lastLogoutAt:{
    type:Date,
    default:null,
}
})

userSchema.methods.generateAuthToken=function(){
    const token=jsonwebtoken.sign({_id:this._id},process.env.JWT_SECRET,{expiresIn:"1h"});
    return token;
}

userSchema.methods.comparePassword=async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.hashPassword=async function(password){
    const salt=await bcrypt.genSalt(10);
    return await bcrypt.hash(password,salt);
}   

const userModel= mongoose.model("user",userSchema);

module.exports=userModel;
