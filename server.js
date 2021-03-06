const http = require('http')
const app = require('./app')

let users = [];
let wordcount;

const words = [
    "word", "letter", "number", "person", "pen", "police", "fire",
    "earth", "water", "M.Robillard", "university", "fish", "joke", "wire", "transport",
    "ankle", "pillow", "temple", "fairy", "route", "Victorine", "Laurine", "horoscope",
    "book", "dream", "vegetation", "birthday", "forest", "victory", "marriage",
    "rich", "chocolate", "soak", "space", "pool", "gun", "quest", "survey", "bathroom",
    "dance", "art", "fork", "beer", "leaflet", "music", "river", "car", "world", "head", "page", "country"
];

function newWord() {
    wordcount = Math.floor(Math.random() * (words.length));
    return words[wordcount];
};


const normalizePort = val => {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const errorHandler = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
        default:
            throw error;
    }
}

const server = http.createServer(app)

server.on('error', errorHandler)
server.on('listening', () => {
    const address = server.address()
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port
    console.log('Listening on ' + bind)
})


// Web sockets
const io = require('socket.io')(server)

io.sockets.on('connection', (socket) => {
    socket.on('join', function (name) {
        socket.username = name;
        // user automatically joins a room under their own name
        socket.join(name);
        console.log(socket.username + ' has joined ' + "number of player : " + users.length);
        // save the name of the user to an array called users
        users.push(socket.username);
        // if the user is first to join OR 'drawer' room has no connections
        if (users.length === 1 || typeof io.sockets.adapter.rooms['drawer'] === 'undefined') {
            // place user into 'drawer' room
            socket.room = "drawer";
            socket.join('drawer');
            // server submits the 'drawer' event to this user
            io.in(socket.username).emit('drawer', socket.username);
            console.log(socket.username + ' is a drawer');
            socket.on('mouse', (data) => socket.broadcast.emit('mouse', data));
            // send the random word to the user inside the 'drawer' room
            io.in(socket.username).emit('draw word', newWord());

        } else {
            // additional users will join the 'guesser' room
            socket.join('guesser');
            socket.room = "guesser";
            // server submits the 'guesser' event to this user
            io.in(socket.username).emit('guesser', socket.username);
            console.log(socket.username + ' is a guesser');
        }

        // update all clients with the list of users
        io.emit('userlist', users);

    });

    socket.on('new drawer', function (name) {
        // remove user from 'guesser' room
        socket.leave('guesser');
        // place user into 'drawer' room
        socket.join('drawer');
        console.log('new drawer emit: ' + name);

        // submit 'drawer' event to the same user
        socket.emit('drawer', name);
        // send a random word to the user connected to 'drawer' room
        io.in('drawer').emit('draw word', newWord());

    });

    // submit each client's guesses to all clients
    socket.on('guessword', function (data) {
        socket.broadcast.emit('guessword', {
            username: data.username,
            guessword: data.guessword
        })
        console.log('guessword event triggered on server from: ' + data.username + ' with word: ' + data.guessword);
    });


    socket.on('set', function (status, callback) {
        console.log(status);
        callback('ok');
    });

    // initiated from drawer's 'dblclick' event in Player list
    socket.on('swap rooms', function (data) {

        // drawer leaves 'drawer' room and joins 'guesser' room
        socket.leave('drawer');
        socket.join('guesser');

        // submit 'guesser' event to this user
        socket.emit('guesser', socket.username);

        // submit 'drawer' event to the name of user that was doubleclicked
        io.in(data.to).emit('drawer', data.to);

        // submit random word to new user drawer
        io.in(data.to).emit('draw word', newWord());

        io.emit('reset', data.to);

    });


    socket.on('correct answer', function (data) {
        socket.broadcast.emit('correct answer', data);
        console.log(data.username + ' guessed correctly with ' + data.guessword);
    });

    socket.on('disconnect', () => {
        for (var i = 0; i < users.length; i++) {
            // remove user from users list
            if (users[i] == socket.username) {
                users.splice(i, 1);
            };
        };
        console.log(socket.username + ' has disconnected + number of player : ' + users.length);
        // submit updated users list to all clients
        io.emit('userlist', users);

        // if 'drawer' room has no connections..
        if (typeof io.sockets.adapter.rooms['drawer'] === "undefined") {

            // generate random number based on length of users list
            let x = Math.floor(Math.random() * (users.length));

            // submit new drawer event to the random user in userslist
            io.in(users[x]).emit('new drawer', users[x]);
        };
    });
});

server.listen(port);