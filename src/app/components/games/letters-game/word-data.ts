export interface WordData {
  word: string;
  image: string;
  level: number;
}

export const WORDS: WordData[] = [
  // Level 1 (3-4 letters)
  { word: 'CHAT', image: 'https://cdn.pixabay.com/photo/2017/02/20/18/03/cat-2083492_640.jpg', level: 1 },
  { word: 'RIRE', image: 'https://cdn.pixabay.com/photo/2017/05/11/08/48/emoticon-2301865_640.png', level: 1 },
  { word: 'LUNE', image: 'https://cdn.pixabay.com/photo/2013/07/03/20/17/moon-143651_640.jpg', level: 1 },
  { word: 'NEZ', image: 'https://cdn.pixabay.com/photo/2016/12/05/19/41/nose-1884821_640.jpg', level: 1 },
  { word: 'CIEL', image: 'https://cdn.pixabay.com/photo/2015/07/05/10/18/blue-sky-832087_640.jpg', level: 1 },
  
  // Level 2 (5-6 letters)
  { word: 'MAISON', image: 'https://cdn.pixabay.com/photo/2016/06/24/10/47/house-1477041_640.jpg', level: 2 },
  { word: 'FLEUR', image: 'https://cdn.pixabay.com/photo/2018/01/29/07/11/flower-3115353_640.jpg', level: 2 },
  { word: 'TABLE', image: 'https://cdn.pixabay.com/photo/2017/01/14/12/59/table-1979266_640.jpg', level: 2 },
  { word: 'CHAISE', image: 'https://cdn.pixabay.com/photo/2017/08/02/01/01/living-room-2569325_640.jpg', level: 2 },
  { word: 'SOURIS', image: 'https://cdn.pixabay.com/photo/2014/11/30/14/11/cat-551554_640.jpg', level: 2 },
  
  // Level 3 (6+ letters)
  { word: 'JARDIN', image: 'https://cdn.pixabay.com/photo/2016/11/18/18/39/living-room-1835923_640.jpg', level: 3 },
  { word: 'CRAYON', image: 'https://cdn.pixabay.com/photo/2017/06/21/19/01/pencil-2429311_640.jpg', level: 3 },
  { word: 'CHAPEAU', image: 'https://cdn.pixabay.com/photo/2017/01/31/23/42/hat-2028063_640.png', level: 3 },
  { word: 'HORLOGE', image: 'https://cdn.pixabay.com/photo/2013/07/12/12/56/clock-145095_640.png', level: 3 },
  { word: 'CITRON', image: 'https://cdn.pixabay.com/photo/2017/01/20/15/06/oranges-1995056_640.jpg', level: 3 },
  
  // Additional words with online images
  { word: 'POMME', image: 'https://cdn.pixabay.com/photo/2016/02/23/17/42/apple-1218158_640.jpg', level: 1 },
  { word: 'LIVRE', image: 'https://cdn.pixabay.com/photo/2016/03/26/22/21/books-1281581_640.jpg', level: 2 },
  { word: 'ARBRE', image: 'https://cdn.pixabay.com/photo/2016/11/19/11/11/fir-1839205_640.jpg', level: 2 },
  { word: 'SOLEIL', image: 'https://cdn.pixabay.com/photo/2016/11/29/05/45/astronomy-1867616_640.jpg', level: 2 },
  { word: 'MONTAGNE', image: 'https://cdn.pixabay.com/photo/2016/08/11/23/55/mountains-1587287_640.jpg', level: 3 },
  { word: 'ÉTOILE', image: 'https://cdn.pixabay.com/photo/2017/01/20/15/06/orion-1995051_640.jpg', level: 2 },
  { word: 'CHIEN', image: 'https://cdn.pixabay.com/photo/2017/09/25/13/12/dog-2785074_640.jpg', level: 1 },
  { word: 'OISEAU', image: 'https://cdn.pixabay.com/photo/2017/02/07/16/47/kingfisher-2046453_640.jpg', level: 2 },
  { word: 'POISSON', image: 'https://cdn.pixabay.com/photo/2016/12/31/21/22/discus-fish-1943755_640.jpg', level: 3 },
  { word: 'CŒUR', image: 'https://cdn.pixabay.com/photo/2017/09/23/16/33/pixel-heart-2779422_640.png', level: 1 },
  { word: 'MAIN', image: 'https://cdn.pixabay.com/photo/2017/01/10/03/06/hand-196747_640.jpg', level: 1 },
  { word: 'NUAGE', image: 'https://cdn.pixabay.com/photo/2017/11/04/08/14/tree-2916763_640.jpg', level: 2 },
  { word: 'ÉCOLE', image: 'https://cdn.pixabay.com/photo/2017/11/28/10/03/board-2983079_640.jpg', level: 2 },
  { word: 'JOUET', image: 'https://cdn.pixabay.com/photo/2017/01/16/16/25/baby-1984315_640.jpg', level: 2 },
  { word: 'ROUE', image: 'https://cdn.pixabay.com/photo/2013/07/13/11/34/car-157703_640.png', level: 1 }
];
