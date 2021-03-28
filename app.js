//jshint esversion:6
require('dotenv').config();
const express=require('express');
const expressAsyncHandler=require('express-async-handler');
const ejs=require('ejs');
const mongoose=require('mongoose');
const session=require('express-session');
const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate=require('mongoose-findorcreate');
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
    password:String,
    googleId:String,
    secret:String,
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secret=process.env.SECRET;
// userSchema.plugin(encrypt,{secret:secret,encryptedFields:['password']});

const User=new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:'https://www.googleapis.com/oauth2/v3/userinfo',
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get('/',function(req,res){
    res.render('home');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get('/login',(req,res)=>{
    res.render('login')
});

app.get('/secrets',expressAsyncHandler(async(req,res)=>{
    if(req.isAuthenticated())
    {
        User.find({"secret":{$ne:null}},(err,foundUsers)=>{
            if(err)
            {
                console.log(err);
                res.send("Error");
            }
            else
            {
                if(foundUsers)
                {
                    const foundSecrets=(foundUsers.map(user=>user.secret)).filter(secret=>secret);
                    res.render('secrets',{allSecrets:foundSecrets});
                }
            }
        });
        
    }
    else res.redirect('/login');
}));


app.get('/submit',expressAsyncHandler(async(req,res)=>{
    if(req.isAuthenticated())
    {
        res.render('submit');
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

app.post('/submit',expressAsyncHandler(async(req,res)=>{
    if(req.isAuthenticated())
    {
        const submittedSecret=req.body.secret;
        User.findById(req.user.id,(err,foundUser)=>{
            if(err)
            {
                console.log(err);
                res.send("Error");
            }
            else
            {
                if(foundUser)
                {
                    foundUser.secret=submittedSecret;
                    foundUser.save(()=>{
                        res.redirect("/secrets");
                    })
                }
            }
        });
    }
    else res.redirect('/login');
}));




app.listen(3000,()=>{
    console.log('Server started on port 3000...');
});
