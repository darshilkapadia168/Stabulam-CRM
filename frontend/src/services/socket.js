import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const connectSocket = (userId) => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);

            // Join user's personal room
            if (userId) {
                socket.emit('join-user-room', userId);
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });
    }

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('🔌 Socket disconnected manually');
    }
};

export const getSocket = () => socket;

export default {
    connectSocket,
    disconnectSocket,
    getSocket,
};