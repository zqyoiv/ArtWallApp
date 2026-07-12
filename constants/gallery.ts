import { ImageSourcePropType } from 'react-native';

export type GalleryArtwork = {
  id: string;
  artist: string;
  year: string;
  title: string;
  medium: string;
  dimensionsIn: string;
  image: ImageSourcePropType;
};

/** Love to Hate test gallery — mirrors assets/test-gallery/love-to-hate.csv */
export const GALLERY_ARTWORKS: GalleryArtwork[] = [
  {
    id: 'pedro-pedro-blue-cheese',
    artist: 'Pedro Pedro',
    year: '2026',
    title: 'Blue Cheese',
    medium: 'Acrylic and textile paint on linen',
    dimensionsIn: '30 x 24 in',
    image: require('../assets/test-gallery/pedro_pedro-blue_cheese.png'),
  },
  {
    id: 'tania-alvarez-pool',
    artist: 'Tania Alvarez',
    year: '2025',
    title: 'Pool',
    medium: 'Acrylic and oil on beveled panel',
    dimensionsIn: '12 x 12 x 2 in',
    image: require('../assets/test-gallery/tania_alvarez-pool.png'),
  },
  {
    id: 'tj-rinoski-deep-end',
    artist: 'TJ Rinoski',
    year: '2023',
    title: 'Deep End',
    medium: 'Oil on canvas',
    dimensionsIn: '54 x 72 in',
    image: require('../assets/test-gallery/tj-rinoski_deep-end.png'),
  },
  {
    id: 'jake-sheiner-ipickle',
    artist: 'Jake Sheiner',
    year: '2026',
    title: 'iPickle, South Pasadena',
    medium: 'Oil on canvas',
    dimensionsIn: '48 x 36 in',
    image: require('../assets/test-gallery/jake-sheiner_ipickle.png'),
  },
  {
    id: 'avery-wheless-last-call',
    artist: 'Avery Wheless',
    year: '2026',
    title: 'Last Call',
    medium: 'Oil on canvas',
    dimensionsIn: '54 x 42 in',
    image: require('../assets/test-gallery/avery-wheless_last-call.png'),
  },
  {
    id: 'austin-hayman-nothing-to-wear',
    artist: 'Austin Hayman',
    year: '2026',
    title: 'Nothing To Wear (The Chair) II',
    medium: 'Oil on canvas',
    dimensionsIn: '44 x 44 in',
    image: require('../assets/test-gallery/austin-hayman_nothing-to-wear.png'),
  },
  {
    id: 'ari-salka-the-work-of-ambivalence',
    artist: 'Ari Salka',
    year: '2026',
    title: 'The Work of Ambivalence',
    medium: 'Raw pigment, dye, acrylic, chalk and oil on linen',
    dimensionsIn: '50 x 60 in',
    image: require('../assets/test-gallery/ari-salka_the-work-of-ambivalence.png'),
  },
];
