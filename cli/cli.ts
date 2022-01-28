import readline from 'readline';
import net from 'net';
import { stdin as input, stdout as output } from 'process';

import cliHardcode from './cliHardcode.json';
import { COMMANDS } from '../infrastructure/constants';
import { IPayload, Optional } from '../infrastructure/interfaces';

class CliClient {
  private rl;
  private connectionInfo = {
    port: 8080,
    name: 'user1',
    room: 'default',
  };
  private socket?: net.Socket;

  constructor() {
    this.rl = readline.createInterface({ input, output });
    this.rl.write(cliHardcode.welcomeMessage);

    this.rl.question(cliHardcode.PORT, (port) => {
      this.connectionInfo.port ||= +port;

      this.rl.question('Name: ', (name) => {
        if (!name) {
          throw new Error('Name is required');
        }
        this.connectionInfo.name = name;

        this.rl.question('Room: ', (room) => {
          if (!room) {
            throw new Error('Room is required');
          }
          this.connectionInfo.room = room;

          console.log(this.connectionInfo);
          this.init();
        });
      });
    });
  }

  private async init() {
    this.socket = new net.Socket();
    this.socket.connect(this.connectionInfo.port, 'localhost', () => {
      this.sendMessage({
        cmd: COMMANDS.INIT,
      });
      setTimeout(() => {
        this.sendMessage({
          cmd: COMMANDS.HST,
        });
      }, 500);
    });

    this.socket.on('data', function (d) {
      console.log(d.toString());
    });

    this.rl.addListener('line', (answer) => {
      const elem = answer.split(':');
      switch (elem[0]) {
        case COMMANDS.END: {
          this.socket!.end();
          this.rl.close();
          break;
        }
        case COMMANDS.CHR: {
          this.sendMessage({ cmd: COMMANDS.CHR, targetRoom: elem[1] });
          this.connectionInfo.room = elem[1];
          break;
        }
        case COMMANDS.LSU: {
          this.sendMessage({ cmd: COMMANDS.LSU });
          break;
        }
        case COMMANDS.HELP: {
          console.log(cliHardcode.help);
          break;
        }
        default: {
          this.sendMessage({ cmd: COMMANDS.MSG, text: elem[0] });
        }
      }
    });
  }

  private sendMessage(payload: Optional<IPayload, 'nick' | 'room'>) {
    payload.room = this.connectionInfo.room;
    payload.nick = this.connectionInfo.name;
    this.socket!.write(Buffer.from(JSON.stringify(payload)));
  }
}

new CliClient();
