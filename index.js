require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static("./public"));

mongoose.connect(process.env.MDB_URI);

const addressSchema = {
  original_url: String,
  short_url: String
};

const Address = mongoose.model("Address", addressSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// If a previously stored short URL is entered as :num in the route path,
// the full URL will be retreived and the browser will be redirected to it.
// If no doc is found matching the short URL, an error will be displayed.
app.get("/api/shorturl/:num", function(req, res) {
  const num = String(req.params.num);
  Address.findOne({short_url: num}).then(function(foundDoc){
    if (!foundDoc) {
      res.json('error: no original URL saved for that short URL.')
    } else {
      res.redirect(foundDoc.original_url);
    }
  })
})

// If a valid URL is entered, this post request will start by checking if a doc exists in the collection for the given URL. If so, that doc will be retreived and displayed as JSON.
// If not, the else block will do the following:
// a) retrieve all previously existing docs in the database
// b) push all shortened URL nums into a new array
// c) generate a random 5-digit number and convert it into a string
// d) use .includes() to check whether that 5-digit number is already taken by one of the existing docs; if so, another number is generated; this will continue until a number is created that isn't already taken.
// e) Return an object of the full URL paired with the short URL.
app.post("/api/shorturl", function(req, res) {
    const original_url = req.body.url;
    if (!/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(original_url)) {
      res.json({error: 'invalid url'})
    } else {
      Address.findOne({original_url: original_url}).then(function(foundDoc){
      if (foundDoc) {
        res.json(foundDoc);
        return;
      } else {
       Address.find({}).then(function(allPreExistingDocs){
      const allPreExistingNums = [];
      for (let doc of allPreExistingDocs) {
        allPreExistingNums.push(doc.short_url);
      }
      let newShortURL = String(Math.floor(Math.random() * 99999));
    while (allPreExistingNums.includes(newShortURL)) {
      newShortURL = String(Math.floor(Math.random() * 99999));
    }
    addressObj = {original_url: original_url, short_url: newShortURL};
     return addressObj;
   }).then(function(addressObj) {
     Address.create(addressObj);
    res.json(addressObj);
   }).catch(function(err){
     console.log(err);
   })
      }
    }).catch(function(err){
      console.log(err);
    })
    }
    
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
