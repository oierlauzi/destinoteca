import { h, type VNode } from '../../hardware';
import { FLAP } from './geometry';

/**
 * The printed plates of the train column.
 *
 * By 1995 the flaps that named the train were no longer lettered but printed
 * with the logo of each product. The photograph of that year shows them dark
 * and too small to read; the one of 2007 shows them pale, each with the mark
 * of the product and its name beside it, which is the state this draws.
 *
 * Every mark here is Renfe's or the operator's own vector artwork, placed by
 * the box its ink fills. The names beside a mark are set in type and fitted
 * to their room with `textLength`: they are drawn to match the photograph,
 * not taken from the artwork. `SEEN` says which products a photograph of this
 * board shows a plate for and `RECONSTRUCTED` the rest, which are the same
 * identities applied to products the photographs do not show.
 */

interface Art {
  /** The part of the artwork the ink fills, in its own coordinates. */
  box: { x: number; y: number; width: number; height: number };
  paths: { d: string; fill?: string; transform?: string }[];
}

/**
 * The «renfe» wordmark, from the company's own artwork. The same drawing has
 * been printed in more than one purple, so the colour is the caller's and not
 * part of the artwork here.
 */
const RENFE: Art = {
  box: { x: 0, y: 0, width: 287.56, height: 109.92 },
  paths: [
    { d: 'M167.949,104.327L166.939,109.92L173.36,109.92C181.497,109.92 187.07,107.174 191.815,103.721C202.112,96.17 203.687,87.003 206.13,75.959C206.13,75.959 210.774,49.993 210.976,48.923C212.874,39.413 212.268,39.413 223.757,39.413L226.604,39.413L227.614,33.8L213.702,33.8C213.702,33.8 216.811,16.153 217.498,12.841C218.77,6.784 221.576,5.593 226.523,5.593L234.701,5.593L235.71,0L229.33,0C221.193,0 215.62,2.746 210.855,6.199C200.558,13.75 199.003,22.917 196.54,33.961L188.927,76.383C188.927,76.383 185.818,93.686 185.172,97.099C184.223,102.146 181.861,103.56 178.428,104.065C177.56,104.186 176.672,104.246 175.783,104.246L167.909,104.347L167.949,104.327Z' },
    { d: 'M104.933,34.042C97.119,32.911 90.193,33.012 80.845,33.8C67.438,34.931 60.27,40.099 56.959,47.994C55.202,52.315 53.971,57.666 53.526,62.37C52.638,70.931 54.253,78.462 64.934,79.29C79.351,80.401 92.818,80.037 105.034,79.29L105.983,73.677C94.454,74.485 80.421,74.525 72.829,73.677C67.478,73.071 70.426,62.39 70.426,62.39L94.534,62.39C103.661,62.39 111.374,60.29 114.564,51.588C117.694,42.987 115.372,35.556 104.913,34.042L104.933,34.042ZM77.13,42.684C78.785,40.503 80.885,39.574 85.812,39.191C88.679,38.969 89.911,38.989 93.545,39.191C99.804,39.514 102.288,42.825 99.885,49.589C98.028,54.839 94.817,56.797 88.073,56.797L71.517,56.797C73.617,47.59 77.15,42.684 77.15,42.684L77.13,42.684Z' },
    { d: 'M276.637,34.042C268.823,32.911 261.898,33.012 252.549,33.8C239.143,34.931 231.975,40.099 228.663,47.994C226.907,52.315 225.675,57.666 225.231,62.37C224.343,70.931 225.958,78.462 236.639,79.29C251.055,80.401 264.523,80.037 276.738,79.29L277.687,73.677C266.158,74.485 252.125,74.525 244.534,73.677C239.183,73.071 242.131,62.39 242.131,62.39L266.239,62.39C275.365,62.39 283.078,60.29 286.268,51.588C289.398,42.987 287.076,35.556 276.617,34.042L276.637,34.042ZM248.834,42.684C250.49,40.503 252.59,39.574 257.516,39.191C260.384,38.969 261.615,38.989 265.25,39.191C271.509,39.514 273.992,42.825 271.59,49.589C269.732,54.839 266.522,56.797 259.778,56.797L243.221,56.797C245.321,47.59 248.854,42.684 248.854,42.684L248.834,42.684Z' },
    { d: 'M167.949,33.8L127.103,33.8L118.905,79.29L136.027,79.29L143.195,39.413L157.167,39.413C169.08,39.413 167.404,43.391 166.213,50.054C165.243,55.424 160.963,79.31 160.963,79.31L178.065,79.31C178.065,79.31 182.163,56.474 183.274,50.336C184.97,40.907 179.942,33.84 167.949,33.84' },
    { d: 'M54.294,39.413L55.303,33.8L24.976,33.8C12.155,33.8 7.289,38.666 5.835,46.803C5.048,51.164 0,79.29 0,79.29L17.102,79.29C17.102,79.29 21.443,55.021 22.352,50.033C23.401,44.481 25.582,39.393 31.761,39.393L54.273,39.393L54.294,39.413Z' },
  ],
};

/**
 * The two strokes of Grandes Líneas, from Renfe's own artwork: the mark the
 * Trd and Regional Exprés flaps still carry in the 2007 photograph.
 */
const SWOOSH: Art = {
  box: { x: 61.35, y: 23.15, width: 1884.91, height: 711.2 },
  paths: [
    { d: 'M288.506,94.675C-92.831,186.394 -49.596,249.969 155.11,228.662C107.003,220.169 55.082,177.278 288.506,94.675Z', fill: '#f79817', transform: 'matrix(3.91202,0,0,3.91202,58.5085,-176.346)' },
    { d: 'M482.551,50.995C129.729,145.087 107.305,237.979 282.758,216.178C253.885,185.699 331.847,123.08 482.551,50.995Z', fill: '#0033a0', transform: 'matrix(3.91202,0,0,3.91202,58.5085,-176.346)' },
  ],
};

/** The «AVE» wordmark, from Renfe's own artwork: its V is printed in the purple of the company mark. */
const AVE_WORD: Art = {
  box: { x: 0, y: 241.15, width: 1582.98, height: 436.74 },
  paths: [
    { d: 'M0,-97.573L0,-101.195L-11.884,-101.195C-34.482,-101.195 -44.983,-96.098 -55.523,-81.977C-66.063,-67.855 -100.66,-20.856 -100.66,-20.856L-82.382,3.622C-82.382,3.622 -24.613,-74.709 -20.044,-80.91C-15.474,-87.111 -12.049,-92.099 -9.672,-94.273C-6.69,-97 -2.649,-97.573 0,-97.573', fill: '#851765', transform: 'matrix(4.16667,0,0,4.16667,1091.86,662.799)' },
    { d: 'M0,61.091L-50.189,61.093C-44.995,54.048 -30.42,34.277 -30.42,34.277L19.775,34.277L26.868,24.671L-23.34,24.671C-23.34,24.671 -8.927,5.194 -7.322,3.004C-5.936,1.112 -4.064,0.016 -0.8,0.016L45.099,0.016L52.284,-9.624L-4.838,-9.624C-27.436,-9.624 -37.937,-4.528 -48.477,9.594C-55.842,19.462 -74.951,45.38 -85.797,60.101C-87.034,61.689 -88.11,62.952 -89.029,63.792C-92.01,66.52 -96.051,67.093 -98.701,67.093L-98.701,70.715L-7.092,70.715L0,61.091Z', fill: '#98989a', transform: 'matrix(4.16667,0,0,4.16667,1365.13,281.254)' },
    { d: 'M0,21.221L14.974,0.932L29.963,21.221L0,21.221ZM80.82,40.898C78.368,37.655 28.854,-29.531 28.854,-29.531C28.854,-29.531 22.184,-29.537 22.179,-29.531L22.169,-29.531L-37.066,50.748L-21.764,50.748L-7.083,30.827L37.092,30.827C37.275,31.072 37.453,31.311 37.624,31.54C48.164,45.661 58.665,50.758 81.262,50.758L93.147,50.758L93.147,47.136C90.359,47.016 85.539,47.14 80.82,40.898', fill: '#98989a', transform: 'matrix(4.16667,0,0,4.16667,154.442,364.406)' },
    { d: 'M0,-5.732C8.992,6.424 19.473,20.72 27.136,31.111C32.079,24.401 38.779,15.311 45.305,6.469C38.07,-3.33 31.23,-12.578 27.463,-17.625C16.923,-31.746 6.422,-36.843 -16.176,-36.843L-22.79,-36.843L0,-5.732Z', fill: '#98989a', transform: 'matrix(4.16667,0,0,4.16667,521.464,394.872)' },
  ],
};

/** The «avlo» wordmark with the stroke under its o, from Renfe's own artwork. */
const AVLO_WORD: Art = {
  box: { x: 10.04, y: 153.28, width: 1391.48, height: 588.64 },
  paths: [
    { d: 'M389.306,545.122l-0,65.938c-4.132,-0 -39.497,0.017 -53.299,-0c-31.823,-0.053 -47.205,-12.848 -54.896,-43.351l-4.34,0.052c-0.903,0.833 -3.16,3.524 -4.427,5.312c-15.295,21.32 -36.024,34.896 -61.094,41.632c-60.434,16.25 -126.285,-7.066 -163.75,-57.239c-22.309,-29.896 -33.837,-63.768 -36.701,-100.539c-3.177,-41.163 3.507,-80.642 23.402,-117.378c33.959,-62.674 103.629,-94.149 172.223,-77.552c25.538,6.18 46.771,19.444 63.715,39.6c1.649,1.962 3.333,4.601 4.722,5.921l6.007,-0l0,-40.712l77.813,-0l-0,253.021c-0,3.055 -0.104,6.128 0.035,9.201c0.503,10.695 5.243,15.486 16.076,16.059c4.531,0.226 9.097,0.035 14.514,0.035Zm-300.07,-106.91c0.07,18.386 3.247,35.677 10.729,52.153c29.028,63.924 120.521,73.698 161.355,16.615c24.739,-34.566 26.909,-73.178 13.42,-112.327c-23.281,-67.569 -112.327,-84.531 -159.41,-30.799c-18.646,21.285 -25.695,46.928 -26.094,74.358Z', fill: '#10cfc9' },
    { d: 'M1201.81,257.535c66.84,1.649 119.132,25.764 154.843,80.243c23.872,36.441 31.997,77.118 27.657,120.347c-5.243,52.153 -28.021,94.705 -70.035,126.389c-26.892,20.278 -57.691,31.181 -90.955,34.15c-38.924,3.472 -76.511,-2.17 -111.233,-21.354c-47.552,-26.268 -75.885,-66.789 -86.701,-119.497c-8.229,-40.104 -4.722,-79.531 12.5,-116.893c26.423,-57.361 72.066,-89.948 133.785,-100.555c10.833,-1.858 21.944,-2.101 30.139,-2.83Zm1.354,74.219c-31.511,0.069 -58.837,12.291 -77.848,35.156c-14.357,17.274 -21.562,37.431 -23.923,59.653c-5.66,53.351 24.01,110.417 88.42,118.229c31.337,3.785 59.983,-3.663 83.299,-25.729c27.205,-25.747 35.729,-58.195 32.083,-94.722c-5.382,-54.046 -47.795,-92.709 -102.031,-92.587Z', fill: '#10cfc9' },
    { d: 'M426.424,266.441l81.528,0l85.798,270.052l5.747,0l84.497,-269.67l83.889,0l-117.431,343.802l-105.781,0l-118.247,-344.184Z', fill: '#10cfc9' },
    { d: 'M835.105,539.844l-0,-386.563l76.753,0l0,373.056c0,13.993 5.052,18.681 19.132,18.802c9.132,0.07 27.57,0.018 27.57,0.018l-0,65.486l-59.931,-0.208c-21.267,-0 -63.524,-17.935 -63.524,-70.591Z', fill: '#10cfc9' },
    { d: 'M1377.93,652.587c7.899,8.959 15.747,17.865 23.594,26.771c-86.337,81.58 -280.903,88.056 -381.337,-8.455c2.413,-2.812 4.896,-5.711 7.882,-9.201c52.205,40.191 111.944,55.33 176.597,53.663c64.427,-1.649 123.143,-19.479 173.264,-62.778Z', fill: '#82005e' },
  ],
};

/** iryo's wordmark, from the operator's own artwork. */
const IRYO: Art = {
  box: { x: 0, y: 0, width: 396.45, height: 237.13 },
  paths: [
    { d: 'M51,2.15C83.273,-6.234 117.203,10.187 130.65,40.7C135.762,52.55 137.47,65.594 135.58,78.36C130.31,113.86 97.723,139.343 62,135.9C45.583,134.588 30.204,127.302 18.79,115.43C7.69,104.22 1.24,88.86 0,73.22L0,63C0.731,53.292 3.509,43.848 8.15,35.29C17.201,18.775 32.739,6.758 51,2.15Z', fill: '#cb151b', transform: 'matrix(0.352022,0,0,0.352022,0,0.0106191)' },
    { d: 'M929.57,156C963.29,152.64 998.01,158.71 1028.23,174.17C1074.95,197.37 1110.31,242.17 1121.68,293.11C1132.02,337.8 1124.52,386.46 1100.49,425.62C1068.25,479.481 1009.92,512.554 947.146,512.554C849.109,512.554 768.436,431.881 768.436,333.844C768.436,242.421 838.59,164.991 929.57,156M932.57,251.94C905.882,256.946 883.257,274.687 872.03,299.41C862.951,319.51 862.338,342.443 870.33,363C876.351,378.353 886.793,391.58 900.33,401C916.62,412.33 937.05,417.9 956.82,415.43C972.088,413.642 986.573,407.683 998.68,398.21C1020.39,381.57 1032.74,353.6 1030.12,326.34C1028.12,299.13 1011.36,273.75 987.39,260.84C970.672,251.726 951.326,248.605 932.59,252L932.57,251.94Z', fill: '#cb151b', transform: 'matrix(0.352022,0,0,0.352022,0,0.0106191)' },
    { d: 'M61.44,170.84C79.44,163.95 98.87,161.72 118.02,161.01C120.843,160.794 123.682,160.935 126.47,161.43C126.543,274.043 126.543,386.66 126.47,499.28C126.47,501.83 126.81,504.4 126.3,506.93C87.2,507.01 48.1,507.01 9,506.93C7.4,507.24 7.61,505.13 7.48,504.15L7.48,253.25C7.55,234.3 11.95,214.85 23.01,199.2C32.36,185.89 46.37,176.48 61.44,170.84Z', fill: '#cb151b', transform: 'matrix(0.352022,0,0,0.352022,0,0.0106191)' },
    { d: 'M180.78,161.07C214.86,160.85 248.96,161.07 283.04,160.98C288.4,161.06 293.77,160.76 299.11,161.21C299.51,175.21 298.99,189.28 299.38,203.3C302.03,202.24 303.63,199.75 305.72,197.93C327.27,177.1 356.53,165.71 385.99,162.2C394.28,161.34 402.67,160.47 410.99,161.29C411.61,193.92 411.06,226.6 411.27,259.29C411.359,261.519 411.212,263.752 410.83,265.95C373.83,266.19 336.74,265.82 299.7,266.14C299.05,269.48 299.26,272.89 299.25,276.27L299.25,484.27C299.12,491.84 299.51,499.44 299.04,507.01C260.027,507.11 221.027,507.11 182.04,507.01C180.37,507.34 180.19,505.55 180.28,504.39L180.28,165.19C180.316,163.804 180.484,162.425 180.78,161.07Z', fill: '#cb151b', transform: 'matrix(0.352022,0,0,0.352022,0,0.0106191)' },
    { d: 'M436.43,162.4C436.71,162.06 437.26,161.4 437.53,161.02C462.1,161.47 487.01,163.67 510.4,171.65C535.12,179.71 557.29,197.99 566.17,222.9C581.59,261.9 596.66,301.07 611.9,340.16C612.28,341.333 613.036,342.349 614.05,343.05C635.93,283.4 657,223.44 678.64,163.7C679.19,162.7 679.32,160.8 680.89,160.95C686.56,160.38 692.29,160.86 697.99,160.95L782.99,160.95C786.32,160.95 789.69,160.72 792.99,161.36C791.93,165.65 789.87,169.6 788.33,173.73C727.53,324.523 666.863,475.373 606.33,626.28C600.33,641.253 594.48,656.277 588.78,671.35C588.44,672.48 587.5,674.35 586.03,673.28C573.68,667.78 562.82,659.36 553.14,650.01C540.77,637.42 530.55,622.43 524.74,605.69C517.481,584.356 517.781,561.159 525.59,540.02C535.23,514.54 544.92,489.077 554.66,463.63C555.121,462.393 555.075,461.023 554.53,459.82C525.44,387.04 496.76,314.1 467.53,241.38C457.27,215 446.6,188.81 436.43,162.4Z', fill: '#cb151b', transform: 'matrix(0.352022,0,0,0.352022,0,0.0106191)' },
  ],
};

/** Ouigo's roundel, from the operator's own artwork. */
const OUIGO: Art = {
  box: { x: 1.64, y: 0.9, width: 177.16, height: 177.16 },
  paths: [
    { d: 'M42.913,21.474C42.913,33.216 33.395,42.734 21.653,42.734C9.912,42.734 0.394,33.216 0.394,21.474C0.394,9.733 9.912,0.215 21.653,0.215C33.395,0.215 42.913,9.733 42.913,21.474Z', fill: '#ec1b7a', transform: 'matrix(4.16667,0,0,4.16667,0,0)' },
    { d: 'M9.292,21.824L9.292,21.8C9.292,20.375 8.235,19.188 6.745,19.188C5.255,19.188 4.222,20.352 4.222,21.776L4.222,21.8C4.222,23.224 5.279,24.411 6.769,24.411C8.259,24.411 9.292,23.248 9.292,21.824ZM2.287,21.824L2.287,21.8C2.287,19.438 4.173,17.503 6.769,17.503C9.364,17.503 11.226,19.414 11.226,21.776L11.226,21.8C11.226,24.162 9.34,26.097 6.745,26.097C4.15,26.097 2.287,24.186 2.287,21.824Z', fill: 'white', transform: 'matrix(4.16667,0,0,4.16667,0,0)' },
    { d: 'M11.971,22.393L11.971,18.488C11.971,17.978 12.38,17.574 12.896,17.574C13.413,17.574 13.821,17.978 13.821,18.488L13.821,22.346C13.821,23.699 14.506,24.4 15.636,24.4C16.765,24.4 17.45,23.723 17.45,22.405L17.45,18.488C17.45,17.978 17.859,17.574 18.375,17.574C18.891,17.574 19.3,17.978 19.3,18.488L19.3,22.334C19.3,24.85 17.87,26.085 15.611,26.085C13.353,26.085 11.971,24.839 11.971,22.393Z', fill: 'white', transform: 'matrix(4.16667,0,0,4.16667,0,0)' },
    { d: 'M20.502,18.488C20.502,17.978 20.91,17.574 21.427,17.574C21.943,17.574 22.352,17.978 22.352,18.488L22.352,25.112C22.352,25.622 21.943,26.026 21.427,26.026C20.91,26.026 20.502,25.622 20.502,25.112L20.502,18.488Z', fill: 'white', transform: 'matrix(4.16667,0,0,4.16667,0,0)' },
    { d: 'M23.313,21.824L23.313,21.8C23.313,19.438 25.176,17.503 27.723,17.503C28.996,17.503 29.837,17.787 30.594,18.31C30.775,18.44 30.979,18.69 30.979,19.046C30.979,19.544 30.57,19.948 30.066,19.948C29.801,19.948 29.633,19.853 29.501,19.758C28.997,19.402 28.456,19.188 27.663,19.188C26.317,19.188 25.248,20.363 25.248,21.776L25.248,21.8C25.248,23.319 26.305,24.435 27.795,24.435C28.468,24.435 29.068,24.269 29.537,23.937L29.537,22.75L28.288,22.75C27.843,22.75 27.483,22.405 27.483,21.966C27.483,21.527 27.843,21.171 28.288,21.171L30.402,21.171C30.919,21.171 31.328,21.574 31.328,22.085L31.328,24.103C31.328,24.637 31.123,25.005 30.679,25.266C29.994,25.681 28.997,26.097 27.735,26.097C25.115,26.097 23.313,24.281 23.313,21.824Z', fill: 'white', transform: 'matrix(4.16667,0,0,4.16667,0,0)' },
    { d: 'M38.969,21.824L38.969,21.8C38.969,20.375 37.911,19.188 36.422,19.188C34.931,19.188 33.898,20.352 33.898,21.776L33.898,21.8C33.898,23.224 34.955,24.411 36.445,24.411C37.935,24.411 38.969,23.248 38.969,21.824ZM31.964,21.824L31.964,21.8C31.964,19.438 33.85,17.503 36.445,17.503C39.041,17.503 40.903,19.414 40.903,21.776L40.903,21.8C40.903,24.162 39.017,26.097 36.422,26.097C33.826,26.097 31.964,24.186 31.964,21.824Z', fill: 'white', transform: 'matrix(4.16667,0,0,4.16667,0,0)' },
    { d: 'M22.544,15.366C22.544,15.984 22.044,16.484 21.427,16.484C20.809,16.484 20.308,15.984 20.308,15.367C20.308,14.749 20.809,14.248 21.427,14.248C22.044,14.248 22.544,14.749 22.544,15.367', fill: 'white', transform: 'matrix(4.16667,0,0,4.16667,0,0)' },
  ],
};

// --- Placing ----------------------------------------------------------------------

/** The artwork's ink, `height` tall, its left edge at `x`, centred on `cy`. */
function place(art: Art, x: number, cy: number, height: number, fill?: string): VNode {
  const scale = height / art.box.height;
  const dx = x - art.box.x * scale;
  const dy = cy - (art.box.y + art.box.height / 2) * scale;
  return h('g', { transform: `translate(${dx},${dy}) scale(${scale})`, ...(fill ? { fill } : {}) }, art.paths.map((path) => h('path', path)));
}

const widthOf = (art: Art, height: number): number => (art.box.width / art.box.height) * height;

// --- The names beside a mark -------------------------------------------------------

/**
 * The 2007 photograph shows two families of plate side by side. The Renfe
 * mark adopted in 2005 carries its product in a light italic grotesque; the
 * Grandes Líneas mark it replaced, still on some flaps, carries its product
 * in an italic with serifs, as that identity's own artwork does.
 */
const SANS = "Helvetica, Arial, 'Liberation Sans', sans-serif";
const SERIF = "Georgia, 'Times New Roman', 'Liberation Serif', serif";
/** Advance widths of Helvetica's letters, in thousandths of the size, enough to guess a line's length. */
const ADVANCE: Record<string, number> = {
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833,
  n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833,
  N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  ' ': 278, '.': 278, "'": 191, '-': 333,
};
const advance = (text: string): number => Array.from(text).reduce((sum, char) => sum + (ADVANCE[char] ?? 556), 0) / 1000;
/** Capitals are this much of the size tall. */
const CAP = 0.716;
/** A name of two lines: how tall each is against one of a single line, and the room between them. */
const SECOND_LINE = { cap: 0.64, gap: 0.3 };

/**
 * A name on one line, or cut at its space when a single line would have to be
 * squeezed into much less than it asks for. The 2007 photograph shows
 * «Regional Exprés» on two lines and everything shorter on one.
 */
function nameLines(text: string, room: number, cap: number): string[] {
  if (!text.includes(' ') || advance(text) * (cap / CAP) <= room * 1.3) return [text];
  const at = text.indexOf(' ');
  return [text.slice(0, at), text.slice(at + 1)];
}

/** The product's name against the left of its room, fitted to it and never stretched past it. */
function nameNodes(text: string, x: number, cy: number, room: number, cap: number, font: string, fill: string): VNode[] {
  const lines = nameLines(text, room, cap);
  const height = lines.length > 1 ? cap * SECOND_LINE.cap : cap;
  const step = height * (1 + SECOND_LINE.gap);
  const first = cy - ((lines.length - 1) * step) / 2 + height / 2;
  const size = height / CAP;
  return lines.map((line, i) =>
    h(
      'text',
      {
        x,
        y: first + i * step,
        'font-family': font,
        'font-size': size,
        'font-style': 'italic',
        textLength: Math.min(room, advance(line) * size),
        lengthAdjust: 'spacingAndGlyphs',
        fill,
      },
      [line],
    ),
  );
}

// --- The plates --------------------------------------------------------------------

/** The flap the plate is printed on, pale against the black ones beside it. */
export const PLATE = '#efece1';
/** The purple the Renfe mark is printed in, from the company's own artwork. */
const RENFE_PURPLE = '#870464';
/** The grey the product names are printed in, from Renfe's own artwork. */
const NAME_GREY = '#76777b';

/** From the plate's edges to the ink. */
const MARGIN = { side: 1.2, top: 1.1 };
/** Between a mark and the name beside it. */
const GAP = 1.4;

export type Logo = (x: number, y: number, width: number) => VNode[];

/** The Renfe plate: the wordmark adopted in 2005, and the product beside it. */
function renfe(name: string): Logo {
  return (x, y, width) => {
    const cy = y + FLAP.height / 2;
    const left = x + MARGIN.side;
    const room = width - 2 * MARGIN.side;
    const markHeight = (FLAP.height - 2 * MARGIN.top) * 0.78;
    const markWidth = widthOf(RENFE, markHeight);
    const nameX = left + markWidth + GAP;
    return [
      place(RENFE, left, cy, markHeight, RENFE_PURPLE),
      ...nameNodes(name, nameX, cy, Math.max(0, left + room - nameX), markHeight * 0.62, SANS, NAME_GREY),
    ];
  };
}

/** The Grandes/** The Grandes Líneas plate the 2007 photograph still shows: the two strokes, and the product beside them. */
function grandesLineas(name: string): Logo {
  return (x, y, width) => {
    const cy = y + FLAP.height / 2;
    const left = x + MARGIN.side;
    const room = width - 2 * MARGIN.side;
    const markHeight = (FLAP.height - 2 * MARGIN.top) * 0.74;
    const nameX = left + widthOf(SWOOSH, markHeight) + GAP;
    return [
      place(SWOOSH, left, cy, markHeight),
      ...nameNodes(name, nameX, cy, Math.max(0, left + room - nameX), markHeight * 0.52, SERIF, NAME_GREY),
    ];
  };
}

/**
 * A product with a wordmark of its own: that mark alone, centred on the
 * plate. It is not set beside the company's, which is the lockup for a
 * product named in lettering.
 */
function alone(art: Art, fraction: number): Logo {
  return (x, y, width) => {
    const cy = y + FLAP.height / 2;
    const height = (FLAP.height - 2 * MARGIN.top) * fraction;
    const room = width - 2 * MARGIN.side;
    const fitted = Math.min(height, room / (art.box.width / art.box.height));
    return [place(art, x + (width - widthOf(art, fitted)) / 2, cy, fitted)];
  };
}

/**
 * The plates, by what the flap under them says. Keys are folded as the
 * displays fold text: upper case, accents dropped.
 */
const PLATES: Record<string, Logo> = {
  // Renfe's products named in lettering, in the identity adopted in 2005.
  ALTARIA: renfe('Altaria'),
  ALVIA: renfe('Alvia'),
  ARCO: renfe('Arco'),
  AVANT: renfe('Avant'),
  CERCANIAS: renfe('Cercanías'),
  ESTRELLA: renfe('Estrella'),
  EUROMED: renfe('Euromed'),
  INTERCITY: renfe('Intercity'),
  'MEDIA DISTANCIA': renfe('Media Distancia'),
  REGIONAL: renfe('Regional'),
  TALGO: renfe('Talgo'),
  TRENHOTEL: renfe('Trenhotel'),
  // What the 2007 photograph still shows in the identity before it.
  'GRANDES LINEAS': grandesLineas('Grandes Líneas'),
  'REGIONAL EXPRES': grandesLineas('Regional Exprés'),
  TRD: grandesLineas('Trd'),
  // Products with a wordmark of their own, Renfe's and other operators'.
  AVE: alone(AVE_WORD, 0.66),
  AVLO: alone(AVLO_WORD, 0.84),
  IRYO: alone(IRYO, 0.74),
  OUIGO: alone(OUIGO, 1),
};

/**
 * The other names one of these products answers to: the short forms a display
 * writes when the whole name does not fit its flaps, and the names a product
 * has been renamed to since. Euromed is printed «AVE Eur» on ADIF's own
 * boards; the plate here is the one the product carried as renfe Euromed.
 */
const ALSO: Record<string, string> = {
  CERC: 'CERCANIAS',
  ICITY: 'INTERCITY',
  INTCITY: 'INTERCITY',
  MD: 'MEDIA DISTANCIA',
  REG: 'REGIONAL',
  'REG. EXPRES': 'REGIONAL EXPRES',
  'R. EXPRES': 'REGIONAL EXPRES',
  GL: 'GRANDES LINEAS',
  'AVE EUR': 'EUROMED',
  'AVE EUROMED': 'EUROMED',
};

/** The products a photograph of this board shows a plate for, all of them in the one of 2007. */
export const SEEN = ['ALTARIA', 'INTERCITY', 'REGIONAL EXPRES', 'TALGO', 'TRD'] as const;
/** The rest: the same identities applied to products no photograph of this board shows. */
export const RECONSTRUCTED = Object.keys(PLATES).filter((key) => !(SEEN as readonly string[]).includes(key));

/** The plate for what a train flap says, or nothing when the product has none. */
export function plateFor(text: string): Logo | undefined {
  const key = text.trim().replace(/\s+/g, ' ');
  return PLATES[key] ?? PLATES[ALSO[key] ?? ''];
}

/** Every value a train flap can turn to when the plates are printed, in the order the flaps fall. */
export const PLATE_WORDS: string[] = ['', ...Object.keys(PLATES)];
