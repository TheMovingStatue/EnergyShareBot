var express = require('express');
var app = express();
var FBBotFramework = require('fb-bot-framework');
// Initialize
var bot = new FBBotFramework({
    page_token: "EAARLlputr4YBAGjPQN1rYGD4FmqM0M9cesiVZB3cdny1O2RnuGzoL5qtK197kKku7pDobJ6AMdvsW1h5CqSV9jDYrBdGTgvoZCCF0DKA1EkvuIBBvBNw6InzS207IBQmgmmSPOvMIIL7OAaZAMZCSiu8NgZBWocvTOzk2HHhKrQZDZD",
    verify_token: "verify_token"
});
var bodyParser = require('body-parser')
var request = require('request')

// Setup Express middleware for /webhook
app.use('/webhook', bot.middleware());

// Process application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({extended: false}))

// // Process application/json
// app.use(bodyParser.json())

var elements = [
    {
        "title": "Classic T-Shirt Collection",
        "image_url": "https://peterssendreceiveapp.ngrok.io/img/collection.png",
        "subtitle": "See all our colors",
        "default_action": {
            "type": "web_url",
            "url": "https://peterssendreceiveapp.ngrok.io/shop_collection",
            "messenger_extensions": true,
            "webview_height_ratio": "tall",
            "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
        },
        "buttons": [
            {
                "title": "View",
                "type": "web_url",
                "url": "https://peterssendreceiveapp.ngrok.io/collection",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": "https://peterssendreceiveapp.ngrok.io/"                        
            }
        ]
    },
    {
        "title": "Classic White T-Shirt",
        "image_url": "https://peterssendreceiveapp.ngrok.io/img/white-t-shirt.png",
        "subtitle": "100% Cotton, 200% Comfortable",
        "default_action": {
            "type": "web_url",
            "url": "https://peterssendreceiveapp.ngrok.io/view?item=100",
            "messenger_extensions": true,
            "webview_height_ratio": "tall",
            "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
        },
        "buttons": [
            {
                "title": "Shop Now",
                "type": "web_url",
                "url": "https://peterssendreceiveapp.ngrok.io/shop?item=100",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": "https://peterssendreceiveapp.ngrok.io/"                        
            }
        ]                
    },
    {
        "title": "Classic Blue T-Shirt",
        "image_url": "https://peterssendreceiveapp.ngrok.io/img/blue-t-shirt.png",
        "subtitle": "100% Cotton, 200% Comfortable",
        "default_action": {
            "type": "web_url",
            "url": "https://peterssendreceiveapp.ngrok.io/view?item=101",
            "messenger_extensions": true,
            "webview_height_ratio": "tall",
            "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
        },
        "buttons": [
            {
                "title": "Shop Now",
                "type": "web_url",
                "url": "https://peterssendreceiveapp.ngrok.io/shop?item=101",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": "https://peterssendreceiveapp.ngrok.io/"                        
            }
        ]                
    },
    {
        "title": "Classic Black T-Shirt",
        "image_url": "https://peterssendreceiveapp.ngrok.io/img/black-t-shirt.png",
        "subtitle": "100% Cotton, 200% Comfortable",
        "default_action": {
            "type": "web_url",
            "url": "https://peterssendreceiveapp.ngrok.io/view?item=102",
            "messenger_extensions": true,
            "webview_height_ratio": "tall",
            "fallback_url": "https://peterssendreceiveapp.ngrok.io/"
        },
        "buttons": [
            {
                "title": "Shop Now",
                "type": "web_url",
                "url": "https://peterssendreceiveapp.ngrok.io/shop?item=102",
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": "https://peterssendreceiveapp.ngrok.io/"                        
            }
        ]                
    }
];

// Setup listener for incoming messages
bot.on('message', function (userId, message) {
    // bot.getUserProfile('1395075953944300', function (err, profile) {
    //     console.log(profile);
    // });
    bot.sendTextMessage(userId, "Hi " + message + " where is my T-Shirt - BTW your FB id is " + userId);
    console.log(elements);
    // bot.sendListMessage(userId, elements);
    // bot.sendTextMessage('1395075953944300', message + " sent a message..."); -- Send message to sepcific user.
    // console.log(userId + message);
});

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text
            if (text === 'Generic') {
                sendGenericMessage(sender)
                continue
            }
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
        }
        if (event.postback) {
            text = JSON.stringify(event.postback)
            sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
            continue
        }
    }
    res.sendStatus(200)
})

var token = bot.page_token; //"<PAGE_ACCESS_TOKEN>"

function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function sendGenericMessage(sender) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "First card",
                    "subtitle": "Element #1 of an hscroll",
                    "image_url": "https://www.agl.com.au/-/media/Project/Primary/Logos/AGL_Logo_primary.png",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://www.messenger.com",
                        "title": "web url"
                    }, {
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for first element in a generic bubble",
                    }],
                }, {
                    "title": "Second card",
                    "subtitle": "Element #2 of an hscroll",
                    "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
                    "buttons": [{
                        "type": "postback",
                        "title": "Postback",
                        "payload": "Payload for second element in a generic bubble",
                    }],
                }]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

app.get("/", function (req, res) {
    res.send("hello world");
});

//Make Express listening
app.listen(3000);

