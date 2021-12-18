import { HttpClient } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  faBalanceScale,
  faCaretLeft,
  faClock,
  faCodeBranch,
  faExternalLinkAlt,
  faEye,
  faGlobe,
  faStar,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import { CatalogueService } from "../services/catalogue/catalogue.service";

@Component({
  selector: "app-repo-details",
  templateUrl: "./repo-details.component.html",
  styleUrls: ["./repo-details.component.scss"],
})
export class RepoDetailsComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private catalogueService: CatalogueService
  ) {}

  readonly faCaretLeft = faCaretLeft;
  readonly faGlobe = faGlobe;
  readonly faUserCircle = faUserCircle;
  readonly faGithub = faGithub;
  readonly faExternalLinkAlt = faExternalLinkAlt;
  readonly faEye = faEye;
  readonly faStar = faStar;
  readonly faCodeBranch = faCodeBranch;
  readonly faClock = faClock;
  readonly faBalanceScale = faBalanceScale;

  id: number;
  item;

  ngOnInit(): void {
    this.id = this.route.snapshot.params.id;
    this.item = this.catalogueService.getLocalRepo(this.id);
  }
}
