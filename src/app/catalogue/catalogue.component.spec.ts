import { provideLocationMocks } from '@angular/common/testing';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CatalogueComponent } from './catalogue.component';

@Component({ template: '' })
class BlankPageComponent {}

describe('CatalogueComponent', () => {
  let fixture: ComponentFixture<CatalogueComponent>;

  const veil = () => {
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.route-veil');
  };
  const isReady = () => document.body.classList.contains('catalogue-ready');

  const create = (reducedMotion: boolean) => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: reducedMotion } as MediaQueryList);
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'next', component: BlankPageComponent }]), provideLocationMocks()],
    });
    fixture = TestBed.createComponent(CatalogueComponent);
  };

  it('should show the veil until the opening transition ends', fakeAsync(() => {
    create(false);

    expect(veil()).not.toBeNull();
    expect(isReady()).toBeFalse();

    tick(900);

    expect(veil()).toBeNull();
    expect(isReady()).toBeTrue();
  }));

  it('should replay the veil on navigation', fakeAsync(() => {
    create(false);
    tick(900);

    TestBed.inject(Router).navigateByUrl('/next');
    tick(20);

    expect(veil()).not.toBeNull();
    expect(isReady()).toBeFalse();

    tick(900);

    expect(veil()).toBeNull();
    expect(isReady()).toBeTrue();
  }));

  it('should skip the veil when the user prefers reduced motion', fakeAsync(() => {
    create(true);

    expect(veil()).toBeNull();
    expect(isReady()).toBeTrue();

    TestBed.inject(Router).navigateByUrl('/next');
    tick(20);

    expect(veil()).toBeNull();
    expect(isReady()).toBeTrue();
  }));

  it('should cancel its timers and clean up the body when destroyed', fakeAsync(() => {
    create(false);

    fixture.destroy();
    tick(900);

    expect(isReady()).toBeFalse();
  }));
});
