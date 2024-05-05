import Shape from './Shape';
import Path from './Path';
import Info from './Info';

export default function sketch(s) {
  let isStart = false;

  s.drawnShapeCount = 0;

  s.setup = () => {
    s.createCanvas();
    s.angleMode(s.DEGREES);
    s.colorMode(s.HSB, 360, 1, 1, 1);
    s.noStroke();
    s.resize();
    s.noLoop();

    setTimeout(() => {
      s.init();
    });
  }

  s.initGraphics = (graphics) => {
    graphics.colorMode(s.HSB, 360, 1, 1, 1);
    graphics.angleMode(s.DEGREES);
    graphics.noStroke();
    return graphics;
  }

  s.init = () => {
    if (s.isInited) return;

    s.randomSeed(s.seedCount);
    s.noiseSeed(s.seedCount);

    s.baseLayer = s.initGraphics(s.createGraphics(s.width, s.height));
    s.lineLayer = s.initGraphics(s.createGraphics(s.width, s.height));
    s.infoLayer = s.initGraphics(s.createGraphics(200, 250));

    s.layers = [
      s.baseLayer,
      s.lineLayer,
      s.infoLayer,
    ];

    s.isInited = true;
    s.shapes = [];

    s.shapes.push(new Shape({
      s,
      index: 0,
      position: {
        x: s.width * .5,
        y: s.height * .5,
      },
    }));

    s.path = new Path(s);
    s.info = new Info(s);

    s.bgColor = s.color(s.random(360), 0.01, .9);

    s.loop();
  }

  s.chance = (percent) => {
    return s.random(100) < percent;
  }

  s.draw = () => {
    if (!s.shapes) return;

    s.clear();
    s.baseLayer.clear();
    // s.lineLayer.clear();

    s.background(s.bgColor);
    s.shapes.forEach((shape) => {
      shape.draw();
    });
    s.path.draw();

    s.image(s.baseLayer, 0, 0, s.width, s.height);
    s.image(s.lineLayer, 0, 0, s.width, s.height);
    s.image(s.infoLayer, 0, s.height - s.infoLayer.height, s.infoLayer.width, s.infoLayer.height);

    if (s.drawnShapeCount == s.tokens.length) {
      s.noLoop();
    }
  }

  s.windowResized = () => {
    s.resize();
  }

  s.stringToSeed = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      let char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash;
  }

  s.updateWithProps = (props) => {
    if (!props.tokens?.length) return;

    s.seedCount = s.stringToSeed(props.walletAddress);
    s.distanceScale = s.getDistanceScale(props.tokens);

    if (!isStart) {
      isStart = true;
      s.tokens = props.tokens;
    } else {
      s.tokens = props.tokens;
      s.isInited = false;
      s.init();
    }
  }

  s.getDistanceScale = (tokens) => {
    const points = tokens.map((token) => (s.createVector(token.lat, token.lan)));

    let minX, minY, maxX, maxY;
    points.forEach((point) => {
      if (minX == null || point.x < minX) minX = point.x;
      if (minY == null || point.y < minY) minY = point.y;
      if (maxX == null || point.x > maxX) maxX = point.x;
      if (maxY == null || point.y > maxY) maxY = point.y;
    });

    return 1 / s.dist(minX, minY, maxX, maxY) * 300;
  }

  s.resize = () => {
    if (!s.canvas?.parentElement) return;

    const ratio = .6;
    const width = s.canvas.parentElement.clientWidth;
    const height = width * ratio;
    s.resizeCanvas(width, height);
  }
}
