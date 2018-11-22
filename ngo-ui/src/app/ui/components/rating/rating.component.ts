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
import { Component, Input, Injectable, Output, EventEmitter, OnInit } from '@angular/core';


@Injectable()
export class RatingService {
  ratingClick = new EventEmitter<any>();
}
@Component({
  selector: 'app-star-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss']
})
export class RatingComponent implements OnInit {

  @Input() rating: number;
  @Input() itemId: string;
  @Input() iseditable: false;

  inputName: string;

  constructor(private ratingService: RatingService) { }

  ngOnInit() {
    this.inputName = this.itemId + '_rating';
  }

  onClick(rating: number): void {
    if (this.iseditable) {
      this.rating = rating;
      this.ratingService.ratingClick.emit({
        itemId: this.itemId,
        rating: rating
      });
    }
  }

}
