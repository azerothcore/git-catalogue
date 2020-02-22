import { Component, OnInit, Input } from '@angular/core';
import { faStar, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-repo',
  templateUrl: './repo.component.html',
  styleUrls: ['./repo.component.scss']
})
export class RepoComponent implements OnInit {

  @Input() name: string;
  @Input() stars: number;
  @Input() created: Date;
  @Input() description: string;
  @Input() fullName: string;

  faStar: IconDefinition = faStar;

  constructor() { }

  ngOnInit(): void {
  }

}
