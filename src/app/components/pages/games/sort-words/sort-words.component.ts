import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../game-template/game-template.component';

interface Sentence {
  words: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

@Component({
  selector: 'app-sort-words',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl: './sort-words.component.html',
  styleUrls: ['./sort-words.component.css']
})
export class SortWordsComponent implements OnInit, OnDestroy {

  sentences: Sentence[] = [
    { words: ['I', 'love', 'programming'] },
    { words: ['The', 'cat', 'is', 'black'] },
    { words: ['Angular', 'is', 'fun'] },
    { words: ['Children', 'like', 'games'] }
  ];

  currentIndex = 0;
  shuffledWords: string[] = [];
  selectedWords: string[] = [];
  feedback: string | null = null;
  isCorrect: boolean | null = null;

  // Game state
  questionsCorrectInLevel = 0;
  timeElapsed = 0;
  level = 1;
  currentWord = { difficulty: 'easy', sentence: '', correct: '' };
  private timer: any;

  // Audio for correct answers
  private correctAudio: HTMLAudioElement;
  private wrongAudio: HTMLAudioElement;

  constructor() {
    this.correctAudio = new Audio('/audio/correct.mp3');
    this.wrongAudio = new Audio('/audio/wrong.mp3');
  }

  ngOnInit() {
    this.startTimer();
    this.loadSentence();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  // Timer
  private startTimer() {
    this.timer = setInterval(() => this.timeElapsed++, 1000);
  }

  // Sentence Loader
  private loadSentence() {
    const current = this.sentences[this.currentIndex];
    const correctSentence = current.words.join(' ');

    this.shuffledWords = this.shuffle([...current.words]);
    this.selectedWords = [];
    this.feedback = null;
    this.isCorrect = null;

    this.currentWord = {
      difficulty: this.getDifficultyText(),
      sentence: correctSentence,
      correct: correctSentence
    };
  }

  // Difficulty
  private getDifficultyText(): 'easy' | 'medium' | 'hard' {
    if (this.level <= 3) return 'easy';
    if (this.level <= 6) return 'medium';
    return 'hard';
  }

  // Word Colors
  getColor(index: number): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1',
      '#96CEB4', '#FFEEAD', '#D4A5A5',
      '#9B59B6', '#E67E22', '#2ECC71', '#E74C3C'
    ];
    return colors[index % colors.length];
  }

  // Shuffle
  private shuffle(array: string[]): string[] {
    return array
      .map(val => ({ val, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(obj => obj.val);
  }

  // Actions
  selectWord(word: string) {
    if (this.feedback) return;
    this.selectedWords.push(word);
    this.shuffledWords = this.shuffledWords.filter(w => w !== word);
  }

  removeWord(word: string, index: number) {
    if (this.feedback) return;
    this.selectedWords.splice(index, 1);
    this.shuffledWords.push(word);
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

  checkAnswer() {
    const correctSentence = this.sentences[this.currentIndex].words.join(' ');
    const childSentence = this.selectedWords.join(' ');

    this.isCorrect = (childSentence === correctSentence);
    this.feedback = this.isCorrect ? '✅ Correct!' : '❌ Wrong!';

    if (this.isCorrect) {
      this.questionsCorrectInLevel++;
      this.playCorrectSound(); // Play sound when answer is correct
    } else {
      this.playWrongSound(); // Play sound when answer is wrong
    }
  }

  nextSentence() {
    this.currentIndex = (this.currentIndex + 1) % this.sentences.length;
    this.loadSentence();
  }
  
}
