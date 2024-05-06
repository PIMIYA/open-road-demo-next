import { hueMap, shapeMap } from "./const";

export default class Shape {
  constructor(options) {
    this.s = options.s;

    this.index = options.index;
    this.token = this.s.tokens[this.index];
    this.title = this.token.title;
    this.nextToken = this.s.tokens[this.index + 1];
    this.distanceToNext = this.getDistanceToNext();
    this.cliamedPercentage = this.token.cliamedPercentage;

    this.type = shapeMap[this.token.categoryId].type;

    this.sides = shapeMap[this.token.categoryId].sides;

    this.hue = this.token.tags.map(tag => hueMap[tag.main]).reduce((acc, cur) => acc + cur, 0) / this.token.tags.length;
    this.radius = this.token.totalAmount * .5;
    this.rotate = options.s.random(360);
    this.nextAngle = options.nextAngle || options.s.random(360);
    this.position = options.s.createVector(options.position.x, options.position.y);

    this.frameCount = 0;
    this.padding = 20;

    this.initGraphics();
    this.drawCenter();
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

    return s.dist(lat, lan, nextLat, nextLan) * s.distanceScale;
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
      this.startAngle = this.s.random(360);
    }

    let angle = this.startAngle + this.frameCount;
    let x = this.radius * s.cos(angle);
    let y = this.radius * s.sin(angle);

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
    if (this.endPoints == null) {
      this.endPoints = [];
      this.isDrawFromCenter = true;
      const startAngle = this.s.random(360);
      for (let i = 0; i < this.sides; i++) {
        const angle = 360 / this.sides * i + startAngle;
        const x = this.radius * this.s.cos(angle);
        const y = this.radius * this.s.sin(angle);
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

    const g = this.graphics;
    let { x: startX, y: startY } = this.startPoint;
    let { x: endX, y: endY } = this.endPoint;
    let { x: targetX, y: targetY } = this.nextPoint;

    endX = g.lerp(endX, targetX, (this.frameCount % 100) / 100);
    endY = g.lerp(endY, targetY, (this.frameCount % 100) / 100);

    g.push();
      g.translate(g.width / 2, g.height / 2);
      this.drawLine(startX, startY, endX, endY);
    g.pop();

    if (Math.floor(this.frameCount / 100) > this.drawnPoints.length) {
      this.drawnPoints.push(this.nextPoint);
      this.endPoint = this.nextPoint;
      this.nextPoint = this.endPoints.shift();

      if (!this.nextPoint) {
        this.isNodeDrawn = true;
        this.stop();
      }
    }
  }

  drawLine(startX, startY, endX, endY) {
    const s = this.s;
    const g = this.graphics;

    const alphaBase = s.map(s.noise(this.frameCount * .01), 0, 1, 1, 5);

    for(let i = 0; i < 100; i+=.5) {
      let size = 1.2;
      let alpha = g.map(i, 100, 0, .1, .01) * alphaBase;
      let sat = g.map(s.noise(i * .01), 0, 1, .5, 1);
      let bri = 1 - sat * .3;

      if (s.chance(10)) {
        sat = 1;
        bri *= .9;
        alpha *= 2;
      }

      if (i >= 99) {
        // alpha *= 2;
        size = s.noise(this.frameCount * .1) * 5;
      }

      size *= .8;

      g.fill(this.hue, sat, bri, alpha);
      const x = g.lerp(startX, endX, i / 100);
      const y = g.lerp(startY, endY, i / 100);
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
      this.nextAngle += s.random(-1, 1) * 90;
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
  }
}
