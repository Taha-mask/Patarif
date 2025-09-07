import { Component, computed, effect, signal, OnInit, OnDestroy } from '@angular/core';
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

function genererQuestion(niveau: number, difficulte: 'facile' | 'moyen' | 'difficile'): Question {
  const ops: Op[] = ['+', '-', '×', '÷'];
  
  // تحديد الحد الأقصى حسب مستوى الصعوبة
  let max: number;
  switch (difficulte) {
    case 'facile':
      max = Math.min(5 + niveau, 20);
      break;
    case 'moyen':
      max = Math.min(10 + niveau * 2, 50);
      break;
    case 'difficile':
      max = Math.min(15 + niveau * 3, 99);
      break;
  }

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
export class MathLadderComponent implements OnInit, OnDestroy {
  totalMarches = 10;
  totalQuestions = 10; // إجمالي الأسئلة المطلوبة
  niveau = signal(1);
  marche = signal(0);
  questionsCorrectes = 0;
  questionsRepondues = signal(0); // عدد الأسئلة التي تم الإجابة عليها
  tempsEcoule = signal(0); // الوقت المنقضي
  difficulteActuelle: 'facile' | 'moyen' | 'difficile' = 'facile';
  
  question = signal<Question>(genererQuestion(this.niveau(), this.difficulteActuelle));
  estBloque = signal(false);

  afficherCelebration = signal(false);

  estGagne = computed(() => this.questionsRepondues() >= this.totalQuestions);

  private timerInterval?: number;

  constructor(private audioService: AudioService) {
    effect(() => {
      if (this.estGagne()) {
        this.stopTimer();
        this.afficherCelebration.set(true);
      }
    });
  }

  ngOnInit() {
    this.startTimer();
    this.updateDifficulty();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private startTimer() {
    this.timerInterval = window.setInterval(() => {
      this.tempsEcoule.set(this.tempsEcoule() + 1);
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  private updateDifficulty() {
    // تحديث مستوى الصعوبة حسب المستوى
    if (this.niveau() <= 3) {
      this.difficulteActuelle = 'facile';
    } else if (this.niveau() <= 6) {
      this.difficulteActuelle = 'moyen';
    } else {
      this.difficulteActuelle = 'difficile';
    }
  }

  get donneesCelebration(): CelebrationData {
    return {
      level: this.niveau(),
      questionsCorrect: this.questionsCorrectes,
      totalQuestions: this.totalQuestions,
      timeElapsed: this.tempsEcoule(),
      difficulty: this.difficulteActuelle
    };
  }

  private jouerSonCorrect() { this.audioService.playCorrectSound(); }
  private jouerSonFaux() { this.audioService.playWrongSound(); }

  choisir(choix: number) {
    if (this.estBloque() || this.estGagne()) return;
    this.estBloque.set(true);

    const correct = choix === this.question().reponse;
    
    // إضافة تأثيرات بصرية على الأزرار
    const buttons = document.querySelectorAll('.choice');
    buttons.forEach(button => {
      const buttonElement = button as HTMLElement;
      if (parseInt(buttonElement.textContent || '0') === choix) {
        if (correct) {
          buttonElement.classList.add('correct');
        } else {
          buttonElement.classList.add('wrong');
        }
      }
    });
    
    // زيادة عدد الأسئلة المجابة دائماً
    this.questionsRepondues.set(this.questionsRepondues() + 1);

    if (correct) {
      this.marche.set(Math.min(this.totalMarches, this.marche() + 1));
      this.questionsCorrectes++;
      this.jouerSonCorrect();

      const enfant = document.querySelector('.boy');
      const etoile = document.querySelector('.star');
      
      if (enfant) {
        // إضافة تأثيرات النجاح
        enfant.classList.add('jump', 'success');
        
        // إزالة التأثيرات بعد انتهاء الحركة
        setTimeout(() => {
          enfant.classList.remove('jump', 'success');
        }, 1000);
      }
      
      // تأثير النجمة عند الوصول للقمة
      if (this.marche() === this.totalMarches && etoile) {
        etoile.classList.add('celebrate');
        setTimeout(() => {
          etoile.classList.remove('celebrate');
        }, 2000);
      }

      setTimeout(() => {
        // إزالة تأثيرات الأزرار
        buttons.forEach(button => {
          button.classList.remove('correct', 'wrong');
        });
        if (!this.estGagne()) this.questionSuivante();
        this.estBloque.set(false);
      }, 1000);
    } else {
      this.jouerSonFaux();
      
      const enfant = document.querySelector('.boy');
      if (enfant) {
        // إضافة تأثير الاهتزاز للخطأ
        enfant.classList.add('wrong');
        
        // إزالة التأثير بعد انتهاء الحركة
        setTimeout(() => {
          enfant.classList.remove('wrong');
        }, 600);
      }
      
      setTimeout(() => {
        // إزالة تأثيرات الأزرار
        buttons.forEach(button => {
          button.classList.remove('correct', 'wrong');
        });
        if (!this.estGagne()) this.questionSuivante();
        this.estBloque.set(false);
      }, 600);
    }
  }

  questionSuivante() {
    this.question.set(genererQuestion(this.niveau(), this.difficulteActuelle));
  }

  recommencerJeu() {
    this.marche.set(0);
    this.questionsCorrectes = 0;
    this.questionsRepondues.set(0);
    this.tempsEcoule.set(0);
    this.estBloque.set(false);
    this.afficherCelebration.set(false);
    this.updateDifficulty();
    this.startTimer();
    this.questionSuivante();
  }

  fermerCelebration() {
    this.afficherCelebration.set(false);
    this.recommencerJeu();
  }

  niveauSuivant() {
    this.niveau.set(this.niveau() + 1);
    this.updateDifficulty();
    this.recommencerJeu();
  }
}
