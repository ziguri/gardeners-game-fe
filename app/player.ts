import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API } from './login';

export function pdf(title: string, rows: any[]) {
  const d = new jsPDF(); d.text(title, 14, 16);
  autoTable(d, { startY: 22, head: [['Game', 'Member', 'Team', 'Score', 'Correct', 'Date']],
    body: rows.map(r => [r.gameId, r.member, r.team, r.score, `${r.correct}/${r.total}`, r.date]) });
  d.save(title.replace(/\W+/g, '-') + '.pdf');
}
@Component({ selector: 'app-player', imports: [FormsModule], template: `
  <h1>My game stats</h1>
  <button (click)="start()">Start a new game</button> <button (click)="exportPdf()">Export PDF</button>
  <table><tr><th>Date<th>Score<th>Correct</tr>
    @for (r of rows(); track r.gameId) { <tr><td>{{r.date}}<td>{{r.score}}<td>{{r.correct}}/{{r.total}}</tr> }</table>
  <h2>Change password</h2>
  <input type="password" placeholder="New password (min. 8)" [(ngModel)]="pw"><button (click)="save()">Save password</button> {{note}}` })
export class Player {
  http = inject(HttpClient); r = inject(Router); rows = signal<any[]>([]); pw = ''; note = '';
  constructor() { this.http.get<any[]>(API + '/me/stats').subscribe(x => this.rows.set(x)); }
  start() { this.http.post<any>(API + '/me/games', {}).subscribe(g => this.r.navigate(['game', g.id])); }
  exportPdf() { pdf('My Gardeners game stats', this.rows()); }
  save() { this.http.post(API + '/me/password', { newPassword: this.pw }).subscribe({
    next: () => { sessionStorage.removeItem('t'); this.r.navigate(['']); }, error: () => this.note = 'Use at least 8 characters.' }); }
}
