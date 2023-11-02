import express from 'express';
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser" ;//its also a middleware
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
//---------------------------------------------------------------------------------------------------------------------
//Connecting mongoose
mongoose
    .connect("mongodb://localhost:27017",{//find the connection string in mongodb compass
        dbname:"backend",//prodvide the name that you gave of the database
    })
    .then(()=>console.log("Database connected"))//if  connected print this 
    .catch((e)=>console.log(e));//if not connected because of some issue print this

//Defining a schema for creating a collection
const userSchema = mongoose.Schema({
    name: String,
    email:String,
    password:String,
})

//Creating a collection -name of collecctoin and the schema is passed
const User = mongoose.model("User",userSchema)
//Messge is variable declared through which we can access mongooses function <read write etc>
//-----------------------------------------------------------------------------------------------------------------------------------


//creating the server
const app = express(); 


//Middlewaress
app.use(express.static(path.join(path.resolve(),"public")))
console.log(path.join(path.resolve(),"public"))
app.use(express.urlencoded({extended :true}))//by using this we can access data from Files by giving path
app.use(cookieParser())//for accessing cookies




//Manditory write as it is
//setting up ejs so the machine know we are using view engine and lang is ejs and not any other
app.set("view engine","ejs");//kinda setting up a view folder that has dynamic ejs and other dynamic things

//creating my custom handler
const isAuthenticated = async (req,res,next)=>{
     // clg(req.cookies)={ token: 'iamin' }
    //we used middleware of cookies
    const {token} = req.cookies; //destructuring
    //if token that is cookie is generated that mean we are logged in and we need sign out button on screen
    if(token){
        const decoded =jwt.verify(token,"dgghrhrhssagf")//decrypt is by sending same code
        // console.log(decoded)
        //{ _id: '6530e895c3af6da948b75b9d', iat: 1697704085 }

        req.user = await User.findById(decoded._id) //the user fetchess its info from database
        next();//goes to next handler in route
    }
    else{
        res.redirect("/login")
    }
}

//Loading home screen login page
app.get("/",isAuthenticated,(req,res)=>{
    // console.log(req.user)
    res.render("logout.ejs",{ name : req.user.name})
})

app.get("/login",(req,res)=>{
    // console.log(req.user)
    res.render("login.ejs")
})

app.get("/register",(req,res)=>{
    // console.log(req.user)
    res.render("register.ejs");
});

//login apifor
app.post("/login", async (req,res) => {
    const { email , password} = req.body;

    let user = await User.findOne({email});//checking by user
    if (!user) return res.redirect("/register") //if not present in database then go and register

    // const  isMatch = user.password === password; this was before using bcrypt module where we didnt hash the password
    const  isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch) return res.render("login.ejs", { email , message :"Incorrect password"})//locals is the object send to login.ejs

    const token = jwt.sign({ _id: user._id }, "dgghrhrhssagf");//i encode here the user id
    // console.log(token);
    //gives a ccryptic code
    //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NTMwZTkxNGUxYzRjODJlYThjODg3MGEiLCJpYXQiOjE2OTc3MDQyMTJ9.TglI5JIxszGvmXlMYJNXnbPk7DO6Z0sVy9Gb867-lg8 
    
    // setiing cookie or creation
    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000)
    })
    res.redirect('/')

})


//api for register form
app.post("/register",async (req,res)=>{
    const {name ,email,password} = req.body

    //checking if user exists
    let user = await User.findOne({ email });
    if(user){
        return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password,10)//10 is security level
    
    user = await User.create({
        name,
        email,
        password: hashedPassword,
    })

    const token = jwt.sign({ _id: user._id }, "dgghrhrhssagf");//i encode here the user id
    // console.log(token);
    //gives a ccryptic code
    //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NTMwZTkxNGUxYzRjODJlYThjODg3MGEiLCJpYXQiOjE2OTc3MDQyMTJ9.TglI5JIxszGvmXlMYJNXnbPk7DO6Z0sVy9Gb867-lg8 
    
    // setiing cookie or creation
    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000)
    })
    res.redirect('/')
})

//api for logout-get because we are not putting anything like email etcc while logout
app.get("/logout",async (req,res)=>{//when pressed logout login should render
    //setiing cookie as null that is deleting it
    res.cookie("token",null,{
        httpOnly:true,
        expires:new Date(Date.now())
    })
    res.redirect('/')
})




app.listen( 5000 , ()=>{ //calling on port 5000
    console.log("working")
})