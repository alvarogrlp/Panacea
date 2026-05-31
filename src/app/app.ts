import { Component } from '@angular/core';
import { Search } from './features/search/search';

@Component({
  selector: 'app-root',
  imports: [Search],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
