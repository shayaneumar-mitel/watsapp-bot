const http = require('http');
const express = require('express');
const { urlencoded } = require('body-parser');
const fetch = require('node-fetch');

const MessagingResponse = require('twilio').twiml.MessagingResponse;

const app = express();
app.use(urlencoded({ extended: false }));

app.post('/sms', async (req, res) => {
    const names = {
        '+919999749496': { name: 'Shayane Umar' },
        '+919945686171': { name: 'Rakesh Anchan' }
    };
    const twiml = new MessagingResponse();

    // Access the message body and the number it was sent from.
    console.log(`Incoming message from ${req.body.From}: ${req.body.Body}`);
    console.log(req.body.Body);
    const payload = req.body.Body.split("-");
    const accessCode = payload[0];
    const message = payload[1];
    const phoneNumber = req.body.From.split(':')[1];

    await postMessage(accessCode, names[phoneNumber].name + ": " + message);
    twiml.message('Your message has been posted to the meeting.');

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

http.createServer(app).listen(3000, () => {
    console.log('Express server listening on port 3000');
});

async function postMessage(accessCode, message) {
    async function getData(url, authToken) {
        const response = await fetch(url, {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        });
        return response.json(); // parses JSON response into native JavaScript objects
    }

    async function postData(url, data, authToken) {
        let headers;
        if (authToken) {
            headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            };
        } else {
            headers = {
                'Content-Type': 'application/json'
            };
        }

        const response = await fetch(url, {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            headers: headers,
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: JSON.stringify(data) // body data type must match "Content-Type" header
        });
        return response.json(); // parses JSON response into native JavaScript objects
    }

    let body = {
        "grant_type": "password",
        "account_id": "858000055",
        "username": "shayane.umar@mitel.com",
        "password": "P@ssword11",
        "name": "Shayane display name"
    };

    let response = await postData('https://authentication.api.mitel.io/2017-09-01/token', body, '');
    let accessToken = response.access_token;

    console.log('Access token: ' + response.access_token);
    response = await getData(`https://media.api.mitel.io/2017-09-01/conferences?$filter=accessCode%20eq%20%27${accessCode}%27&$expand=tags`,
        accessToken);

    let meeting = JSON.parse(response._embedded.items[0]._embedded.conferenceTags._embedded.items[0].value).meeting;
    console.log('Conversation ID: ' + meeting.conversationId);

    body = {
        "body": message,
        "contentType": "text/plain",
        "tag": "{\"sendId\":\"6e5b8391-fbf2-4806-b1dd-4a389d634562\"}"
    };


    response = await postData(`https://chat.us.api.mitel.io/2017-09-01/conversations/${meeting.conversationId}/messages`,
        body, accessToken);
}

// postMessage();