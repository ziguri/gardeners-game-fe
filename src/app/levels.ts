import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API } from './login';

@Component({ selector: 'app-levels', imports: [RouterLink], template: `
<div class="narrow">
  <div class="top"><a class="iconbtn" routerLink="/me" aria-label="Back">←</a><h1>Levels</h1><span class="pill">{{d()?.seeds}} seeds</span></div>
  @if (err()) { <p class="toast" role="alert">✕ {{err()}}</p> }
  @for (w of worlds; track w.name) {
    <h2 class="sec">{{w.name}} <small>Levels {{w.from}}–{{w.from + 9}}</small></h2>
    <div class="lvgrid">
      @for (l of slice(w.from); track l.level) {
        <button class="lv" [disabled]="!l.unlocked" (click)="play(l.level)" [attr.aria-label]="'Level ' + l.level + (l.unlocked ? ', ' + l.stars + ' stars' : ', locked')">
          {{l.level}}<small>{{l.unlocked ? '★'.repeat(l.stars) + '☆'.repeat(3 - l.stars) : 'locked'}}</small></button> }
    </div>
  }
</div>` })
export class Levels {
  http = inject(HttpClient); r = inject(Router); d = signal<any>(null); err = signal('');
  worlds = [{ name: 'CTW', from: 1 }, { name: 'Gardeners', from: 11 }, { name: 'Teams & people', from: 21 }];
  constructor() { this.http.get(API + '/me/levels').subscribe(x => this.d.set(x)); }
  slice(from: number) { return (this.d()?.levels ?? []).slice(from - 1, from + 9); }
  play(level: number) { this.http.post<any>(API + '/me/games', { level }).subscribe({
    next: g => this.r.navigate(['game', g.id]), error: e => this.err.set(e.error?.details ?? e.error?.message ?? 'This level is not available yet. Ask the admin to add facts.') }); }
}
