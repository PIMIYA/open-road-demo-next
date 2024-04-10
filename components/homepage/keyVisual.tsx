import { useTheme } from "@mui/material/styles";
import { type Sketch } from "@p5-wrapper/react";
import { NextReactP5Wrapper } from "@p5-wrapper/next";
import { Box } from "@mui/material";

import { type Point, POINT_TYPES } from "./const";
import { xx, chance, pick } from "./utils";
import svgData from './svgData';

import CONFIG from './config';

const sketch: Sketch = (s) => {
  const points: Point[] = [];
  const originalSize = [1152, 2130];

  let isFinished = false;

  function getSvgPoints(d: string, isDev = false) {
    const result: Point[] = [];
    const g = s.layer1;

    let commands = d.split(/(?=[MLCQ])/); // M means Move, L means Line, C means Cubic Bezier, Q means Quadratic Bezier
    let startX, startY, control1X, control1Y, control2X, control2Y, endX, endY;

    if (isDev) {
      g.noFill();
      g.beginShape();
    }

    for (let cmd of commands) {
      let type = cmd[0];
      let nums = cmd.slice(1).split(/[\s,]+/).map(Number);

      nums = nums.map((num, i) => {
        num *= .95;
        num += 30;
        return num;
      });

      if (type == 'M') {
        startX = nums[0];
        startY = nums[1];

        isDev && g.vertex(startX, startY);

        let isStored = false;
        if (result.length > 0) {
          const positions = result.map(p => `${p.position.x},${p.position.y}`);
          const current = `${startX},${startY}`;
          isStored = positions.includes(current);
        }

        if (!isStored) {
          result.push({
            position: { x: startX, y: startY },
            type: POINT_TYPES.KEY_POINT
          });
        }
      } else if (type == 'C') {
        control1X = nums[0];
        control1Y = nums[1];
        control2X = nums[2];
        control2Y = nums[3];
        endX = nums[4];
        endY = nums[5];
        isDev && g.bezierVertex(control1X, control1Y, control2X, control2Y, endX, endY);

        let tStep = 0.002;

        for (let t = 0; t <= 1; t += tStep) {
          let x = g.bezierPoint(startX, control1X, control2X, endX, t);
          let y = g.bezierPoint(startY, control1Y, control2Y, endY, t);

          if (t == 0) {
            const positions = result.map(p => `${p.position.x},${p.position.y}`);
            const current = `${x},${y}`;

            if (!positions.includes(current)) {
              result.push({
                position: { x, y },
                type: POINT_TYPES.KEY_POINT
              });
            }
          }

          result.push({
            position: { x, y },
            type: POINT_TYPES.PATH
          });
        }

        startX = endX;
        startY = endY;
      }
    }

    result.push({
      position: { x: endX as number, y: endY as number },
      type: POINT_TYPES.KEY_POINT
    });

    isDev && g.endShape();

    return result;
  }

  function parseSVG() {
    let parser = new DOMParser();
    let doc = parser.parseFromString(svgData, "image/svg+xml");
    let paths = doc.querySelectorAll('path');

    paths.forEach((path) => {
      let d = path.getAttribute('d');

      if (d) {
        points.push(...getSvgPoints(d));
      }
    });
  }

  function drawNumbers() {
    const g = s.layer1;

    g.noFill();
    g.noStroke();
    g.beginShape();
    g.fill('#000');

    const keyPoints = points.filter(p => p.type == POINT_TYPES.KEY_POINT);
    keyPoints.forEach((point, i) => {
      g.circle(point.position.x, point.position.y, 4);
      g.textSize(8);
      g.text(i + 1, point.position.x + s.random(5, 10), point.position.y + s.random(5, 10));
    });
  }

  function drawKeyPoint(point: Point, g: any) {
    let { x, y } = point.position;
    let size = +pick({
      [s.random(4, 8)]: 1,
      [s.random(8, 12)]: 2,
      [s.random(12, 20)]: .3,
      [s.random(20, 30)]: .1,
    });

    const shape = pick(CONFIG.SHAPE_CHANCE);
    const color = pick(CONFIG.COLOR_CHANCE);

    g.push();
    g.fill(color);
    g.translate(x, y);
    g.rotate(s.random(360));

    switch (shape) {
      case 'triangle':
        size *= .8;
        g.triangle(0, -size, -size * Math.sqrt(3) / 2, size / 2, size * Math.sqrt(3) / 2, size / 2);
        break;

      case 'circle':
        g.circle(0, 0, size);
        break;

      case 'square':
        g.rect(-size / 2, -size / 2, size, size);
        break;

      case 'other-polygon':
        size *= .6;
        const sides = ~~s.random(5, 9);

        g.beginShape();
        for (let i = 0; i < sides; i++) {
          let angle = 360 / sides * i;
          let x = size * s.cos(angle);
          let y = size * s.sin(angle);
          g.vertex(x, y);
        }
        g.endShape(s.CLOSE);
        break;
    }

    g.pop();
  }

  function drawPoints() {
    const g = s.layer1;
    const g2 = s.layer2;

    for (let i = 0; i < 60 * CONFIG.DRAW_SPEED; i++) {
      let point = points.shift();

      if (!point) {
        isFinished = true;
        break;
      }

      if (point.type == POINT_TYPES.KEY_POINT) {
        drawKeyPoint(point, g2);
        return;
      }

      g.noFill();
      g.stroke(0, 0, 0, 10);

      for (let j = 0; j < 3; j++) {
        let { x, y } = point.position;
        if (CONFIG.PATH.RANDOM_POSITION_FACTOR) {
          x += s.random(-1, 1) * CONFIG.PATH.RANDOM_POSITION_FACTOR;
          y += s.random(-1, 1) * CONFIG.PATH.RANDOM_POSITION_FACTOR;
        }
        g.circle(x, y, s.random(...CONFIG.PATH.STROKE_SIZE_RANGE));
      }
    }
  }

  s.setup = () => {
    s.createCanvas();
    s.windowResized();
    s.angleMode(s.DEGREES);

    s.layer1 = s.createGraphics(...originalSize);
    s.layer2 = s.createGraphics(...originalSize);

    s.layer2.noStroke();
    s.layer2.angleMode(s.DEGREES);

    parseSVG();
    drawNumbers();
  }

  s.draw = () => {
    const g = s.layer1;
    const g2 = s.layer2;

    drawPoints();
    s.clear();
    s.image(g, 0, 0, s.width, s.height);

    s.image(g2, 0, 0, s.width, s.height);
    s.image(g2, 1, 1, s.width, s.height);
    s.image(g2, 1, 0, s.width, s.height);
    s.image(g2, 0, 1, s.width, s.height);

    if (isFinished) {
      s.noLoop();
    }
  };

  s.windowResized = () => {
    const ratio = originalSize[0] / originalSize[1];
    const width = Math.min(originalSize[0], window.innerWidth);
    const height = width / ratio;

    s.resizeCanvas(width, height);
  }
};

export default () => {

  const theme = useTheme();

  return (
    <Box
      sx={{
        pb: {
          xs: '20vh',
          sm: '40vh',
          md: '45vh',
        },
      }}
    >
      <Box sx={{
        position: 'absolute',
        zIndex: (theme.zIndex as any).keyVisual,
      }}>
        <NextReactP5Wrapper sketch={sketch} />
      </Box>
    </Box>
  );
}
