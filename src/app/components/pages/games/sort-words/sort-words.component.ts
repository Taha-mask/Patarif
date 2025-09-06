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
  // --- DB game id for this component (change to your actual id) ---
  private readonly GAME_ID = 4;

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

  constructor(private supabase: SupabaseService, private cd: ChangeDetectorRef, private audioService: AudioService) {}

  async ngOnInit() {
    // Try to restore progress
    try {
      const progress = await this.supabase.getPlayerProgress(this.GAME_ID);

      if (progress && typeof progress.level === 'number' && progress.level >= 1) {
        this.level = Math.max(1, progress.level);
      } else {
        this.level = 1;
      }

      // Load sentences for the resolved level
      await this.loadSentencesFromDB();

      // If we have a saved question number, restore to it (approximate used questions)
      if (progress && typeof progress.question_num === 'number' && progress.question_num >= 1) {
        // clamp to [1, sentences.length]
        const qnum = Math.max(1, Math.min(progress.question_num, this.sentences.length || this.questionsInLevel));
        // currentIndex is 0-based; qnum is 1-based
        this.currentIndex = Math.max(0, qnum - 1);
        // reconstruct used indices approximately: mark (qnum - 1) random used sentences
        this.markRandomUsedIndices(this.level, qnum - 1);
        this.currentQuestion = qnum;
      } else {
        // no saved progress - create initial row and defaults
        this.currentIndex = 0;
        this.currentQuestion = 1;
        try {
          await this.supabase.savePlayerProgress(this.GAME_ID, 1, 1);
        } catch (err) {
          // ignore errors - best-effort
          console.warn('Could not create initial player progress:', err);
        }
      }
    } catch (err) {
      console.error('Error restoring progress:', err);
      // fallback defaults
      this.level = 1;
      this.currentIndex = 0;
      this.currentQuestion = 1;
      try { await this.supabase.savePlayerProgress(this.GAME_ID, 1, 1); } catch (_) {}
    }

    // Start timer and load the initial sentence into UI
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
      this.sentences = []; // keep empty so loadSentence handles it
    }
  }

  // Sentence Loader
  private loadSentence() {
    if (!this.sentences.length) return;

    // ensure currentIndex in bounds
    if (this.currentIndex < 0) this.currentIndex = 0;
    if (this.currentIndex >= this.sentences.length) this.currentIndex = this.sentences.length - 1;

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

  async onNextLevel() {
    // move to next level
    this.level++;
    this.questionsCorrectInLevel = 0;
    this.showCelebration = false;
    this.currentIndex = 0;
    this.currentQuestion = 1;
    this.timeElapsed = 0;

    // load new level sentences and reset UI
    await this.loadSentencesFromDB();
    this.loadSentence();
    // save initial row for next level (best-effort)
    try { await this.supabase.savePlayerProgress(this.GAME_ID, this.level, 1); } catch (_) {}
  }

  get celebrationData(): CelebrationData {
    return {
      level: this.level,
      questionsCorrect: this.questionsCorrectInLevel,
      totalQuestions: this.questionsInLevel,
      timeElapsed: this.timeElapsed,
      difficulty: this.currentWord.difficulty as 'facile' | 'moyen' | 'difficile'
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
    this.audioService.playCorrectSound();
  }

  private playWrongSound() {
    this.audioService.playWrongSound();
  }

  handleButton() {
    if (!this.feedback) {
      this.checkAnswer();
    } else if (this.isCorrect) {
      // move to next sentence (and save progress)
      this.nextSentenceOrLevel();
      // increment currentQuestion to reflect moving forward (saved inside nextSentenceOrLevel uses currentQuestion + 1)
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
  
  private async nextSentenceOrLevel() {
    // If completed enough questions in level -> show celebration & save next level progress
    if (this.questionsCorrectInLevel >= this.questionsInLevel) {
      this.showCelebration = true;

      // Save progress: move player to next level with question_num = 1
      try {
        const nextLevel = this.level + 1;
        await this.supabase.savePlayerProgress(this.GAME_ID, nextLevel, 1);
      } catch (err) {
        console.warn('Failed to save progress on level completion:', err);
      }
    } else {
      // move to next sentence if available
      if (this.currentIndex < this.sentences.length - 1) {
        this.currentIndex++;
        this.loadSentence();
      }

      // Save progress: the player will be at question (currentQuestion + 1)
      const nextQuestionNum = this.currentQuestion + 1; // because caller will increment currentQuestion after this call
      try {
        // best-effort save, non-blocking
        this.supabase.savePlayerProgress(this.GAME_ID, this.level, nextQuestionNum)
          .then(saved => { if (!saved) console.warn('Failed to save progress (nextSentence)'); })
          .catch(err => console.warn('savePlayerProgress error (nextSentence):', err));
      } catch (err) {
        console.warn('Error saving progress in nextSentenceOrLevel:', err);
      }
    }
  
    // إعادة ضبط الحالة
    this.feedback = null;
    this.isCorrect = null;
    this.selectedWords = [];
  }
  
  // ========================
  // HELPERS
  // ========================
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  /**
   * Mark `count` distinct random sentence indices as used for `level`.
   * This approximates previous progress when restoring.
   */
  private markRandomUsedIndices(level: number, count: number): void {
    const total = this.sentences.length;
    if (count <= 0 || total === 0) return;

    const indices = Array.from({ length: total }, (_, i) => i);
    // shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const chosen = indices.slice(0, Math.min(count, total));
    // advance currentIndex if needed so loadSentence picks correct one
    // we will set currentIndex to the next unused index if possible
    const usedSet = new Set(chosen);
    // find next unused index
    let nextIdx = 0;
    while (usedSet.has(nextIdx) && nextIdx < total) nextIdx++;
    // if all used, keep currentIndex as last
    this.currentIndex = Math.min(nextIdx, total - 1);
  }
}
