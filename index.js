var admin = require("firebase-admin");
const functions = require('firebase-functions');
const express = require('express');
const bodyParser = require('body-parser');
const {WebhookClient} = require('dialogflow-fulfillment');
const fs = require('fs');
const cors = require('cors');
const dialogflow  = require('dialogflow');
const { response } = require("express");
const app = express()

app.use(bodyParser.json());
app.use(cors())
const port = process.env.PORT || 3000;

var serviceAccount;
if(process.env.NODE_ENV==='production')
{
  serviceAccount = JSON.parse(process.env.service_account)
}
else
{
  serviceAccount = require('./serviceAccount.json');
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://chatty-sfjb.firebaseio.com"
})


async function runSample(projectId = 'chatty-sfjb', request, response) {
    // A unique identifier for the given session
    const sessionId = 'dasd'
  
    var req = request.body;
    // Create a new session
    const sessionClient = new dialogflow.SessionsClient({credential: serviceAccount});
    const sessionPath = sessionClient.sessionPath('chatty-sfjb','dasd');
    req.session = sessionPath;
  

    // Send request and log result
    const responses = await sessionClient.detectIntent(req);

    
    console.log('Detected intent');
    const result = responses[0].queryResult;
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    response.send(result.fulfillmentText)
    if (result.intent) {
      console.log(`  Intent: ${result.intent.displayName}`);
    } else {
      console.log(`  No intent matched.`);
    }
  }

// This is the callback used when the user sends a message in
app.post('/dialogflow-in', (request, response) => {
 runSample('chatty-sfjb', request, response)

})

//This is called when there is a fulfillment with a webhook attached
app.post('/dialogflow-fulfillment', (request, response) => {
    dialogflowFulfillment(request, response);
    //console.log("got " + request.body)
})

app.post('/checking-in', (request, response) => {
  response.send('ok')
 })

 app.post('/loadImage', (req, response) => {

  var imageSrc = req.body.imageSrc

  var request = require('request').defaults({encoding: 'hex'});
  request.get(imageSrc, function (err, res, body) {
      response.send(body)

  });


 })

app.listen(port, ()=>{
    console.log('Db Name ' + process.env.DB_Name)

})

const dialogflowFulfillment = (request, response) =>{
    const agent = new WebhookClient({request, response});

    function ConfirmEmailChange(agent) {
      agent.add(request.body.queryResult.fulfillmentText) //Use the responses set on Dialogflow console
    }


    let intentMap = new Map();
    intentMap.set("UpdateProfile - yes", ConfirmEmailChange);
    agent.handleRequest(intentMap);
}