import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from "../../../game-template/game-template.component";

type Op = '+' | '-' | '×' | '÷';

interface Question {
  a: number;
  b: number;
  op: Op;
  answer: number;
  choices: number[];
  correctAnswer: number; // Add this line
}

function makeQuestion(level: number): Question {
  const ops: Op[] = ['+', '-', '×', '÷'];
  // زوّد الصعوبة تدريجيًا مع المستوى
  const max = Math.min(10 + level * 2, 99);

  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 1 + Math.floor(Math.random() * max);
  let b = 1 + Math.floor(Math.random() * Math.max(2, Math.floor(max / 2)));

  let answer = 0;

  switch (op) {
    case '+': answer = a + b; break;
    case '-':
      if (b > a) [a, b] = [b, a];
      answer = a - b; 
      break;
    case '×':
      a = Math.floor(Math.random() * Math.min(12, max)) + 1;
      b = Math.floor(Math.random() * Math.min(12, max)) + 1;
      answer = a * b; 
      break;
    case '÷':
      // نولّد قسمة بدون كسور: (a*b) ÷ b = a
      a = Math.floor(Math.random() * Math.min(12, max)) + 2;
      b = Math.floor(Math.random() * Math.min(12, max)) + 2;
      answer = a;
      const dividend = a * b;
      a = dividend;
      // الآن السؤال: a ÷ b = answer
      break;
  }

  // اختيارات متعددة (منها الصحيحة)
  const choices = new Set<number>([answer]);
  while (choices.size < 4) {
    const wrongAnswer = answer + (Math.floor(Math.random() * 10) - 5);
    if (wrongAnswer > 0 && wrongAnswer !== answer) {
      choices.add(wrongAnswer);
    }
  }

  const choicesArray = Array.from(choices).sort(() => Math.random() - 0.5);
  return {
    a,
    b,
    op,
    answer,
    choices: choicesArray,
    correctAnswer: answer
  };
}

@Component({
  selector: 'app-math-stairs',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl:'./math-ladder.component.html',
  styleUrls: ['./math-ladder.component.css']
})
export class MathLadderComponent {
  // إعدادات اللعبة
  totalSteps = 7;        // عدد درجات السلم للوصول للنجمة
  level = signal(1);     // مستوى الصعوبة
  step = signal(0);      // الدرجة الحالية (0..totalSteps)
  questionsCorrectInLevel = 0;  // عدد الإجابات الصحيحة في المستوى الحالي
  timeElapsed = 0;               // الوقت المنقضي بالثواني
  currentDifficulty: 'easy' | 'medium' | 'hard' = 'easy'; // مستوى الصعوبة الحالي
  
  question = signal<Question>(makeQuestion(this.level()));
  currentQuestion = this.question(); // Initialize after question signal
  isLocked = signal(false);
  isWin = computed(() => this.step() >= this.totalSteps);

  // Audio for correct and wrong answers
  private correctAudio: HTMLAudioElement;
  private wrongAudio: HTMLAudioElement;

  constructor() {
    this.correctAudio = new Audio('/audio/correct.mp3');
    this.wrongAudio = new Audio('/audio/wrong.mp3');
    
    // كل ما نكسب: نزود المستوى شوية
    effect(() => {
      if (this.isWin()) {
        this.level.set(this.level() + 1);
      }
    });
  }

  // Play correct sound
  private playCorrectSound() {
    this.correctAudio.currentTime = 0;
    this.correctAudio.play().catch(error => {
      console.log('Audio playback failed:', error);
    });
  }

  // Play wrong sound
  private playWrongSound() {
    this.wrongAudio.currentTime = 0;
    this.wrongAudio.play().catch(error => {
      console.log('Audio playback failed:', error);
    });
  }

  pick(choice: number) {
  if (this.isLocked() || this.isWin()) return;
  this.isLocked.set(true);

  const correct = choice === this.question().answer;

  if (correct) {
    // نطلع درجة
    this.step.set(Math.min(this.totalSteps, this.step() + 1));
    this.playCorrectSound(); // Play correct sound

    // نضيف كلاس jump للولد
    const boyEl = document.querySelector('.boy');
    boyEl?.classList.add('jump');
    setTimeout(() => boyEl?.classList.remove('jump'), 500);

    setTimeout(() => {
      if (!this.isWin()) this.nextQuestion();
      this.isLocked.set(false);
    }, 600);
  } else {
    this.playWrongSound(); // Play wrong sound
    setTimeout(() => {
      this.nextQuestion();
      this.isLocked.set(false);
    }, 400);
  }
}


  nextQuestion() {
    this.question.set(makeQuestion(this.level()));
  }

  resetGame() {
    this.step.set(0);
    this.isLocked.set(false);
    this.nextQuestion();
  }
}
