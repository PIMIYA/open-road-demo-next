import React from "react";
import { type Sketch } from "@p5-wrapper/react";
import { NextReactP5Wrapper } from "@p5-wrapper/next";
import { Box } from "@mui/material";

import { xx, chance, pick } from "./utils";
import svgData from './svgData';

const CONFIG = {
  DRAW_SPEED: .5,
}

const sketch: Sketch = (s) => {

  type Point = {
    position: {
      x: number;
      y: number;
    },
    type: 'PATH' | 'KEY_POINT';
  };

  const points: Point[] = [];

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
        if (i % 2 == 0) {
          return num + 10;
        } else {
          return num
        }
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
            type: 'KEY_POINT'
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
                type: 'KEY_POINT'
              });
            }
          }

          result.push({
            position: { x, y },
            type: 'PATH'
          });
        }

        startX = endX;
        startY = endY;
      }
    }

    result.push({
      position: { x: endX, y: endY },
      type: 'KEY_POINT'
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

    const keyPoints = points.filter(p => p.type == 'KEY_POINT');
    keyPoints.forEach((point, i) => {
      g.circle(point.position.x, point.position.y, 4);
      g.textSize(8);
      g.text(i + 1, point.position.x + s.random(5, 10), point.position.y + s.random(5, 10));
    });
  }

  s.setup = () => {
    s.createCanvas();
    s.windowResized();
    s.angleMode(s.DEGREES);
    s.canvas.style.position = "absolute";
    s.canvas.style.zIndex = -1;

    s.layer1 = s.createGraphics(1152, 2600);
    s.layer2 = s.createGraphics(1152, 2600);

    s.layer2.noStroke();
    s.layer2.angleMode(s.DEGREES);

    parseSVG();
    drawNumbers();
  }

  let randomPositionFactor = .8;
  let strokeSizeRange = [.1, 1];

  s.draw = () => {
    const g = s.layer1;
    const g2 = s.layer2;

    let isFinished = false;

    for (let i = 0; i < 60 * CONFIG.DRAW_SPEED; i++) {
      let point = points.shift();

      if (!point) {
        isFinished = true;
        break;
      }

      if (point.type == 'KEY_POINT') {
        let { x, y } = point.position;
        let size = s.random(8, 12);

        const shape = pick({
          'triangle': 1,
          'circle': 1,
          'square': 1,
          'other-polygon': 1,
        });

        const color = pick({
          '#0016B9': 1,
          '#da46a7': 1,
          '#20956b': 1,
        })

        g2.push();
          g2.fill(color);
          g2.translate(x, y);
          g2.rotate(s.random(360));

        switch (shape) {
          case 'triangle':
            size *= .8;
            g2.triangle(0, -size, -size * Math.sqrt(3) / 2, size / 2, size * Math.sqrt(3) / 2, size / 2);
            break;

          case 'circle':
            g2.circle(0, 0, size);
            break;

          case 'square':
            g2.rect(-size / 2, -size / 2, size, size);
            break;

          case 'other-polygon':
            size *= .6;
            const sides = ~~s.random(5, 9);

            g2.beginShape();
            for (let i = 0; i < sides; i++) {
              let angle = 360 / sides * i;
              let x = size * s.cos(angle);
              let y = size * s.sin(angle);
              g2.vertex(x, y);
            }
            g2.endShape(s.CLOSE);
            break;
        }

        g2.pop();

        return;
      }

      g.noFill();
      g.stroke(0, 0, 0, 10);

      for (let j = 0; j < 3; j++) {
        let {x, y} = point.position;
        if (randomPositionFactor) {
          x += s.random(-1, 1) * randomPositionFactor;
          y += s.random(-1, 1) * randomPositionFactor;
        }
        g.circle(x, y, s.random(...strokeSizeRange));
      }
    }

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
    const ratio = 1152 / 2600;
    const width = Math.min(1152, window.innerWidth);
    const height = width / ratio;

    s.resizeCanvas(width, height);
  }
};

export default () => {

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
      <NextReactP5Wrapper sketch={sketch} />
    </Box>
  );
}
