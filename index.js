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

// Setup fake account data
var accounts = [{ AccountNumber: "1234512345", IsGas: true, GasTotal: 132, IsElec: true, ElecTotal: 145.44, GroupCode: "1RU25P", NextPaymentDue: "15 Aug 2017" }];
var accountMembers = [{ AccountNumber: "1234512345", UserId: "1501442076579619", MemberType: "PRIMARY" }];
var userSessions = [];
var initialSession = { "UserId": "1501442076579619", "Stage": "VERIFIEDPRIMARY" };
userSessions.push(initialSession);

// Setup Express middleware for /webhook
app.use('/webhook', bot.middleware());

// Setup listener for incoming messages 
bot.on('message', function (userId, message) {
    var result = userSessions.filter(x => x.UserId === userId);
    if (result.length !== 1) {
        var message = "OK, lets's start ... what would you like to do?"
        DisplayStartOptions(userId, message);
        return;
    }

    if (result[0].Stage === "CREATE") {
        HandleCreate(userId, message, result);
        return;
    }

    if (result[0].Stage === "VERIFYEMAIL") {
        result[0].Stage = "VERIFIEDPRIMARY";
        var rString = randomString(6, '0123456789BCDEFGHIJKLMNOPQRSTUVWXYZ');
        var accountMember = { AccountNumber: "1234512345", UserId: userId, MemberType: "PRIMARY" };
        accountMembers.push(accountMember);
        var message = "Thank you for verifying. Share the following code with other rent sharers " + rString
        DisplayGroupOptions(userId, message);
        return;
    }

    if (result[0].Stage === "JOIN") {
        var account = accounts.filter(x => x.GroupCode === message);
        if (account.length !== 1) {
            bot.sendTextMessage(userId, "Invalid group code provided - please try again?");
        } else {
            result[0].Stage == "VERIFIEDSECONDARY";
            var accountMember = { AccountNumber: account[0].AccountNumber, UserId: userId, MemberType: "PRIMARY" };
            accountMembers.push(accountMember);
            var message = "Thank you for verifying. You are now a member of a rental group, What would you like to do?"
            DisplayGroupOptions(userId, message);
        }
        return;
    }

});

// Setup listener for quick reply messages 
bot.on('quickreply', function (userId, payload) {
    if (payload == "CREATERENTALGROUP") {
        bot.getUserProfile(userId, function (err, profile) {
            var userSession = { "UserId": userId, "Stage": "CREATE" };
            userSessions.push(userSession);
            bot.sendTextMessage(userId, "Hi " + profile.first_name + ", enter your email address and AGL Account number.");
            console.log(userSessions);
            return;
        });
    }
    if (payload == "JOINRENTALGROUP") {
        bot.getUserProfile(userId, function (err, profile) {
            var userSession = { "UserId": userId, "Stage": "JOIN" };
            userSessions.push(userSession);
            bot.sendTextMessage(userId, "Hi " + profile.first_name + ", please enter the Group Code provided by the Primary Account holder");
            return;
        });
    }

    if (payload == "VIEWBILL") {
        bot.getUserProfile(userId, function (err, profile) {
            SendReceipt(userId);
            return;
        });
    }
    if (payload == "CHECKSHARE") {
        bot.getUserProfile(userId, function (err, profile) {
            SendList(userId);
            return;
        });
    }

    if (payload == "PAYNOW") {
        bot.getUserProfile(userId, function (err, profile) {
            var message = "What else would you like to do?"
            DisplayGroupOptions(userId, message);
            return;
        });
    }

    if (payload == "PAYLATER") {
        bot.getUserProfile(userId, function (err, profile) {
            var message = "What else would you like to do?"
            DisplayGroupOptions(userId, message);
            return;
        });
    }
});

// Config the Get Started Button and register a callback 
bot.setGetStartedButton("GET_STARTED");
bot.on('postback', function (userId, payload) {

    if (payload == "GET_STARTED") {
        getStarted(userId);
    }

    if (payload == "GETSTARTED") {
        var result = userSessions.filter(x => x.UserId === userId);
        if (result.length !== 1) {
            // Get started process
            var message = "OK, lets's begin... what would you like to do?"
            DisplayStartOptions(userId, message);
        } else {
            // Connected user process
            var message = "OK, lets's begin... what would you like to do?"
            DisplayGroupOptions(userId, message);
        }

    }

    if (payload == "CREATERENTALGROUP") {
        bot.getUserProfile(userId, function (err, profile) {
            bot.sendTextMessage(userId, "Hi " + profile.first_name + " can you please provide your email address?");
        });
    }

    if (payload == "HELP") {
        bot.getUserProfile(userId, function (err, profile) {
            bot.sendTextMessage(userId, "Hi " + profile.first_name + " this bot allows users to register as a primary AGL account holder or join an AGL rental group.?");
            var message = "OK, lets's start ... what would you like to do?"
            DisplayHelpOptions(userId, message);
        });
    }
});

// Setup listener for attachment 
bot.on('attachment', function (userId, attachment) {
    // Echo the audio attachment 
    if (attachment[0].type == "audio") {
        bot.sendAudioAttachment(userId, attachment[0].payload.url);
    }
});

function checkIfEmailInString(text) {
    var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
    return re.test(text);
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function DisplayStartOptions(userId, message) {
    var replies = [
        {
            "content_type": "text",
            "title": "Create rental group",
            "payload": "CREATERENTALGROUP"
        },
        {
            "content_type": "text",
            "title": "Join rental group",
            "payload": "JOINRENTALGROUP"
        }
    ];
    bot.sendQuickReplies(userId, message, replies);
}

function DisplayGroupOptions(userId, message) {
    console.log("Display Group Options");
    console.log(userId);
    // bot.sendTextMessage(userId, "Thank you for verifying. You are now a member of a rental group");
    var replies = [
        {
            "content_type": "text",
            "title": "Check my share",
            "payload": "CHECKSHARE"
        },
        {
            "content_type": "text",
            "title": "View Bill",
            "payload": "VIEWBILL"
        }
    ];
    bot.sendQuickReplies(userId, message, replies);
}

function DisplayPayNow(userId, message) {
    var replies = [
        {
            "content_type": "text",
            "title": "Pay Now",
            "payload": "PAYNOW"
        },
        {
            "content_type": "text",
            "title": "Pay Later",
            "payload": "PAYLATER"
        },
    ];
    bot.sendQuickReplies(userId, message, replies);
}

function DisplayHelpOptions(userId, message) {
    var replies = [
        {
            "content_type": "text",
            "title": "Create rental group",
            "payload": "CREATERENTALGROUP"
        },
        {
            "content_type": "text",
            "title": "Join rental group",
            "payload": "JOINRENTALGROUP"
        }
    ];
    bot.sendQuickReplies(userId, message, replies);
}

function SetGroupMenu() {
    var menuButtons = [
        {
            "type": "postback",
            "title": "Leave Group",
            "payload": "LEAVEGROUP"
        },
        {
            "type": "web_url",
            "title": "View Website",
            "url": "https://www.agl.com.au/"
        },
        {
            "type": "postback",
            "title": "Help",
            "payload": "HELP"
        }
    ];
    bot.setPersistentMenu(menuButtons);
}

// HANDLERS
function HandleCreate(userId, message, result) {
    var emailsArray = message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
    var intValue = 0;
    try {
        var intValue = parseInt(message.match(/[0-9]+/)[0], 10);
    }
    catch (err) {
        bot.sendTextMessage(userId, "Invalid email/account number provided - can you please try again?");
        return;
    }
    if (emailsArray != null && emailsArray.length && intValue > 0) {
        result[0].Stage = "VERIFYEMAIL";
        bot.sendTextMessage(userId, "A verification code has been sent to your email address. Please confirm this number to comfirm your account.");
    } else {
        bot.sendTextMessage(userId, "Invalid email/account number provided - can you please try again?");
    }
}

function SendReceipt(userId) {
    bot.getUserProfile(userId, function (err, profile) {

        var receipt = {
            "recipient_name": profile.first_name + " " + profile.last_name,
            "order_number": "12345678902",
            "currency": "AUD",
            "payment_method": "Visa 2345",
            "timestamp": "1428444852",
            "elements": [
                {
                    "title": "Electricity",
                    "subtitle": "connection and usage",
                    "price": 44.37,
                    "currency": "AUD",
                    "image_url": "https://www.agl.com.au/-/media/AGL/Business/Images/Large-Business/Our-Service-Difference/electricity-icon.png?la=en"
                },
                {
                    "title": "GAS",
                    "subtitle": "connection and usage",
                    "price": 40.63,
                    "currency": "AUD",
                    "image_url": "https://www.agl.com.au/-/media/AGL/Business/Images/Large-Business/Our-Service-Difference/gas-icon.png?la=en"
                },
            ],
            "address": {
                "street_1": "141 Banksia Street",
                "street_2": "",
                "city": "Ivanhoe",
                "postal_code": "3079",
                "state": "VIC",
                "country": "AU"
            },
            "summary": {
                "subtotal": 85.00,
                "total_tax": 8.50,
                "total_cost": 63.50
            },
            "adjustments": [
                {
                    "name": "Direct Debit Discount",
                    "amount": 20
                },
                {
                    "name": "Dual Fuel Discount",
                    "amount": 10
                }
            ]
        };

        bot.sendReceiptMessage(userId, receipt);
        var firstName = profile.first_name;
        setTimeout(function () {
            var message = firstName + " what else would you like to do?";
            var userIdM = userId;
            DisplayGroupOptions(userIdM, message);
        }, 5000);
    });
}

function SendList(userId) {
    bot.getUserProfile(userId, function (err, profile) {
        var receipt = {
            "recipient_name": profile.first_name + " " + profile.last_name,
            "order_number": "12345678902",
            "currency": "AUD",
            "payment_method": "Visa 4424",
            "timestamp": "1438444852",
            "elements": [
                {
                    "title": "Electricity 33% share",
                    "subtitle": "connection and usage 33% share",
                    "price": 44.37,
                    "currency": "AUD",
                    "image_url": "https://www.agl.com.au/-/media/AGL/Business/Images/Large-Business/Our-Service-Difference/electricity-icon.png?la=en"
                },
                {
                    "title": "GAS 33% share",
                    "subtitle": "connection and usage 33% share",
                    "price": 40.63,
                    "currency": "AUD",
                    "image_url": "https://www.agl.com.au/-/media/AGL/Business/Images/Large-Business/Our-Service-Difference/gas-icon.png?la=en"
                },
            ],
            "address": {
                "street_1": "141 Banksia Street",
                "street_2": "",
                "city": "Ivanhoe",
                "postal_code": "3079",
                "state": "VIC",
                "country": "AU"
            },
            "summary": {
                "subtotal": 28.33,
                "total_tax": 2.83,
                "total_cost": 21.17
            },
            "adjustments": [
                {
                    "name": "Direct Debit Discount",
                    "amount": 6.66
                },
                {
                    "name": "Dual Fuel Discount",
                    "amount": 3.33
                }
            ]
        };

        bot.sendReceiptMessage(userId, receipt);
        var firstName = profile.first_name;
        setTimeout(function () {
            var message = firstName + " you can pay the your share now.";
            DisplayPayNow(userId, message);
        }, 5000);
    });
}

function getStarted(userId) {
    bot.sendTextMessage("Hi welcome to AGL Energy rental share bot");
    var menuButtons = [
        {
            "type": "postback",
            "title": "Get Started",
            "payload": "GETSTARTED"
        },
        {
            "type": "web_url",
            "title": "View Website",
            "url": "https://www.agl.com.au/"
        },
        {
            "type": "postback",
            "title": "Help",
            "payload": "HELP"
        }
    ];
    bot.setPersistentMenu(menuButtons);
    var result = userSessions.filter(x => x.UserId === userId);
    if (result.length !== 1) {
        // Get started process
        var message = "OK, lets's begin... what would you like to do?"
        DisplayStartOptions(userId, message);
    } else {
        // Connected user process
        var message = "OK, lets's begin... what would you like to do?"
        DisplayGroupOptions(userId, message);
    }
}

//Make Express listening
app.listen(3000);
