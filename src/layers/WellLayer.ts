import { WellboreBaseComponentLayer, StaticWellboreBaseComponentIncrement } from './WellboreBaseComponentLayer';
import { WellLayerOptions, OnMountEvent, OnUpdateEvent, OnRescaleEvent, HoleObjectData, HoleSize, Casing } from '..';
import { Texture, Point } from 'pixi.js';
import { createNormalCoords, generateHoleCoords, findCasing, findIntersectingItems } from '../datautils/wellboreItemShapeGenerator';
import { createNormal } from '../utils/vectorUtils';
import { Cement, CompiledCement, MDPoint } from '../interfaces';

export class WellLayer extends WellboreBaseComponentLayer {
  options: WellLayerOptions;

  constructor(id?: string, options?: WellLayerOptions) {
    super(id, options);
    this.options = {
      holeOuterColor: 'rgb(163, 102, 42)',
      holeInnerColor: 'rgb(255, 255, 255)',
      holeLineColor: 0x8b4513,
      casingOuterColor: '#777788',
      casingInnerColor: '#EEEEFF',
      casingLineColor: 0x575757,
      cementFillColor: '#c7b9ab',
      cementStipeColor: '#5b5b5b',
      cementLineColor: 0x5b5b5b,

      maxTextureDiameterScale: 2,
      ...options,
    };
    this.render = this.render.bind(this);
  }

  onMount(event: OnMountEvent): void {
    super.onMount(event);
  }

  onUpdate(event: OnUpdateEvent): void {
    super.onUpdate(event);
    this.render(event);
  }

  onRescale(event: OnRescaleEvent): void {
    super.onRescale(event);
  }

  render(event: OnRescaleEvent | OnUpdateEvent): void {
    super.render(event);
    this.renderHoleSize(event);
    this.renderCasing(event);
    this.renderCement(event);
  }

  renderHoleSize(event: OnRescaleEvent | OnUpdateEvent): void {
    const { maxTextureDiameterScale, holeOuterColor, holeInnerColor } = this.options;
    const { holes } = this.data;

    if (holes == null) {
      return;
    }

    const sizes: HoleObjectData[] = holes.map((d: HoleSize) => this.generateHoleSizeData(d));

    const maxDiameter = Math.max(...sizes.map((s: HoleObjectData) => s.data.diameter));
    const texture = this.createTexure(maxDiameter * maxTextureDiameterScale, holeOuterColor, holeInnerColor);
    sizes
      .sort((a: any, b: any) => (a.data.diameter <= b.data.diameter ? 1 : -1)) // draw smaller casings and holes inside bigger ones if overlapping
      .map((s: any) => this.drawHoleSize(s, texture));
  }

  drawHoleSize = (holeObject: HoleObjectData, texture: Texture): void => {
    const { holeLineColor } = this.options;
    const { wellBorePathCoords, normalOffsetCoordsDown, normalOffsetCoordsUp } = createNormalCoords(holeObject);

    const { top, bottom, left, right } = generateHoleCoords(normalOffsetCoordsUp, normalOffsetCoordsDown);
    const polygonCoords = [...left, ...right];
    const mask = this.drawBigPolygon(polygonCoords);
    const holeWallWidth = 1; // Todo make option

    this.createRopeTextureBackground(wellBorePathCoords, texture, mask);

    this.drawLine(polygonCoords, holeLineColor, holeWallWidth);
    this.drawLine(top, holeLineColor, 1);
    this.drawLine(bottom, holeLineColor, 1);
  };

  renderCasing(event: OnRescaleEvent | OnUpdateEvent): void {
    const { maxTextureDiameterScale, casingOuterColor, casingInnerColor } = this.options;
    const { casings } = this.data;

    if (casings == null) {
      return;
    }

    const sizes: HoleObjectData[] = casings.map((d: Casing) => this.generateHoleSizeData(d));

    const maxDiameter = Math.max(...sizes.map((s: HoleObjectData) => s.data.diameter));
    const texture = this.createTexure(maxDiameter * maxTextureDiameterScale, casingOuterColor, casingInnerColor);
    sizes
      .sort((a: any, b: any) => (a.data.diameter <= b.data.diameter ? 1 : -1)) // draw smaller casings and holes inside bigger ones if overlapping
      .map((s: any) => this.drawCasing(s, texture));
  }

  // Rename this method
  drawCasing = (holeObject: HoleObjectData, defaultTexture: Texture): void => {
    const { maxTextureDiameterScale, casingOuterColor, casingInnerColor, casingLineColor } = this.options;
    const { wellBorePathCoords, normalOffsetCoordsDown, normalOffsetCoordsUp } = createNormalCoords(holeObject);

    const { top, bottom, left, right } = generateHoleCoords(normalOffsetCoordsUp, normalOffsetCoordsDown);
    const polygonCoords = [...left, ...right];
    const mask = this.drawBigPolygon(polygonCoords);
    let texture = defaultTexture;
    let casingWallWidth = 1;

    const pctOffset = 0.35;
    texture = this.createTexure(holeObject.data.diameter * maxTextureDiameterScale, casingOuterColor, casingInnerColor, pctOffset);
    casingWallWidth = Math.abs(holeObject.data.diameter - holeObject.innerDiameter);

    this.createRopeTextureBackground(wellBorePathCoords, texture, mask);

    this.drawLine(polygonCoords, casingLineColor, casingWallWidth);
    this.drawLine(top, casingLineColor, 1);
    this.drawLine(bottom, casingLineColor, 1);

    const takeMeters = (points: Point[], meters: number): Point[] => {
      let tot = 0;
      const lastMeterPoint = 2;
      const newPoints: Point[] = [];

      for (let i = 0; tot < meters && i > points.length - lastMeterPoint; i++) {
        tot += StaticWellboreBaseComponentIncrement;
        newPoints.push(points[points.length - 1 - i].clone());
      }

      return newPoints.reverse();
    };

    if (holeObject.hasShoe === true) {
      const shoeWidth = 5;
      const meters = 10;
      const shoeHeightCoords = takeMeters(normalOffsetCoordsDown, meters);
      const shoeCoords = this.generateShoe(shoeHeightCoords, -shoeWidth);
      this.drawBigPolygon(shoeCoords);

      const shoeHeightCoords2 = takeMeters(normalOffsetCoordsUp, meters);
      const shoeCoords2 = this.generateShoe(shoeHeightCoords2, shoeWidth);
      this.drawBigPolygon(shoeCoords2);
    }
  };

  generateShoe = (triangleSideShoe: Point[], offset: number): Point[] => {
    if (triangleSideShoe.length < 1) {
      return [];
    }
    const normalOffset = createNormal(
      [triangleSideShoe[0], triangleSideShoe[1], triangleSideShoe[triangleSideShoe.length - 1], triangleSideShoe[triangleSideShoe.length - 1]],
      offset,
    );

    const a = [triangleSideShoe[0], triangleSideShoe[triangleSideShoe.length - 1], normalOffset[normalOffset.length - 1], triangleSideShoe[0]];
    return a;
  };

  /**
   *
   * CEMENT
   */
  renderCement(event: OnRescaleEvent | OnUpdateEvent): void {
    if (this.data == null) {
      return;
    }

    const { cement, casings, holes } = this.data;
    this.createCementShapes(cement, casings, holes);
  }

  parseCement = (cement: Cement, casings: Casing[], holes: HoleSize[]) => {
    const attachedCasing = findCasing(cement.casingId, casings);
    const res: CompiledCement = {
      ...cement,
      boc: attachedCasing.end,
      intersectingItems: findIntersectingItems(cement, attachedCasing, casings, holes),
    };
    return res;
  };

  getClosestRelatedItem = (related: (Casing | HoleSize)[], md: number): HoleSize | Casing => {
    const between = related.filter((r) => r.start <= md && r.end >= md);
    const sorted = between.sort((a, b) => (a.diameter < b.diameter ? -1 : 1));
    const result = sorted[0];
    return result;
  };

  createMiddlePath = (c: CompiledCement): MDPoint[] => {
    const points = [];

    // Can we do some sampling here? Increase increment based on zoom level?
    // Can we do this smarter? Always add bottom point
    // This applies everywhere StaticWellboreBaseComponentIncrement is used

    // Add distance to points
    for (let i = c.toc; i < c.boc; i += StaticWellboreBaseComponentIncrement) {
      const p = this.referenceSystem.project(i);
      points.push({ point: new Point(p[0], p[1]), md: i });
    }
    return points;
  };

  createSimplePolygonPath = (c: CompiledCement): any => {
    const middle = this.createMiddlePath(c);
    const points: { left: Point[]; right: Point[] } = { left: [], right: [] };
    let prevPoint = null;

    for (let md = c.toc; md < c.boc; md += StaticWellboreBaseComponentIncrement) {
      // create normal for sections
      const offsetItem = this.getClosestRelatedItem(c.intersectingItems, md);

      if (!offsetItem) {
        continue;
      }

      const start = md;
      md = Math.min(c.boc, offsetItem != null ? offsetItem.end : c.boc); // set next calc MD

      // Subtract casing thickness / holesize edge
      const offsetDimDiff = offsetItem.diameter - offsetItem.innerDiameter || 1;
      const defaultCementWidth = 100; // Default to flow cement outside to seabed to show error in data
      const offset = offsetItem != null ? offsetItem.diameter - offsetDimDiff : defaultCementWidth;
      const stop = md;
      let partPoints = middle.filter((x) => x.md >= start && x.md <= stop).map((s) => s.point);

      if (prevPoint != null) {
        partPoints = [prevPoint, ...partPoints];
      }

      const sideLeft = createNormal(partPoints, -offset);
      const sideRight = createNormal(partPoints, offset);

      prevPoint = partPoints[partPoints.length - 2];

      points.left.push(...sideLeft);
      points.right.push(...sideRight);
    }

    const centerPiece = findCasing(c.casingId, this.data.casings);
    const wholeMiddlePoints = middle.map((s) => s.point);
    const sideLeftMiddle = createNormal(wholeMiddlePoints, -centerPiece.diameter);
    const sideRightMiddle = createNormal(wholeMiddlePoints, +centerPiece.diameter);

    const sideLeftMiddleR = sideLeftMiddle.map((s) => s.clone()).reverse();
    const rightR = points.right.map((s) => s.clone()).reverse();
    const cementRectCoords = [...sideLeftMiddleR, ...points.left, sideLeftMiddleR[0], ...rightR, ...sideRightMiddle];

    // const line = [...sideLeftMiddleR, ...points.left];
    // this.drawLine(line, 0xff0000);
    console.log(cementRectCoords.length, ' lengde');
    return { path: middle, coords: cementRectCoords };
  };

  createCementShapes(cement: Cement[], casings: any, holes: any): any {
    const cementCompiled = cement.map((c: Cement) => this.parseCement(c, casings, holes));

    const t = this.createCementTexture();
    const paths = cementCompiled.map((c) => this.createSimplePolygonPath(c));

    // const bigSquareBackgroundTest = new Graphics();
    // bigSquareBackgroundTest.beginTextureFill({ texture: t });
    // bigSquareBackgroundTest.drawRect(-1000, -1000, 2000, 2000);
    // bigSquareBackgroundTest.endFill();
    // this.ctx.stage.addChild(bigSquareBackgroundTest);

    paths.map((p) => {
      const mask = this.drawBigPolygon(p.coords);
      this.createRopeTextureBackground(p.path, t, mask);
    });
  }

  createCementTexture = (): Texture => {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const canvasCtx = canvas.getContext('2d');

    canvasCtx.fillStyle = this.options.cementFillColor;
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 1;
    canvasCtx.fillStyle = this.options.cementStipeColor;

    canvasCtx.beginPath();

    const distanceBetweenLines = 10;
    for (let i = -canvas.width; i < canvas.width; i++) {
      canvasCtx.moveTo(-canvas.width + distanceBetweenLines * i, -canvas.height);
      canvasCtx.lineTo(canvas.width + distanceBetweenLines * i, canvas.height);
    }
    canvasCtx.stroke();

    const t = Texture.from(canvas);

    return t;
  };
}
