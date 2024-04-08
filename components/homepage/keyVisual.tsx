import React from "react";
import { type Sketch } from "@p5-wrapper/react";
import { NextReactP5Wrapper } from "@p5-wrapper/next";
import { Box } from "@mui/material";

import { xx, chance, pick } from "./utils";
import svgData from './svgData';

const CONFIG = {
  DRAW_SPEED: 1,
}

const sketch: Sketch = (s) => {

  type Point = {
    position: {
      x: number;
      y: number;
    },
    type: 'NORMAL' | 'KEY_POINT';
  }

  const points: Point[] = [];

  function drawBezierFromSVG(d: string) {
    let commands = d.split(/(?=[MLCQ])/); // M means Move, L means Line, C means Cubic Bezier, Q means Quadratic Bezier

    const g = s.layer1;

    g.noFill();
    g.noStroke();
    g.beginShape();

    let startX, startY, control1X, control1Y, control2X, control2Y, endX, endY;

    let lineCount = 0;

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
        g.vertex(startX, startY);


        g.push();
          let isStored = false;
          if (points.length > 0) {
            const positions = points.map(p => `${p.position.x},${p.position.y}`);
            const current = `${startX},${startY}`;
            isStored = positions.includes(current);
          }

          if (!isStored) {
            lineCount++;
            points.push({
              position: { x: startX, y: startY },
              type: 'KEY_POINT'
            });

            g.fill('#000');
            g.circle(startX, startY, 4);
            g.text(lineCount, startX + s.random(10, 30), startY + s.random(10, 30));
          }
        g.pop();
      } else if (type == 'C') {
        control1X = nums[0];
        control1Y = nums[1];
        control2X = nums[2];
        control2Y = nums[3];
        endX = nums[4];
        endY = nums[5];
        g.bezierVertex(control1X, control1Y, control2X, control2Y, endX, endY);

        g.push();
          g.fill('#000');
          let tStep = 0.001;

          for (let t = 0; t <= 1; t += tStep) {
            let x = g.bezierPoint(startX, control1X, control2X, endX, t);
            let y = g.bezierPoint(startY, control1Y, control2Y, endY, t);

            points.push({
              position: { x, y },
              type: 'NORMAL'
            });

            if (t == 0 || t == 1) {
              if (chance(10)) {
                g.push();
                g.fill('#ccc');
                  g.circle(x + s.random(-100, 100), y + s.random(-100, 100), s.random(10, 20));
                g.pop();
              }
            }
          }
        g.pop();

        startX = endX;
        startY = endY;
      }
    }
    g.endShape();
  }

  function parseSVG() {
    let parser = new DOMParser();
    let doc = parser.parseFromString(svgData, "image/svg+xml");
    let paths = doc.querySelectorAll('path');

    paths.forEach((path) => {
      let d = path.getAttribute('d');
      d && drawBezierFromSVG(d);
    });
  }

  s.setup = () => {
    s.createCanvas();
    s.windowResized();
    s.canvas.style.position = "absolute";
    s.canvas.style.zIndex = -1;

    s.layer1 = s.createGraphics(1152, 2600);
    s.layer2 = s.createGraphics(1152, 2600);

    s.layer2.noStroke();
    s.layer2.angleMode(s.DEGREES);

    parseSVG();
  }

  let randomPositionFactor = .8;
  let strokeSizeRange = [.1, 1];

  s.draw = () => {
    const g = s.layer1;
    const g2 = s.layer2;

    for (let i = 0; i < 60 * CONFIG.DRAW_SPEED; i++) {
      let point = points.shift();

      if (!point) break;

      if (point.type == 'KEY_POINT') {
        let { x, y } = point.position;
        let size = s.random(8, 15);

        const shape = pick({
          'triangle': 1,
          'circle': 1,
          'square': 1,
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
        }

        g2.pop();

        return;
      }

      for (let j = 0; j < 3; j++) {
        let {x, y} = point.position;
        if (randomPositionFactor) {
          x += s.random(-1, 1) * randomPositionFactor;
          y += s.random(-1, 1) * randomPositionFactor;
        }
        g.fill(0, 0, 0, 20);
        g.circle(x, y, s.random(...strokeSizeRange));
      }
    }

    s.clear();
    s.image(g, 0, 0, s.width, s.height);
    s.image(g2, 0, 0, s.width, s.height);
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
    <Box pb='45vh'>
      <NextReactP5Wrapper sketch={sketch} />
    </Box>
  );
}
