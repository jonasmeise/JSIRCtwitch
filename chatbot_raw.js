/*
Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

    http://aws.amazon.com/apache2.0/

or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
    
    This file is what connects to chat and parses messages as they come along. The chat client connects via a 
    Web Socket to Twitch chat. The important part events are onopen and onmessage.
*/

//Ayyyyy
//Javascript: ALLES IST EIN VAR (wirklich alles)

var chatClient = function chatClient(options){ //Konstruktor für das initialisieren der Daten
    this.username = options.username;
    this.password = options.password;
    this.channel = options.channel;

    this.server = 'irc-ws.chat.twitch.tv';
    this.port = 443;
}

chatClient.prototype.open = function open(){
    console.log(this.username + "/Bot gestartet fuer #" + document.getElementById("channel").value);
    this.webSocket = new WebSocket('wss://' + this.server + ':' + this.port + '/', 'irc');
    myWebSocket = this.webSocket;

    this.webSocket.onmessage = this.onMessage.bind(this);
    this.webSocket.onerror = this.onError.bind(this);
    this.webSocket.onclose = this.onClose.bind(this);
    this.webSocket.onopen = this.onOpen.bind(this);
};

chatClient.prototype.onError = function onError(message){
    console.log('Error: ' + message);
};

chatClient.prototype.onMessage = function onMessage(message){ //wird bei einkommenden nachrichten getriggert HotPokket

    var parsed = this.parseMessage(message.data);

    if(parsed !== null){

        var original = parsed.original;
        console.log(original); //schreibt ALLE eingehenden nachrichten in die entwicklerkonsole. kannst du ausmachen falls zuviel text

        //PING CHECK; notwendig, ansonsten fliegt der bot nach ~5 minuten aus dem channel raus
        if(original === 'PING :tmi.twitch.tv\r\n'){
            console.log("Bot wurde gepingt. Pong back")
            //PONG BACK
            this.webSocket.send('PONG :tmi.twitch.tv\r\n');
        }

        if(parsed.command === 'PRIVMSG')
        {
            //Alle kommandos hier rein; Nachrichtenverarbeitung etc..
            //hilfreiche commands mit strings: [STRING].startsWith('!request') : boolean
            //var array = [STRING].split(' ') --> teilt string in einzelteile von Leerzeichen, kannst damit argumente von z.b. '!request song' abfangen
            //[STRING].includes('KonCha') : boolean
        }
    }
};
function isPart(username, liste){ //hilfreiche funktion zum überprüfen ob element username teil von array liste ist.
    for (let name of liste)
    {
        if(username.localeCompare(name) === 0)
        {
            return true;
        }
    }

    return false;
}

function getTags(tagname, source) //praktische funktion zum ermitteln von tags in nachrichten. z.B. getTags('mod', nachricht)=0/1
{
    var splitted = source.split(';');

    for(let elements of splitted)
    {
        nextsplit = splitted.split('=');

        if(nextsplit[0] === tagname)
        {
            return nextsplit[1];
        }
    }
}

function send(message){ //verschickt nachrichten an den Server
    if (myWebSocket !== null && myWebSocket.readyState === 1) {
            console.log('Sending ' + message);

            myWebSocket.send('PRIVMSG #' + document.getElementById("channel").value + ' :' + message); //document.getELementById wird anstelle von this.channel, weil echtzeitaktualisierung iwie nicht klappt. yolo
    }
}

function whisper(message, user){ //dasselbe wie send(), nur schon mit eingebauter whisper funktion
    if (myWebSocket !== null && myWebSocket.readyState === 1) {
            console.log('Whispering ' + user + ': ' + message);

            myWebSocket.send('PRIVMSG #' + document.getElementById("channel").value + ' :/w ' + user + ' '+ message);
    }
}

chatClient.prototype.onOpen = function onOpen(){ //nichts verändern, höchstens die daten :D
    var socket = this.webSocket;

    if (socket !== null && socket.readyState === 1) {
        console.log('Connecting and authenticating...');

        socket.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
        socket.send('PASS ' + this.password);
        socket.send('NICK ' + this.username);
        socket.send('JOIN #' + document.getElementById("channel").value);
    }
};

chatClient.prototype.nClose = function onClose(){
    console.log('Disconnected from the chat server.');
};

chatClient.prototype.close = function close(){
    if(this.webSocket){
        this.webSocket.close();
    }
};

/* This is an example of an IRC message with tags. I split it across 
multiple lines for readability. The spaces at the beginning of each line are 
intentional to show where each set of information is parsed. */

//@badges=global_mod/1,turbo/1;color=#0D4200;display-name=TWITCH_UserNaME;emotes=25:0-4,12-16/1902:6-10;mod=0;room-id=1337;subscriber=0;turbo=1;user-id=1337;user-type=global_mod
// :twitch_username!twitch_username@twitch_username.tmi.twitch.tv 
// PRIVMSG 
// #channel
// :Kappa Keepo Kappa

chatClient.prototype.parseMessage = function parseMessage(rawMessage) { //splittet die nachricht in relevante teilchen auf. sehr sehr praktisch, kannst dann auf die einzelnen infos direkt zugreifen
    var parsedMessage = {
        message: null,
        tags: null,
        command: null,
        original: rawMessage,
        channel: null,
        username: null
    };

    if(rawMessage[0] === '@'){
        var tagIndex = rawMessage.indexOf(' '),
        userIndex = rawMessage.indexOf(' ', tagIndex + 1),
        commandIndex = rawMessage.indexOf(' ', userIndex + 1),
        channelIndex = rawMessage.indexOf(' ', commandIndex + 1),
        messageIndex = rawMessage.indexOf(':', channelIndex + 1);

        parsedMessage.tags = rawMessage.slice(0, tagIndex);
        parsedMessage.username = rawMessage.slice(tagIndex + 2, rawMessage.indexOf('!'));
        parsedMessage.command = rawMessage.slice(userIndex + 1, commandIndex);
        parsedMessage.channel = rawMessage.slice(commandIndex + 1, channelIndex);
        parsedMessage.message = rawMessage.slice(messageIndex + 1);
    }

    return parsedMessage;
}
