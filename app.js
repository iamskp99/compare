require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const fs = require('fs');
const Schema = mongoose.Schema;
const multer = require('multer');
const path = require('path');
const querystring = require('querystring');

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb+srv://admin-iamskp:"+process.enc.password+"@cluster0.8mhaf.mongodb.net/UserDB",{useNewUrlParser : true,useUnifiedTopology: true});

//Image Storage
var storage = multer.diskStorage({
  //Destination of images
  destination: function (req, file, cb) {
    cb(null, './public/images/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

var upload = multer({ storage: storage });
var imgPath = './public/images/default.png';

// Schemas
const userSchema = new mongoose.Schema({
  name : String,
  img: { data: Buffer, contentType: String },
  rating : Number
});
const User = mongoose.model("User",userSchema);

const gameSchema = new mongoose.Schema({
  title : String,
  url : String,
  items : [userSchema]
});

const Game = mongoose.model("Game",gameSchema);

//GET Routes

app.get("/", function(req, res) {
  res.render('main');
});

app.get("/compose", function(req, res) {
  res.render('compose');
});

app.get("/games/:customGameName",function(req,res){
  const customGameName = req.params.customGameName;
  Game.findOne({url : customGameName},function(err,foundGame){
    if(!err){
          if(foundGame !== null){
              var x1 =  Math.floor(Math.random()*foundGame.items.length);
              var x2 =  Math.floor(Math.random()*foundGame.items.length);
              while(x1 === x2){
                var x2 =  Math.floor(Math.random()*foundGame.items.length);
              }
                res.render("game", {gameTitle: foundGame.title, l: [x1,x2],players: foundGame.items,url : foundGame.url});
                }
              else{
                res.render("error");
              }
            }
    else{
      res.render("error");
    }
  });
});

app.get("/standings/:customGameName",function(req,res){
  const customGameName = req.params.customGameName;
  Game.findOne({url : customGameName},function(err,foundGame){
    if(!err){
      if(foundGame !== null){
              var sarray = [];
              var i = 0;
              while(i < foundGame.items.length){
                sarray.push(foundGame.items[i]);
                i = i+1;
              }
              sarray.sort((a, b) => (a.rating > b.rating) ? -1 : 1);
              res.render("standings", {gameTitle: foundGame.title, sarray: sarray});
            }
          else{
            res.render("error");
          }
        }
    else{
      res.render("error");
    }
  });
});

app.get("/elo/:query", function(req, res) {
  const qs = req.params.query;
  const obj = querystring.parse(qs);
  //Database operations and Elo implemenation.
  const winid = obj.winner;
  const loseid = obj.loser;
  Game.findOne({url : obj.url},function(err,foundGame){
    if(err){
      console.log(err);
    }
    else{
      var i = 0;
      var cnt = 0;
      var rating1 = 0;
      var rating2 = 0;
      // console.log(foundGame);
      while(i < foundGame.items.length){
        if(foundGame.items[i]._id == winid){
          rating1 = foundGame.items[i].rating;
          // console.log(foundGame.items[i].name);
          // console.log(foundGame.items[i].rating);
          cnt = cnt+1;
        }
          if(foundGame.items[i]._id == loseid){
            rating2 = foundGame.items[i].rating;
            // console.log(foundGame.items[i].name);
            // console.log(foundGame.items[i].rating);
            // console.log(foundGame.items[i].name);
            cnt = cnt+1;
          }
        if(cnt == 2){
          break;
        }
        i = i+1;
      }

      var p1 = 1.0/(1.0+Math.pow(10,((rating2-rating1)/400)));
      var p2 = 1.0/(1.0+Math.pow(10,((rating1-rating2)/400)));

      var rat1 = rating1;
      rat1 = rat1 + (30*(1-p1));
      var rat2 = rating2 + (30*(0-p2));
      i = 0;
      var cnt = 0;
      while(i < foundGame.items.length){
        if(foundGame.items[i]._id == winid){
          foundGame.items[i].rating = rat1;
          // console.log(foundGame.items[i].name);
          // console.log(foundGame.items[i].rating);
          // // console.log(foundGame.items[i].name);
          cnt = cnt+1;
        }
          if(foundGame.items[i]._id == loseid){
            foundGame.items[i].rating = rat2;
            // console.log(foundGame.items[i].name);
            // console.log(foundGame.items[i].rating);
            // // console.log(foundGame.items[i].name);
            cnt = cnt+1;
          }
        if(cnt === 2){
          break;
        }
        i = i+1;
      }
    }
    foundGame.save();
  });
  res.redirect("/games/"+obj.url);
});

//POST routes
app.post("/compose",upload.single('img'),function(req,res){
  Game.find({url : req.body.url},function(err,foundGames){
    if(foundGames.length === 0){
      const temp = new User({
        name : req.body.name,
        //The file will be uploaded and its data will be retrieved in base64 type string.
        img: {data:fs.readFileSync(path.join(__dirname + '/public/images/' + req.file.filename)),contentType: req.file.mimetype},
        rating : 1200
      });
      temp.save(function(err){
        if(err){
          console.log(err);
        }
      });

      const dummy = new User({
        name : "Dummy",
        img : {data: fs.readFileSync(imgPath),contentType : 'image/png'},
        rating : 1200
      });
      dummy.save(function(err){
        if(err){
          console.log(err);
        }
      });
      const tlist = new Game({
        title : req.body.postTitle,
        url : req.body.url,
        items : [temp,dummy]
      });
      tlist.save(function(err){
        if(err){
          console.log(err);
        }
      }
      );
    }
    else{
      console.log("A key is already present");
      res.redirect("/error.ejs");
    }
  });
  res.redirect("/");
});

//Adding a new user
app.post("/insert",function(req,res){
  const value = req.body.user;
  res.render("add",{value:value});
});

app.post("/add",upload.single('img'),function(req,res){
  const url = req.body.gameUrl;
  console.log(url);
  const temp = new User({
    name : req.body.name,
    img: {data:fs.readFileSync(path.join(__dirname + '/public/images/' + req.file.filename)),contentType: req.file.mimetype},
    rating : 1200
  });
  temp.save(function(err){
    if(err){
      console.log(err);
    }
  });

  Game.findOne({url : url},function(err,foundGames){
    if(err){
      console.log(err);
    }
    else{
      // console.log(foundGames.items);
      foundGames.items.push(temp);
      foundGames.save();
      // foundGames.save().then(() => res.redirect("/games/"+url));
    }
  });
  // res.redirect("");
  res.redirect("/games/"+url);
});

app.post("/games",function(req,res){
  res.redirect("/games/"+req.body.key);
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
// app.listen(port);

app.listen(port,function(){
  console.log("Server started !");
});
