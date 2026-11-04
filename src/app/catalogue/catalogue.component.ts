import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

const READY_CLASS = 'catalogue-ready';
const VEIL_DURATION_MS = 900;
const VEIL_RESTART_DELAY_MS = 20;

@Component({
  selector: 'app-catalogue',
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogueComponent {
  protected readonly veilVisible = signal(false);

  private showTimer?: number;
  private hideTimer?: number;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.clearTimers();
      document.body.classList.remove(READY_CLASS);
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add(READY_CLASS);
      return;
    }

    document.body.classList.remove(READY_CLASS);
    this.veilVisible.set(true);
    this.hideTimer = window.setTimeout(() => this.finishTransition(), VEIL_DURATION_MS);

    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.replayVeil());
  }

  private replayVeil(): void {
    this.clearTimers();
    document.body.classList.remove(READY_CLASS);
    this.veilVisible.set(false);
    this.showTimer = window.setTimeout(() => this.veilVisible.set(true), VEIL_RESTART_DELAY_MS);
    this.hideTimer = window.setTimeout(() => this.finishTransition(), VEIL_DURATION_MS);
  }

  private finishTransition(): void {
    this.veilVisible.set(false);
    document.body.classList.add(READY_CLASS);
  }

  private clearTimers(): void {
    window.clearTimeout(this.showTimer);
    window.clearTimeout(this.hideTimer);
  }
}
