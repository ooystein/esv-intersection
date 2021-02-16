import { Graphics, Texture, Point, SimpleRope, RENDERER_TYPE } from 'pixi.js';
import { merge, max } from 'd3-array';
import { PixiLayer } from './base/PixiLayer';
import { HoleSizeLayerOptions, OnUpdateEvent, OnRescaleEvent, OnMountEvent, WellComponentBaseOptions, MDPoint } from '../interfaces';

const createGradientFill = (
  canvas: HTMLCanvasElement,
  canvasCtx: CanvasRenderingContext2D,
  firstColor: string,
  secondColor: string,
  startPctOffset: number,
): CanvasGradient => {
  const halfWayPct = 0.5;
  const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, firstColor);
  gradient.addColorStop(halfWayPct - startPctOffset, secondColor);
  gradient.addColorStop(halfWayPct + startPctOffset, secondColor);
  gradient.addColorStop(1, firstColor);

  return gradient;
};

export class WellboreBaseComponentLayer extends PixiLayer {
  _textureCache: Record<string, Texture> = {};

  rescaleEvent: OnRescaleEvent;

  constructor(id?: string, options?: WellComponentBaseOptions) {
    super(id, options);
    this.options = {
      ...this.options,
      ...options,
    };
    this.render = this.render.bind(this);
  }

  onMount(event: OnMountEvent): void {
    super.onMount(event);
  }

  onUpdate(event: OnUpdateEvent): void {
    super.onUpdate(event);
    this.clear();
  }

  onRescale(event: OnRescaleEvent): void {
    const shouldRender = this.rescaleEvent?.zFactor !== event.zFactor;

    this.rescaleEvent = event;
    super.optionsRescale(event);

    if (!this.ctx) {
      return;
    }

    const yRatio = this.yRatio();
    const flippedX = event.xBounds[0] > event.xBounds[1];
    const flippedY = event.yBounds[0] > event.yBounds[1];
    this.ctx.stage.position.set(event.xScale(0), event.yScale(0));
    this.ctx.stage.scale.set(event.xRatio * (flippedX ? -1 : 1), yRatio * (flippedY ? -1 : 1));

    if (shouldRender) {
      this.clear();
      this.render(event);
    }
  }

  clear(): void {
    const children = this.ctx.stage.removeChildren();
    children.forEach((child) => {
      child.destroy();
    });
  }

  // This is overridden by the extended well bore items layers (casing, hole)
  // TODO: Look at this construct; can we do something slightly better here?
  render(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: OnRescaleEvent | OnUpdateEvent,
  ): // eslint-disable-next-line @typescript-eslint/no-empty-function
  void {}

  /**
   * Calculate yRatio without zFactor
   * TODO consider to move this into ZoomPanHandler
   */
  yRatio(): number {
    const domain = this.rescaleEvent.yScale.domain();
    const ySpan = domain[1] - domain[0];
    const baseYSpan = ySpan * this.rescaleEvent.zFactor;
    const baseDomain = [domain[0], domain[0] + baseYSpan];
    return Math.abs(this.rescaleEvent.height / (baseDomain[1] - baseDomain[0]));
  }

  getMdPoint = (md: number): MDPoint => {
    const p = this.referenceSystem.project(md);
    const point = { point: p, md: md };
    return point;
  };

  getPathForPoints = (start: number, end: number, interestPoints: number[]): MDPoint[] => {
    const pathPoints = this.referenceSystem.getCurtainPath(start, end);

    // Filter duplicate points
    const uniqueInterestPoints = interestPoints.filter((ip) => !pathPoints.some((p) => p.md === ip));
    const interestMdPoints = uniqueInterestPoints.map(this.getMdPoint);

    const points = merge<MDPoint>([pathPoints, interestMdPoints]);
    points.sort((a, b) => a.md - b.md);

    return points;
  };

  getZFactorScaledPathForPoints = (start: number, end: number, interestPoints: number[]): MDPoint[] => {
    const y = (y: number): number => y * this.rescaleEvent.zFactor;

    const path = this.getPathForPoints(start, end, interestPoints);
    return path.map((p) => ({
      point: [p.point[0], y(p.point[1])],
      md: p.md,
    }));
  };

  drawBigPolygon = (coords: Point[], t?: Texture): Graphics => {
    if (!this.rescaleEvent) {
      return;
    }

    coords.forEach((point) => point.set(point.x, point.y));

    const polygon = new Graphics();
    if (t != null) {
      polygon.beginTextureFill({ texture: t });
    } else {
      polygon.beginFill(0);
    }
    polygon.drawPolygon(coords);
    polygon.endFill();
    this.ctx.stage.addChild(polygon);

    return polygon;
  };

  drawRopeWithMask(path: Point[], maskPolygon: Point[], texture: Texture): void {
    if (maskPolygon.length === 0 || path.length === 0) {
      return null;
    }
    const rope: SimpleRope = new SimpleRope(texture, path, 1);

    const mask = new Graphics();
    mask.beginFill(0);
    mask.drawPolygon(maskPolygon);
    mask.endFill();
    this.ctx.stage.addChild(mask);
    rope.mask = mask;

    this.ctx.stage.addChild(rope);
  }

  drawRope(path: Point[], texture: Texture, scale = 1): void {
    if (path.length === 0) {
      return null;
    }

    const rope: SimpleRope = new SimpleRope(texture, path, scale);
    this.ctx.stage.addChild(rope);
  }

  drawLine(coords: Point[], lineColor: number, lineWidth = 1, close: boolean = false): void {
    const DRAW_ALIGNMENT_INSIDE = 1;
    const startPoint = coords[0];
    const line = new Graphics();
    line.lineStyle(lineWidth, lineColor, undefined, DRAW_ALIGNMENT_INSIDE).moveTo(startPoint.x, startPoint.y);
    coords.map((p: Point) => line.lineTo(p.x, p.y));
    if (close) {
      line.lineTo(coords[0].x, coords[0].y);
    }

    this.ctx.stage.addChild(line);
  }

  createTexture(maxWidth: number, startPctOffset: number = 0): Texture {
    const cacheKey = `${maxWidth}X${startPctOffset}`;
    if (this._textureCache.hasOwnProperty(cacheKey)) {
      return this._textureCache[cacheKey];
    }

    const { solidColor, firstColor, secondColor } = this.options as HoleSizeLayerOptions;

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = maxWidth > 0 ? maxWidth : canvas.width; // TODO needs to grow with scale
    const canvasCtx = canvas.getContext('2d');

    canvasCtx.fillStyle = solidColor || createGradientFill(canvas, canvasCtx, firstColor, secondColor, startPctOffset);
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const t = Texture.from(canvas);
    this._textureCache[cacheKey] = t;

    return this._textureCache[cacheKey];
  }

  createHoleTexture(maxWidth: number, startPctOffset: number = 0): Texture {
    const cacheKey = `${maxWidth}X${startPctOffset}`;
    if (this._textureCache.hasOwnProperty(cacheKey)) {
      return this._textureCache[cacheKey];
    }

    const { firstColor, secondColor } = this.options as HoleSizeLayerOptions;

    const offsets = [0, 2, 4, 2, 4, 5, 3, 2, 0, 3, 4, 3, 2].map((x) => x * 3);
    const maxOffset = max(offsets);
    const midOffset = maxOffset / 2;

    const canvas = document.createElement('canvas');
    canvas.width = 4200;
    canvas.height = maxWidth > 0 ? maxWidth + (maxOffset + 2) * 2 : canvas.width; // TODO needs to grow with scale
    const canvasCtx = canvas.getContext('2d');

    const start = 11;
    const end = canvas.height - 11;

    const left = [];
    const right = [];
    let tmpYMD = 1;
    let localBottomPointPx = canvas.width;
    let i = 0;
    while (localBottomPointPx > 0) {
      i += 1;
      i %= offsets.length;
      tmpYMD += offsets[i] * 5;
      localBottomPointPx -= tmpYMD;
      if (localBottomPointPx <= 0) {
        localBottomPointPx = 0;
      }

      const newXOffset = Math.round(offsets[i]);
      left.push([localBottomPointPx, start + newXOffset]);
      right.push([localBottomPointPx, end - newXOffset]);
    }
    right.reverse();

    const strokePath = new Path2D();
    strokePath.moveTo(canvas.width, start + midOffset);
    left.forEach((p) => strokePath.lineTo(p[0], p[1]));
    strokePath.lineTo(0, start + midOffset);

    strokePath.moveTo(0, end - midOffset);
    right.forEach((p) => strokePath.lineTo(p[0], p[1]));
    strokePath.lineTo(canvas.width, end - midOffset);

    canvasCtx.lineWidth = 8;
    canvasCtx.strokeStyle = '#8b4513';
    canvasCtx.stroke(strokePath);

    const path = new Path2D();
    path.moveTo(canvas.width, start + midOffset);
    left.forEach((p) => path.lineTo(p[0], p[1]));
    path.lineTo(0, start + midOffset);

    path.lineTo(0, end - midOffset);
    right.forEach((p) => path.lineTo(p[0], p[1]));
    path.lineTo(canvas.width, end - midOffset);

    path.closePath();
    canvasCtx.fillStyle = createGradientFill(canvas, canvasCtx, firstColor, secondColor, startPctOffset);
    canvasCtx.fill(path);

    const t = Texture.from(canvas);
    this._textureCache[cacheKey] = t;

    return this._textureCache[cacheKey];
  }

  get renderType(): RENDERER_TYPE {
    return this.ctx.renderer.type;
  }
}
