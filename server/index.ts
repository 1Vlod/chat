import * as stream from 'stream';
import * as net from 'net';
import { COMMANDS } from '../infrastructure/constants';
import { IConnection, IPayload } from '../infrastructure/interfaces';

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
          const message = data.toString();
          console.log(message);
          const payload: IPayload = JSON.parse(message);
          console.log(payload);

          if (!payload.cmd || !payload.room || !payload.nick) {
            socket.write(
              `${COMMANDS.ERR}: You must write a command from commands list in the rigth order.\n`
            );
            return;
          }

          if (
            !Object.keys(COMMANDS).includes(payload.cmd) ||
            payload.cmd === COMMANDS.ERR
          ) {
            socket.write(
              `${COMMANDS.ERR}: You must write the right command from commands list`
            );
            return;
          }

          switch (payload.cmd) {
            case COMMANDS.INIT: {
              for (const entry of this.pool.entries()) {
                if (entry[0] === socket) {
                  console.log('Found');
                  if (this.roomsUsers.has(payload.room)) {
                    this.roomsUsers
                      .get(payload.room)!
                      .push({ socket, nick: payload.nick });
                  } else {
                    this.roomsUsers.set(payload.room, [
                      { socket, nick: payload.nick },
                    ]);
                  }
                  this.pool.delete(socket);
                  break;
                }
              }

              for (const connection of this.roomsUsers.get(payload.room)!) {
                if (connection.nick === payload.nick) continue;

                connection.socket.write(
                  Buffer.from(
                    `В комнату ${payload.room} подключился новый участник ${
                      payload.nick
                    }.\nВсего участников ${
                      this.roomsUsers.get(payload.room)?.length
                    }`
                  )
                );
              }
              break;
            }
            case COMMANDS.HST: {
              if (this.roomsMessages.has(payload.room)) {
                socket.write(
                  Buffer.from(this.roomsMessages.get(payload.room)!.join(''))
                );
              }
              break;
            }
            case COMMANDS.MSG: {
              if (!payload.text) {
                socket.write(
                  `${COMMANDS.ERR}: You must write any text in your message.\n`
                );
                return;
              }

              const roomMessages = this.roomsMessages.get(payload.room);
              if (roomMessages?.length) {
                roomMessages.push(`${payload.nick}: ${payload.text} \n`);
                console.log('Saved message to room');
              } else {
                this.roomsMessages.set(payload.room, [
                  `${payload.nick}: ${payload.text} \n`,
                ]);
                console.log('Created array for messages room # ', payload.room);
              }

              for (const user of this.roomsUsers.get(payload.room)!) {
                if (user.nick === payload.nick) continue;
                user.socket.write(
                  Buffer.from(`${payload.nick}: ${payload.text}`)
                );
              }
              break;
            }
            case COMMANDS.CHR: {
              if (!payload.targetRoom) {
                socket.write(
                  `${COMMANDS.ERR}: You must write a targetRoom to change a room.\n`
                );
                return;
              }
              if (this.roomsUsers.has(payload.targetRoom)) {
                this.roomsUsers
                  .get(payload.targetRoom)!
                  .push({ socket, nick: payload.nick });
                for (const connection of this.roomsUsers.get(
                  payload.targetRoom
                )!) {
                  if (connection.nick === payload.nick) continue;

                  connection.socket.write(
                    Buffer.from(
                      `В комнату ${
                        payload.targetRoom
                      } подключился новый участник ${
                        payload.nick
                      }.\nВсего участников ${
                        this.roomsUsers.get(payload.targetRoom)?.length
                      }`
                    )
                  );
                }

                socket.write(
                  Buffer.from(
                    this.roomsMessages.get(payload.targetRoom)!.join('')
                  )
                );
              } else {
                this.roomsUsers.set(payload.targetRoom, [
                  { socket, nick: payload.nick },
                ]);
              }

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
                Buffer.from(
                  this.roomsUsers
                    .get(payload.room)!
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
