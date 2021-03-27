//jshint esversion:6
const express=require('express');
const ejs=require('ejs');
const mongoose=require('mongoose');
const encrypt=require('mongoose-encryption');


const app =express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));

mongoose.connect('mongodb://127.0.0.1:27017/PassPortUserDB',{useNewUrlParser:true,useUnifiedTopology:true,useCreateIndex:true});
const userSchema=new mongoose.Schema({
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    },
    {timestamps:true}
);

const User=new mongoose.model("User",userSchema);


app.get('/',function(req,res){
    res.render('home');
});

app.get('/login',(req,res)=>{
    res.render('login')
});

app.get('/register',(req,res)=>{
    res.render('register')
});

app.post('/register',(req,res)=>{
    // console.log(req.body.username);
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    });
    newUser.save((err)=>{
        if(err)
        {
            res.send("UserName Already Exists!");
            console.log(err);
        }
        else res.render('secrets');
    });
});

app.post('/login',function(req,res){
    const username=req.body.username;
    const password=req.body.password;

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
                if(foundUser.password===password)
                {
                    res.render('secrets');
                }
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

