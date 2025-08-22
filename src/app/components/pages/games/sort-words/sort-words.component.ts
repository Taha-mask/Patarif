import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
interface CurrentWord {
  difficulty: 'easy' | 'medium' | 'hard';
  sentence: string;
  correct: string;
}

interface Sentence {
  words: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}
@Component({
  selector: 'app-sort-words',
  imports: [CommonModule, GameTemplateComponent],
  templateUrl: './sort-words.component.html',
  styleUrl: './sort-words.component.css'
})
export class SortWordsComponent {
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
    
    // Game state properties
    level: number = 1;
    questionsCorrectInLevel: number = 0;
    timeElapsed: number = 0;
    currentWord: CurrentWord = {
      difficulty: 'easy',
      sentence: '',
      correct: ''
    };
    
    get currentDifficulty() {
      return this.currentWord.difficulty;
    }
    bonusPoints: number = 0;
    private timer: any;
    
    // Initialize game
    ngOnInit() {
      this.startTimer();
    }
    
    // Clean up timer on destroy
    ngOnDestroy() {
      if (this.timer) {
        clearInterval(this.timer);
      }
    }
    
    // Timer methods
    startTimer() {
      this.timer = setInterval(() => {
        this.timeElapsed++;
      }, 1000);
    }
    
    // Format time as MM:SS
    formatTime(seconds: number): string {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    // Get time display class based on time elapsed
    getTimeDisplayClass(): string {
      if (this.timeElapsed < 30) return 'text-success';
      if (this.timeElapsed < 60) return 'text-warning';
      return 'text-danger';
    }
    
    // Get difficulty class based on level
    getDifficultyClass(): string {
      if (this.level <= 3) return 'text-success';
      if (this.level <= 6) return 'text-warning';
      return 'text-danger';
    }
  
    private getDifficultyText(): string {
      if (this.level <= 3) return 'easy';
      if (this.level <= 6) return 'medium';
      return 'hard';
    }
  
    constructor() {
      this.loadSentence();
    }
  
    /** Shuffle array using Fisher-Yates */
    shuffle(array: string[]): string[] {
      let shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
  
    loadSentence() {
      const current = this.sentences[this.currentIndex];
      const correctSentence = current.words.join(' ');
      this.shuffledWords = this.shuffle([...current.words]);
      this.selectedWords = [];
      this.feedback = null;
      this.isCorrect = null;
      
      // Update current word with all required properties
      this.currentWord = {
        difficulty: this.getDifficultyText() as 'easy' | 'medium' | 'hard',
        sentence: correctSentence,
        correct: correctSentence
      };
    }
  
    selectWord(word: string) {
      if (this.feedback) return; // disable after check
      this.selectedWords.push(word);
      this.shuffledWords = this.shuffledWords.filter(w => w !== word);
    }
  
    removeWord(word: string, index: number) {
      // Remove the word from selected words
      this.selectedWords.splice(index, 1);
      // Add it back to the shuffled words
      this.shuffledWords = [...this.shuffledWords, word];
      // Clear any previous feedback
      this.feedback = null;
      this.isCorrect = null;
    }
  
    checkAnswer() {
      const correctSentence = this.sentences[this.currentIndex].words.join(' ');
      const childSentence = this.selectedWords.join(' ');
  
      if (childSentence === correctSentence) {
        this.feedback = '✅ Correct!';
        this.isCorrect = true;
      } else {
        this.feedback = '❌ Wrong!';
        this.isCorrect = false;
      }
    }
  
    nextSentence() {
      this.currentIndex = (this.currentIndex + 1) % this.sentences.length;
      this.loadSentence();
    }
  }
  