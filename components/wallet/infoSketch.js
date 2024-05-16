import Info from './Info';

export default function sketch(s) {
  s.setup = () => {
    s.createCanvas(200, 500);
    s.infoLayer = s.createGraphics(200, 500);
    s.initGraphics(s);
    s.initGraphics(s.infoLayer);
    s.info = new Info(s);
    s.placeImage();
    s.noLoop();
  }

  s.initGraphics = (g) => {
    g.colorMode(s.HSB, 360, 1, 1, 1);
    g.angleMode(s.DEGREES);
    g.noStroke();
    return g;
  }

  s.placeImage = () => {
    const parent = s.canvas.parentElement;
    const height = parent.clientHeight;
    const ratio = 500 / 200;
    const width = height / ratio;
    s.image(s.infoLayer, 0, 0, width, height);
  }

  s.windowResized = () => {
    if (!s.canvas?.parentElement) return;
    s.clear();
    s.placeImage();
  }

}
