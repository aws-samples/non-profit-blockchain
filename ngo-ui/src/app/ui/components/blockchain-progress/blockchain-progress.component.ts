/*
# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# or in the "license" file accompanying this file. This file is distributed
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
# express or implied. See the License for the specific language governing
# permissions and limitations under the License.
#
*/
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { Block } from './blockchain.interface';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { SocketService } from 'src/app/services/shared/socket.service';

@Component({
  selector: 'app-blockchain-progress',
  templateUrl: './blockchain-progress.component.html',
  styleUrls: ['./blockchain-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('contentState', [
      state('active', style({
        position: 'relative', 'z-index': 2, opacity: 1,
      })),
      transition('right => active', [
        style({
          transform: 'translateX(100%)'
        }),
        animate('400ms ease-in-out', keyframes([
          style({ opacity: 0, transform: 'translateX(100%)', offset: 0 }),
          style({ opacity: 1, transform: 'translateX(0%)', offset: 1.0 })
        ]))
      ]),
      transition('active => right', [
        style({
          transform: 'translateX(-100%)'
        }),
        animate('400ms ease-in-out', keyframes([
          style({ opacity: 1, transform: 'translateX(0%)', offset: 0 }),
          style({ opacity: 0, transform: 'translateX(100%)', offset: 1.0 })
        ]))
      ]),
      transition('active => left', [
        style({
          transform: 'translateX(-100%)'
        }),
        animate('400ms ease-in-out', keyframes([
          style({ opacity: 1, transform: 'translateX(0%)', offset: 0 }),
          style({ opacity: 0, transform: 'translateX(-100%)', offset: 1.0 })
        ]))
      ]),
      transition('left => active', [
        style({
          transform: 'translateX(100%)'
        }),
        animate('400ms ease-in-out', keyframes([
          style({ opacity: 0, transform: 'translateX(-100%)', offset: 0 }),
          style({ opacity: 1, transform: 'translateX(0%)', offset: 1.0 })
        ]))
      ]),
    ])
  ]
})
export class BlockchainProgressComponent implements AfterViewInit {
  prevLinkInactive = true;
  nextLinkInactive = false;
  loaded = false;
  selectedIndex = 0;
  @ViewChild('eventsWrapper') eventsWrapper: ElementRef;
  @ViewChild('connectBlocks') connectBlocks: ElementRef;
  @ViewChildren('blockEvents') blockEvents: QueryList<ElementRef>;
  eventsWrapperWidth = 0;
  private _viewInitialized = false;

  constructor(private detectChange: ChangeDetectorRef, private socketService: SocketService) {
    this.socketService.newMessage.subscribe(
      (data: any) => {
        try {
          detectChange.detectChanges();
          this.ngAfterViewInit();
        } catch (ex) {
          console.error(ex);
        }
      });
  }

  private blockEventsWidth = 720;
  private blockEventsGap = 100;
  private _blockElements: Block[];

  get blockElements(): Block[] {
    return this._blockElements;
  }

  @Input()
  set blockElements(value: Block[]) {
    this._blockElements = value;
    this.initView();
  }

  private static pxToNumber(val: string): number {
    return Number(val.replace('px', ''));
  }

  private static getElementWidth(element: Element): number {
    const computedStyle = window.getComputedStyle(element);
    if (!computedStyle.width) {
      return 0;
    }
    return BlockchainProgressComponent.pxToNumber(computedStyle.width);
  }

  private static parentElement(element: any, tagName: string) {
    if (!element || !element.parentNode) {
      return null;
    }

    let parent = element.parentNode;
    while (true) {
      if (parent.tagName.toLowerCase() === tagName) {
        return parent;
      }
      parent = parent.parentNode;
      if (!parent) {
        return null;
      }
    }
  }

  private static getTranslateValue(block: Element) {
    const blockStyle = window.getComputedStyle(block);
    const blockTranslate = blockStyle.getPropertyValue('-webkit-transform') ||
      blockStyle.getPropertyValue('-moz-transform') ||
      blockStyle.getPropertyValue('-ms-transform') ||
      blockStyle.getPropertyValue('-o-transform') ||
      blockStyle.getPropertyValue('transform');

    let translateValue = 0;
    if (blockTranslate.indexOf('(') >= 0) {
      const blockTranslateStr = blockTranslate
        .split('(')[1]
        .split(')')[0]
        .split(',')[4];
      translateValue = Number(blockTranslateStr);
    }
    return translateValue;
  }

  private static setTransformValue(element: any, property: any, value: any) {
    element.style['-webkit-transform'] = property + '(' + value + ')';
    element.style['-moz-transform'] = property + '(' + value + ')';
    element.style['-ms-transform'] = property + '(' + value + ')';
    element.style['-o-transform'] = property + '(' + value + ')';
    element.style['transform'] = property + '(' + value + ')';
  }

  private static dayDiff(first: Date, second: Date): number {
    return Math.round(second.getTime() - first.getTime());
  }

  private static minLapse(elements: Block[]): number {
    if (elements && elements.length && elements.length === 1) {
      return 0;
    }

    let result = 0;
    for (let i = 1; i < elements.length; i++) {
      const distance = BlockchainProgressComponent.dayDiff(elements[i - 1].date, elements[i].date);
      result = result ? Math.min(result, distance) : distance;
    }
    return result;
  }

  ngAfterViewInit(): void {
    this.detectChange.detach();
    this._viewInitialized = true;
    this.initView();
    $('[data-toggle="tooltip"]').tooltip();
  }

  initBlockChain(blockChains: Block[]) {
    const blockEventsMinDist = 100;
    this.setBlockPosition(blockChains, this.blockEventsGap, blockEventsMinDist);
    this.setBlockChainWidth(blockChains, this.blockEventsGap, blockEventsMinDist);
    this.loaded = true;
  }

  onBlocksScrollChange(e: Event, right: boolean) {
    e.preventDefault();
    this.updateBlocksVisibility(this.eventsWrapperWidth, right);
    this.detectChange.detectChanges();
  }

  updateBlocksVisibility(blockTotWidth: number, right: boolean) {
    const translateValue = BlockchainProgressComponent.getTranslateValue(this.eventsWrapper.nativeElement);
    if (right) {
      this.translateBlockChain(translateValue - this.blockEventsWidth + this.blockEventsGap, this.blockEventsWidth - blockTotWidth);
    } else {
      this.translateBlockChain(translateValue + this.blockEventsWidth - this.blockEventsGap, null);
    }
  }

  translateBlockChain(value: number, totWidth: number | null) {
    value = (value > 0) ? 0 : value;
    value = (!(totWidth === null) && value < totWidth) ? totWidth : value;
    BlockchainProgressComponent.setTransformValue(this.eventsWrapper.nativeElement, 'translateX', value + 'px');
    this.prevLinkInactive = value === 0;
    this.nextLinkInactive = value === totWidth;
  }

  updateBlockChainPosition(element: Element) {
    const eventStyle = window.getComputedStyle(element);
    const eventLeft = BlockchainProgressComponent.pxToNumber(eventStyle.getPropertyValue('left'));
    const translateValue = BlockchainProgressComponent.getTranslateValue(this.eventsWrapper.nativeElement);
    if (eventLeft > this.blockEventsWidth - translateValue) {
      this.translateBlockChain(-eventLeft + this.blockEventsWidth / 2, this.blockEventsWidth - this.eventsWrapperWidth);
    }
  }

  setBlockChainWidth(elements: Block[], width: number, blockEventsMinDist: number) {
    let timeSpan = 100;
    if (elements.length > 2) {
      timeSpan = timeSpan * elements.length;
    } else {
      timeSpan = 350;
    }
    let timeSpanNorm = timeSpan / blockEventsMinDist;
    timeSpanNorm = Math.round(timeSpanNorm) + 4;
    this.eventsWrapperWidth = timeSpanNorm * width;
    const aHref = this.eventsWrapper.nativeElement.querySelectorAll('img.selected')[0];
    this.updateConnectBlocks(aHref);
    this.updateBlockChainPosition(aHref);
    return this.eventsWrapperWidth;
  }

  private updateConnectBlocks(element: any) {
    const eventStyle = window.getComputedStyle(element);
    const eventLeft = eventStyle.getPropertyValue('left');
    const eventWidth = eventStyle.getPropertyValue('width');
    const eventLeftNum = BlockchainProgressComponent.pxToNumber(eventLeft) + BlockchainProgressComponent.pxToNumber(eventWidth) / 2;
    const scaleValue = eventLeftNum / this.eventsWrapperWidth;
    BlockchainProgressComponent.setTransformValue(this.connectBlocks.nativeElement, 'scaleX', scaleValue);
  }

  private setBlockPosition(elements: Block[], min: number, blockEventsMinDist: number) {
    const blockEventsArray = this.blockEvents.toArray();
    let i = 0;
    for (const component of elements) {
      const distance = 100 * i + 1;
      const distanceNorm = Math.round(distance / blockEventsMinDist);
      blockEventsArray[i].nativeElement.style.left = distanceNorm * min + 'px';
      blockEventsArray[i].nativeElement.children[0].style.left = distanceNorm * min + 'px';

      const span: HTMLSpanElement = <HTMLSpanElement>blockEventsArray[i].nativeElement.parentElement.children[1];
      const spanWidth = BlockchainProgressComponent.getElementWidth(span);
      span.style.left = distanceNorm * min - 8 + 'px';
      i++;
    }
  }

  private initView(): void {
    if (!this._viewInitialized) {
      return;
    }
    if (this._blockElements && this._blockElements.length) {
      for (let i = 0; i < this._blockElements.length; i++) {
        if (this._blockElements[i].selected) {
          this.selectedIndex = i;
          break;
        }
      }
      this.initBlockChain(this._blockElements);
    }
    this.detectChange.detectChanges();
  }

  getTransections(item) {
    let translist = '';
    for (let i = 0; i < item.txInBlock.length; i++) {
      translist += `<em> ${item.txInBlock[i]}</em><br>`;
    }
    return `<span>Transaction Count:${item.txCount}</span><br><span>Transaction Blocks<span><br>${translist}`;
  }
}
