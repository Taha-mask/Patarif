import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameTemplateComponent } from '../../../game-template/game-template.component';
import { SupabaseService } from '../../../../supabase.service';
import { CelebrationComponent, CelebrationData } from '../../../game-template/celebration/celebration.component';
import { AudioService } from '../../../../services/audio.service';
interface Sentence {
  words: string[];
  difficulty?: 'facile' | 'moyen' | 'difficile';
}

@Component({
  selector: 'app-sort-words',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent, CelebrationComponent],
  templateUrl: './sort-words.component.html',
  styleUrls: ['./sort-words.component.css']
})
export class SortWordsComponent implements OnInit, OnDestroy {

  sentences: Sentence[] = [];
  currentIndex = 0;
  shuffledWords: string[] = [];
  selectedWords: string[] = [];
  feedback: string | null = null;
  isCorrect: boolean | null = null;
  wordColors: {[key: string]: string} = {};

  // Game state
  currentQuestion = 1;
  questionsCorrectInLevel = 0;
  questionsInLevel = 5; // Number of questions per level
  timeElapsed = 0;
  level = 1;
  showCelebration = false;
  currentWord: { difficulty: 'facile' | 'moyen' | 'difficile', sentence: string, correct: string } = { 
    difficulty: 'facile', 
    sentence: '', 
    correct: '' 
  };
  private timer: any;


  constructor(private supabase: SupabaseService,private cd: ChangeDetectorRef, private audioService: AudioService) {
    
  }

  async ngOnInit() {
    this.startTimer();
    await this.loadSentencesFromDB(); // جلب الجمل من Supabase
    this.loadSentence();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  // Timer
  private startTimer() {
    this.timer = setInterval(() => this.timeElapsed++, 1000);
  }

  // جلب الجمل من Supabase
  private async loadSentencesFromDB() {
    try {
      const data = await this.supabase.getSentenceSorting(this.level);

      this.sentences = data.map((row: any) => ({
        words: row.value.split(' '), // تحويل الجملة إلى كلمات
        difficulty: row.difficulty
      }));
    } catch (error) {
      console.error('Error fetching sentences:', error);
    }
  }

  // Sentence Loader
  private loadSentence() {
    if (!this.sentences.length) return;

    const current = this.sentences[this.currentIndex];
    const correctSentence = current.words.join(' ');

    this.shuffledWords = this.shuffle([...current.words]);
    this.selectedWords = [];
    this.feedback = null;
    this.isCorrect = null;
    
    // Ensure all words have colors assigned
    current.words.forEach(word => this.getColor(word));

    this.currentWord = {
      difficulty: current.difficulty || 'facile',
      sentence: correctSentence,
      correct: correctSentence
    };
  }


  // Word Colors (ثابت لكل كلمة داخل الجملة)
  getColor(word: string): string {
    if (!this.wordColors[word]) {
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
        '#FFEEAD', '#D4A5A5', '#9B59B6', '#E67E22', 
        '#2ECC71', '#E74C3C', '#1ABC9C', '#3498DB',
        '#9B59B6', '#E74C3C', '#F1C40F', '#E67E22'
      ];
      // Generate a consistent hash for the word to get a stable color
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = word.charCodeAt(i) + ((hash << 5) - hash);
      }
      this.wordColors[word] = colors[Math.abs(hash) % colors.length];
    }
    return this.wordColors[word];
  }


  
  // Shuffle
  private shuffle(array: string[]): string[] {
    return array
      .map(val => ({ val, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(obj => obj.val);
  }

  // Celebration methods
  onCloseCelebration() {
    this.showCelebration = false;
  }

  onNextLevel() {
    this.level++;                  // زيادة المستوى
    this.questionsCorrectInLevel = 0; // إعادة ضبط عداد الأسئلة
    this.showCelebration = false;
    this.loadSentencesFromDB();    // تحميل أسئلة المستوى الجديد
    this.currentIndex = 0;
    this.loadSentence();
    this.currentQuestion = 1;
  }
  

  get celebrationData(): CelebrationData {
    return {
      level: this.level,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.questionsInLevel,
      timeElapsed: this.timeElapsed,
      difficulty: this.currentWord.difficulty as 'facile' | 'moyen' | 'difficile' // Type assertion to match CelebrationData interface
    };
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


  private playCorrectSound() {
    this.audioService.playCorrect();
  }

  private playWrongSound() {
    this.audioService.playWrong();
  }
  handleButton() {
    if (!this.feedback) {
      this.checkAnswer();
    } else if (this.isCorrect) {
      this.nextSentenceOrLevel();
      this.currentQuestion++;
    } else {
      // الإجابة خاطئة → إعادة ترتيب الكلمات
      this.shuffledWords = this.shuffle([...this.sentences[this.currentIndex].words]);
      this.selectedWords = [];
      this.feedback = null;
      this.isCorrect = null;
    }
  }
  
  private checkAnswer() {
    const selectedSentence = this.selectedWords.join(' ');
    const isCorrect = selectedSentence.trim() === this.currentWord.correct.trim();
    this.isCorrect = isCorrect;
    this.feedback = isCorrect ? 'Correct!' : 'Try again!';
  
    if (isCorrect) {
      // زيادة عدد الأسئلة المكتملة
      this.questionsCorrectInLevel++;
      this.playCorrectSound();
    } else {
      this.playWrongSound();
    }
  }
  
  private nextSentenceOrLevel() {
    if (this.questionsCorrectInLevel >= this.questionsInLevel) {
      // انتهاء المستوى
      this.showCelebration = true;
    } else {
      // الانتقال للسؤال التالي
      if (this.currentIndex < this.sentences.length - 1) {
        this.currentIndex++;
        this.loadSentence();
      }
    }
  
    // إعادة ضبط الحالة
    this.feedback = null;
    this.isCorrect = null;
    this.selectedWords = [];
  }
  
  
}
