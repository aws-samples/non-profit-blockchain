import { Component, OnInit, Input, ChangeDetectorRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})


export class GalleryComponent implements AfterViewInit {


  images = [];
  private _itemId: any;
  @Input()
  set itemId(value: any) {
    this._itemId = value;
    this._cdr.detectChanges();
    this.ngAfterViewInit();
  }

  constructor(private _cdr: ChangeDetectorRef) { }

  ngAfterViewInit() {
    this.images = [
      `assets/images/${this._itemId}/activities/01.jpg`,
      `assets/images/${this._itemId}/activities/02.jpg`,
      `assets/images/${this._itemId}/activities/03.jpg`,
      `assets/images/${this._itemId}/activities/04.jpg`,
    ];
  }

}
