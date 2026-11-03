import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API } from './login';
import { pdf, mmss } from './player';

@Component({ selector: 'app-admin', imports: [FormsModule], template: `
<div class="top"><h1>Admin</h1><span class="pill">Garden control</span></div>
<nav class="tabs">@for (x of tabs; track x[0]) { <button [class.on]="tab() === x[0]" (click)="tab.set(x[0])">{{x[1]}}</button> }</nav>
@if (note()) { <p class="toast ok" role="status">✓ {{note()}}</p> }

@switch (tab()) {
@case ('facts') {
  <section class="panel"><h2>Company</h2><div class="grid">
    <input aria-label="Company name" placeholder="Name" [(ngModel)]="company.name"><input aria-label="Description" placeholder="Description" [(ngModel)]="company.description"></div>
    <button (click)="saveCompany()">Save company</button></section>
  <section class="panel"><h2>Add a fact</h2><p>Company facts can be quiz-style: a question with three answers and one correct choice.</p>
    <div class="grid"><select aria-label="Kind of fact" [(ngModel)]="f.scope"><option value="COMPANY">Company (levels 1–10)</option><option value="UNIT">Gardeners (levels 11–20)</option><option value="TEAM">About a team (levels 21–30)</option><option value="MEMBER">About a person (levels 21–30)</option></select>
      @if (f.scope === 'TEAM') { <select aria-label="Team" [(ngModel)]="f.targetId">@for (x of teams(); track x.id) {<option [ngValue]="x.id">{{x.name}}</option>}</select> }
      @else if (f.scope === 'MEMBER') { <select aria-label="Person" [(ngModel)]="f.targetId">@for (x of allPeople(); track x.id) {<option [ngValue]="x.id">{{x.name}}</option>}</select> }
      @else if (f.scope !== 'COMPANY') { <input aria-label="Topic" placeholder="Topic, e.g. History" list="topics" [(ngModel)]="f.topic"><datalist id="topics">@for (x of topics(); track x) {<option [value]="x">}</datalist> } </div>
    @if (f.scope === 'COMPANY') {
      <textarea aria-label="Question" rows="2" placeholder="Question" [(ngModel)]="f.question"></textarea>
      <div class="grid"><label><input type="radio" name="company-fact-answer" [value]="1" [(ngModel)]="f.correctAnswer"> <input aria-label="Answer A" placeholder="Answer A" [(ngModel)]="f.answerA"></label>
        <label><input type="radio" name="company-fact-answer" [value]="2" [(ngModel)]="f.correctAnswer"> <input aria-label="Answer B" placeholder="Answer B" [(ngModel)]="f.answerB"></label>
        <label><input type="radio" name="company-fact-answer" [value]="3" [(ngModel)]="f.correctAnswer"> <input aria-label="Answer C" placeholder="Answer C" [(ngModel)]="f.answerC"></label></div>
      <textarea aria-label="Explanation" rows="2" placeholder="Optional explanation shown after the player answers" [(ngModel)]="f.explanation"></textarea>
    } @else {
      <textarea aria-label="Fact" rows="2" placeholder="The fact, written as a sentence" [(ngModel)]="f.text"></textarea>
    }
    <button (click)="addFact()">Add fact</button></section>
  <section class="panel"><h2>Facts ({{facts().length}})</h2>
    @for (x of facts(); track x.id) {
      @if (ed?.kind === 'fact' && ed.id === x.id) { <div class="item">
        @if (x.question) {
          <textarea aria-label="Question" rows="2" [(ngModel)]="ed.question"></textarea>
          <div class="grid"><label><input type="radio" name="edit-company-fact-answer" [value]="1" [(ngModel)]="ed.correctAnswer"> <input aria-label="Answer A" [(ngModel)]="ed.answerA"></label>
            <label><input type="radio" name="edit-company-fact-answer" [value]="2" [(ngModel)]="ed.correctAnswer"> <input aria-label="Answer B" [(ngModel)]="ed.answerB"></label>
            <label><input type="radio" name="edit-company-fact-answer" [value]="3" [(ngModel)]="ed.correctAnswer"> <input aria-label="Answer C" [(ngModel)]="ed.answerC"></label></div>
          <textarea aria-label="Explanation" rows="2" [(ngModel)]="ed.explanation"></textarea>
        } @else {
          @if (x.targetType === 'TOPIC') { <select aria-label="Scope" [(ngModel)]="ed.scope"><option value="COMPANY">CTW</option><option value="UNIT">Gardeners</option></select><input aria-label="Topic" [(ngModel)]="ed.topic"> }
          <textarea aria-label="Fact" rows="2" [(ngModel)]="ed.text"></textarea>
        }
        <button (click)="save()">Save</button><button class="ghost" (click)="ed = null">Cancel</button></div>
      } @else { <div class="item"><b>{{x.question || x.text}}</b>
        @if (x.question) {
          <div class="answerlist">@for (o of factOptions(x); track o.key) { <div class="answer-row" [class.correct]="o.correct"><span>{{o.key}}</span><span>{{o.text}}</span>@if (o.correct) { <span class="pill mint">Correct</span> }</div> }</div>
          <small>1 of 3 marked correct</small>
        } @else { <span class="pill">{{tag(x)}}</span> }
        <button (click)="edit('fact', x)">Edit</button><button class="danger" (click)="del('fact', x)">Delete</button></div> }
    }</section>
}
@case ('teams') {
  <section class="panel"><h2>New team</h2><div class="grid">
    <input aria-label="Name" placeholder="Name" [(ngModel)]="t.name">
    <select aria-label="Location" [(ngModel)]="t.location"><option>Lisboa<option>Porto</select>
    <input aria-label="Product" placeholder="Type of product" [(ngModel)]="t.productType"><input aria-label="Description" placeholder="Description" [(ngModel)]="t.description"></div>
    <textarea aria-label="Curiosities" rows="2" placeholder="Curiosities, separated by ;" [(ngModel)]="cur"></textarea>
    <button (click)="addTeam()">Create team</button></section>
  <section class="panel"><h2>Teams</h2>@for (x of teams(); track x.id) {
    @if (ed?.kind === 'team' && ed.id === x.id) { <div class="item"><div class="grid" style="width:100%">
        <input aria-label="Name" [(ngModel)]="ed.name"><select aria-label="Location" [(ngModel)]="ed.location"><option>Lisboa<option>Porto</select>
        <input aria-label="Product" [(ngModel)]="ed.productType"><input aria-label="Description" [(ngModel)]="ed.description"></div>
        <button (click)="save()">Save</button><button class="ghost" (click)="ed = null">Cancel</button></div>
    } @else { <div class="item"><b>{{x.name}}</b><span class="pill">{{x.location}}</span><span>{{x.productType}}</span>
        <button (click)="edit('team', x)">Edit</button><button class="danger" (click)="del('team', x)">Delete</button></div> }
  }</section>
}
@case ('members') {
  <section class="panel"><h2>New member</h2><div class="grid">
    <input aria-label="Name" placeholder="Name" [(ngModel)]="m.name"><input aria-label="Username" placeholder="Username" [(ngModel)]="m.username">
    <input aria-label="Temporary password" placeholder="Temporary password" [(ngModel)]="m.password"><input aria-label="Job title" placeholder="Job title" [(ngModel)]="m.jobTitle">
    <select aria-label="Team" [(ngModel)]="m.teamId"><option [ngValue]="null">No team</option>@for (x of teams(); track x.id) {<option [ngValue]="x.id">{{x.name}} ({{x.location}})</option>}</select>
    <input aria-label="Curiosity" placeholder="A curiosity about this person" [(ngModel)]="m.curiosity"></div>
    <button (click)="addMember()">Create member</button></section>
  <section class="panel"><h2>Members <small>Game level <input type="number" min="1" max="30" style="width:5rem" [(ngModel)]="lvl"></small></h2>
    @for (x of members(); track x.id) {
      @if (ed?.kind === 'member' && ed.id === x.id) { <div class="item"><div class="grid" style="width:100%">
          <input aria-label="Name" [(ngModel)]="ed.name"><input aria-label="Job title" placeholder="Job title" [(ngModel)]="ed.jobTitle">
          <select aria-label="Team" [(ngModel)]="ed.teamId"><option [ngValue]="null">No team</option>@for (y of teams(); track y.id) {<option [ngValue]="y.id">{{y.name}} ({{y.location}})</option>}</select>
          <input aria-label="New password" placeholder="New password (optional)" [(ngModel)]="ed.password"></div>
          <button (click)="save()">Save</button><button class="ghost" (click)="ed = null">Cancel</button></div>
      } @else { <div class="item"><b>{{x.name}}</b><span class="pill">{{x.team?.name || 'No team'}}</span>
          <select aria-label="Move to team" (change)="move(x.id, $any($event.target).value)"><option value="0">Move to…</option>@for (y of teams(); track y.id) {<option [value]="y.id">{{y.name}}</option>}</select>
          <button (click)="newGame(x.id)">Create game</button><button (click)="edit('member', x)">Edit</button><button class="danger" (click)="del('member', x)">Delete</button></div> }
    }</section>
}
@case ('scores') {
  <section class="panel"><h2>Scores</h2>
    <select aria-label="Team filter" [(ngModel)]="ft" (change)="load()"><option [ngValue]="null">All teams</option>@for (x of teams(); track x.id) {<option [ngValue]="x.id">{{x.name}}</option>}</select>
    <select aria-label="Member filter" [(ngModel)]="fm" (change)="load()"><option [ngValue]="null">All members</option>@for (x of members(); track x.id) {<option [ngValue]="x.id">{{x.name}}</option>}</select>
    <button (click)="exportPdf()">Export PDF</button>
    <table><tr><th>Member<th>Team<th>Level<th>Seeds<th>Correct<th>Time<th>Date</tr>
    @for (r of rows(); track r.gameId) { <tr><td>{{r.member}}<td>{{r.team}}<td>{{r.level}}<td>{{r.score}}<td>{{r.correct}}/{{r.total}}<td>{{fmt(r.seconds)}}<td>{{r.date}}</tr> }</table></section>
  }
}` })
export class Admin {
  http = inject(HttpClient); fmt = mmss; tab = signal('facts'); note = signal('');
  tabs = [['facts', 'Company & facts'], ['teams', 'Teams'], ['members', 'Members'], ['scores', 'Scores']];
  teams = signal<any[]>([]); members = signal<any[]>([]); rows = signal<any[]>([]); facts = signal<any[]>([]);
  company: any = {}; t: any = { location: 'Lisboa' }; m: any = { teamId: null }; f: any = { scope: 'COMPANY' };
  ed: any = null; cur = ''; ft: number | null = null; fm: number | null = null; lvl = 1;
  constructor() { this.refresh(); }
  ok(msg: string) { this.note.set(msg); setTimeout(() => this.note.set(''), 3000); this.refresh(); }
  refresh() {
    this.http.get<any[]>(API + '/admin/teams').subscribe(x => this.teams.set(x));
    this.http.get<any[]>(API + '/admin/members').subscribe(x => this.members.set(x));
    this.http.get<any[]>(API + '/admin/facts').subscribe(x => this.facts.set(x));
    this.http.get<any>(API + '/admin/company').subscribe(x => this.company = x ?? {}); this.load(); }
  topics() { return [...new Set(this.facts().filter(x => x.scope === this.f.scope).map(x => x.topic))]; }
  load() { const q = [this.ft && 'teamId=' + this.ft, this.fm && 'memberId=' + this.fm].filter(Boolean).join('&');
    this.http.get<any[]>(`${API}/admin/scores?${q}`).subscribe(x => this.rows.set(x)); }
  saveCompany() { this.http.put(API + '/admin/company', this.company).subscribe(() => this.ok('Company saved')); }
  addFact() { this.http.post(API + '/admin/facts', this.f).subscribe(() => { this.f = { scope: this.f.scope, correctAnswer: 1 }; this.ok('Fact added'); }); }
  addTeam() { this.http.post(API + '/admin/teams', { ...this.t, curiosities: this.cur.split(';').map(s => s.trim()).filter(Boolean) })
    .subscribe(() => { this.t = { location: 'Lisboa' }; this.cur = ''; this.ok('Team created'); }); }
  addMember() { this.http.post(API + '/admin/members', this.m).subscribe(() => { this.m = { teamId: null }; this.ok('Member created'); }); }
  move(id: number, team: string) { this.http.put(`${API}/admin/members/${id}/team/${team}`, {}).subscribe(() => this.ok('Member moved')); }
  newGame(memberId: number) { this.http.post(API + '/admin/games', { memberId, level: this.lvl }).subscribe({ next: () => this.ok('Game created'), error: () => this.note.set('') }); }
  allPeople() { return this.members(); }
  factOptions(x: any) { return [
    { key: 'A', text: x.answerA, correct: x.correctAnswer === 1 },
    { key: 'B', text: x.answerB, correct: x.correctAnswer === 2 },
    { key: 'C', text: x.answerC, correct: x.correctAnswer === 3 }
  ]; }
  tag(x: any) { return x.targetType === 'TOPIC' ? (x.scope === 'COMPANY' ? 'CTW' : 'Gardeners') + ' · ' + x.topic : (x.targetType === 'TEAM' ? 'Team' : 'Person') + ' · ' + x.label; }
  edit(kind: string, x: any) {
    this.ed = kind === 'fact' ? { kind, id: x.id, scope: x.scope, topic: x.topic, text: x.text,
      question: x.question ?? x.text, answerA: x.answerA ?? '', answerB: x.answerB ?? '', answerC: x.answerC ?? '',
      correctAnswer: x.correctAnswer ?? 1, explanation: x.explanation ?? '' }
      : kind === 'team' ? { kind, id: x.id, name: x.name, location: x.location, productType: x.productType, description: x.description }
      : { kind, id: x.id, name: x.name, jobTitle: x.jobTitle, password: '', teamId: x.team?.id ?? null }; }
  private path = (kind: string) => ({ fact: 'facts', team: 'teams', member: 'members' } as any)[kind];
  save() { const e = this.ed; this.http.put(`${API}/admin/${this.path(e.kind)}/${e.id}`, e)
    .subscribe({ next: () => { this.ed = null; this.ok('Saved'); }, error: () => this.note.set('') }); }
  del(kind: string, x: any) {
    const what = { fact: 'this fact', team: `team "${x.name}" and its curiosities (members stay, without a team)`, member: `${x.name}, their games and the curiosities about them` } as any;
    if (confirm(`Delete ${what[kind]}? This cannot be undone.`)) this.http.delete(`${API}/admin/${this.path(kind)}/${x.id}`).subscribe(() => this.ok('Deleted')); }
  exportPdf() { pdf('Gardeners score dashboard', this.rows()); }
}
