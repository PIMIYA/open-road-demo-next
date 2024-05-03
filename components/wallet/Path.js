export default class Path {
  constructor(s) {
    this.s = s;
    this.shapes = s.shapes;
    this.frameSpeed = 3;
    this.frameCount = -this.frameSpeed;
    this.currentTargetIndex = 1;
    this.isOnlyTwoPoints = this.s.tokens.length == 2;

    this.shapes[0].activate();
  }

  stop() {
    this.isStopped = true;
  }

  resetDrawingPoints() {
    const s = this.s;

    this.prevPoint = this.shapes[this.currentTargetIndex - 2]?.position.copy();
    this.point = this.shapes[this.currentTargetIndex - 1].position.copy();
    this.nextPoint = this.shapes[this.currentTargetIndex].position.copy();
    this.afterPoint = this.shapes[this.currentTargetIndex + 1]?.position.copy();

    this.control1 = this.point.copy();
    this.control2 = this.nextPoint.copy();

    this.speed = this.point.dist(this.nextPoint) / 2;
    this.speed = Math.max(this.speed, 80);

    if (this.isOnlyTwoPoints) {
      return;
    }

    if (!this.prevPoint) {
      // it's start point
      // modify this.control1
      const angleFromAfterToPoint = this.afterPoint.copy().sub(this.nextPoint).heading();
      const angle = angleFromAfterToPoint + 90;

      // projection distance
      const distanceToNextPoint = this.point.dist(this.nextPoint);
      const distance = distanceToNextPoint * s.cos(angle);
      this.control1.x += s.cos(angle) * distance;
      this.control1.y += s.sin(angle) * distance;
    } else {
      // modify this.control1
      const nextToPrev = this.nextPoint.copy().sub(this.prevPoint);
      this.control1.add(nextToPrev.mult(.2));
    }

    if (this.afterPoint) {
      // modify this.control2
      const afterToPoint = this.afterPoint.copy().sub(this.point);
      this.control2.sub(afterToPoint.mult(.2));
    } else {
      // it's end point
      // modify this.control2
      const angleFromNextToPrev = this.nextPoint.copy().sub(this.prevPoint).heading();
      const angle = angleFromNextToPrev + 90;

      // projection distance
      const distanceToNextPoint = this.point.dist(this.nextPoint);
      const distance = distanceToNextPoint * s.cos(angle);
      this.control2.x += s.cos(angle) * distance;
      this.control2.y += s.sin(angle) * distance;
    }
  }

  draw() {
    const s = this.s;
    this.frameCount += this.frameSpeed;

    if (this.isStopped) return;
    if (this.isOnlyTwoPoints) {
      if (this.shapes.length < 2) return;
    } else {
      if (this.shapes.length < 3) return;
    }

    if (!this.point) {
      this.resetDrawingPoints();
    }

    for (let i = 0; i < this.frameSpeed; i++) {
      const frameCount = this.frameCount + i;
      const progress = frameCount / this.speed;

      const g = s.lineLayer;
      const lerpX = s.bezierPoint(this.point.x, this.control1.x, this.control2.x, this.nextPoint.x, progress);
      const lerpY = s.bezierPoint(this.point.y, this.control1.y, this.control2.y, this.nextPoint.y, progress);
      const lerp = s.createVector(lerpX, lerpY);

      let isInRange = true;

      if (progress < .5 && lerp.dist(this.point) < 5) {
        isInRange = false;
      }
      if (progress > .5 && lerp.dist(this.nextPoint) < 5) {
        isInRange = false;
      }

      if (isInRange) {
        for (let i = 0; i < 10; i++) {
          const size = s.noise(frameCount * 0.05, i) * 3 + .8;
          g.fill(0, 0, .1, s.random(.05, 1));
          g.circle(lerpX + s.random(size), lerpY + s.random(size), 1);
        }
      }

      if (progress > 1) {
        this.shapes[this.currentTargetIndex].activate();
        this.currentTargetIndex++;
        this.frameCount = 0;

        if (this.currentTargetIndex >= this.shapes.length) {
          return this.stop();
        }

        this.resetDrawingPoints();
        break;
      }
    }

  }
}
