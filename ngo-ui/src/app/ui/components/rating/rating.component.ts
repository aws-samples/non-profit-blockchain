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
