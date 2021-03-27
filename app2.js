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
const bcrypt=require('bcrypt');
const saltRounds=10;


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

const userSchema=new mongoose.Schema({
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    },
    {timestamps:true}
);

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

app.get('/register',(req,res)=>{
    res.render('register')
});

app.post('/register',expressAsyncHandler(async(req,res)=>{

    const hash= await bcrypt.hash(req.body.password,saltRounds);
    // There is another method too, instead of promise we can use callback
    // bcrypt.hash(req.body.password,salrounds,(err,hash)=>{/* do ur thing */});


    const newUser=new User({
        email:req.body.username,
        // password:md5(req.body.password),
        password:hash,
    });
    newUser.save((err)=>{
        if(err)
        {
            res.send("UserName Already Exists!");
            console.log(err);
        }
        else res.render('secrets');
    });
}));

app.post('/login',function(req,res){
    const username=req.body.username;
    const password=req.body.password;
    // const password=md5(req.body.password);

    User.findOne({email:username},(err,foundUser)=>{
        if(err)
        {
            res.send(err);
            console.log(err);
        }
        else
        {
            if(foundUser)
            {
                // if(foundUser.password===password)
                // {
                //     res.render('secrets');
                // }
                bcrypt.compare(password,foundUser.password,(err,result)=>{
                if(result===true)
                {
                    res.render('secrets');
                }
                    else res.send("Invalid Details!");
                });
            }
            else{
                res.send("Invalid Details!");
            }
        }
    });
}); 





app.listen(3000,()=>{
    console.log('Server started on port 3000...');
});

