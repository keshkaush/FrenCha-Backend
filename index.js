const express = require('express')
const http = require('http')
const cors = require('cors')
const { addUser, getUser, getUsersInRoom, removeUser } = require('./users')

const PORT = process.env.PORT || 5000
const router = require('./router')

const app = express()
const server = http.createServer(app);


const options={
 cors:true,
 origins:["http://127.0.0.1:5000"],
}
const io = require('socket.io')(server, options)

app.use(cors());
app.use(router)

io.on('connection', (socket) => {
    console.log('connected to socket!!');

    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room })
        if (error) return callback(error)
        
        socket.emit('message', { user: '', text: `${user.name}, Welcome! to the channel ${user.room}` })
        socket.broadcast.to(user.room).emit('message', { user: '', text: `${user.name}, has joined the channel` })

        socket.join(user.room)

        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)})

        callback()
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('message', { user: user.name, text: message })
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)})
        callback();
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            socket.broadcast.to(user.room).emit('message', {user: '', text: `${user.name}, has left the chat!`})
        }
    })
})

server.listen(PORT, () => {
    console.log('server running at '+PORT);
})
