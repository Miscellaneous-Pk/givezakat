require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const _ = require('lodash');
const readXlsxFile = require('read-excel-file/node');

const {sheet} = require('./server/sheets.js');
const {mongoose} = require('./db/mongoose');
const {People} = require('./models/people');

var app = express();
var port = process.env.PORT || 3000;
app.use(express.static(__dirname+'/static'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine','hbs');

hbs.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

// sheet('construction','read');
// sheet('material','read');
// sheet('material','update',[
// [new Date().toString(),'MES','Sand','2000', 'cft','Brought it for const of Washroom']
// ]);
// sheet('ramadan','read').then((msg) => {
//   res.render('home.hbs',{
//     data: msg[0].values,
//   });
// }).catch((e) => {
//   console.log(e);
// });

app.get('/hacks',(req,res) => {
  res.render('hacks.hbs');
})

app.get('/',(req,res) => {
  console.log('home page opened.');
  People.find().then((msg) => {
    res.data = msg;
    return readXlsxFile(__dirname+'/static/sample.xlsx')
  }).then((rows) => {
    console.log(res.data);
    res.render('home.hbs',{
      data: res.data,
      sampleRows: rows[0]
    });
  }).catch((e) => {
    console.log(e);
    res.status(404).send(e);
  });
});

app.post('/data',(req,res) => {

  if (req.body) {
    return res.status(200).send('data recieved');
  }
  res.status(400).send('sorry no data recieved');

});

app.post('/excelData',(req,res) => {
  var body = [];
  _.each(req.body,(val,key)=> {
    val.addedBy = 'Qaism Ali ki id here';
    body[key] = _.pick(val,['name','mob','salary','fMembers','story','address','sponsorName','sponsorMob','sponsorAccountTitle','sponsorAccountNo','sponsorAccountIBAN','package','packageCost','packageQty','orderDate','deliveryDate','pteInfo','nearestCSD','cardClass','addedBy']);
  });

  People.insertMany(body,{ordered:false}).then((msg) => {
    console.log(msg.length);
    res.status(200).send(`Successfully added <b>${msg.length} rows</b>.`);
  }).catch((e) => {
    let errors = [];
    // console.log(e.result.result);
    if (e.result.result) {
      errors.push(`Updated <b>${e.result.result.nInserted}</b> rows!`);
      errors.push(`Failed to update <b>${e.result.result.writeErrors.length}</b> rows due to duplicates:-`)
      _.each(e.result.result.writeErrors,(val,key) => {
        // console.log(val.err.op);
        errors.push(key + '. ' + val.err.op.name + ', ' + val.err.op.mob);
      })
      console.log(errors);
      return res.status(400).send(errors);
    }
    res.status(400).send(e);

  });

});

app.post('/data',(req,res) => {

  if (req.body.query === 'Register') {
    var user = new Users(
      _.pick(req.body,['name','email','password']),
    );
    user.generateAuthToken().then((returned) => {
      res.status(200).send(returned.tokens[0].token);
      return console.log('saved', returned.name);
    }).catch((e) => {
      console.log(e);
      if (e.code === 11000) return res.status(400).send('You are already registered with this email');
      console.log('Error here', e);
      return res.status(400).send('Server - Bad Request');
    });
  };

  if (req.body.query === 'Login') {
    var user = _.pick(req.body,['email','password']);
    Users.findByCredentials(user.email, user.password).then((returned) => {
      if (!returned) return Promise.reject('Invalid credentials.')
      return returned.generateAuthToken();
    }).then((user) => {
      if (!user) return Promise.reject('Failed to Sign In.');
      return res.status(200).send(user.tokens[0].token);
    }).catch((e) => {
      console.log(e);
      res.status(404).send(e);
    });
  };

  if (req.body.query === 'Email_Verify') {
    var phoneCode = Math.floor(100000 + Math.random() * 900000);
    Users.findOne({"email":req.body.email}).then((user) => {
      if (!user) return res.status(404).send('Un authorized request');
      return sendmail(req.body.email,`Your Code is <b>${phoneCode}</b>, please enter it on webpage.`,'Make a story - Forgot Password')
    }).then((msg) => {
      return Users.findOneAndUpdate({"email": req.body.email}, {$set : {"phoneCode":phoneCode}}, {new: true});
    }).then((user) => {
      res.status(200).send('Mail sent !');
    }).catch((e) => {
      console.log(e);
      res.status(404).send(e.errno);
    });
  };

  if (req.body.query === 'Test_Code') {
    Users.findOne({
      "email": req.body.email,
      "phoneCode": req.body.code
    }).then((user) => {
      if (!user) return Users.findOneAndUpdate({"email":req.body.email},{$set: {attemptedTime: new Date()}, $inc:{wrongAttempts:1}},{new:true});
      console.log('user found', user);
      return Promise.resolve('Found');
    }).then((response) => {
      if (response === 'Found') return res.status(200).send('Verified !');
      console.log(`${response}:::: Wrong attempt no: ${response.wrongAttempts} x Attempt`);
      if (response.wrongAttempts > 4) return res.status(404).send('5 wrong attempts, please try again after 2 mins.');
      return res.status(400).send('Did not match !');
    }).catch((e) => {
      console.log(e);
      return res.status(400).send(e);
    });
  };

  if (req.body.query === 'new_password') {
    Users.findOne({
      "email": req.body.email,
      "phoneCode": req.body.code,
    }).then((user) => {
      if (!user) return Promise.reject('Un authorized request.');
      user.password = req.body.password;
      return user.generateAuthToken();
    }).then((response)=> {
      console.log(response);
      res.status(200).send('Password changed, please login with new password.');
    }).catch((e) => {
      console.log(e);
      res.status(404).send(e);
    });

  };

});


app.listen(port, () => {
  console.log(`listening on port ${port}...`);
});
