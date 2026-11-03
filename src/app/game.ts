import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API } from './login';
import { Art } from './art';
import { mmss } from './player';

@Component({ selector: 'app-game', imports: [CdkDrag, CdkDropList, CdkDropListGroup, RouterLink, Art], template: `
<div cdkDropListGroup class="narrow game">
@if (s(); as g) {
  <div class="top">
    <a class="iconbtn" routerLink="/levels" aria-label="Back to levels">←</a>
    <h1>Level {{g.level}}</h1>
    <span><span class="pill" aria-label="Time">{{fmt(el())}}</span> <span class="pill">{{g.score}} seeds</span></span>
  </div>

  @if (g.card) {
    @if (g.quiz) {
      <p class="lead">Choose the correct answer</p>
      <div class="quiz-card"><p>{{g.card}}</p></div>
      <div cdkDropListGroup class="quiz-board">
        <div cdkDropList class="answer-tray" cdkDropListSortingDisabled>
          @for (a of g.answers ?? []; track a.id) { <article class="seed-card" cdkDrag [cdkDragData]="a">{{a.label}}</article> }
        </div>
        <div cdkDropList class="pot" (cdkDropListDropped)="dropQuiz($event)"><span class="seed"></span>Drop your answer</div>
      </div>
    } @else {
      <p class="lead">Drop each fact where it belongs · {{g.total - g.remaining + 1}} of {{g.total}}</p>
      <div class="helprow"><button class="btn turq small" [disabled]="!g.helpsLeft || hint().length" (click)="help()">Help ({{g.helpsLeft}} left)</button></div>
    }
    @if (msg()) { <p class="toast" [class.ok]="ok()" role="status">{{ok() ? '✓' : '✕'}} {{msg()}}</p> }
  } @else {
    <section class="center done">
      <div class="artbox"><app-art/></div>
      <h1 class="title">{{g.stars ? 'Garden complete!' : 'Keep growing!'}}</h1>
      <div class="stars" [attr.aria-label]="g.stars + ' of 3 stars'">
        @for (i of [1,2,3]; track i) { <svg viewBox="0 0 48 48" width="56" height="56"><polygon points="24,3 30,18 46,19 34,30 38,46 24,37 10,46 14,30 2,19 18,18" stroke="#0b0b6b" stroke-width="3" stroke-linejoin="round" [attr.fill]="i <= g.stars ? '#2fdccb' : 'none'"/></svg> }
      </div>
      @if (!g.stars) { <p>You need at least 5 correct answers to unlock the next level.</p> }
      <div class="stats"><div><b>{{g.score / 10}}/{{g.total}}</b>Correct</div><div><b>{{fmt(g.seconds)}}</b>Time</div><div><b>+{{g.score}}</b>Seeds</div></div>
      @if (g.stars && g.level < 30) { <button class="btn navy" (click)="go(g.level + 1)">Next level</button> }
      <button class="btn" [class.navy]="!g.stars" [class.ghost]="g.stars" (click)="go(g.level)">Replay</button>
      <a class="btn ghost" routerLink="/levels">All levels</a>
    </section>
  }

  @if (!g.quiz) {
    @if (of(g, 'TOPIC').length) {
      <h2 class="sec">{{g.level <= 10 ? 'About CTW' : 'About the Gardeners'}}</h2>
      <div class="wrap">@for (t of of(g, 'TOPIC'); track t.id) { <div cdkDropList class="tile" [class.hint]="isHint(t)" (cdkDropListDropped)="drop($event, t)">{{t.label}}</div> }</div>
    }
    @if (of(g, 'LOCATION').length) {
      <h2 class="sec">Locations</h2>
      <div class="beds">@for (t of of(g, 'LOCATION'); track t.id) {
        <div cdkDropList class="bed" [class.hint]="isHint(t)" (cdkDropListDropped)="drop($event, t)"><span class="seed"></span>{{t.label}}</div> }</div>
    }
    @if (of(g, 'TEAM').length) {
      <h2 class="sec">Teams</h2>
      @for (grp of groups(g, 'TEAM'); track grp) { <h3>{{grp}}</h3>
        <div class="wrap">@for (t of of(g, 'TEAM', grp); track t.id) { <div cdkDropList class="tile" [class.hint]="isHint(t)" (cdkDropListDropped)="drop($event, t)">{{t.label}}</div> }</div> }
    }
    @if (of(g, 'MEMBER').length) {
      <h2 class="sec">People</h2>
      @for (grp of groups(g, 'MEMBER'); track grp) { <h3>{{grp}}</h3>
        <div class="wrap">@for (t of of(g, 'MEMBER', grp); track t.id) { <div cdkDropList class="chip" [class.hint]="isHint(t)" (cdkDropListDropped)="drop($event, t)">{{t.label}}</div> }</div> }
    }
    
    @if (g.card) {
      <section class="tray"><b>Seed packets</b>
        <div cdkDropList cdkDropListSortingDisabled class="slot">
          @for (c of [g.cardId]; track c) { <article class="packet" cdkDrag><span>Fact</span><p>{{g.card}}</p></article> }
        </div>
      </section>
    }
  }
}
</div>` })
export class Game implements OnInit, OnDestroy {
  http = inject(HttpClient); route = inject(ActivatedRoute); router = inject(Router); id: string | null = null; fmt = mmss;
  s = signal<any>(null); hint = signal<any[]>([]); msg = signal(''); ok = signal(false); el = signal(0); t0 = 0; iv: any;
  ngOnInit() { this.route.paramMap.subscribe(p => { this.id = p.get('id'); this.msg.set(''); this.hint.set([]); this.load(); }); }
  ngOnDestroy() { clearInterval(this.iv); }
  load() { this.http.get<any>(`${API}/me/games/${this.id}`).subscribe(s => {
    this.s.set(s); this.t0 = Date.now() - s.seconds * 1000; clearInterval(this.iv);
    this.el.set(s.seconds); if (s.status !== 'FINISHED') this.iv = setInterval(() => this.el.set(Math.floor((Date.now() - this.t0) / 1000)), 1000); }); }
  of(g: any, type: string, grp?: string) { return g.targets.filter((t: any) => t.type === type && (!grp || t.group === grp)); }
  groups(g: any, type: string) { return [...new Set(this.of(g, type).map((t: any) => t.group))] as string[]; }
  isHint(t: any) { return this.hint().some(h => h.type === t.type && h.id === t.id); }
  go(level: number) { this.http.post<any>(`${API}/me/games`, { level }).subscribe(g => this.router.navigate(['game', g.id])); }
  help() { this.http.post<any[]>(`${API}/me/games/${this.id}/help`, { cardId: this.s().cardId }).subscribe(h => { this.hint.set(h); this.msg.set('One of the 3 highlighted spots is the right one.'); this.ok.set(true); this.load(); }); }
  dropQuiz(e: CdkDragDrop<any>) {
    if (e.previousContainer === e.container) return;
    const answer = e.item?.data;
    if (!answer) return;
    this.http.post<any>(`${API}/me/games/${this.id}/drop`, { cardId: this.s().cardId, type: 'ANSWER', id: answer.id }).subscribe(a => {
      this.ok.set(a.correct); this.msg.set(a.correct ? 'Correct! +10 seeds' : `Not quite. ${a.explanation || 'Try another answer.'}`);
      this.hint.set([]); this.load(); });
  }
  drop(e: CdkDragDrop<any>, t: any) {
    if (e.previousContainer === e.container) return;
    const targets = this.s().targets;
    this.http.post<any>(`${API}/me/games/${this.id}/drop`, { cardId: this.s().cardId, type: t.type, id: t.id }).subscribe(a => {
      const right = targets.find((x: any) => x.type === a.correctType && x.id === a.correctId)?.label;
      this.ok.set(a.correct); this.msg.set(a.correct ? 'Planted! +10 seeds' : `Not quite. That one belongs to ${right}.`);
      this.hint.set([]); this.load(); });
  }
}
