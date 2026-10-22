import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API } from './login';
import { pdf } from './player';

@Component({ selector: 'app-admin', imports: [FormsModule], template: `
<h2>New team</h2>
<input placeholder="Name" [(ngModel)]="t.name">
<select [(ngModel)]="t.location"><option>Lisboa<option>Porto</select>
<input placeholder="Type of product" [(ngModel)]="t.productType">
<input placeholder="Description" [(ngModel)]="t.description">
<input placeholder="Curiosities (separate with ;)" [(ngModel)]="cur">
<button (click)="addTeam()">Create team</button>

<h2>New member</h2>
<input placeholder="Name" [(ngModel)]="m.name"><input placeholder="Username" [(ngModel)]="m.username">
<input placeholder="Temporary password" [(ngModel)]="m.password"><input placeholder="Job title" [(ngModel)]="m.jobTitle">
<select [(ngModel)]="m.teamId"><option [ngValue]="null">No team</option>@for (x of teams(); track x.id) {<option [ngValue]="x.id">{{x.name}} ({{x.location}})</option>}</select>
<input placeholder="A curiosity about this person" [(ngModel)]="m.curiosity">
<button (click)="addMember()">Create member</button>

<h2>Members</h2>
@for (x of members(); track x.id) { <div class="row">{{x.name}} · {{x.team?.name || 'No team'}}
  <select (change)="move(x.id, $any($event.target).value)"><option value="0">Move to…</option>@for (y of teams(); track y.id) {<option [value]="y.id">{{y.name}}</option>}</select>
  <button (click)="newGame(x.id)">Create game</button></div> }

<h2>Scores</h2>
<select [(ngModel)]="ft" (change)="load()"><option [ngValue]="null">All teams</option>@for (x of teams(); track x.id) {<option [ngValue]="x.id">{{x.name}}</option>}</select>
<select [(ngModel)]="fm" (change)="load()"><option [ngValue]="null">All members</option>@for (x of members(); track x.id) {<option [ngValue]="x.id">{{x.name}}</option>}</select>
<button (click)="exportPdf()">Export PDF</button>
<table><tr><th>Member<th>Team<th>Score<th>Correct<th>Date</tr>
@for (r of rows(); track r.gameId) { <tr><td>{{r.member}}<td>{{r.team}}<td>{{r.score}}<td>{{r.correct}}/{{r.total}}<td>{{r.date}}</tr> }</table>` })
export class Admin {
  http = inject(HttpClient); teams = signal<any[]>([]); members = signal<any[]>([]); rows = signal<any[]>([]);
  t: any = { location: 'Lisboa' }; m: any = { teamId: null }; cur = ''; ft: number | null = null; fm: number | null = null;
  constructor() { this.refresh(); }
  refresh() {
    this.http.get<any[]>(API + '/admin/teams').subscribe(x => this.teams.set(x));
    this.http.get<any[]>(API + '/admin/members').subscribe(x => this.members.set(x)); this.load(); }
  load() { const q = [this.ft && 'teamId=' + this.ft, this.fm && 'memberId=' + this.fm].filter(Boolean).join('&');
    this.http.get<any[]>(`${API}/admin/scores?${q}`).subscribe(x => this.rows.set(x)); }
  addTeam() { this.http.post(API + '/admin/teams', { ...this.t, curiosities: this.cur.split(';').map(s => s.trim()).filter(Boolean) })
    .subscribe(() => { this.t = { location: 'Lisboa' }; this.cur = ''; this.refresh(); }); }
  addMember() { this.http.post(API + '/admin/members', this.m).subscribe(() => { this.m = { teamId: null }; this.refresh(); }); }
  move(id: number, team: string) { this.http.put(`${API}/admin/members/${id}/team/${team}`, {}).subscribe(() => this.refresh()); }
  newGame(memberId: number) { this.http.post(API + '/admin/games', { memberId }).subscribe(() => this.load()); }
  exportPdf() { pdf('Gardeners score dashboard', this.rows()); }
}
