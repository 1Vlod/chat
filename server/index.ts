import * as net from 'net';
import { COMMANDS } from '../infrastructure/constants';
import { IConnection, IPayload } from '../infrastructure/interfaces';

export class SocketServer {
  private pool = new Set<net.Socket>();
  private roomsUsers = new Map<string, Omit<IConnection, 'room'>[]>();
  private roomsMessages = new Map<string, string[]>();

  constructor(private port: number) {
    net
      .createServer((socket: net.Socket) => {
        console.log(socket.address());
        console.log('connected');

        this.pool.add(socket);

        socket.on('data', (data) => {
          try {
            const message = data.toString();
            let payload: IPayload;
            try {
              payload = JSON.parse(message);
              console.log(payload);
            } catch (err: any) {
              console.log('err', err);
              this.sendError(
                socket,
                "Error occurred while parsing a data chunk. Make sure you're using the correct client for this server (cli)\n"
              );
              return;
            }

            if (!payload.cmd || !payload.room || !payload.nick) {
              this.sendError(
                socket,
                'You must write a command from commands list in the rigth order.\n'
              );
              return;
            }

            if (
              !Object.keys(COMMANDS).includes(payload.cmd) ||
              payload.cmd === COMMANDS.ERR
            ) {
              this.sendError(
                socket,
                'You must write the right command from commands list'
              );
              return;
            }

            switch (payload.cmd) {
              case COMMANDS.INIT: {
                for (const [key] of this.pool.entries()) {
                  if (key === socket) {
                    this.addSocketToRoom(socket, {
                      room: payload.room,
                      nick: payload.nick,
                    });
                    this.pool.delete(socket);
                    break;
                  }
                }
                break;
              }
              case COMMANDS.HST: {
                if (this.roomsMessages.has(payload.room)) {
                  socket.write(this.roomsMessages.get(payload.room)!.join(''));
                }
                break;
              }
              case COMMANDS.MSG: {
                if (!payload.text) {
                  this.sendError(
                    socket,
                    'You must write any text in your message.\n'
                  );
                  return;
                }

                const roomMessages = this.roomsMessages.get(payload.room);
                if (roomMessages?.length) {
                  roomMessages.push(`${payload.nick}: ${payload.text} \n`);
                  console.log(
                    `Saved message from ${payload.nick} to room ${payload.room}`
                  );
                } else {
                  this.roomsMessages.set(payload.room, [
                    `${payload.nick}: ${payload.text} \n`,
                  ]);
                  console.log(
                    'Created array for messages room # ',
                    payload.room
                  );
                }

                this.notifyOtherSockets(
                  payload.room,
                  payload.nick,
                  `${payload.nick}: ${payload.text}`
                );
                break;
              }
              case COMMANDS.CHR: {
                if (!payload.targetRoom) {
                  this.sendError(
                    socket,
                    'You must write a targetRoom to change a room.\n'
                  );
                  return;
                }

                this.addSocketToRoom(socket, {
                  room: payload.targetRoom,
                  nick: payload.nick,
                });

                this.roomsUsers.set(
                  payload.room,
                  this.roomsUsers
                    .get(payload.room)!
                    .filter((user) => user.nick !== payload.nick)
                );
                break;
              }
              case COMMANDS.LSU: {
                socket.write(
                  this.roomsUsers
                    .get(payload.room)!
                    .map((userName, i) => `${i}.${userName.nick}`)
                    .join('\n')
                );
                break;
              }
            }
          } catch (err) {
            console.log('Internal error: ', err);
            this.sendError(
              socket,
              'Internal server error occured, please write Vlad about it \n'
            );
          }
        });
      })
      .listen(this.port);

    console.log('server start on port: ', this.port);
  }

  private sendError(socket: net.Socket, errorMessage: string) {
    socket.write(`${COMMANDS.ERR}: ${errorMessage}`);
  }

  private addSocketToRoom(
    socket: net.Socket,
    { room, nick }: Pick<IPayload, 'room' | 'nick'>
  ) {
    if (this.roomsUsers.has(room)) {
      this.roomsUsers.get(room)!.push({ socket, nick: nick });
      this.notifyOtherSockets(
        room,
        nick,
        `В комнату ${room} подключился новый участник ${nick}.\nВсего участников ${
          this.roomsUsers.get(room)?.length
        }`
      );
    } else {
      this.roomsUsers.set(room, [{ socket, nick: nick }]);
    }
  }

  private notifyOtherSockets(room: string, nick: string, message: string) {
    for (const connection of this.roomsUsers.get(room)!) {
      if (connection.nick === nick) continue;

      connection.socket.write(message);
    }
  }
}

new SocketServer(8080);

process.on('SIGINT', () => {
  process.exit(0);
});
