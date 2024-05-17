import { categoryNames, shapeMap, tagNames, tagsLabelColor } from "./const";

export default class Info {
  constructor(s) {
    this.s = s;
    this.graphics = s.infoLayer;
    this.shapeRadius = 5;

    this.initDraw();
  }

  drawRound({ isStripped }) {
    const g = this.graphics;
    g.circle(0, 0, this.shapeRadius * 2);

    if (isStripped) {
      g.circle(0, 0, this.shapeRadius * 1.2);
      g.circle(0, 0, this.shapeRadius * .4);
    }
  }

  drawPolygon({type, sides, radius}) {
    const g = this.graphics;
    const points = [];

    for (let i = 0; i < sides; i++) {
      const angle = 360 / sides * i;
      const x = radius * this.s.cos(angle);
      const y = radius * this.s.sin(angle);
      points.push({ x, y });
    }

    g.beginShape();
    g.noFill();
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
      shape.isStripped = shapeMap[key].strip;

      g.push();
      g.translate(0, index * 20);

      g.text(categoryNames[shape.label], 10, 0);

      g.noFill();
      g.stroke(0);

      switch (shape.type) {
        case 'round':
          this.drawRound(shape);
          break;

        default:
          this.drawPolygon({ ...shape, radius: this.shapeRadius });
          if (shape.isStripped) {
            this.drawPolygon({ ...shape, radius: this.shapeRadius * .4 });
          }

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
      g.text(tagNames[key], 10, 0);
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
