import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API } from './login';
import { Art } from './art';

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export function pdf(title: string, rows: any[]) {
  const d = new jsPDF(); d.text(title, 14, 16);
  autoTable(d, { startY: 22, headStyles: { fillColor: [11, 11, 107] }, head: [['Game', 'Member', 'Team', 'Level', 'Seeds', 'Correct', 'Time', 'Date']],
    body: rows.map(r => [r.gameId, r.member, r.team, r.level, r.score, `${r.correct}/${r.total}`, mmss(r.seconds), r.date]) });
  d.save(title.replace(/\W+/g, '-') + '.pdf');
}
@Component({ selector: 'app-player', imports: [FormsModule, Art, RouterLink], template: `
  <div class="narrow center">
    <div class="top"><span class="pill">Level {{lv()?.current}}</span><span class="pill">{{lv()?.seeds}} seeds</span></div>
    <app-art/><h1 class="title">Gardeners</h1><p class="tag">Drag. Drop. Grow.</p>
    <button class="btn navy" (click)="play()">Play level {{lv()?.current}}</button>
    <a class="btn turq" routerLink="/levels">All levels</a>
    <button class="btn ghost" (click)="exportPdf()">Export my stats (PDF)</button>
    @if (err()) { <p class="toast" role="alert">✕ {{err()}}</p> }
    <h2 class="left">My games</h2>
    <table><tr><th>Level<th>Seeds<th>Correct<th>Time</tr>
      @for (r of rows(); track r.gameId) { <tr><td>{{r.level}}<td>{{r.score}}<td>{{r.correct}}/{{r.total}}<td>{{fmt(r.seconds)}}</tr> }</table>
    <details class="pw"><summary class="btn ghost">Change password</summary>
      <input type="password" aria-label="New password" placeholder="New password (min. 8)" [(ngModel)]="pw">
      <button class="btn turq" (click)="save()">Save password</button><p class="err" role="alert">{{note}}</p></details>
  </div>` })
export class Player {
  http = inject(HttpClient); r = inject(Router); rows = signal<any[]>([]); lv = signal<any>(null); err = signal(''); pw = ''; note = ''; fmt = mmss;
  constructor() {
    this.http.get<any[]>(API + '/me/stats').subscribe(x => this.rows.set(x));
    this.http.get(API + '/me/levels').subscribe(x => this.lv.set(x)); }
  play() { this.http.post<any>(API + '/me/games', { level: this.lv().current }).subscribe({
    next: g => this.r.navigate(['game', g.id]), error: () => this.err.set('This level has no facts yet. Ask the admin to add some.') }); }
  exportPdf() { pdf('My Gardeners game stats', this.rows()); }
  save() { this.http.post(API + '/me/password', { newPassword: this.pw }).subscribe({
    next: () => { sessionStorage.removeItem('t'); this.r.navigate(['']); }, error: () => this.note = 'Use at least 8 characters.' }); }
}
