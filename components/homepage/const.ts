export const enum POINT_TYPES {
  KEY_POINT = 'KEY_POINT',
  PATH = 'PATH',
}

export type Point = {
  position: {
    x: number;
    y: number;
  },
  type: POINT_TYPES.PATH | POINT_TYPES.KEY_POINT;
};
