import { STROKE_TYPES, SHAPE_TYPES } from './const';

export default {
  DRAW_SPEED: 3,
  COLOR_CHANCE: {
    '#0016B9': 1,
    '#da46a7': 1,
    '#20956b': 1,
  },
  SHAPE_CHANCE: {
    [SHAPE_TYPES.TRIANGLE]: 1,
    [SHAPE_TYPES.CIRCLE]: 1,
    [SHAPE_TYPES.SQUARE]: 1,
    [SHAPE_TYPES.OTHER_POLYGON]: 1,
  },
  STROKE_CHANCE: {
    [STROKE_TYPES.THIN]: 1,
    [STROKE_TYPES.MEDIUM]: 1,
    [STROKE_TYPES.THICK]: .5,
    [STROKE_TYPES.BLACK]: .2,
    [STROKE_TYPES.BRUSH]: .1,
  },
  PATH: {
    RANDOM_POSITION_FACTOR: Math.random(),
    STROKE_SIZE_RANGE: [.1, 1],
  },
};
