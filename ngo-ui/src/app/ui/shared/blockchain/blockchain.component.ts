import { Component, OnInit, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { Block } from 'src/app/ui/components/blockchain-progress/blockchain.interface';
import { SocketService } from 'src/app/services/shared/socket.service';
import { environment } from 'src/environments/environment';
import { Donor } from 'src/app/models';
import { DonorService } from 'src/app/services/shared';

@Component({
  selector: 'app-blockchain',
  templateUrl: './blockchain.component.html',
  styleUrls: ['./blockchain.component.scss']
})
export class BlockchainComponent implements OnInit {

  error: any = null;
  connection: WebSocket = null;
  messageProducer: any = null;
  public messages: Subject<any> = new Subject<any>();
  currentUser: Donor = null;


  content = 'Test Data';
  blockchain: Block[] = [<Block>{
    caption: '0',
    date: new Date(),
    selected: true,
    title: 'Login',
    txCount: 0,
    txInBlock: []
  },

  ];

  setBlockChain(newdata: Block[]) {
    this.blockchain = newdata;
  }

  constructor(private socketService: SocketService,
    private donorService: DonorService) { }

  ngOnInit(): void {
    this.messages = <Subject<any>>this.socketService.connect(environment.socket_url);
    this.messages.subscribe(message => {
      this.processMessage(message);
    });
    setInterval(() => {
      try {
        this.messages.next('ping');
      } catch (e) {
        console.error(e);
      }
    }, 1000);

    this.donorService.currentDonor.subscribe(
      (userData) => {
        this.currentUser = userData;
      }
    );
  }

  processError(error) {
    console.error(error);
  }

  processMessage(message) {
    let jsonobj = null;
    try {
      const resp_data = JSON.parse(message.data);
      const message_obj = {
        caption: resp_data.blockNumber,
        date: new Date(1 / 1 / 2019),
        selected: true,
        title: resp_data.txCount,
        txCount: resp_data.txCount,
        txInBlock: resp_data.txInBlock
      };
      jsonobj = <Block>message_obj;
    } catch (e) {
      console.error('Invalid JSON: ', message.data);
      return;
    }
    if (jsonobj) {
      this.updateData(jsonobj);
    } else {
      console.error('Hmm..., I\'ve never seen JSON like this:', jsonobj);
    }
  }

  updateData(block) {
    const data = this.blockchain;
    const len = data.length;
    if (data && data[len - 1].caption !== block.caption) {
      if (len > 0 && data[len - 1]) {
        (data[len - 1]).selected = null;
      }
      data.push(block);
      this.setBlockChain(data);
      this.socketService.newMessage.emit({
        data: this.blockchain
      });
    }
  }



}
