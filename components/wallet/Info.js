import { shapeMap, tagsLabelColor } from "./const";

export default class Info {
  constructor(s) {
    this.s = s;
    this.graphics = s.infoLayer;
    this.shapeRadius = 5;

    this.initDraw();
  }

  drawRound() {
    const g = this.graphics;
    g.circle(0, 0, this.shapeRadius * 2);
  }

  drawPolygon(sides) {
    const g = this.graphics;
    const angle = 360 / sides;
    const radius = this.shapeRadius;
    const points = [];

    for (let i = 0; i < sides; i++) {
      const x = radius * this.s.cos(angle * i);
      const y = radius * this.s.sin(angle * i);
      points.push({ x, y });
    }

    g.beginShape();
    points.forEach((point, index) => {
      const nextPoint = points[index + 1] || points[0];
      g.vertex(point.x, point.y);
      g.vertex(nextPoint.x, nextPoint.y);
    });
    g.endShape();
  }

  drawCategories() {
    const g = this.graphics;
    g.push();
    g.translate(this.shapeRadius, 0);

    Object.entries(shapeMap).forEach(([key, shape], index) => {
      g.push();
      g.translate(0, index * 20);

      g.text(shape.label, 10, 0);

      g.noFill();
      g.stroke(0);

      switch (shape.type) {
        case 'round':
          this.drawRound();
          break;

        default:
          this.drawPolygon(shape.sides);
          break;
      }

      g.pop();
    });

    g.pop();
  }

  drawTags() {
    const g = this.graphics;

    g.push();
    g.translate(this.shapeRadius, 0);

    Object.entries(tagsLabelColor).forEach(([key, hex], index) => {
      g.push();
      g.translate(0, index * 20 + 20);

      g.fill(hex);
      g.text(key, 10, 0);
      g.circle(0, 0, this.shapeRadius * 2);

      g.pop();
    });

    g.pop();
  }

  initDraw() {
    const g = this.graphics;

    g.textAlign(g.LEFT, g.CENTER);
    g.textSize(12);
    g.fill(0);

    g.push();
      g.translate(20, 20);

      g.push();
        g.textStyle(g.BOLD);
        g.text('Categories (shape)', 0, 0);
      g.pop();
      g.translate(0, 20);
      this.drawCategories();
      g.translate(0, 20 * Object.keys(shapeMap).length);

      g.translate(0, 20); // margin

      g.push();
        g.textStyle(g.BOLD);
        g.text('Tags (hue)', 0, 0);
      g.pop();
      this.drawTags();
    g.pop();
  }
}
