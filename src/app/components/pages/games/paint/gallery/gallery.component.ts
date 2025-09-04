import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GameTemplateComponent } from "../../../../game-template/game-template.component";

interface Card {
  title: string;
  img: string;
}

interface Category {
  name: string;
  images: Card[];
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, GameTemplateComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent implements OnInit {
  selectedImageUrl: string = '';
  isLoading: boolean = false;
  private isDragging: boolean = false;
  private startX: number = 0;
  private scrollLeft: number = 0;

  constructor(private router: Router, private route: ActivatedRoute) {}

  selectImage(image: Card): void {
    // Navigate to canvas with the selected image URL as a query parameter
    this.router.navigate(['../canvas'], { 
      relativeTo: this.route,
      queryParams: { imageUrl: encodeURIComponent(image.img) }
    });
  }

  categories: Category[] = [
    {
      name: 'Animals',
      images: [
        { title: 'Lion', img: 'images/Final images/animals/Image_fx(119).jpg' },
        { title: 'Elephant', img: 'images/Final images/animals/Image_fx(120).jpg' },
        { title: 'Giraffe', img: 'images/Final images/animals/Image_fx(121).jpg' },
        { title: 'Tiger', img: 'images/Final images/animals/Image_fx(122).jpg' },
        { title: 'Monkey', img: 'images/Final images/animals/Image_fx(123).jpg' },
        { title: 'Zebra', img: 'images/Final images/animals/Image_fx(124).jpg' },
        { title: 'Kangaroo', img: 'images/Final images/animals/Image_fx(125).jpg' },
        { title: 'Panda', img: 'images/Final images/animals/Image_fx(126).jpg' },
        { title: 'Hippo', img: 'images/Final images/animals/Image_fx(177).jpg' },
        { title: 'Koala', img: 'images/Final images/animals/Image_fx(192).jpg' },
        { title: 'Polar Bear', img: 'images/Final images/animals/Image_fx(200).jpg' },
        { title: 'Penguin', img: 'images/Final images/animals/Image_fx(201).jpg' },
        { title: 'Wolf', img: 'images/Final images/animals/Image_fx(310).jpg' },
        { title: 'Fox', img: 'images/Final images/animals/Image_fx(312).jpg' },
        { title: 'Deer', img: 'images/Final images/animals/Image_fx(313).jpg' },
        { title: 'Rabbit', img: 'images/Final images/animals/Image_fx(314).jpg' },
        { title: 'Squirrel', img: 'images/Final images/animals/Image_fx(317).jpg' },
        { title: 'Raccoon', img: 'images/Final images/animals/Image_fx(319).jpg' },
        { title: 'Owl', img: 'images/Final images/animals/Image_fx(320).jpg' },
        { title: 'Eagle', img: 'images/Final images/animals/Image_fx(323).jpg' },
        { title: 'Parrot', img: 'images/Final images/animals/Image_fx(325).jpg' },
        { title: 'Flamingo', img: 'images/Final images/animals/Image_fx(326).jpg' },
        { title: 'Peacock', img: 'images/Final images/animals/Image_fx(330).jpg' },
        { title: 'Swan', img: 'images/Final images/animals/Image_fx(331).jpg' },
        { title: 'Duck', img: 'images/Final images/animals/Image_fx(332).jpg' },
        { title: 'Chicken', img: 'images/Final images/animals/Image_fx(333).jpg' },
        { title: 'Rooster', img: 'images/Final images/animals/Image_fx(336).jpg' },
        { title: 'Turkey', img: 'images/Final images/animals/Image_fx(339).jpg' },
        { title: 'Ostrich', img: 'images/Final images/animals/Image_fx(341).jpg' },
        { title: 'Frog', img: 'images/Final images/animals/Image_fx(343).jpg' },
        { title: 'Turtle', img: 'images/Final images/animals/Image_fx(344).jpg' },
        { title: 'Snake', img: 'images/Final images/animals/Image_fx(345).jpg' },
        { title: 'Lizard', img: 'images/Final images/animals/Image_fx(346).jpg' },
        { title: 'Crocodile', img: 'images/Final images/animals/Image_fx(347).jpg' },
        { title: 'Alligator', img: 'images/Final images/animals/Image_fx(348).jpg' },
        { title: 'Dolphin', img: 'images/Final images/animals/Image_fx(349).jpg' },
        { title: 'Whale', img: 'images/Final images/animals/Image_fx(350).jpg' },
        { title: 'Shark', img: 'images/Final images/animals/Image_fx(351).jpg' },
        { title: 'Octopus', img: 'images/Final images/animals/Image_fx(352).jpg' },
        { title: 'Jellyfish', img: 'images/Final images/animals/Image_fx(353).jpg' },
        { title: 'Starfish', img: 'images/Final images/animals/Image_fx(354).jpg' },
        { title: 'Crab', img: 'images/Final images/animals/Image_fx(355).jpg' },
        { title: 'Lobster', img: 'images/Final images/animals/Image_fx(356).jpg' },
        { title: 'Shrimp', img: 'images/Final images/animals/Image_fx(357).jpg' },
        { title: 'Squid', img: 'images/Final images/animals/Image_fx(358).jpg' },
        { title: 'Seahorse', img: 'images/Final images/animals/Image_fx(359).jpg' },
        { title: 'Clownfish', img: 'images/Final images/animals/Image_fx(360).jpg' },
        { title: 'Angelfish', img: 'images/Final images/animals/Image_fx(361).jpg' },
        { title: 'Butterflyfish', img: 'images/Final images/animals/Image_fx(362).jpg' },
        { title: 'Tang', img: 'images/Final images/animals/Image_fx(363).jpg' },
        { title: 'Pufferfish', img: 'images/Final images/animals/Image_fx(364).jpg' },
        { title: 'Eel', img: 'images/Final images/animals/Image_fx(365).jpg' },
        { title: 'Ray', img: 'images/Final images/animals/Image_fx(366).jpg' },
        { title: 'Seal', img: 'images/Final images/animals/Image_fx(367).jpg' },
        { title: 'Walrus', img: 'images/Final images/animals/Image_fx(368).jpg' },
        { title: 'Penguin 2', img: 'images/Final images/animals/Image_fx(369).jpg' },
        { title: 'Polar Bear 2', img: 'images/Final images/animals/Image_fx(370).jpg' },
        { title: 'Fox 2', img: 'images/Final images/animals/Image_fx(371).jpg' },
        { title: 'Wolf 2', img: 'images/Final images/animals/Image_fx(372).jpg' },
        { title: 'Deer 2', img: 'images/Final images/animals/Image_fx(424).jpg' },
        { title: 'Rabbit 2', img: 'images/Final images/animals/Image_fx(425).jpg' },
        { title: 'Squirrel 2', img: 'images/Final images/animals/Image_fx(427).jpg' },
        { title: 'Raccoon 2', img: 'images/Final images/animals/Image_fx(432).jpg' },
        { title: 'Owl 2', img: 'images/Final images/animals/Image_fx(437).jpg' },
        { title: 'Eagle 2', img: 'images/Final images/animals/Image_fx(438).jpg' },
        { title: 'Parrot 2', img: 'images/Final images/animals/Image_fx(439).jpg' },
        { title: 'Flamingo 2', img: 'images/Final images/animals/Image_fx(443).jpg' },
        { title: 'Peacock 2', img: 'images/Final images/animals/Image_fx(444).jpg' },
        { title: 'Swan 2', img: 'images/Final images/animals/Image_fx(497).jpg' },
        { title: 'Duck 2', img: 'images/Final images/animals/Image_fx(528).jpg' },
        { title: 'Chicken 2', img: 'images/Final images/animals/Image_fx(68).jpg' },
        { title: 'Rooster 2', img: 'images/Final images/animals/Image_fx(70).jpg' },
        { title: 'Turkey 2', img: 'images/Final images/animals/Image_fx(71).jpg' },
        { title: 'Ostrich 2', img: 'images/Final images/animals/Image_fx(72).jpg' },
        { title: 'Frog 2', img: 'images/Final images/animals/Image_fx(80).jpg' },
        { title: 'Turtle 2', img: 'images/Final images/animals/Image_fx(85).jpg' },
        { title: 'Snake 2', img: 'images/Final images/animals/Image_fx(87).jpg' }
      ]
    },
    {
      name: 'Places',
      images: [
        { title: 'Place 1', img: 'images/Final images/places/Image_fx(104).jpg' },
        { title: 'Place 2', img: 'images/Final images/places/Image_fx(106).jpg' },
        { title: 'Place 3', img: 'images/Final images/places/Image_fx(107).jpg' },
        { title: 'Place 4', img: 'images/Final images/places/Image_fx(108).jpg' },
        { title: 'Place 5', img: 'images/Final images/places/Image_fx(117).jpg' },
        { title: 'Place 6', img: 'images/Final images/places/Image_fx(118).jpg' },
        { title: 'Place 7', img: 'images/Final images/places/Image_fx(148).jpg' },
        { title: 'Place 8', img: 'images/Final images/places/Image_fx(149).jpg' },
        { title: 'Place 9', img: 'images/Final images/places/Image_fx(150).jpg' },
        { title: 'Place 10', img: 'images/Final images/places/Image_fx(191).jpg' },
        { title: 'Place 11', img: 'images/Final images/places/Image_fx(193).jpg' },
        { title: 'Place 12', img: 'images/Final images/places/Image_fx(194).jpg' },
        { title: 'Place 13', img: 'images/Final images/places/Image_fx(195).jpg' },
        { title: 'Place 14', img: 'images/Final images/places/Image_fx(196).jpg' },
        { title: 'Place 15', img: 'images/Final images/places/Image_fx(199).jpg' },
        { title: 'Place 16', img: 'images/Final images/places/Image_fx(202).jpg' },
        { title: 'Place 17', img: 'images/Final images/places/Image_fx(203).jpg' },
        { title: 'Place 18', img: 'images/Final images/places/Image_fx(478).jpg' },
        { title: 'Place 19', img: 'images/Final images/places/Image_fx(479).jpg' },
        { title: 'Place 20', img: 'images/Final images/places/Image_fx(480).jpg' },
        { title: 'Place 21', img: 'images/Final images/places/Image_fx(481).jpg' },
        { title: 'Place 22', img: 'images/Final images/places/Image_fx(482).jpg' },
        { title: 'Place 23', img: 'images/Final images/places/Image_fx(483).jpg' },
        { title: 'Place 24', img: 'images/Final images/places/Image_fx(484).jpg' },
        { title: 'Place 25', img: 'images/Final images/places/Image_fx(485).jpg' },
        { title: 'Place 26', img: 'images/Final images/places/Image_fx(486).jpg' },
        { title: 'Place 27', img: 'images/Final images/places/Image_fx(487).jpg' },
        { title: 'Place 28', img: 'images/Final images/places/Image_fx(488).jpg' },
        { title: 'Place 29', img: 'images/Final images/places/Image_fx(489).jpg' },
        { title: 'Place 30', img: 'images/Final images/places/Image_fx(490).jpg' },
        { title: 'Place 31', img: 'images/Final images/places/Image_fx(491).jpg' },
        { title: 'Place 32', img: 'images/Final images/places/Image_fx(492).jpg' },
        { title: 'Place 33', img: 'images/Final images/places/Image_fx(493).jpg' },
        { title: 'Place 34', img: 'images/Final images/places/Image_fx(494).jpg' },
        { title: 'Place 35', img: 'images/Final images/places/Image_fx(495).jpg' },
        { title: 'Place 36', img: 'images/Final images/places/Image_fx(496).jpg' },
        { title: 'Place 37', img: 'images/Final images/places/Image_fx(97).jpg' }
      ]
    },
    {
      name: 'Fruits',
      images: [
        { title: 'Fruit 1', img: 'images/Final images/fruits/Image_fx(105).jpg' },
        { title: 'Fruit 2', img: 'images/Final images/fruits/Image_fx(373).jpg' },
        { title: 'Fruit 3', img: 'images/Final images/fruits/Image_fx(374).jpg' },
        { title: 'Fruit 4', img: 'images/Final images/fruits/Image_fx(375).jpg' },
        { title: 'Fruit 5', img: 'images/Final images/fruits/Image_fx(376).jpg' },
        { title: 'Fruit 6', img: 'images/Final images/fruits/Image_fx(377).jpg' },
        { title: 'Fruit 7', img: 'images/Final images/fruits/Image_fx(378).jpg' },
        { title: 'Fruit 8', img: 'images/Final images/fruits/Image_fx(379).jpg' },
        { title: 'Fruit 9', img: 'images/Final images/fruits/Image_fx(380).jpg' },
        { title: 'Fruit 10', img: 'images/Final images/fruits/Image_fx(381).jpg' },
        { title: 'Fruit 11', img: 'images/Final images/fruits/Image_fx(382).jpg' },
        { title: 'Fruit 12', img: 'images/Final images/fruits/Image_fx(383).jpg' },
        { title: 'Fruit 13', img: 'images/Final images/fruits/Image_fx(384).jpg' },
        { title: 'Fruit 14', img: 'images/Final images/fruits/Image_fx(385).jpg' },
        { title: 'Fruit 15', img: 'images/Final images/fruits/Image_fx(386).jpg' },
        { title: 'Fruit 16', img: 'images/Final images/fruits/Image_fx(387).jpg' },
        { title: 'Fruit 17', img: 'images/Final images/fruits/Image_fx(388).jpg' }
      ]
    },
    {
      name: 'Plants',
      images: [
        { title: 'Plant 1', img: 'images/Final images/plants/Image_fx(100).jpg' },
        { title: 'Plant 2', img: 'images/Final images/plants/Image_fx(101).jpg' },
        { title: 'Plant 3', img: 'images/Final images/plants/Image_fx(102).jpg' },
        { title: 'Plant 4', img: 'images/Final images/plants/Image_fx(103).jpg' },
        { title: 'Plant 5', img: 'images/Final images/plants/Image_fx(410).jpg' },
        { title: 'Plant 6', img: 'images/Final images/plants/Image_fx(411).jpg' },
        { title: 'Plant 7', img: 'images/Final images/plants/Image_fx(412).jpg' },
        { title: 'Plant 8', img: 'images/Final images/plants/Image_fx(413).jpg' },
        { title: 'Plant 9', img: 'images/Final images/plants/Image_fx(414).jpg' },
        { title: 'Plant 10', img: 'images/Final images/plants/Image_fx(415).jpg' },
        { title: 'Plant 11', img: 'images/Final images/plants/Image_fx(416).jpg' },
        { title: 'Plant 12', img: 'images/Final images/plants/Image_fx(417).jpg' },
        { title: 'Plant 13', img: 'images/Final images/plants/Image_fx(418).jpg' },
        { title: 'Plant 14', img: 'images/Final images/plants/Image_fx(419).jpg' },
        { title: 'Plant 15', img: 'images/Final images/plants/Image_fx(420).jpg' },
        { title: 'Plant 16', img: 'images/Final images/plants/Image_fx(421).jpg' },
        { title: 'Plant 17', img: 'images/Final images/plants/Image_fx(422).jpg' },
        { title: 'Plant 18', img: 'images/Final images/plants/Image_fx(423).jpg' }
      ]
    },
    {
      name: 'Tools',
      images: [
        { title: 'Tool 1', img: 'images/Final images/tools/Image_fx(109).jpg' },
        { title: 'Tool 2', img: 'images/Final images/tools/Image_fx(112).jpg' },
        { title: 'Tool 3', img: 'images/Final images/tools/Image_fx(113).jpg' },
        { title: 'Tool 4', img: 'images/Final images/tools/Image_fx(127).jpg' },
        { title: 'Tool 5', img: 'images/Final images/tools/Image_fx(128).jpg' },
        { title: 'Tool 6', img: 'images/Final images/tools/Image_fx(129).jpg' },
        { title: 'Tool 7', img: 'images/Final images/tools/Image_fx(130).jpg' },
        { title: 'Tool 8', img: 'images/Final images/tools/Image_fx(131).jpg' },
        { title: 'Tool 9', img: 'images/Final images/tools/Image_fx(132).jpg' },
        { title: 'Tool 10', img: 'images/Final images/tools/Image_fx(133).jpg' },
        { title: 'Tool 11', img: 'images/Final images/tools/Image_fx(134).jpg' },
        { title: 'Tool 12', img: 'images/Final images/tools/Image_fx(142).jpg' },
        { title: 'Tool 13', img: 'images/Final images/tools/Image_fx(143).jpg' },
        { title: 'Tool 14', img: 'images/Final images/tools/Image_fx(144).jpg' },
        { title: 'Tool 15', img: 'images/Final images/tools/Image_fx(145).jpg' },
        { title: 'Tool 16', img: 'images/Final images/tools/Image_fx(146).jpg' },
        { title: 'Tool 17', img: 'images/Final images/tools/Image_fx(147).jpg' },
        { title: 'Tool 18', img: 'images/Final images/tools/Image_fx(158).jpg' }
      ]
    },
    {
      name: 'Transports',
      images: [
        { title: 'Transport 1', img: 'images/Final images/transports/Image_fx(110).jpg' },
        { title: 'Transport 2', img: 'images/Final images/transports/Image_fx(111).jpg' },
        { title: 'Transport 3', img: 'images/Final images/transports/Image_fx(116).jpg' },
        { title: 'Transport 4', img: 'images/Final images/transports/Image_fx(433).jpg' },
        { title: 'Transport 5', img: 'images/Final images/transports/Image_fx(434).jpg' },
        { title: 'Transport 6', img: 'images/Final images/transports/Image_fx(435).jpg' },
        { title: 'Transport 7', img: 'images/Final images/transports/Image_fx(457).jpg' },
        { title: 'Transport 8', img: 'images/Final images/transports/Image_fx(458).jpg' },
        { title: 'Transport 9', img: 'images/Final images/transports/Image_fx(459).jpg' },
        { title: 'Transport 10', img: 'images/Final images/transports/Image_fx(460).jpg' },
        { title: 'Transport 11', img: 'images/Final images/transports/Image_fx(461).jpg' },
        { title: 'Transport 12', img: 'images/Final images/transports/Image_fx(462).jpg' },
        { title: 'Transport 13', img: 'images/Final images/transports/Image_fx(463).jpg' },
        { title: 'Transport 14', img: 'images/Final images/transports/Image_fx(464).jpg' },
        { title: 'Transport 15', img: 'images/Final images/transports/Image_fx(465).jpg' },
        { title: 'Transport 16', img: 'images/Final images/transports/Image_fx(466).jpg' },
        { title: 'Transport 17', img: 'images/Final images/transports/Image_fx(467).jpg' },
        { title: 'Transport 18', img: 'images/Final images/transports/Image_fx(468).jpg' }
      ]
    },
    {
      name: 'Characters',
      images: [
        { title: 'Character 1', img: 'images/Final images/characters/Image_fx(115).jpg' },
        { title: 'Character 2', img: 'images/Final images/characters/Image_fx(157).jpg' },
        { title: 'Character 3', img: 'images/Final images/characters/Image_fx(180).jpg' },
        { title: 'Character 4', img: 'images/Final images/characters/Image_fx(184).jpg' },
        { title: 'Character 5', img: 'images/Final images/characters/Image_fx(185).jpg' },
        { title: 'Character 6', img: 'images/Final images/characters/Image_fx(498).jpg' },
        { title: 'Character 7', img: 'images/Final images/characters/Image_fx(499).jpg' },
        { title: 'Character 8', img: 'images/Final images/characters/Image_fx(500).jpg' },
        { title: 'Character 9', img: 'images/Final images/characters/Image_fx(501).jpg' },
        { title: 'Character 10', img: 'images/Final images/characters/Image_fx(502).jpg' },
        { title: 'Character 11', img: 'images/Final images/characters/Image_fx(503).jpg' },
        { title: 'Character 12', img: 'images/Final images/characters/Image_fx(504).jpg' },
        { title: 'Character 13', img: 'images/Final images/characters/Image_fx(505).jpg' },
        { title: 'Character 14', img: 'images/Final images/characters/Image_fx(506).jpg' },
        { title: 'Character 15', img: 'images/Final images/characters/Image_fx(507).jpg' },
        { title: 'Character 16', img: 'images/Final images/characters/Image_fx(508).jpg' },
        { title: 'Character 17', img: 'images/Final images/characters/Image_fx(509).jpg' },
        { title: 'Character 18', img: 'images/Final images/characters/Image_fx(511).jpg' },
        { title: 'Character 19', img: 'images/Final images/characters/Image_fx(512).jpg' },
        { title: 'Character 20', img: 'images/Final images/characters/Image_fx(513).jpg' },
        { title: 'Character 21', img: 'images/Final images/characters/Image_fx(514).jpg' },
        { title: 'Character 22', img: 'images/Final images/characters/Image_fx(515).jpg' },
        { title: 'Character 23', img: 'images/Final images/characters/Image_fx(516).jpg' },
        { title: 'Character 24', img: 'images/Final images/characters/Image_fx(517).jpg' },
        { title: 'Character 25', img: 'images/Final images/characters/Image_fx(518).jpg' },
        { title: 'Character 26', img: 'images/Final images/characters/Image_fx(519).jpg' },
        { title: 'Character 27', img: 'images/Final images/characters/Image_fx(520).jpg' },
        { title: 'Character 28', img: 'images/Final images/characters/Image_fx(521).jpg' },
        { title: 'Character 29', img: 'images/Final images/characters/Image_fx(522).jpg' },
        { title: 'Character 30', img: 'images/Final images/characters/Image_fx(523).jpg' },
        { title: 'Character 31', img: 'images/Final images/characters/Image_fx(524).jpg' },
        { title: 'Character 32', img: 'images/Final images/characters/Image_fx(525).jpg' },
        { title: 'Character 33', img: 'images/Final images/characters/Image_fx(526).jpg' },
        { title: 'Character 34', img: 'images/Final images/characters/Image_fx(527).jpg' }
      ]
    },
    {
      name: 'Food',
      images: [
        { title: 'Food 1', img: 'images/Final images/food/Image_fx(135).jpg' },
        { title: 'Food 2', img: 'images/Final images/food/Image_fx(136).jpg' },
        { title: 'Food 3', img: 'images/Final images/food/Image_fx(137).jpg' },
        { title: 'Food 4', img: 'images/Final images/food/Image_fx(138).jpg' },
        { title: 'Food 5', img: 'images/Final images/food/Image_fx(139).jpg' },
        { title: 'Food 6', img: 'images/Final images/food/Image_fx(140).jpg' },
        { title: 'Food 7', img: 'images/Final images/food/Image_fx(141).jpg' },
        { title: 'Food 8', img: 'images/Final images/food/Image_fx(151).jpg' },
        { title: 'Food 9', img: 'images/Final images/food/Image_fx(152).jpg' },
        { title: 'Food 10', img: 'images/Final images/food/Image_fx(153).jpg' },
        { title: 'Food 11', img: 'images/Final images/food/Image_fx(154).jpg' },
        { title: 'Food 12', img: 'images/Final images/food/Image_fx(155).jpg' },
        { title: 'Food 13', img: 'images/Final images/food/Image_fx(156).jpg' },
        { title: 'Food 14', img: 'images/Final images/food/Image_fx(389).jpg' },
        { title: 'Food 15', img: 'images/Final images/food/Image_fx(390).jpg' },
        { title: 'Food 16', img: 'images/Final images/food/Image_fx(391).jpg' },
        { title: 'Food 17', img: 'images/Final images/food/Image_fx(392).jpg' },
        { title: 'Food 18', img: 'images/Final images/food/Image_fx(393).jpg' },
        { title: 'Food 19', img: 'images/Final images/food/Image_fx(394).jpg' },
        { title: 'Food 20', img: 'images/Final images/food/Image_fx(395).jpg' },
        { title: 'Food 21', img: 'images/Final images/food/Image_fx(396).jpg' },
        { title: 'Food 22', img: 'images/Final images/food/Image_fx(397).jpg' },
        { title: 'Food 23', img: 'images/Final images/food/Image_fx(398).jpg' },
        { title: 'Food 24', img: 'images/Final images/food/Image_fx(399).jpg' },
        { title: 'Food 25', img: 'images/Final images/food/Image_fx(400).jpg' },
        { title: 'Food 26', img: 'images/Final images/food/Image_fx(401).jpg' },
        { title: 'Food 27', img: 'images/Final images/food/Image_fx(402).jpg' },
        { title: 'Food 28', img: 'images/Final images/food/Image_fx(403).jpg' },
        { title: 'Food 29', img: 'images/Final images/food/Image_fx(404).jpg' },
        { title: 'Food 30', img: 'images/Final images/food/Image_fx(405).jpg' },
        { title: 'Food 31', img: 'images/Final images/food/Image_fx(406).jpg' },
        { title: 'Food 32', img: 'images/Final images/food/Image_fx(407).jpg' },
        { title: 'Food 33', img: 'images/Final images/food/Image_fx(408).jpg' },
        { title: 'Food 34', img: 'images/Final images/food/Image_fx(409).jpg' }
      ]
    }
  ];

  ngOnInit(): void {}


  isImageSelected(imageUrl: string): boolean {
    return this.selectedImageUrl === imageUrl;
  }

  get totalImages(): number {
    return this.categories.reduce((sum, category) => sum + category.images.length, 0);
  }

  // Mouse drag scrolling methods
  onMouseDown(event: MouseEvent, scrollContainer: HTMLElement): void {
    this.isDragging = true;
    this.startX = event.pageX - scrollContainer.offsetLeft;
    this.scrollLeft = scrollContainer.scrollLeft;
    scrollContainer.style.cursor = 'grabbing';
    scrollContainer.style.userSelect = 'none';
  }

  onMouseLeave(scrollContainer: HTMLElement): void {
    this.isDragging = false;
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto';
  }

  onMouseUp(scrollContainer: HTMLElement): void {
    this.isDragging = false;
    scrollContainer.style.cursor = 'grab';
    scrollContainer.style.userSelect = 'auto';
  }

  onMouseMove(event: MouseEvent, scrollContainer: HTMLElement): void {
    if (!this.isDragging) return;
    event.preventDefault();
    const x = event.pageX - scrollContainer.offsetLeft;
    const walk = (x - this.startX) * 2;
    scrollContainer.scrollLeft = this.scrollLeft - walk;
  }
}