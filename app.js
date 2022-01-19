const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

require("dotenv").default;

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect the DB to the mongo server
const {MONGO_PASSWORD,MONGO_USER,MONGO_DB} = process.env;
mongoose.connect(`mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@cluster0.tlkc0.mongodb.net/${MONGO_DB}`);

// Create the item Schema, which contains the data types 
const itemSchema = new mongoose.Schema({
    name: String
});

// Create the item model, which is based on the itemSchema
const Item = new mongoose.model("Item", itemSchema);

// Create the docs
const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

// Organize the docs in a array;
const defaultItems = [item1, item2, item3];

//
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

// Home route
app.get("/", function(req,res){

    Item.find({}, function(err, results){
      if(results.length === 0){
        Item.insertMany(defaultItems, function(err){
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved default items to DB.");
          }
          });
          res.redirect("/");
        } else {
           res.render("list", {listTitle: "Today", newListItems: results});
        }
    });
});

app.post("/", function(req,res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {

        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList){
                
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);

        });
    }
});

app.post("/delete", function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err){
            if (!err) {
                console.log("Successfully removed checked item!");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate(
            {name: listName}, 
            {$pull: {items: {_id: checkedItemId}}},
            function(err, foundList) {
                if (!err) {
                    res.redirect("/" + listName);
                }
            });
    }
   
});

app.get("/:customListName", function(req,res){
    const customListName = _.capitalize([req.params.customListName]);

    List.findOne({name: customListName}, function(err,foundList){
        if (err) {
           console.log(err);
        } else {
            if(!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });    
            list.save(function(err, results){
                res.redirect("/" + customListName);
            });
            
        } else {
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
        }  
    });

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function(){
    console.log("Server has started sucessfully");
});