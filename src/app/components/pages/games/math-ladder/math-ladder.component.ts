import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from "../../../game-template/game-template.component";
import { AudioService } from "../../../../services/audio.service";
import { CelebrationComponent, CelebrationData } from '../../../game-template/celebration/celebration.component';

type Op = '+' | '-' | '×' | '÷';

interface Question {
  a: number;
  b: number;
  op: Op;
  reponse: number;
  choix: number[];
  reponseCorrecte: number;
}

function genererQuestion(niveau: number): Question {
  const ops: Op[] = ['+', '-', '×', '÷'];
  const max = Math.min(10 + niveau * 2, 99);

  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 1 + Math.floor(Math.random() * max);
  let b = 1 + Math.floor(Math.random() * Math.max(2, Math.floor(max / 2)));
  let reponse = 0;

  switch (op) {
    case '+': reponse = a + b; break;
    case '-':
      if (b > a) [a, b] = [b, a];
      reponse = a - b; 
      break;
    case '×':
      a = Math.floor(Math.random() * Math.min(12, max)) + 1;
      b = Math.floor(Math.random() * Math.min(12, max)) + 1;
      reponse = a * b; 
      break;
    case '÷':
      a = Math.floor(Math.random() * Math.min(12, max)) + 2;
      b = Math.floor(Math.random() * Math.min(12, max)) + 2;
      reponse = a;
      a = a * b;
      break;
  }

  const choix = new Set<number>([reponse]);
  while (choix.size < 4) {
    const faux = reponse + (Math.floor(Math.random() * 10) - 5);
    if (faux > 0 && faux !== reponse) choix.add(faux);
  }

  const tableauChoix = Array.from(choix).sort(() => Math.random() - 0.5);
  return { a, b, op, reponse, choix: tableauChoix, reponseCorrecte: reponse };
}

@Component({
  selector: 'app-math-ladder',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent, CelebrationComponent],
  templateUrl: './math-ladder.component.html',
  styleUrls: ['./math-ladder.component.css']
})
export class MathLadderComponent {
  totalMarches = 10;
  niveau = signal(1);
  marche = signal(0);
  questionsCorrectes = 0;
  tempsEcoule = 0;
  difficulteActuelle: 'facile' | 'moyen' | 'difficile' = 'facile';
  
  question = signal<Question>(genererQuestion(this.niveau()));
  estBloque = signal(false);

  afficherCelebration = signal(false);

  estGagne = computed(() => this.marche() >= this.totalMarches);

  constructor(private audioService: AudioService) {
    effect(() => {
      if (this.estGagne()) {
        this.afficherCelebration.set(true);
      }
    });
  }

  get donneesCelebration(): CelebrationData {
    return {
      level: this.niveau(),
      questionsCorrect: this.questionsCorrectes,
      totalQuestions: this.questionsCorrectes,
      timeElapsed: this.tempsEcoule,
      difficulty: this.difficulteActuelle
    };
  }

  private jouerSonCorrect() { this.audioService.playCorrectSound(); }
  private jouerSonFaux() { this.audioService.playWrongSound(); }

  choisir(choix: number) {
    if (this.estBloque() || this.estGagne()) return;
    this.estBloque.set(true);

    const correct = choix === this.question().reponse;

    if (correct) {
      this.marche.set(Math.min(this.totalMarches, this.marche() + 1));
      this.questionsCorrectes++;
      this.jouerSonCorrect();

      const enfant = document.querySelector('.boy');
      enfant?.classList.add('jump');
      setTimeout(() => enfant?.classList.remove('jump'), 500);

      setTimeout(() => {
        if (!this.estGagne()) this.questionSuivante();
        this.estBloque.set(false);
      }, 600);
    } else {
      this.jouerSonFaux();
      setTimeout(() => {
        this.questionSuivante();
        this.estBloque.set(false);
      }, 400);
    }
  }

  questionSuivante() {
    this.question.set(genererQuestion(this.niveau()));
  }

  recommencerJeu() {
    this.marche.set(0);
    this.questionsCorrectes = 0;
    this.estBloque.set(false);
    this.afficherCelebration.set(false);
    this.questionSuivante();
  }

  fermerCelebration() {
    this.afficherCelebration.set(false);
    this.recommencerJeu();
  }

  niveauSuivant() {
    this.niveau.set(this.niveau() + 1);
    this.recommencerJeu();
  }
}
