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
