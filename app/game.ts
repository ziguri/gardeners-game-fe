import { Component, inject, OnInit, signal } from '@angular/core';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { API } from './login';

@Component({ selector: 'app-game', imports: [CdkDrag, CdkDropList, CdkDropListGroup, RouterLink], template: `
<div cdkDropListGroup>
  @if (s(); as g) {
    <p>Score <b>{{g.score}}</b> · Cards left {{g.remaining}}/{{g.total}} · Helps left {{g.helpsLeft}}</p>
    @if (g.card) {
      <div class="board" cdkDropList>
        @for (c of [g.cardId]; track c) { <div class="card" cdkDrag>{{g.card}}</div> }
      </div>
      <button [disabled]="!g.helpsLeft || hint().length" (click)="help()">Use a help</button>
    } @else { <h2>Game over: {{g.score}} points</h2><a routerLink="/me">Back to my dashboard</a> }
    <p>{{msg()}}</p>
    @for (grp of groups(); track grp) {
      <h3>{{grp}}</h3>
      <div class="row">@for (t of byGroup(grp); track t.type + t.id) {
        <div cdkDropList class="target" [class.hint]="isHint(t)" (cdkDropListDropped)="drop($event, t)">{{t.label}}</div> }</div>
    }
  }
</div>` })
export class Game implements OnInit {
  http = inject(HttpClient); id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  s = signal<any>(null); hint = signal<any[]>([]); msg = signal('');
  ngOnInit() { this.http.get(`${API}/me/games/${this.id}`).subscribe(s => this.s.set(s)); }
  groups() { return [...new Set(this.s().targets.map((t: any) => t.group))] as string[]; }
  byGroup(g: string) { return this.s().targets.filter((t: any) => t.group === g); }
  isHint(t: any) { return this.hint().some(h => h.type === t.type && h.id === t.id); }
  help() { this.http.post<any[]>(`${API}/me/games/${this.id}/help`, { cardId: this.s().cardId }).subscribe(h => { this.hint.set(h); this.ngOnInit(); }); }
  drop(e: CdkDragDrop<any>, t: any) {
    if (e.previousContainer === e.container) return;
    this.http.post<any>(`${API}/me/games/${this.id}/drop`, { cardId: this.s().cardId, type: t.type, id: t.id }).subscribe(a => {
      this.msg.set(a.correct ? 'Correct! +10' : 'Not this one. It belonged to a different ' + a.correctType.toLowerCase() + '.');
      this.hint.set([]); this.ngOnInit(); });
  }
}
