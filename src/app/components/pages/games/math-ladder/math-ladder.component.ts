import { Component, computed, effect, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from "../../../game-template/game-template.component";
import { AudioService } from "../../../../services/audio.service";
import { CelebrationComponent, CelebrationData } from '../../../game-template/celebration/celebration.component';
import { SupabaseService } from '../../../../supabase.service';

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
  // <-- set this to your DB game_id for this game
  private readonly GAME_ID = 8;

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

  // inject Supabase + audio
  constructor(private supabase: SupabaseService, private audioService: AudioService) {
    // effect to react to finishing the mini-game
    effect(() => {
      if (this.estGagne()) {
        this.stopTimer();
        this.afficherCelebration.set(true);

        // best-effort: save progress moving the player to the next level
        const nextLevel = this.niveau() + 1;
        this.supabase.savePlayerProgress(this.GAME_ID, nextLevel, 1)
          .then(saved => { if (!saved) console.warn('Failed to save progress on level completion'); })
          .catch(err => console.warn('Error saving progress on completion:', err));
      }
    });
  }

  async ngOnInit() {
    // restore progress if available, then start
    await this.restoreProgress();
    this.startTimer();
    this.updateDifficulty();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private async restoreProgress(): Promise<void> {
    try {
      const progress = await this.supabase.getPlayerProgress(this.GAME_ID);
      if (progress) {
        // restore level and answered count
        this.niveau.set(Math.max(1, progress.level || 1));
        const qnum = Math.max(1, Number(progress.question_num || 1)); // question_num is 1-based
        this.questionsRepondues.set(Math.max(0, qnum - 1)); // restore answered count

        // approximate marche & correct answers from answered count (can't reconstruct exact correctness)
        const approxMarche = Math.min(this.totalMarches, this.questionsRepondues());
        this.marche.set(approxMarche);
        this.questionsCorrectes = approxMarche;

        // regenerate a question appropriate to restored level
        this.updateDifficulty();
        this.question.set(genererQuestion(this.niveau(), this.difficulteActuelle));
      } else {
        // no saved progress -> create initial row (best-effort)
        await this.supabase.savePlayerProgress(this.GAME_ID, 1, 1);
      }
    } catch (err) {
      console.error('Error restoring progress:', err);
      // continue with defaults
      try { await this.supabase.savePlayerProgress(this.GAME_ID, 1, 1); } catch (_) {}
    }
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

  async choisir(choix: number) {
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

      setTimeout(async () => {
        // إزالة تأثيرات الأزرار
        buttons.forEach(button => {
          button.classList.remove('correct', 'wrong');
        });
        if (!this.estGagne()) this.questionSuivante();
        this.estBloque.set(false);

        // Save progress: questionsRepondues is updated; we save next-question number = answered + 1
        try {
          const nextQuestionNum = Math.min(this.totalQuestions, this.questionsRepondues() + 1);
          this.supabase.savePlayerProgress(this.GAME_ID, this.niveau(), nextQuestionNum)
            .then(saved => { if (!saved) console.warn('Failed to save progress (choisir)'); })
            .catch(err => console.warn('savePlayerProgress error (choisir):', err));
        } catch (err) {
          console.warn('Error saving progress after answer:', err);
        }
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
      
      setTimeout(async () => {
        // إزالة تأثيرات الأزرار
        buttons.forEach(button => {
          button.classList.remove('correct', 'wrong');
        });
        if (!this.estGagne()) this.questionSuivante();
        this.estBloque.set(false);

        // Save progress even after wrong answer (we still advanced)
        try {
          const nextQuestionNum = Math.min(this.totalQuestions, this.questionsRepondues() + 1);
          this.supabase.savePlayerProgress(this.GAME_ID, this.niveau(), nextQuestionNum)
            .then(saved => { if (!saved) console.warn('Failed to save progress (choisir wrong)'); })
            .catch(err => console.warn('savePlayerProgress error (choisir wrong):', err));
        } catch (err) {
          console.warn('Error saving progress after wrong answer:', err);
        }
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

    // save restart progress (best-effort)
    try {
      this.supabase.savePlayerProgress(this.GAME_ID, this.niveau(), 1)
        .then(saved => { if (!saved) console.warn('Failed to save progress (recommencer)'); })
        .catch(err => console.warn('savePlayerProgress error (recommencer):', err));
    } catch (_) {}
  }

  fermerCelebration() {
    this.afficherCelebration.set(false);
    this.recommencerJeu();
  }

  niveauSuivant() {
    this.niveau.set(this.niveau() + 1);
    this.updateDifficulty();
    this.recommencerJeu();

    // ensure DB knows we're on the new level with question 1
    try {
      this.supabase.savePlayerProgress(this.GAME_ID, this.niveau(), 1)
        .then(saved => { if (!saved) console.warn('Failed to save progress (niveauSuivant)'); })
        .catch(err => console.warn('savePlayerProgress error (niveauSuivant):', err));
    } catch (_) {}
  }
}