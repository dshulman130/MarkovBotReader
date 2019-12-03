// Require the TwitchJS library.
var filename = 'texts/markovText.txt';
var channels = ['moonmoon'];
var sayInterval = '10';
var waitTimer = 30; // this is actually a timer representing the number of messages to wait until bot posts again
var fullLogFilepath = 'F:/GIT/MarkovBotReader/MarkovBotReader/texts/markovText.txt';
var maxFileSize = 100; // 10 KB. Manually calculated at about 2000(?) lines of chat. Need to automate this later formula: (size of log file / actual lines in log file) * desired lines in file = maxFileSize
var minFileSizeToGenerate = 2; // 2 KB - this is so that it doesn't try to generate text when there's only a few lines in there
var fileIsLargeEnough = false;
var sayStarted = false;

// from https://nightbot.tv/t/moonmoon/commands - !blacklist
// check regularly, this may need to be updated
var bannedWords = ['cirSlain', 'tdogwiz', 'C9 LUL', 'Yiff', 'Pikagirl', 'naroStaryn', 'ResidentSleeper', 'cmonBruh', 'NaM', 'moon2MLEM', 'MLEM', 'MeguFace', 'Overwatch', 'kirby', 'new game', 'next game', 'meta', 'FishMoley'];

var markov = require('./markov')(filename);
const TwitchJS = require('twitch-js');
const fs = require('fs');

// Setup the client with your configuration; more details here:
// https://github.com/twitch-apis/twitch-js/blob/master/docs/Chat/Configuration.md
const options = {
    channels: channels,
    //Provide an identity
    identity: {
      username: 'evil_markov_chain_bot',
      password: 'oauth:vwo7ts7d52lax1zzfflqjfezwt7dfp' // oath token, Generate oauth token here: https://twitchapps.com/tmi/
      //password: 's6n#J?v!q3C.JM5'
    },
};

const client = new TwitchJS.client(options);

// Add chat event listener that will respond to "!command" messages with:
// "Hello world!".
client.on('chat', (channel, userstate, message, self) => {
    // Do not repond if the message is from the connected identity.
    var userName = userstate['display-name'];

    // is a subscriber: https://dev.twitch.tv/docs/irc/tags#userstate-twitch-tags
    var isSubscriber = (userstate['badge-info'] >= 1); // at least a 1 month subscriber

    // if self, or messages from other bots (need to make this an array or get from Twitch API)
    if (self || userName === 'Nightbot' || userName === 'Scootycoolguy') return;

    // only log messages from subscribers
    //if(!isSubscriber) return;


    /*
    THIS IS NOT A GOOD EXPERIENCE. Need to figure out how to make this a rolling chat file. Idea:
        - If lines are greater than 200 (or whatever optimal chat lines number is for funniest Markov output)
          delete the first line in the file and append the incoming message to the bottom
     */
    // if file is too big (has too many old messages, we only want the latest X messages), create a new one, otherwise append
    var countPromise = countFileLines(fullLogFilepath);
    var count;
    countPromise.then(function(response){
        count = response;
        if(count < 300)
        {
            //console.log('>>>>>>>>>>>>>>>>LINE COUNT = '+count+"<<<<<<<<<<<<<<<<<<<<<<");
        }
        mainMessageLogic(message, count);
    });

});

// Finally, connect to the channel
client.connect();

function mainMessageLogic(message, count)
{
    //console.log('hewwo? '+count);
    if(count > 300)
    {
        // this stuff isn't working yet
        /*
        console.log("count is: "+count);
        // read file into string, split on \n to make string array, reverse array, write out to file. now file is reversed
        var file = fs.readFileSync(fullLogFilepath, {encoding:'utf8', flag: 'r'});
        var reversedFileString = file.split('\n').reverse().join("\n");
        //console.log('reversed file string: '+reversedFileString);
        fs.writeFileSync(fullLogFilepath, reversedFileString, {encoding:'utf8',flags: 'w'});
        fs.truncateSync(fullLogFilepath, 300); // truncate only cuts lines off the end, so we have to reverse the file first to remove the oldest messages
        var file = fs.readFileSync(fullLogFilepath, {encoding:'utf8'});
        file = file.split('\n').reverse().join("\n");
         */
        //fs.writeFileSync(fullLogFilepath, message+'\n', {encoding:'utf8',flags: 'w'});
        fs.appendFileSync(fullLogFilepath, message+'\n', {encoding:'utf8',flags: 'a'});
    }
    else
    {
        fs.appendFileSync(fullLogFilepath, message+'\n', {encoding:'utf8',flags: 'a'});
    }

    // If file is sufficiently large enough for a corpus, otherwise do nothing
    // if(getFileSizeInKB(fullLogFilepath) > minFileSizeToGenerate)
    // {
    //     fileIsLargeEnough = true;
    // }
    // else
    // {
    //     fileIsLargeEnough = false;
    // }

    //console.log('hi, sayStarted = '+sayStarted);
    if(sayStarted == false)
    {
        console.log('starting say thing');
        sayMsg();
    }
}

function sayMsg()
{
    sayStarted = true;
    var msg = findBetterMarkov();
    var canPost = canPostMessage(msg);
    //client.say(channels, msg);
    //console.log(msg);
    //console.log('canpost? '+canPost);
    if(canPost)// && --waitTimer == 0)
    {
        //waitTimer = 30;
        console.log('moon2DOIT '+msg);
    }
}

setInterval(sayMsg, 3000); // 3 second timer for this function

function findBannedWords(msg)
{
    var length = bannedWords.length;
    while(--length >= 0)
    {
        if(msg.indexOf(bannedWords[length]) != -1)
        {
            return false;
        }

        return true;
    }
}

function findBetterMarkov(msg)
{
    //console.log('array as string: '+array.toString());
    //console.log('array count: '+array.length);
    //console.log('ARRAY IS TOO SMALL, TRYING AGAIN');
    //sayMsg();
    var count = 0;
    var msg = "";
    while(count < 8 || count > 15)
    {
        msg = markov();
        //var array = msg.match(/[^\r\n]+/g);
        var array = {};
        array = msg.toString().split(" ");
        count = array.length;
    }

    return msg;
}

function dontAtMeBro(message)
{
    if(message.includes('@'))
    {
        return false;
    }

    return true;
}

/*
Detect if text contains a link so we can sanitize it
Source: https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
 */
function detectLinks(text) {
    var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

    if(text.search(urlRegex) != -1)
    {
        return false;
    }

    return true;
}

// Get file size in bytes
// Source: https://stackoverflow.com/questions/42363140/how-to-find-the-size-of-the-file-in-node-js
function getFileSizeInKB(filename) {
    var stats = fs.statSync(filename);
    var fileSizeInBytes = stats["size"];
    return fileSizeInBytes / 1000;
}

// Count lines in file
// Sournce: https://stackoverflow.com/questions/12453057/node-js-count-the-number-of-lines-in-a-file
function countFileLines(filePath){
    return new Promise((resolve, reject) => {
        let lineCount = 0;
        fs.createReadStream(filePath)
            .on("data", (buffer) => {
                let idx = -1;
                lineCount--; // Because the loop will run once for idx=-1
                do {
                    idx = buffer.indexOf(10, idx+1);
                    lineCount++;
                } while (idx !== -1);
            }).on("end", () => {
            resolve(lineCount);
        }).on("error", reject);
    });
};

function canPostMessage(msg)
{
    var hasNoBannedWords = findBannedWords(msg); //TODO THIS ISN'T WORKING :((
    var containsNoLinks = detectLinks(msg);
    var doesNotAtUsers = dontAtMeBro(msg);
    if(hasNoBannedWords && containsNoLinks && doesNotAtUsers)
    {
        return true;
    }
    else
    {
        return false;
    }
}