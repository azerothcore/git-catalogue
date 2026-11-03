import { Component, OnDestroy } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-catalogue',
    templateUrl: './catalogue.component.html',
    styleUrls: ['./catalogue.component.scss'],
    standalone: false
})
export class CatalogueComponent implements OnDestroy {
  veilVisible = false;

  private readonly subscription = new Subscription();
  private showTimer?: number;
  private hideTimer?: number;
  private readonly reduceMotion =
    typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private readonly router: Router) {
    document.body.classList.remove('catalogue-ready');

    if (!this.reduceMotion) {
      this.veilVisible = true;
      this.hideTimer = window.setTimeout(() => this.finishTransition(), 900);
    } else {
      document.body.classList.add('catalogue-ready');
    }

    this.subscription.add(
      this.router.events.subscribe((event) => {
        if (!(event instanceof NavigationStart) || this.reduceMotion) {
          return;
        }

        window.clearTimeout(this.showTimer);
        window.clearTimeout(this.hideTimer);
        document.body.classList.remove('catalogue-ready');
        this.veilVisible = false;
        this.showTimer = window.setTimeout(() => (this.veilVisible = true), 20);
        this.hideTimer = window.setTimeout(() => this.finishTransition(), 900);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    window.clearTimeout(this.showTimer);
    window.clearTimeout(this.hideTimer);
    document.body.classList.remove('catalogue-ready');
  }

  private finishTransition(): void {
    this.veilVisible = false;
    document.body.classList.add('catalogue-ready');
  }
}
