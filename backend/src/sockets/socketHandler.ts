import { Server, Socket } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-room', (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`User ${userId} joined room`);
    });

    socket.on('leave-room', (userId: string) => {
      socket.leave(`user-${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const emitNotification = (io: Server, userId: string | null, notification: any) => {
  if (userId) {
    io.to(`user-${userId}`).emit('notification', notification);
  } else {
    io.emit('notification', notification); // Broadcast to all
  }
};

export const emitStockUpdate = (io: Server, productId: string, stock: number) => {
  io.emit('stock-update', { productId, stock, timestamp: new Date() });
};
