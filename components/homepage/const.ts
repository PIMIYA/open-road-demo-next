export const enum POINT_TYPES {
  KEY_POINT = 'KEY_POINT',
  PATH = 'PATH',
};

export const enum STROKE_TYPES {
  THIN = 'thin',
  MEDIUM = 'medium',
  THICK = 'thick',
  BLACK = 'black',
  BRUSH = 'brush',
};

export const enum SHAPE_TYPES {
  TRIANGLE = 'triangle',
  CIRCLE = 'circle',
  SQUARE = 'square',
  OTHER_POLYGON = 'other-polygon',
};

export type Point = {
  position: {
    x: number;
    y: number;
  },
  type: POINT_TYPES.PATH | POINT_TYPES.KEY_POINT;
};
