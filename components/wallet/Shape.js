import { hueMap, shapeMap } from "./const";

export default class Shape {
  constructor(options) {
    this.s = options.s;

    this.index = options.index;
    this.token = this.s.tokens[this.index];
    this.title = this.token.title;
    this.nextToken = this.s.tokens[this.index + 1];
    this.distanceToNext = this.getDistanceToNext();

    this.type = shapeMap[this.token.categoryId].type;
    this.sides = shapeMap[this.token.categoryId].sides;
    this.isStripped = shapeMap[this.token.categoryId].strip;

    this.hue = this.getHue();
    this.radius = this.s.random(25, 50);
    this.rotate = options.s.random(360);
    this.nextAngle = options.nextAngle || options.s.random(360);
    this.position = options.s.createVector(options.position.x, options.position.y);
    this.stripWidth = ~~(this.radius / 4);

    this.frameCount = 0;
    this.padding = 20;
    this.framesForOneSide = ~~this.s.random(100, 110);

    this.initGraphics();
    this.drawCenter();
  }

  updateHue() {
    this.hueIndex++;
    this.hue = this.getHue();
  }

  getHue() {
    if (this.hueIndex == null) {
      this.hueIndex = 0;
    }
    const randomTag = this.token.tags[this.hueIndex % this.token.tags.length];
    return hueMap[randomTag];
  }

  drawCenter() {
    const g = this.s.lineLayer;
    g.push();
    g.translate(this.position.x, this.position.y);
    g.fill(0);
    g.circle(0, 0, 5);
    g.pop();
  }

  initGraphics() {
    const s = this.s;
    const g = s.createGraphics(this.radius * 2 + this.padding * 2, this.radius * 2 + this.padding * 2);

    g.colorMode(s.HSB, 360, 1, 1, 1);
    g.angleMode(s.DEGREES);
    g.noStroke();
    // g.background(0, 1, 1, .3);

    this.graphics = g;
  }

  getDistanceToNext() {
    if (!this.nextToken) return 0;

    const {lat, lan} = this.token;
    const {lat: nextLat, lan: nextLan} = this.nextToken;
    const s = this.s;
    let dist = s.dist(lat, lan, nextLat, nextLan);

    if (!s.distanceScale) {
      return 100;
    }

    if (dist == 0) {
      dist = s.random(5, 30);
    }

    return dist * s.distanceScale;
  }

  activate() {
    this.isActive = true;
  }

  drawNode() {
    if (this.isNodeDrawn) return;
    if (!this.isActive) return;

    switch (this.type) {
      case 'round':
        this.drawRound();
        break;

      default:
        this.drawPolygon();
        break;
    }
  }

  drawRound() {
    const s = this.s;
    const g = this.graphics;
    if (this.startAngle == null) {
      this.startAngle = s.random(360);
    }

    const angle = this.startAngle + this.frameCount;
    const x = this.radius * s.cos(angle);
    const y = this.radius * s.sin(angle);

    if (this.frameCount >= 360) {
      this.isNodeDrawn = true;
      this.stop();
      return;
    }

    g.push();
    g.translate(g.width / 2, g.height / 2);
    this.drawLine(0, 0, x, y);
    g.pop();
  }

  drawPolygon() {
    const s = this.s;

    if (this.endPoints == null) {
      this.endPoints = [];
      this.isDrawFromCenter = true;

      let startAngle = s.random(360);

      for (let i = 0; i < this.sides; i++) {
        let angle = 360 / this.sides * i + startAngle;
        let x = this.radius * s.cos(angle);
        let y = this.radius * s.sin(angle);
        this.endPoints.push({ x, y });
      }

      this.endPoints.push(this.endPoints[0]);

      if (this.isDrawFromCenter) {
        this.startPoint = { x: 0, y: 0 };
      } else {
        this.startPoint = this.endPoints[0];
      }

      this.endPoint = this.endPoints.shift();
      this.nextPoint = this.endPoints.shift();

      this.drawnPoints = [];
    }

    if (Math.floor(this.frameCount / this.framesForOneSide) > this.drawnPoints.length) {
      this.drawnPoints.push(this.nextPoint);
      this.endPoint = this.nextPoint;
      this.nextPoint = this.endPoints.shift();

      if (!this.nextPoint) {
        this.isNodeDrawn = true;
        this.stop();
        return;
      }
    }

    const g = this.graphics;
    let { x: startX, y: startY } = this.startPoint;
    let { x: endX, y: endY } = this.endPoint;
    let { x: targetX, y: targetY } = this.nextPoint;

    endX = g.lerp(endX, targetX, (this.frameCount % this.framesForOneSide) / this.framesForOneSide);
    endY = g.lerp(endY, targetY, (this.frameCount % this.framesForOneSide) / this.framesForOneSide);

    g.push();
      g.translate(g.width / 2, g.height / 2);
      this.drawLine(startX, startY, endX, endY);
    g.pop();
  }

  drawLine(startX, startY, endX, endY) {
    const s = this.s;
    const g = this.graphics;

    const alphaBase = s.map(s.noise(this.frameCount * .01), 0, 1, 1, 1.5);

    for(let i = 0; i < 100; i+=.7) {
      let progress = i / 100;
      let isLast = i >= 99;
      let size = 2;
      let sat = .8;
      let bri = .9;

      if (!isLast && s.chance(10)) {
        continue;
      }

      if (this.isStripped) {
        if (~~(i / this.stripWidth) % 2 == 0) continue;
      }

      let x = g.lerp(startX, endX, progress);
      let y = g.lerp(startY, endY, progress);
      let alpha = g.map(progress, 1, 0, .1, .01) * alphaBase;

      if (isLast) {
        size *= 1 + s.noise(x * .08, y * .08) * 2;
        alpha *= 2;
      }

      if (this.isPolygon) {
        size *= .8;
      }

      if (s.chance(5)) {
        sat = 1;
        bri *= .9;
        alpha = s.random(.5, .8) * .1;
        size = s.random(1.5, 2) * 1;
      }

      g.fill(this.hue, sat, bri, alpha);
      g.circle(x, y, size);
    }
  }

  drawCircle() {
    const s = this.s;
    const radius = this.distanceToNext;

    s.push();
      s.stroke(this.hue, 1, .8, .05);
      s.fill(this.hue, 1, .3, .01);
      s.translate(this.position.x, this.position.y);
      s.circle(0, 0, radius * 2);
    s.pop();
  }

  createNextShape() {
    if (this.isNextShapeBuilt) return;

    const s = this.s;
    const radius = this.distanceToNext;
    let x, y;

    do {
      switch (s.moveMode) {
        case 'Freedraw':
          this.nextAngle += s.random(-1, 1) * 180;
          break;

        case 'Smooth':
          this.nextAngle += s.random(-1, 1) * 60;
          break;

        case 'Clockwise':
          this.nextAngle += s.random(.8, 1) * 60;
          break;

        default:
          break;
      }

      x = this.position.x + s.cos(this.nextAngle) * radius;
      y = this.position.y + s.sin(this.nextAngle) * radius;
    } while (x < s.baseWidth * .1 || x > s.baseWidth * .9 || y < s.baseHeight * .1 || y > s.baseHeight * .9);

    this.nextShape = new Shape({
      s,
      index: this.index + 1,
      nextAngle: this.nextAngle,
      position: {
        x,
        y,
      },
    });
    s.shapes.push(this.nextShape);

    this.isNextShapeBuilt = true;
  }

  drawIndex() {
    if (this.isIndexDrawn) return;
    this.isIndexDrawn = true;

    const g = this.s.lineLayer;

    g.push();
      g.translate(this.position.x, this.position.y);
      g.stroke(0);
      g.textSize(13);
      g.text(this.index + 1, 10, 10);
      g.text(this.index + 1, 10, 10);
    g.pop();
  }

  stop() {
    this.isStopped = true;
    this.s.drawnShapeCount++;
  }

  placeImage() {
    const s = this.s;
    const g = this.graphics;

    s.baseLayer.image(g, this.position.x - g.width / 2, this.position.y - g.height / 2)
  }

  removeGraphics() {
    this.graphics.remove();
  }

  draw() {
    this.placeImage();
    if (this.isStopped) return;

    this.drawNode();

    if (this.nextToken && this.isShapeBuilt) {
      // this.drawCircle();
      this.createNextShape();
    }

    this.drawIndex();

    if (this.isActive) {
      this.frameCount++;
    }
    this.isShapeBuilt = true;

    if (this.frameCount % this.framesForOneSide == 0) {
      this.updateHue();
    }
  }

  get isRound() {
    return this.type === 'round';
  }

  get isPolygon() {
    return this.type === 'polygon';
  }
}
