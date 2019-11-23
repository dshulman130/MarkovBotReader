// Require the TwitchJS library.
var filename = 'texts/markovText.txt';
var channel = 'moonmoon';
var sayInterval = '10';
var markov = require('./markov')(filename);
var config = require('./config');

const TwitchJS = require('twitch-js');
const fs = require('fs');

// Setup the client with your configuration; more details here:
// https://github.com/twitch-apis/twitch-js/blob/master/docs/Chat/Configuration.md
const options = {
    channels: ["moonmoon"],
    //Provide an identity
    identity: {
      username: "evil_markov_chain_bot",
      password: "oauth:c6vldy1gcnfn1smqvedicx61anw2ap"
    },
};

const client = new TwitchJS.client(options);

// Add chat event listener that will respond to "!command" messages with:
// "Hello world!".
client.on('chat', (channel, userstate, message, self) => {
    //console.log(`Message "${message}" received from ${userstate['display-name']}`);

    // Do not repond if the message is from the connected identity.
    if (self) return;

    fs.writeFile("F:/GIT/MarkovBotReader/MarkovBotReader/texts/markovText.txt", message, function(err) {

        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });

    // if (options.identity && message === '!command') {
    //     // If an identity was provided, respond in channel with message.
    //     //client.say(channel, 'Hello world!');
    //     console.log('Hello '+options.identity);
    // }
    // if(options.identity && userstate['display-name'] === 'markov_chain_bot')
    // {
    //     console.log('markov_chain_bot: '+message);
    // }
});

// Finally, connect to the channel
client.connect();