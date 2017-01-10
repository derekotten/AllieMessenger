'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const token = process.env.FB_PAGE_ACCESS_TOKEN;
const sendMessageUrl = 'https://graph.facebook.com/v2.6/me/messages';
const getUserInfoUrl = 'https://graph.facebook.com/v2.6/';

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
});

// Spin up the server
app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'))
});


app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i];
        let sender = event.sender.id;
        if (event.message && event.message.text) {
            sendTypingAction(sender);

            let messageText = event.message.text;

            sendResponseText(sender, messageText);
        }
    }
    res.sendStatus(200)
});

function sendTextMessage(sender, text) {
    let messageData = {text: text};
    request({
        url: sendMessageUrl,
        qs: {access_token: token},
        method: 'POST',
        json: {
            recipient: {id: sender},
            message: messageData
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function sendResponseText(sender, messageText) {

    if (messageText.indexOf("car") != -1) {
        sendTextMessage(sender, "Are you looking for help with car insurance?")
    }
    else if (messageText.indexOf("house") != -1) {
        sendTextMessage(sender, "Are you looking for help with homeowners insurance?")
    }
    else if (messageText.indexOf("hello") != -1) {
        getUserDetails(sender)
    }
    else {
        sendTextMessage(sender, messageText)
    }
}


function getUserDetails(sender) {
    request.get(getUserInfoUrl + sender + '?fields?=first_name&access_token=' + token).on('data', function(data) {
        var rBody = JSON.parse(data);

        sendTextMessage(sender, "Hello, " + rBody.first_name.toString());
    });
}

function sendTypingAction(sender) {
    request({
            url: sendMessageUrl,
            qs: {access_token: token},
            method: 'POST',
            json: {
                recipient: {id: sender},
                sender_action: 'typing_on'
            }
        },
        function (error, response, body) {
            if (error) {
                console.log('Error sending typing action: ', error)
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            }
        })
}

