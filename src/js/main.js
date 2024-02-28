import GUI from 'lil-gui';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  CubeTextureLoader,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const canvas = document.querySelector('canvas.webgl');
const windowDimensions = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * TEXTURES
 */

// Texture
const textureLoader = new TextureLoader();
const particleTexture = textureLoader.load('/textures/particles/mine.png');

const cubeMapLoader = new CubeTextureLoader()
  .setPath('/textures/cubeMaps/')
  .load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);

/**
 * SCENE
 */

const galaxyScene = new Scene();
galaxyScene.background = cubeMapLoader;

/**
 * GEOMETRIES
 */

// Galaxy
const galaxyParams = {};
galaxyParams.count = 50000;
galaxyParams.particleSize = 0.04;
galaxyParams.radius = 7;
galaxyParams.branches = 4;
galaxyParams.spin = 1;
galaxyParams.randomness = 0.2;
galaxyParams.randomnessPower = 3;
galaxyParams.insideColor = 0xff6030;
galaxyParams.outsideColor = 0x1b3984;
galaxyParams.rotate = true;

let galaxyGeometry = null;
let galaxyMaterial = null;
let galaxyPoints = null;

const generateGalaxy = () => {
  // Destroy old galaxy if it exists
  if (galaxyPoints !== null) {
    galaxyGeometry.dispose();
    galaxyMaterial.dispose();
    galaxyScene.remove(galaxyPoints);
  }

  // Geometry
  galaxyGeometry = new BufferGeometry();
  const particlePositions = new Float32Array(galaxyParams.count * 3);
  const particleColors = new Float32Array(galaxyParams.count * 3);

  const colorInside = new Color(galaxyParams.insideColor);
  const colorOutside = new Color(galaxyParams.outsideColor);

  for (let particleIndex = 0; particleIndex < galaxyParams.count; particleIndex++) {
    const positionIndex = particleIndex * 3;

    const randomPointOnRadius = Math.random() * galaxyParams.radius;
    const spinAngle = randomPointOnRadius * galaxyParams.spin;
    const branchAngle =
      ((particleIndex % galaxyParams.branches) / galaxyParams.branches) * Math.PI * 2;

    const randomX =
      Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
    const randomY =
      Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);
    const randomZ =
      Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1);

    particlePositions[positionIndex + 0] =
      Math.cos(branchAngle + spinAngle) * randomPointOnRadius + randomX;
    particlePositions[positionIndex + 1] = randomY;
    particlePositions[positionIndex + 2] =
      Math.sin(branchAngle + spinAngle) * randomPointOnRadius + randomZ;

    // Using linear interpolation since values range between a closed interval of [0, 1]
    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, randomPointOnRadius / galaxyParams.radius);

    particleColors[positionIndex + 0] = mixedColor.r;
    particleColors[positionIndex + 1] = mixedColor.g;
    particleColors[positionIndex + 2] = mixedColor.b;
  }

  galaxyGeometry.setAttribute('position', new BufferAttribute(particlePositions, 3));
  galaxyGeometry.setAttribute('color', new BufferAttribute(particleColors, 3));

  // Material
  galaxyMaterial = new PointsMaterial();
  galaxyMaterial.size = galaxyParams.particleSize;
  galaxyMaterial.sizeAttenuation = true;
  galaxyMaterial.depthWrite = false;
  galaxyMaterial.blending = AdditiveBlending;
  galaxyMaterial.vertexColors = true;
  // galaxyMaterial.transparent = true;
  galaxyMaterial.map = particleTexture;

  // Points
  galaxyPoints = new Points(galaxyGeometry, galaxyMaterial);
  galaxyScene.add(galaxyPoints);
};

generateGalaxy();

/**
 * CAMERA & CONTROLS
 */

// Camera
const mainCamera = new PerspectiveCamera(
  75,
  windowDimensions.width / windowDimensions.height,
  0.1,
  100
);
mainCamera.position.y = 2;
mainCamera.position.x = 10;
galaxyScene.add(mainCamera);

// Controls
const cameraControls = new OrbitControls(mainCamera, canvas);
cameraControls.enableDamping = true;

/**
 * RENDERER
 */

const webGLRenderer = new WebGLRenderer({ canvas });
webGLRenderer.setSize(windowDimensions.width, windowDimensions.height);
webGLRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * ANIMATION LOOP
 */

const animationClock = new Clock();

const animate = () => {
  const elapsedTime = animationClock.getElapsedTime();

  galaxyParams.rotate ? (galaxyPoints.rotation.y = elapsedTime * 0.1) : '';

  cameraControls.update();
  webGLRenderer.render(galaxyScene, mainCamera);
  window.requestAnimationFrame(animate);
};

/**
 * WINDOW EVENT LISTENERS
 */
window.addEventListener('resize', () => {
  windowDimensions.width = window.innerWidth;
  windowDimensions.height = window.innerHeight;

  mainCamera.aspect = windowDimensions.width / windowDimensions.height;
  mainCamera.updateProjectionMatrix();

  webGLRenderer.setSize(windowDimensions.width, windowDimensions.height);
  webGLRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'f') {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
});

animate();

/**
 * DEBUG UI
 */

const guiPanel = new GUI({ title: 'Control Panel', width: 360, closeFolders: true });
// guiPanel.close();

const debugParameters = {
  restoreDefaults() {
    galaxyParams.count = 50000;
    galaxyParams.particleSize = 0.04;
    galaxyParams.radius = 7;
    galaxyParams.branches = 4;
    galaxyParams.spin = 1;
    galaxyParams.randomness = 0.2;
    galaxyParams.randomnessPower = 3;
    galaxyParams.insideColor = 0xff6030;
    galaxyParams.outsideColor = 0x1b3984;
    galaxyParams.rotate = true;

    generateGalaxy();
    guiPanel.reset();
  },
  toggleRotation() {
    galaxyParams.rotate = !galaxyParams.rotate;
  },
};

// Galaxy
const galaxyFolder = guiPanel.addFolder('Galaxy');
galaxyFolder
  .add(galaxyParams, 'radius')
  .name('Galaxy Radius')
  .min(0.01)
  .max(20)
  .step(0.01)
  .onFinishChange(generateGalaxy);
galaxyFolder
  .add(galaxyParams, 'branches')
  .name('Galaxy Branches')
  .min(2)
  .max(20)
  .step(1)
  .onFinishChange(generateGalaxy);
galaxyFolder
  .add(galaxyParams, 'spin')
  .name('Spin')
  .min(1)
  .max(20)
  .step(1)
  .onFinishChange(generateGalaxy);
galaxyFolder
  .add(galaxyParams, 'randomness')
  .name('Randomness')
  .min(0)
  .max(2)
  .step(0.001)
  .onFinishChange(generateGalaxy);
galaxyFolder
  .add(galaxyParams, 'randomnessPower')
  .name('Randomness Power')
  .min(1)
  .max(10)
  .step(0.001)
  .onFinishChange(generateGalaxy);
galaxyFolder
  .addColor(galaxyParams, 'insideColor')
  .name('Color (Inside)')
  .onFinishChange(generateGalaxy);
galaxyFolder
  .addColor(galaxyParams, 'outsideColor')
  .name('Color (Outside)')
  .onFinishChange(generateGalaxy);

// Particles
const starsFolder = guiPanel.addFolder('Stars');
starsFolder.add(galaxyParams, 'count').name('Count').onFinishChange(generateGalaxy);
starsFolder
  .add(galaxyParams, 'particleSize')
  .name('Size')
  .min(0.001)
  .max(0.1)
  .step(0.0001)
  .onFinishChange(generateGalaxy);

guiPanel.add(debugParameters, 'toggleRotation').name('Toggle Rotation');
guiPanel.add(debugParameters, 'restoreDefaults').name('Restore Defaults');
