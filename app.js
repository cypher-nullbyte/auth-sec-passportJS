//jshint esversion:6
require('dotenv').config();
const express=require('express');
const expressAsyncHandler=require('express-async-handler');
const ejs=require('ejs');
const mongoose=require('mongoose');
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');

// const encrypt=require('mongoose-encryption');
// const md5=require('md5');
// const bcrypt=require('bcrypt');
// const saltRounds=10;


const app =express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(session({
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false,

}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/PassPortUserDB',{useNewUrlParser:true,useUnifiedTopology:true,useCreateIndex:true});

// const userSchema=new mongoose.Schema({
//     email:{type:String,required:true,unique:true},
//     password:{type:String,required:true},
//     },
//     {timestamps:true}
// );
const userSchema=new mongoose.Schema({
    email:String,
    password:String
});


userSchema.plugin(passportLocalMongoose);

// const secret=process.env.SECRET;
// userSchema.plugin(encrypt,{secret:secret,encryptedFields:['password']});

const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/',function(req,res){
    res.render('home');
});

app.get('/login',(req,res)=>{
    res.render('login')
});

app.get('/secrets',expressAsyncHandler(async(req,res)=>{
    if(req.isAuthenticated())
    {
        res.render('secrets');
    }
    else res.redirect('/login');
}));

app.get('/logout',(req,res)=>{
   req.logout();
   res.redirect('/'); 
});

app.get('/register',(req,res)=>{
    res.render('register')
});

app.post('/register',(req,res)=>{
    // console.log(req.body.username);
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err)
        {
            console.log(err);
            res.redirect("/");
        }
        else{
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/secrets');
            });
        }
    });
});

app.post('/login',function(req,res){
    const username=req.body.username;
    const password=req.body.password;
    const user=new User({
        username:username,
        password:password
    });
    req.login(user,function(err){
        if(err)
        {
            console.log(error);
            res.redirect('/');
        }
        else{
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/secrets');
            })
        }
    });
}); 





app.listen(3000,()=>{
    console.log('Server started on port 3000...');
});
