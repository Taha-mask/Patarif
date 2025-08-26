export interface Card {
  title: string;
  subtitle?: string;
  img: string;
    gradient?: string; // <-- add this
}

export interface CharacterCard {
  bgIcon: string;
  character: string;
  raiting: number;
}
