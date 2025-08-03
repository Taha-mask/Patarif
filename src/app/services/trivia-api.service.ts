import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface TriviaQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  allAnswers: string[];
  category: string;
  difficulty: string;
  imageUrl?: string;
  imageKeyword?: string;
}

export interface OpenTriviaResponse {
  response_code: number;
  results: OpenTriviaQuestion[];
}

export interface OpenTriviaQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

export interface PixabayImage {
  id: number;
  webformatURL: string;
  largeImageURL: string;
  previewURL: string;
  tags: string;
}

@Injectable({
  providedIn: 'root'
})
export class TriviaApiService {
  private readonly TRIVIA_API_BASE = 'https://opentdb.com/api.php';
  private readonly PIXABAY_API_BASE = 'https://pixabay.com/api/';
  private readonly PIXABAY_API_KEY = 'YOUR_PIXABAY_API_KEY'; // Replace with your key

  constructor(private http: HttpClient) {}

  /**
   * Fetch trivia questions from OpenTrivia API
   * Sample API call: https://opentdb.com/api.php?amount=5&category=9&difficulty=easy&type=multiple
   */
  fetchTriviaQuestions(amount: number = 5, category: string = '9', difficulty: string = 'easy'): Observable<OpenTriviaQuestion[]> {
    const params = new HttpParams()
      .set('amount', amount.toString())
      .set('category', category)
      .set('difficulty', difficulty)
      .set('type', 'multiple');

    return this.http.get<OpenTriviaResponse>(this.TRIVIA_API_BASE, { params }).pipe(
      map(response => {
        if (response.response_code === 0) {
          return response.results;
        } else {
          throw new Error('Failed to fetch questions');
        }
      }),
      catchError(error => {
        console.error('Error fetching trivia questions:', error);
        return of(this.getFallbackQuestions());
      })
    );
  }

  /**
   * Fetch image from Pixabay API based on keyword
   * Sample API call: https://pixabay.com/api/?key=YOUR_KEY&q=lion&image_type=photo&category=animals&safesearch=true&per_page=3
   */
  fetchImageForKeyword(keyword: string): Observable<string | undefined> {
    const params = new HttpParams()
      .set('key', this.PIXABAY_API_KEY)
      .set('q', keyword)
      .set('image_type', 'photo')
      .set('category', 'animals,nature,food')
      .set('safesearch', 'true')
      .set('per_page', '3');

    return this.http.get<PixabayResponse>(this.PIXABAY_API_BASE, { params }).pipe(
      map(response => {
        if (response.hits && response.hits.length > 0) {
          return response.hits[0].webformatURL;
        }
        return undefined;
      }),
      catchError(error => {
        console.error('Error fetching image:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Extract image keyword from question text
   */
  extractImageKeyword(question: string): string | null {
    const questionLower = question.toLowerCase();

    // Keywords that typically need images
    const imageKeywords = [
      'flag', 'country', 'animal', 'cat', 'dog', 'bird', 'fish', 'elephant', 'lion', 'tiger',
      'apple', 'banana', 'orange', 'fruit', 'vegetable', 'car', 'house', 'building', 'mountain',
      'river', 'ocean', 'desert', 'forest', 'flower', 'tree', 'sun', 'moon', 'star'
    ];

    for (const keyword of imageKeywords) {
      if (questionLower.includes(keyword)) {
        return keyword;
      }
    }

    return null;
  }

  /**
   * Decode HTML entities in API responses
   */
  decodeHtml(html: string): string {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  /**
   * Shuffle array for random answer order
   */
  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate unique ID
   */
  generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get fallback questions when API fails
   */
  private getFallbackQuestions(): OpenTriviaQuestion[] {
    return [
      {
        category: "Geography",
        type: "multiple",
        difficulty: "easy",
        question: "What is the capital of France?",
        correct_answer: "Paris",
        incorrect_answers: ["London", "Berlin", "Madrid"]
      },
      {
        category: "Animals",
        type: "multiple",
        difficulty: "easy",
        question: "Which animal is known as the king of the jungle?",
        correct_answer: "Lion",
        incorrect_answers: ["Tiger", "Elephant", "Gorilla"]
      },
      {
        category: "Science",
        type: "multiple",
        difficulty: "easy",
        question: "What color is the sky on a clear day?",
        correct_answer: "Blue",
        incorrect_answers: ["Green", "Red", "Yellow"]
      },
      {
        category: "General Knowledge",
        type: "multiple",
        difficulty: "easy",
        question: "How many days are in a week?",
        correct_answer: "7",
        incorrect_answers: ["5", "6", "8"]
      },
      {
        category: "Food",
        type: "multiple",
        difficulty: "easy",
        question: "Which fruit is yellow and grows on trees?",
        correct_answer: "Banana",
        incorrect_answers: ["Apple", "Orange", "Grape"]
      }
    ];
  }
}

/**
 * SAMPLE JSON STRUCTURES
 */

// Sample OpenTrivia API Response
export const SAMPLE_TRIVIA_RESPONSE = {
  "response_code": 0,
  "results": [
    {
      "category": "Geography",
      "type": "multiple",
      "difficulty": "easy",
      "question": "What is the capital of France?",
      "correct_answer": "Paris",
      "incorrect_answers": ["London", "Berlin", "Madrid"]
    },
    {
      "category": "Animals",
      "type": "multiple",
      "difficulty": "easy",
      "question": "Which animal is known as the king of the jungle?",
      "correct_answer": "Lion",
      "incorrect_answers": ["Tiger", "Elephant", "Gorilla"]
    }
  ]
};

// Sample Pixabay API Response
export const SAMPLE_PIXABAY_RESPONSE = {
  "total": 500,
  "totalHits": 500,
  "hits": [
    {
      "id": 123456,
      "webformatURL": "https://pixabay.com/get/123456_640.jpg",
      "largeImageURL": "https://pixabay.com/get/123456_1280.jpg",
      "previewURL": "https://pixabay.com/get/123456_150.jpg",
      "tags": "lion, animal, wildlife"
    }
  ]
};

// Sample Processed Question Structure
export const SAMPLE_PROCESSED_QUESTION: TriviaQuestion = {
  id: "abc123def",
  question: "What is the capital of France?",
  correctAnswer: "Paris",
  incorrectAnswers: ["London", "Berlin", "Madrid"],
  allAnswers: ["Paris", "London", "Berlin", "Madrid"],
  category: "Geography",
  difficulty: "easy",
  imageUrl: "https://pixabay.com/get/123456_640.jpg",
  imageKeyword: "paris"
};

/**
 * API CONFIGURATION GUIDE
 */

export const API_CONFIG = {
  // OpenTrivia API - No API key required
  TRIVIA_API: {
    baseUrl: 'https://opentdb.com/api.php',
    categories: {
      '9': 'General Knowledge',
      '10': 'Entertainment: Books',
      '11': 'Entertainment: Film',
      '12': 'Entertainment: Music',
      '14': 'Television',
      '15': 'Entertainment: Video Games',
      '16': 'Entertainment: Board Games',
      '17': 'Science & Nature',
      '18': 'Science: Computers',
      '19': 'Science: Mathematics',
      '20': 'Mythology',
      '21': 'Sports',
      '22': 'Geography',
      '23': 'History',
      '24': 'Politics',
      '25': 'Art',
      '27': 'Animals',
      '28': 'Vehicles',
      '29': 'Entertainment: Comics',
      '30': 'Science: Gadgets',
      '32': 'Entertainment: Cartoon & Animations'
    },
    difficulties: ['easy', 'medium', 'hard'],
    types: ['multiple', 'boolean']
  },

  // Pixabay API - Requires API key
  PIXABAY_API: {
    baseUrl: 'https://pixabay.com/api/',
    apiKey: 'YOUR_PIXABAY_API_KEY', // Get from https://pixabay.com/api/docs/
    imageTypes: ['photo', 'illustration', 'vector'],
    categories: ['animals', 'nature', 'food', 'sports', 'transportation'],
    safesearch: true,
    perPage: 3
  }
};

/**
 * SOUND EFFECTS GUIDE
 */

export const SOUND_EFFECTS = {
  correct: {
    file: 'assets/sounds/correct.mp3',
    description: 'Cheerful success sound'
  },
  wrong: {
    file: 'assets/sounds/wrong.mp3',
    description: 'Gentle error sound'
  },
  levelComplete: {
    file: 'assets/sounds/level-complete.mp3',
    description: 'Victory fanfare'
  },
  buttonClick: {
    file: 'assets/sounds/button-click.mp3',
    description: 'Soft click sound'
  }
};

/**
 * ANIMATION IDEAS
 */

export const ANIMATION_SUGGESTIONS = {
  correctAnswer: [
    'Confetti explosion',
    'Star burst effect',
    'Pulse animation',
    'Bounce effect',
    'Color transition'
  ],
  wrongAnswer: [
    'Gentle shake',
    'Red flash',
    'Fade effect',
    'Scale down',
    'Vibration'
  ],
  questionTransition: [
    'Slide in from right',
    'Fade in with scale',
    'Flip animation',
    'Zoom in effect',
    'Bounce entrance'
  ],
  buttonInteractions: [
    'Hover lift effect',
    'Click ripple',
    'Glow on focus',
    'Scale on press',
    'Color transition'
  ]
};
