import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'fallback_secret_key_medidesk_2026',
      });

      this.onlineUsers.set(client.id, payload.sub);
      this.server.emit('online_status', { userId: payload.sub, online: true });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.onlineUsers.get(client.id);
    if (userId) {
      this.onlineUsers.delete(client.id);
      this.server.emit('online_status', { userId, online: false });
    }
  }

  @SubscribeMessage('join_ticket')
  handleJoinTicket(
    @MessageBody('ticketId') ticketId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`ticket_${ticketId}`);
    return { status: 'joined', ticketId };
  }

  @SubscribeMessage('leave_ticket')
  handleLeaveTicket(
    @MessageBody('ticketId') ticketId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`ticket_${ticketId}`);
    return { status: 'left', ticketId };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { ticketId: string; message: string; voiceUrl?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = this.onlineUsers.get(client.id);
    if (!senderId) return { error: 'Unauthorized' };

    const user = await this.prisma.user.findUnique({ where: { id: senderId } });
    if (!user) return { error: 'User not found' };

    const msg = await this.prisma.ticketMessage.create({
      data: {
        ticketId: data.ticketId,
        senderId,
        senderRole: user.role,
        message: data.message,
        voiceUrl: data.voiceUrl,
      },
    });

    // Notify room of the new message
    this.server.to(`ticket_${data.ticketId}`).emit('new_message', msg);
    return msg;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { ticketId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.onlineUsers.get(client.id);
    if (!userId) return;

    // Send typing broadcast to everyone in the room except the typing sender
    client.to(`ticket_${data.ticketId}`).emit('typing', {
      userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('read_receipt')
  handleReadReceipt(
    @MessageBody() data: { ticketId: string; messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.onlineUsers.get(client.id);
    if (!userId) return;

    client.to(`ticket_${data.ticketId}`).emit('read_receipt', {
      messageId: data.messageId,
      userId,
    });
  }
}
