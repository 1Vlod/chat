import * as stream from 'stream';
import * as net from 'net';
import { COMMANDS } from '../infrastructure/constants';
import { IConnection } from '../infrastructure/interfaces';

export class SocketServer {
  private pool = new Set<stream.Duplex>();
  private roomsUsers = new Map<string, Omit<IConnection, 'room'>[]>();
  private roomsMessages = new Map<string, string[]>();

  constructor(private port: number) {
    net
      .createServer((socket: net.Socket) => {
        console.log(socket.address());
        console.log('connected');

        this.pool.add(socket);

        socket.on('data', (data) => {
          let msg = data.toString();
          console.log(msg);
          const [cmd, room, nick, message] = msg.split(':');

          if (!cmd) {
            socket.write(
              `${COMMANDS.ERR}: You must write a command from commands list`
            );
          }

          if (!Object.keys(COMMANDS).includes(cmd) || cmd === COMMANDS.ERR) {
            socket.write(
              `${COMMANDS.ERR}: You must write the right command from commands list`
            );
          }

          switch (cmd) {
            case COMMANDS.INIT: {
              for (const entry of this.pool.entries()) {
                if (entry[0] === socket) {
                  console.log('Found');
                  if (this.roomsUsers.has(room)) {
                    this.roomsUsers.get(room)!.push({ socket, nick });
                  } else {
                    this.roomsUsers.set(room, [{ socket, nick }]);
                  }
                  this.pool.delete(socket);
                  break;
                }
              }

              for (const connection of this.roomsUsers.get(room)!) {
                if (connection.nick === nick) continue;

                connection.socket.write(
                  Buffer.from(
                    `В комнату ${room} подключился новый участник ${nick}.\nВсего участников ${
                      this.roomsUsers.get(room)?.length
                    }`
                  )
                );
              }
              break;
            }
            case COMMANDS.HST: {
              if (this.roomsMessages.has(room)) {
                socket.write(
                  Buffer.from(this.roomsMessages.get(room)!.join(''))
                );
              }
              break;
            }
            case COMMANDS.MSG: {
              const roomMessages = this.roomsMessages.get(room);
              if (roomMessages?.length) {
                roomMessages.push(`${nick}: ${message} \n`);
                console.log('Saved message to room');
              } else {
                this.roomsMessages.set(room, [`${nick}: ${message} \n`]);
                console.log('Created array for messages room # ', room);
              }

              for (const user of this.roomsUsers.get(room)!) {
                if (user.nick === nick) continue;
                user.socket.write(Buffer.from(`${nick}: ${message}`));
              }
              break;
            }
            case COMMANDS.CHR: {
              if (this.roomsUsers.has(message)) {
                this.roomsUsers.get(message)?.push({ socket, nick });
                for (const connection of this.roomsUsers.get(message)!) {
                  if (connection.nick === nick) continue;

                  connection.socket.write(
                    Buffer.from(
                      `В комнату ${message} подключился новый участник ${nick}.\nВсего участников ${
                        this.roomsUsers.get(message)?.length
                      }`
                    )
                  );
                }

                socket.write(
                  Buffer.from(this.roomsMessages.get(message)!.join(''))
                );
              } else {
                this.roomsUsers.set(message, [{ socket, nick }]);
              }

              break;
            }
            case COMMANDS.LSU: {
              socket.write(
                Buffer.from(
                  this.roomsUsers
                    .get(room)!
                    .map((userName, i) => `${i}.${userName.nick}`)
                    .join('\n')
                )
              );
              break;
            }
          }
        });
      })
      .listen(this.port);

    console.log('server start on port: ', this.port);
  }
}

new SocketServer(8080);
