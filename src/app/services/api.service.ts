import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export interface TriviaQuestion {
  id: number;
  category: string;
  type: 'multiple' | 'boolean';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  imageUrl?: string;
  imageKeyword?: string;
}

export interface PixabayImage {
  id: number;
  webformatURL: string;
  previewURL: string;
  tags: string;
  user: string;
}

export interface PixabayResponse {
  hits: PixabayImage[];
  total: number;
  totalHits: number;
}

export interface ProcessedQuestion {
  id: number;
  question: string;
  correctAnswer: string;
  options: string[];
  category: string;
  difficulty: string;
  imageUrl?: string;
  imageKeyword?: string | null;
  type: 'multiple' | 'boolean';
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly TRIVIA_API_BASE = 'https://opentdb.com/api.php';
  private readonly PIXABAY_API_BASE = 'https://pixabay.com/api/';

  // Replace with your actual API keys
  private readonly PIXABAY_API_KEY = 'YOUR_PIXABAY_API_KEY'; // Get from https://pixabay.com/api/docs/

  // Categories suitable for children
  private readonly KID_FRIENDLY_CATEGORIES = [
    { id: 9, name: 'General Knowledge' },
    { id: 27, name: 'Animals' },
    { id: 14, name: 'Television' },
    { id: 15, name: 'Video Games' },
    { id: 32, name: 'Cartoon & Animations' }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Fetch trivia questions from Open Trivia API
   */
  fetchTriviaQuestions(count: number = 5, category?: number, difficulty: 'easy' | 'medium' | 'hard' = 'easy'): Observable<ProcessedQuestion[]> {
    const params: any = {
      amount: count.toString(),
      type: 'multiple',
      difficulty: difficulty
    };

    if (category) {
      params['category'] = category.toString();
    }

    return this.http.get<{ response_code: number; results: TriviaQuestion[] }>(this.TRIVIA_API_BASE, { params })
      .pipe(
        map(response => {
          if (response.response_code === 0 && response.results.length > 0) {
            return response.results.map((q, index) => this.processTriviaQuestion(q, index));
          } else {
            throw new Error('No questions available');
          }
        }),
        switchMap(questions => this.enrichQuestionsWithImages(questions)),
        catchError(error => {
          console.error('Error fetching trivia questions:', error);
          return of(this.getFallbackQuestions());
        })
      );
  }

  /**
   * Process raw trivia question into our format
   */
  private processTriviaQuestion(question: TriviaQuestion, index: number): ProcessedQuestion {
    // Decode HTML entities
    const decodedQuestion = this.decodeHtmlEntities(question.question);
    const decodedCorrectAnswer = this.decodeHtmlEntities(question.correct_answer);
    const decodedIncorrectAnswers = question.incorrect_answers.map(answer => this.decodeHtmlEntities(answer));

    // Shuffle options
    const allOptions = [decodedCorrectAnswer, ...decodedIncorrectAnswers];
    const shuffledOptions = this.shuffleArray(allOptions);

    // Determine if this question needs an image
    const imageKeyword = this.extractImageKeyword(decodedQuestion, decodedCorrectAnswer);

    return {
      id: index + 1,
      question: decodedQuestion,
      correctAnswer: decodedCorrectAnswer,
      options: shuffledOptions,
      category: question.category,
      difficulty: question.difficulty,
      imageKeyword: imageKeyword,
      type: question.type
    };
  }

  /**
   * Enrich questions with relevant images from Pixabay
   */
  private enrichQuestionsWithImages(questions: ProcessedQuestion[]): Observable<ProcessedQuestion[]> {
    const imageRequests = questions
      .filter(q => q.imageKeyword)
      .map(q => this.fetchImageForKeyword(q.imageKeyword!).pipe(
        map(imageUrl => ({ ...q, imageUrl })),
        catchError(() => of(q)) // If image fetch fails, return question without image
      ));

    const questionsWithoutImages = questions.filter(q => !q.imageKeyword);

    if (imageRequests.length === 0) {
      return of(questions);
    }

    return forkJoin(imageRequests).pipe(
      map(questionsWithImages => [...questionsWithImages, ...questionsWithoutImages])
    );
  }

  /**
   * Fetch image from Pixabay based on keyword
   */
  private fetchImageForKeyword(keyword: string): Observable<string> {
    const params = {
      key: this.PIXABAY_API_KEY,
      q: keyword,
      image_type: 'photo',
      category: 'animals,nature,places', // Kid-friendly categories
      safesearch: 'true',
      per_page: '3',
      order: 'popular'
    };

    return this.http.get<PixabayResponse>(this.PIXABAY_API_BASE, { params })
      .pipe(
        map(response => {
          if (response.hits && response.hits.length > 0) {
            return response.hits[0].webformatURL;
          } else {
            throw new Error('No images found');
          }
        }),
        catchError(error => {
          console.error('Error fetching image for keyword:', keyword, error);
          throw error;
        })
      );
  }

  /**
   * Extract keyword for image search from question or answer
   */
  private extractImageKeyword(question: string, answer: string): string | null {
    const questionLower = question.toLowerCase();
    const answerLower = answer.toLowerCase();

    // Check if question is about countries, animals, or objects
    if (questionLower.includes('country') || questionLower.includes('capital')) {
      return answer;
    }

    if (questionLower.includes('animal') || questionLower.includes('pet')) {
      return answer;
    }

    if (questionLower.includes('fruit') || questionLower.includes('vegetable')) {
      return answer;
    }

    if (questionLower.includes('color') || questionLower.includes('colour')) {
      return answer;
    }

    // Check for specific keywords in the answer
    const imageKeywords = ['cat', 'dog', 'elephant', 'lion', 'tiger', 'bear', 'bird', 'fish', 'apple', 'banana', 'orange', 'car', 'house', 'tree', 'flower', 'sun', 'moon', 'star'];

    for (const keyword of imageKeywords) {
      if (answerLower.includes(keyword)) {
        return keyword;
      }
    }

    return null;
  }

  /**
   * Decode HTML entities
   */
  private decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Fallback questions if API fails
   */
  private getFallbackQuestions(): ProcessedQuestion[] {
    return [
      {
        id: 1,
        question: "What color is the sky on a sunny day?",
        correctAnswer: "Blue",
        options: ["Blue", "Red", "Green", "Yellow"],
        category: "General Knowledge",
        difficulty: "easy",
        type: "multiple"
      },
      {
        id: 2,
        question: "Which animal says 'meow'?",
        correctAnswer: "Cat",
        options: ["Dog", "Cat", "Bird", "Fish"],
        category: "Animals",
        difficulty: "easy",
        type: "multiple"
      },
      {
        id: 3,
        question: "What do plants need to grow?",
        correctAnswer: "Water",
        options: ["Water", "Candy", "Toys", "Books"],
        category: "General Knowledge",
        difficulty: "easy",
        type: "multiple"
      },
      {
        id: 4,
        question: "How many legs does a cat have?",
        correctAnswer: "Four",
        options: ["Two", "Three", "Four", "Six"],
        category: "Animals",
        difficulty: "easy",
        type: "multiple"
      },
      {
        id: 5,
        question: "What is the opposite of hot?",
        correctAnswer: "Cold",
        options: ["Cold", "Warm", "Big", "Small"],
        category: "General Knowledge",
        difficulty: "easy",
        type: "multiple"
      }
    ];
  }

  /**
   * Get available categories for trivia
   */
  getAvailableCategories() {
    return this.KID_FRIENDLY_CATEGORIES;
  }

  /**
   * Generate infinite questions for continuous gameplay
   */
  generateInfiniteQuestions(): Observable<ProcessedQuestion[]> {
    // Use multiple categories to ensure variety
    const categories = this.KID_FRIENDLY_CATEGORIES.map(cat => cat.id);
    const requests = categories.map(category =>
      this.fetchTriviaQuestions(10, category, 'easy').pipe(
        catchError(() => of([]))
      )
    );

    return forkJoin(requests).pipe(
      map(responses => {
        const allQuestions = responses.flat();
        // Shuffle all questions for variety
        return this.shuffleArray(allQuestions);
      }),
      catchError(() => of(this.getFallbackQuestions()))
    );
  }

  /**
   * Generate infinite words for letters game
   */
  generateInfiniteWords(): Observable<GameWord[]> {
    // This would typically fetch from a word API
    // For now, we'll use a comprehensive word list
    const words = [
      { word: 'POMME', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=300&fit=crop', level: 1 },
      { word: 'CHAT', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop', level: 1 },
      { word: 'MAIN', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop', level: 1 },
      { word: 'LUNE', image: 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=400&h=300&fit=crop', level: 1 },
      { word: 'SOLEIL', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', level: 2 },
      { word: 'MAISON', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop', level: 2 },
      { word: 'JARDIN', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop', level: 2 },
      { word: 'MUSIQUE', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', level: 3 },
      { word: 'ANIMAL', image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=400&h=300&fit=crop', level: 3 },
      { word: 'COULEUR', image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop', level: 3 },
      // Add more words for infinite gameplay
      { word: 'LIVRE', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop', level: 1 },
      { word: 'TABLE', image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400&h=300&fit=crop', level: 2 },
      { word: 'FLEUR', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop', level: 2 },
      { word: 'ARBRE', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop', level: 2 },
      { word: 'VOITURE', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop', level: 3 },
      { word: 'TELEPHONE', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop', level: 4 },
      { word: 'ORDINATEUR', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop', level: 4 },
      { word: 'INTERNET', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop', level: 4 },
      { word: 'RESTAURANT', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop', level: 5 },
      { word: 'UNIVERSITE', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9a1?w=400&h=300&fit=crop', level: 5 }
    ];

    return of(this.shuffleArray(words));
  }

  /**
   * Generate infinite country questions
   */
  generateInfiniteCountries(): Observable<CountryQuestion[]> {
    const countries = [
      {
        id: 1,
        name: 'France',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        options: ['France', 'Germany', 'Italy', 'Spain'],
        correctAnswer: 'France',
        hint: 'Land of wine and cheese'
      },
      {
        id: 2,
        name: 'Japan',
        image: 'https://images.unsplash.com/photo-1538970272646-f61fabb3a8a2?w=400&h=300&fit=crop',
        options: ['China', 'Japan', 'Korea', 'Thailand'],
        correctAnswer: 'Japan',
        hint: 'Land of cherry blossoms'
      },
      {
        id: 3,
        name: 'Brazil',
        image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&h=300&fit=crop',
        options: ['Brazil', 'Argentina', 'Chile', 'Peru'],
        correctAnswer: 'Brazil',
        hint: 'Home of the Amazon rainforest'
      },
      {
        id: 4,
        name: 'Australia',
        image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
        options: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea'],
        correctAnswer: 'Australia',
        hint: 'Land of kangaroos and koalas'
      },
      {
        id: 5,
        name: 'Egypt',
        image: 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=400&h=300&fit=crop',
        options: ['Egypt', 'Morocco', 'Tunisia', 'Algeria'],
        correctAnswer: 'Egypt',
        hint: 'Land of the pyramids'
      },
      // Add more countries for infinite gameplay
      {
        id: 6,
        name: 'Canada',
        image: 'https://images.unsplash.com/photo-1519832979-6fa011b87667?w=400&h=300&fit=crop',
        options: ['Canada', 'USA', 'Mexico', 'Greenland'],
        correctAnswer: 'Canada',
        hint: 'Land of maple syrup'
      },
      {
        id: 7,
        name: 'India',
        image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop',
        options: ['India', 'Pakistan', 'Bangladesh', 'Sri Lanka'],
        correctAnswer: 'India',
        hint: 'Land of spices and Bollywood'
      },
      {
        id: 8,
        name: 'Russia',
        image: 'https://images.unsplash.com/photo-1549877452-9c387954fbc2?w=400&h=300&fit=crop',
        options: ['Russia', 'Ukraine', 'Belarus', 'Poland'],
        correctAnswer: 'Russia',
        hint: 'Largest country in the world'
      },
      {
        id: 9,
        name: 'South Africa',
        image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=400&h=300&fit=crop',
        options: ['South Africa', 'Namibia', 'Botswana', 'Zimbabwe'],
        correctAnswer: 'South Africa',
        hint: 'Land of Nelson Mandela'
      },
      {
        id: 10,
        name: 'Sweden',
        image: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=400&h=300&fit=crop',
        options: ['Sweden', 'Norway', 'Denmark', 'Finland'],
        correctAnswer: 'Sweden',
        hint: 'Land of IKEA and ABBA'
      }
    ];

    return of(this.shuffleArray(countries));
  }
}

// Additional interfaces for infinite gameplay
export interface GameWord {
  word: string;
  image: string;
  level: number;
}

export interface CountryQuestion {
  id: number;
  name: string;
  image: string;
  options: string[];
  correctAnswer: string;
  hint: string;
}
