import { WellLayer } from '../../../../src/layers/WellLayer';
import {
  Cement,
  OnRescaleEvent,
  CementLayerOptions,
  HoleSize,
  Casing,
  HoleSizeLayerOptions,
  CasingLayerOptions,
  WellLayerOptions,
} from '../../../../src/interfaces';

import { ZoomPanHandler } from '../../../../src/control/ZoomPanHandler';
import { createRootContainer, createLayerContainer, createFPSLabel } from '../../utils';

import { IntersectionReferenceSystem, HoleSizeLayer, CasingLayer, Controller, GridLayer, WellborepathLayer } from '../../../../src';

import { poslog, mockedWellborePath, casingData, holeSizeData, cementData } from '../../exampledata';

export const WellLayerBasic = () => {
  // const fpsLabel = createFPSLabel();

  // [EASTING, NORTHING, TVD, MD] See order in PoslogIndex enum
  const wellXVolvePosLog = [
    [0.0, 0, 138.2, 138.2],
    [0.0, 0, 150.0, 150.0],
    [0.0, 0, 180.0, 180.0],
    [0.0, 0, 210.0, 210.0],
    [0.0, 0, 240.0, 240.0],
    [0.0, 0, 270.0, 270.0],
    [0.0, 0, 300.0, 300.0],
    [0.0, 0, 330.0, 330.0],
    [0.0, 0, 360.0, 360.0],
    [0.0, 0, 390.0, 390.0],
    [0.0, 0, 420.0, 420.0],
    [0.0, 0, 450.0, 450.0],
    [0.0, 0, 480.0, 480.0],
    [0.0, 0, 510.0, 510.0],
    [0.0, 0, 540.0, 540.0],
    [0.0, 0, 570.0, 570.0],
    [0.0, 0, 600.0, 600.0],
    [0.0, 0, 630.0, 630.0],
    [0.0, 0, 660.0, 660.0],
    [0.0, 0, 690.0, 690.0],
    [0.0, 0, 720.0, 720.0],
    [0.0, 0, 750.0, 750.0],
    [0.0, 0, 780.0, 780.0],
    [0.0, 0, 810.0, 810.0],
    [0.0, 0, 840.0, 840.0],
    [0.0, 0, 870.0, 870.0],
    [0.0, 0, 900.0, 900.0],
    [0.0, 0, 930.0, 930.0],
    [0.0, 0, 960.0, 960.0],
    [0.0, 0, 990.0, 990.0],
    [0.0, 0, 1020.0, 1020.0],
    [0.0, 0, 1052.6, 1052.6],
    [0.15, 0.4, 1080.0, 1080.0],
    [0.65, 1.77, 1109.96, 1110.0],
    [1.49, 4.11, 1139.85, 1140.0],
    [2.7, 7.41, 1169.65, 1170.0],
    [4.25, 11.66, 1199.3, 1200.0],
    [6.14, 16.88, 1228.78, 1230.0],
    [8.38, 23.04, 1258.06, 1260.0],
    [10.97, 30.14, 1287.09, 1290.0],
    [13.89, 38.17, 1315.84, 1320.0],
    [17.16, 47.13, 1344.28, 1350.0],
    [18.01, 49.48, 1351.25, 1357.4],
    [20.65, 56.75, 1372.48, 1380.0],
    [24.16, 66.39, 1400.68, 1410.0],
    [27.67, 76.03, 1428.87, 1440.0],
    [31.18, 85.67, 1457.06, 1470.0],
    [34.69, 95.31, 1485.25, 1500.0],
    [38.2, 104.96, 1513.44, 1530.0],
    [41.71, 114.6, 1541.63, 1560.0],
    [45.22, 124.24, 1569.82, 1590.0],
    [48.73, 133.88, 1598.01, 1620.0],
    [52.24, 143.52, 1626.2, 1650.0],
    [55.75, 153.17, 1654.39, 1680.0],
    [59.26, 162.81, 1682.58, 1710.0],
    [62.77, 172.45, 1710.77, 1740.0],
    [66.28, 182.09, 1738.96, 1770.0],
    [69.79, 191.73, 1767.16, 1800.0],
    [73.29, 201.37, 1795.35, 1830.0],
    [76.8, 211.02, 1823.54, 1860.0],
    [80.31, 220.66, 1851.73, 1890.0],
    [83.82, 230.3, 1879.92, 1920.0],
    [87.33, 239.94, 1908.11, 1950.0],
    [90.84, 249.58, 1936.3, 1980.0],
    [94.35, 259.23, 1964.49, 2010.0],
    [97.86, 268.87, 1992.68, 2040.0],
    [101.37, 278.51, 2020.87, 2070.0],
    [104.88, 288.15, 2049.06, 2100.0],
    [108.39, 297.79, 2077.25, 2130.0],
    [111.9, 307.43, 2105.45, 2160.0],
    [115.41, 317.08, 2133.64, 2190.0],
    [118.92, 326.72, 2161.83, 2220.0],
    [122.43, 336.36, 2190.02, 2250.0],
    [125.93, 346.0, 2218.21, 2280.0],
    [129.44, 355.64, 2246.4, 2310.0],
    [132.95, 365.29, 2274.59, 2340.0],
    [136.46, 374.93, 2302.78, 2370.0],
    [139.97, 384.57, 2330.97, 2400.0],
    [143.48, 394.21, 2359.16, 2430.0],
    [146.99, 403.85, 2387.35, 2460.0],
    [150.5, 413.49, 2415.54, 2490.0],
    [154.01, 423.14, 2443.73, 2520.0],
    [157.52, 432.78, 2471.93, 2550.0],
    [161.03, 442.42, 2500.12, 2580.0],
    [164.54, 452.06, 2528.31, 2610.0],
    [168.05, 461.7, 2556.5, 2640.0],
    [171.56, 471.35, 2584.69, 2670.0],
    [175.07, 480.99, 2612.88, 2700.0],
    [178.57, 490.63, 2641.07, 2730.0],
    [182.08, 500.27, 2669.26, 2760.0],
    [185.59, 509.91, 2697.45, 2790.0],
    [189.1, 519.55, 2725.64, 2820.0],
    [192.61, 529.2, 2753.83, 2850.0],
    [196.12, 538.84, 2782.02, 2880.0],
    [199.63, 548.48, 2810.21, 2910.0],
    [203.14, 558.12, 2838.41, 2940.0],
    [206.65, 567.76, 2866.6, 2970.0],
    [210.16, 577.41, 2894.79, 3000.0],
    [213.67, 587.05, 2922.98, 3030.0],
    [217.18, 596.69, 2951.17, 3060.0],
    [220.69, 606.33, 2979.36, 3090.0],
    [224.2, 615.97, 3007.55, 3120.0],
    [227.71, 625.61, 3035.74, 3150.0],
    [231.21, 635.26, 3063.93, 3180.0],
    [234.72, 644.9, 3092.12, 3210.0],
    [238.23, 654.54, 3120.31, 3240.0],
    [241.74, 664.18, 3148.5, 3270.0],
    [245.25, 673.82, 3176.69, 3300.0],
    [248.76, 683.46, 3204.88, 3330.0],
    [252.27, 693.1, 3233.07, 3360.0],
    [255.78, 702.74, 3261.27, 3390.0],
    [259.29, 712.38, 3289.46, 3420.0],
    [262.8, 722.02, 3317.65, 3450.0],
    [266.31, 731.66, 3345.84, 3480.0],
    [269.82, 741.3, 3374.03, 3510.0],
    [273.33, 750.94, 3402.22, 3540.0],
    [276.84, 760.58, 3430.41, 3570.0],
    [280.35, 770.22, 3458.6, 3600.0],
    [283.86, 779.86, 3486.79, 3630.0],
    [287.37, 789.5, 3514.98, 3660.0],
    [290.88, 799.14, 3543.17, 3690.0],
    [294.39, 808.78, 3571.36, 3720.0],
    [297.9, 818.42, 3599.55, 3750.0],
    [301.41, 828.06, 3627.75, 3780.0],
    [304.92, 837.7, 3655.94, 3810.0],
    [308.43, 847.34, 3684.13, 3840.0],
    [311.94, 856.98, 3712.32, 3870.0],
    [315.45, 866.62, 3740.51, 3900.0],
    [318.96, 876.26, 3768.7, 3930.0],
    [322.47, 885.9, 3796.89, 3960.0],
    [325.98, 895.54, 3825.08, 3990.0],
    [329.49, 905.18, 3853.27, 4020.0],
    [333.0, 914.82, 3881.46, 4050.0],
    [336.51, 924.46, 3909.65, 4080.0],
    [340.02, 934.1, 3937.84, 4110.0],
    [343.53, 943.74, 3966.03, 4140.0],
    [347.04, 953.38, 3994.23, 4170.0],
    [350.55, 963.02, 4022.42, 4200.0],
    [354.06, 972.66, 4050.61, 4230.0],
    [357.57, 982.3, 4078.8, 4260.0],
    [361.08, 991.94, 4106.99, 4290.0],
    [364.59, 1001.58, 4135.18, 4320.0],
    [368.1, 1011.22, 4163.37, 4350.0],
    [371.61, 1020.86, 4191.56, 4380.0],
    [375.12, 1030.5, 4219.75, 4410.0],
    [378.63, 1040.14, 4247.94, 4440.0],
    [382.14, 1049.78, 4276.13, 4470.0],
    [385.65, 1059.42, 4304.32, 4500.0],
    [389.16, 1069.06, 4332.52, 4530.0],
    [392.67, 1078.7, 4360.71, 4560.0],
    [396.18, 1088.34, 4388.9, 4590.0],
    [399.69, 1097.98, 4417.09, 4620.0],
    [403.2, 1107.62, 4445.28, 4650.0],
    [406.71, 1117.26, 4473.47, 4680.0],
    [410.22, 1126.9, 4501.66, 4710.0],
    [413.73, 1136.54, 4529.85, 4740.0],
    [417.24, 1146.18, 4558.04, 4770.0],
    [420.75, 1155.82, 4586.23, 4800.0],
    [424.26, 1165.46, 4614.42, 4830.0],
    [427.77, 1175.1, 4642.61, 4860.0],
    [431.28, 1184.74, 4670.8, 4890.0],
    [434.79, 1194.38, 4699.0, 4920.0],
    [438.3, 1204.02, 4727.19, 4950.0],
    [441.81, 1213.66, 4755.38, 4980.0],
    [445.32, 1223.3, 4783.57, 5010.0],
    [448.83, 1232.94, 4811.76, 5040.0],
    [452.34, 1242.58, 4839.95, 5070.0],
    [455.85, 1252.22, 4868.14, 5100.0],
    [459.36, 1261.86, 4896.33, 5130.0],
    [462.87, 1271.5, 4924.52, 5160.0],
    [466.38, 1281.14, 4952.71, 5190.0],
    [469.89, 1290.78, 4980.9, 5220.0],
    [473.4, 1300.42, 5009.09, 5250.0],
    [476.91, 1310.06, 5037.28, 5280.0],
    [480.42, 1319.7, 5065.48, 5310.0],
    [483.93, 1329.34, 5093.67, 5340.0],
    [487.44, 1338.98, 5121.86, 5370.0],
    [490.95, 1348.62, 5150.05, 5400.0],
    [494.46, 1358.26, 5178.24, 5430.0],
    [497.97, 1367.9, 5206.43, 5460.0],
    [501.48, 1377.54, 5234.62, 5490.0],
    [504.99, 1387.18, 5262.81, 5520.0],
    [508.5, 1396.82, 5291.0, 5550.0],
    [512.01, 1406.46, 5319.19, 5580.0],
    [515.52, 1416.1, 5347.38, 5610.0],
    [519.03, 1425.74, 5375.57, 5640.0],
    [522.54, 1435.38, 5403.76, 5670.0],
    [526.05, 1445.02, 5431.96, 5700.0],
    [529.56, 1454.66, 5460.15, 5730.0],
    [533.07, 1464.3, 5488.34, 5760.0],
    [536.58, 1473.94, 5516.53, 5790.0],
    [540.09, 1483.58, 5544.72, 5820.0],
    [543.6, 1493.22, 5572.91, 5850.0],
    [547.11, 1502.86, 5601.1, 5880.0],
    [550.62, 1512.5, 5629.29, 5910.0],
    [554.13, 1522.14, 5657.48, 5940.0],
    [557.64, 1531.78, 5685.67, 5970.0],
    [561.15, 1541.42, 5713.86, 6000.0],
    [564.66, 1551.06, 5742.05, 6030.0],
    [568.17, 1560.7, 5770.24, 6060.0],
    [571.68, 1570.34, 5798.44, 6090.0],
    [575.19, 1579.98, 5826.63, 6120.0],
    [578.7, 1589.62, 5854.82, 6150.0],
    [582.21, 1599.26, 5883.01, 6180.0],
    [585.72, 1608.9, 5911.2, 6210.0],
    [589.23, 1618.54, 5939.39, 6240.0],
    [592.74, 1628.18, 5967.58, 6270.0],
    [596.25, 1637.82, 5995.77, 6300.0],
    [599.76, 1647.46, 6023.96, 6330.0],
    [603.27, 1657.1, 6052.15, 6360.0],
    [606.78, 1666.74, 6080.34, 6390.0],
    [610.29, 1676.38, 6108.53, 6420.0],
    [613.8, 1686.02, 6136.72, 6450.0],
    [617.31, 1695.66, 6164.92, 6480.0],
    [620.82, 1705.3, 6193.11, 6510.0],
    [624.33, 1714.94, 6221.3, 6540.0],
    [627.84, 1724.58, 6249.49, 6570.0],
    [631.35, 1734.22, 6277.68, 6600.0],
    [634.86, 1743.86, 6305.87, 6630.0],
    [638.37, 1753.5, 6334.06, 6660.0],
    [641.88, 1763.14, 6362.25, 6690.0],
    [645.39, 1772.78, 6390.44, 6720.0],
    [648.9, 1782.42, 6418.63, 6750.0],
    [652.41, 1792.06, 6446.82, 6780.0],
    [655.92, 1801.7, 6475.01, 6810.0],
    [659.43, 1811.34, 6503.2, 6840.0],
    [662.94, 1820.98, 6531.4, 6870.0],
    [666.45, 1830.62, 6559.59, 6900.0],
    [669.96, 1840.26, 6587.78, 6930.0],
    [673.47, 1849.9, 6615.97, 6960.0],
    [676.98, 1859.54, 6644.16, 6990.0],
    [680.49, 1869.18, 6672.35, 7020.0],
  ];

  const width = 700;
  const height = 600;

  const xRange = 600;
  const yRange = 500;
  const xbounds: [number, number] = [0, 1000];
  const ybounds: [number, number] = [0, 1000];

  const scaleOptions = { xMin: xbounds[0], xMax: xbounds[1], yMin: ybounds[0], yMax: ybounds[1], height: yRange, width: xRange };
  const axisOptions = {
    xLabel: 'Displacement',
    yLabel: 'TVD MSL',
    unitOfMeasure: 'm',
  };

  const referenceSystem = new IntersectionReferenceSystem(wellXVolvePosLog);

  referenceSystem.offset = wellXVolvePosLog[0][3];

  const options: WellLayerOptions = {
    order: 2,
    referenceSystem,
    data: getWellXData(),
  };

  const wellLayer = new WellLayer('webgl', options);

  const root = createRootContainer(width);
  const container = createLayerContainer(width, height);

  const controller = new Controller({
    referenceSystem,
    path: wellXVolvePosLog,
    axisOptions,
    scaleOptions,
    container,
  });

  controller.addLayer(new GridLayer('grid', { order: 1 }));
  const wellBorePathLayer = new WellborepathLayer('wellborepath', { order: 3, strokeWidth: '2px', stroke: 'red', referenceSystem });
  controller.addLayer(wellBorePathLayer);
  controller.addLayer(wellLayer);

  controller.setBounds(xbounds, ybounds);
  controller.adjustToSize(width, height);
  controller.setViewport(1000, 1000, 5000);

  // root.appendChild(fpsLabel);
  root.appendChild(container);
  return root;
};

// export const CementLayerWithSampleData = () => {
//   const referenceSystem = new IntersectionReferenceSystem(poslog || mockWellborePath, defaultOptions);

//   const options: CementLayerOptions = {
//     order: 1,
//     referenceSystem,
//   };
//   const cementLayer = new CementLayer('webgl', options);

//   const width: number = 1280;
//   const height: number = 1024;
//   const root = createRootContainer(width);
//   const container = createLayerContainer(width, height);

//   cementLayer.onMount({ elm: root, height, width });
//   cementLayer.onUpdate({
//     elm: root,
//     data: getSampleDataData(),
//   });

//   const zoomHandler = new ZoomPanHandler(root, (event: OnRescaleEvent) => {
//     cementLayer.onRescale(event);
//   });
//   zoomHandler.setBounds([0, 1000], [0, 1000]);
//   zoomHandler.adjustToSize(width, height);
//   zoomHandler.zFactor = 1;
//   zoomHandler.setTranslateBounds([-5000, 6000], [-5000, 6000]);
//   zoomHandler.enableTranslateExtent = false;
//   zoomHandler.setViewport(1000, 1000, 5000);

//   root.appendChild(container);

//   return root;
// };

const getData = () => {
  // Cement requires data casing and holes to create cement width
  const casings = casingData.map((c: Casing) => ({ ...c, end: c.start + c.length, casingId: `${c.start + c.length}` }));
  const holes = holeSizeData.map((h: HoleSize) => ({ ...h, end: h.start + h.length }));
  const cement: Cement[] = [];
  for (let i = 0; i < casingData.length && i < cementData.length; i++) {
    const c: Cement = (cementData[i] as unknown) as Cement;
    c.casingId = `${casings[i].casingId}`;
    cement.push(c);
  }
  const d = { cement, casings, holes };
  return d;
};

const getWellXData = () => {
  return {
    cement: [
      {
        toc: 142.2,
        casingId: '144838668',
      },
      {
        toc: 142.2,
        casingId: '144838671',
      },
      {
        toc: 1795,
        casingId: '144838674',
      },
      {
        toc: 2595,
        casingId: '144838677',
      },
      {
        toc: 2950,
        casingId: '144838681',
      },
    ],
    holes: [
      {
        length: 57.80000000000001,
        start: 142.2,
        end: 200,
        hasShoe: true,
        diameter: 36,
        innerDiameter: 36,
      },
      {
        length: 800,
        start: 200,
        end: 1000,
        hasShoe: true,
        diameter: 26,
        innerDiameter: 26,
      },
      {
        length: 1000,
        start: 1000,
        end: 2000,
        hasShoe: true,
        diameter: 16,
        innerDiameter: 16,
      },
      {
        length: 500,
        start: 2000,
        end: 2500,
        hasShoe: true,
        diameter: 12.25,
        innerDiameter: 12.25,
      },
      {
        length: 150,
        start: 2500,
        end: 2650,
        hasShoe: true,
        diameter: 13.5,
        innerDiameter: 13.5,
      },
      {
        length: 350,
        start: 2650,
        end: 3000,
        hasShoe: true,
        diameter: 12.25,
        innerDiameter: 12.25,
      },
      {
        length: 1000,
        start: 3000,
        end: 4000,
        hasShoe: true,
        diameter: 8.5,
        innerDiameter: 8.5,
      },
    ],
    casings: [
      {
        length: 59,
        start: 140,
        end: 199,
        hasShoe: true,
        diameter: 30,
        innerDiameter: 29.4,
        casingId: '144838668',
      },
      {
        length: 855,
        start: 140,
        end: 995,
        hasShoe: true,
        diameter: 20.000000000000004,
        innerDiameter: 19.4,
        casingId: '144838671',
      },
      {
        length: 1855,
        start: 140,
        end: 1995,
        hasShoe: true,
        diameter: 13,
        innerDiameter: 12.4,
        casingId: '144838674',
      },
      {
        length: 2855,
        start: 140,
        end: 2995,
        hasShoe: true,
        diameter: 10.000000000000002,
        innerDiameter: 9.4,
        casingId: '144838677',
      },
      {
        length: 1048,
        start: 2950,
        end: 3998,
        hasShoe: true,
        diameter: 7,
        innerDiameter: 6.4,
        casingId: '144838681',
      },
    ],
  };
};

// const getSampleDataData = () => {
//   const data: Cement[] = [
//     { diameter: 30, start: 0, length: 500, hasShoe: false, innerDiameter: 30 - 1 },
//     { diameter: 29, start: 500, length: 500, hasShoe: false, innerDiameter: 29 - 1 },
//     { diameter: 28, start: 1000, length: 500, hasShoe: true, innerDiameter: 28 - 1 },
//     { diameter: 26, start: 1500, length: 500, hasShoe: true, innerDiameter: 26 - 1 },
//     { diameter: 20, start: 2000, length: 500, hasShoe: true, innerDiameter: 20 - 1 },
//     { diameter: 18, start: 2500, length: 500, hasShoe: true, innerDiameter: 18 - 1 },
//     { diameter: 16, start: 3000, length: 500, hasShoe: true, innerDiameter: 16 - 1 },
//     { diameter: 10, start: 3500, length: 500, hasShoe: true, innerDiameter: 10 - 1 },
//   ];
//   data.forEach((x) => (x.end = x.start + x.length));
//   return data;
// };
