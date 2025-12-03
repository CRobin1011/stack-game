import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { BOX_HEIGHT, ORIGINAL_BOX_SIZE, OPTIMAL_CLICK_INTERVAL, AUTOPILOT_SPEED_FACTOR, MOVE_BOUNDS, PERFECT_TOLERANCE, GENESIS_BOX_HEIGHT } from '../config/constants.js';

export class GameEngine {
  constructor({ stats, gameModes, feedback, review, ui }) {
    // injected systems
    this.stats = stats;
    this.gameModes = gameModes;
    this.feedback = feedback;
    this.review = review;
    this.ui = ui;

    // three/cannon
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.world = null;

    // state
    this.lastTime = 0;
    this.stack = [];
    this.overhangs = [];
    this.autopilot = true;
    this.gameEnded = false;
    this.robotPrecision = 0;
    this.gameStartTime = null;
    this.lastClickTime = null;
    this.blockMoveStartTime = null;
    this.perfectBorders = []

    this.isZoomingOut = false;
    this.zoomElapsed = 0;
    this.zoomDuration = 1000;   // ms, how long the zoom takes
    this.zoomFromPos = null;
    this.zoomToPos = null;
    this.zoomFromZoom = 1;
    this.zoomToZoom = 0.5;

    this.pendingGameOver = null;
    this.gameOverShown = false;
    this.gameOverDelayElapsed = 0;
    this.gameOverDelayDuration = 3000; // 

    this.towerYOffset = 0;

    this.finalScore = 0;

    this.lightnings = [];
    this.lightFlashTtl = 0;
    this.lightFlashStartTtl = 0;
    this.baseAmbientIntensity = 0.6;
    this.baseDirectionalIntensity = 0.6;
  }

  init() {
    this._setupThreeJS();
    this._setupGame();
  }

  _setRobotPrecision() {
    this.robotPrecision = Math.random() * 1 - 0.5;
  }

  _setupThreeJS() {
    const aspect = window.innerWidth / window.innerHeight;
    const width = 10;
    const height = width / aspect;

    this.cameraWidth = width;
    this.camera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      0,
      100
    );


    this.camera.position.set(4, 4, 4);
    this.camera.lookAt(0, 0, 0);

    this.scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xffffff, this.baseAmbientIntensity);
    this.scene.add(ambientLight);

    const dLight = new THREE.DirectionalLight(0xffffff, this.baseDirectionalIntensity);
    dLight.position.set(10, 20, 0);
    this.scene.add(dLight);

    this.ambientLight = ambientLight;
    this.directionalLight = dLight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // the UI layer will append renderer.domElement to the DOM
  }

  attachTo(domElement) {
    domElement.appendChild(this.renderer.domElement);
    this.renderer.setAnimationLoop(this._animate.bind(this));
  }

  _setupGame() {
    this.autopilot = true;
    this.gameEnded = false;
    this.lastTime = 0;
    this.stack = [];
    this.overhangs = [];
    this._setRobotPrecision();
    this.world = new CANNON.World();
    this.world.gravity.set(0, -10, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 40;

    this.finalScore = 0;

    this.towerYOffset = -1;
    this._addBaseLayer(0, 0, ORIGINAL_BOX_SIZE, ORIGINAL_BOX_SIZE);
    this._addLayer(-10, 0, ORIGINAL_BOX_SIZE, ORIGINAL_BOX_SIZE, 'x');
  }

  startGame(modeId) {
    this.gameModes.setMode(modeId);

    this.gameEnded = false;
    this.isZoomingOut = false;
    this.gameOverShown = false;
    this.pendingGameOver = null;
    this.gameOverDelayElapsed = 0;

    this.autopilot = false;
    this.gameEnded = false;
    this.lastTime = 0;
    this.gameStartTime = Date.now();
    this.lastClickTime = Date.now();
    this.stack = [];
    this.overhangs = [];

    this.finalScore = 0;

    // reset feedback popups
    this.feedback.clearAllPopups();

    // clear world & scene meshes
    if (this.world) {
      while (this.world.bodies.length > 0) {
        this.world.removeBody(this.world.bodies[0]);
      }
    }
    if (this.scene) {
      let mesh = this.scene.children.find(c => c.type === 'Mesh');
      while (mesh) {
        this.scene.remove(mesh);
        mesh = this.scene.children.find(c => c.type === 'Mesh');
      }
    }

    if (this.camera) {
      this.camera.position.set(4, 4, 4);
      this.camera.lookAt(0, 0, 0);
      this.camera.zoom = 1;  // Add this line!
      this.camera.updateProjectionMatrix();  // Add this line!
    }

    this.towerYOffset = -1;
    // rebuild base layers
    this._addBaseLayer(0, 0, ORIGINAL_BOX_SIZE, ORIGINAL_BOX_SIZE);
    this._addLayer(-10, 0, ORIGINAL_BOX_SIZE, ORIGINAL_BOX_SIZE, 'x');

    // stats
    this.stats.startGame();

    this.ui.updateScore(0);  // Add this line!

    // HUD update
    this.ui.updateHUD(this.stats, this.gameModes.getCurrentConfig(), this.gameEnded);

    this.blockMoveStartTime = Date.now();
  }

  _addBaseLayer(x, z, width, depth, direction) {
    const y = BOX_HEIGHT * this.stack.length + this.towerYOffset - 0.8;
    const layer = this._generateGenesisBox(x, y, z, width, depth, false);
    layer.direction = direction;
    this.stack.push(layer);
  }

  _generateGenesisBox(x, y, z, width, depth, falls) {
    const geometry = new THREE.BoxGeometry(width, GENESIS_BOX_HEIGHT, depth);
    const color = new THREE.Color(`hsl(${348 - (this.stack.length * 4.5)}, 85%, 45%)`);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, GENESIS_BOX_HEIGHT / 2, depth / 2));
    let mass = falls ? 5 : 0;
    mass *= width / ORIGINAL_BOX_SIZE;
    mass *= depth / ORIGINAL_BOX_SIZE;
    const body = new CANNON.Body({ mass, shape });
    body.position.set(x, y, z);
    this.world.addBody(body);

    return {
      threejs: mesh,
      cannonjs: body,
      width,
      depth
    };
  }

  _addLayer(x, z, width, depth, direction) {
    const y = BOX_HEIGHT * this.stack.length + this.towerYOffset;
    const layer = this._generateBox(x, y, z, width, depth, false);
    layer.direction = direction;
    this.stack.push(layer);
  }

  _addOverhang(x, z, width, depth) {
    const y = BOX_HEIGHT * (this.stack.length - 1) + this.towerYOffset;
    const overhang = this._generateBox(x, y, z, width, depth, true);
    this.overhangs.push(overhang);
  }

  _generateBox(x, y, z, width, depth, falls) {
    const geometry = new THREE.BoxGeometry(width, BOX_HEIGHT, depth);
    const color = new THREE.Color(`hsl(${348 - (this.stack.length * 4.5)}, 85%, 45%)`);
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, BOX_HEIGHT / 2, depth / 2));
    let mass = falls ? 5 : 0;
    mass *= width / ORIGINAL_BOX_SIZE;
    mass *= depth / ORIGINAL_BOX_SIZE;
    const body = new CANNON.Body({ mass, shape });
    body.position.set(x, y, z);
    this.world.addBody(body);

    return {
      threejs: mesh,
      cannonjs: body,
      width,
      depth
    };
  }

  handlePrimaryAction(eventTarget) {
    if (this.autopilot) {
      // let UI decide if mode selector should open
      this.ui.requestModeSelectionIfAllowed(eventTarget);
      return;
    }

    if (this.gameEnded) return;

    this._splitBlockAndNextOneIfOverlaps();
  }

  _splitBlockAndNextOneIfOverlaps() {
    const currentTime = Date.now();
    const topLayer = this.stack[this.stack.length - 1];
    const previousLayer = this.stack[this.stack.length - 2];
    const direction = topLayer.direction;

    const size = direction === 'x' ? topLayer.width : topLayer.depth;
    const delta = topLayer.threejs.position[direction] - previousLayer.threejs.position[direction];
    const overhangSize = Math.abs(delta);
    const overlap = size - overhangSize;

    const timingError = currentTime - this.lastClickTime - OPTIMAL_CLICK_INTERVAL;
    const alignmentOffset = (overhangSize / size) * 100;

    if (overlap > 0.1) {
      const errorPercentage = (overhangSize / size) * 100;
      const tolerance = PERFECT_TOLERANCE;
      const isPerfect = errorPercentage < tolerance;

      if (isPerfect) {
        this.stats.addPerfect();
        this.feedback.showPerfectFeedback();
        this._spawnPerfectBorder(topLayer);
        this._spawnLightningStrike(topLayer);
      }else{
        if(this.stats.resetPerfectCombo){
          this.stats.resetPerfectCombo();
        }
      }

      this.stats.addError(errorPercentage, Math.abs(timingError), alignmentOffset);
      this.stats.addScore();

      this._cutBox(topLayer, overlap, size, delta);

      if (overhangSize > 0.1) {
        const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
        const overhangX = direction === 'x'
          ? topLayer.threejs.position.x + overhangShift
          : topLayer.threejs.position.x;
        const overhangZ = direction === 'z'
          ? topLayer.threejs.position.z + overhangShift
          : topLayer.threejs.position.z;
        const overhangWidth = direction === 'x' ? overhangSize : topLayer.width;
        const overhangDepth = direction === 'z' ? overhangSize : topLayer.depth;

        this._addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);
      }

      // next layer
      const nextX = direction === 'x' ? topLayer.threejs.position.x : -10;
      const nextZ = direction === 'z' ? topLayer.threejs.position.z : -10;
      const newWidth = topLayer.width;
      const newDepth = topLayer.depth;
      const nextDirection = direction === 'x' ? 'z' : 'x';

      const currentScore = this.stack.length - 1;
      this.ui.updateScore(currentScore);

      const comboShown = this.feedback.showComboFeedback(
        this.stats.currentGameStats.combo,
        this.gameModes.getCurrentMode()
      )

      let milestoneShown = false;
      if (!comboShown) {
          milestoneShown = this.feedback.showMilestoneMessage(currentScore);
      }

      //this.feedback.showMilestoneMessage(currentScore);
      //this.feedback.showComboFeedback(this.stats.currentGameStats.combo, this.gameModes.getCurrentMode());   
      let modeMessage = null;
      if(!comboShown && !milestoneShown){
        modeMessage = this.gameModes.getModeSpecificFeedback(
          currentScore,
          this.stats.currentGameStats.combo
        )
      }
      this.feedback.showModeSpecificFeedback(modeMessage);
      this._addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);

      this.blockMoveStartTime = currentTime;

    } else {
      this.stats.resetCombo();
      if (this.stats.resetPerfectCombo) {
        this.stats.resetPerfectCombo();
      }
      this._missedTheSpot();
    }

    this.lastClickTime = currentTime;

    this.ui.updateHUD(this.stats, this.gameModes.getCurrentConfig(), this.gameEnded);
  }

    _spawnLightningStrike(layer) {
    const strikeHeight = 8;

    const beamThickness = Math.min(layer.width, layer.depth) * 0.25;
    const segments = 4;            // banyak segmen zigzag
    const segmentHeight = strikeHeight / segments;

    const group = new THREE.Group();

    // titik awal di atas tower
    let currX = layer.threejs.position.x;
    let currZ = layer.threejs.position.z;
    let currYTop = layer.threejs.position.y + strikeHeight + 1;

    const maxOffset = beamThickness * 0.8;

    for (let i = 0; i < segments; i++) {
      const nextYTop = currYTop - segmentHeight;

      // tiap segmen boleh belok sedikit di X atau Z
      let nextX = currX;
      let nextZ = currZ;

      if (i % 2 === 0) {
        // belok di X
        nextX += (Math.random() - 0.5) * maxOffset;
      } else {
        // belok di Z
        nextZ += (Math.random() - 0.5) * maxOffset;
      }

      const start = new THREE.Vector3(currX, currYTop, currZ);
      const end = new THREE.Vector3(nextX, nextYTop, nextZ);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

      const dir = new THREE.Vector3().subVectors(end, start);
      const length = dir.length();

      const geom = new THREE.BoxGeometry(beamThickness, length, beamThickness);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0,
      });

      const segMesh = new THREE.Mesh(geom, mat);

      // box defaultnya memanjang di Y, jadi kita putar ke arah segmen
      segMesh.position.copy(mid);
      const up = new THREE.Vector3(0, 1, 0);
      segMesh.quaternion.setFromUnitVectors(up, dir.clone().normalize());

      group.add(segMesh);

      currX = nextX;
      currZ = nextZ;
      currYTop = nextYTop;
    }

    // simpan TTL di group
    group.userData = {
      ttl: 160,
      startTtl: 160,
    };

    this.scene.add(group);
    this.lightnings.push(group);

    // flash cahaya global
    this.lightFlashTtl = this.lightFlashStartTtl = 180;
  }

      _updateLightningEffects(deltaMs) {
    if (!this.lightnings) this.lightnings = [];

    for (let i = this.lightnings.length - 1; i >= 0; i--) {
      const bolt = this.lightnings[i];
      const data = bolt.userData;
      data.ttl -= deltaMs;

      const t = Math.max(data.ttl, 0);
      const alpha = t / data.startTtl;

      // apply fade ke semua mesh di dalam group
      bolt.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.opacity = alpha;
        }
      });

      if (data.ttl <= 0) {
        this.scene.remove(bolt);
        this.lightnings.splice(i, 1);
      }
    }

    // flash cahaya
    if (this.lightFlashTtl > 0) {
      this.lightFlashTtl -= deltaMs;
      const t = Math.max(this.lightFlashTtl, 0) / this.lightFlashStartTtl;
      const flashStrength = Math.sin((1 - t) * Math.PI);

      if (this.ambientLight && this.directionalLight) {
        this.ambientLight.intensity =
          this.baseAmbientIntensity + flashStrength * 0.8;

        this.directionalLight.intensity =
          this.baseDirectionalIntensity + flashStrength * 2.5;
      }

      if (this.lightFlashTtl <= 0) {
        if (this.ambientLight) {
          this.ambientLight.intensity = this.baseAmbientIntensity;
        }
        if (this.directionalLight) {
          this.directionalLight.intensity = this.baseDirectionalIntensity;
        }
      }
    }
  }



  _cutBox(topLayer, overlap, size, delta) {
    const direction = topLayer.direction;
    const newWidth = direction === 'x' ? overlap : topLayer.width;
    const newDepth = direction === 'z' ? overlap : topLayer.depth;

    topLayer.width = newWidth;
    topLayer.depth = newDepth;

    topLayer.threejs.scale[direction] = overlap / size;
    topLayer.threejs.position[direction] -= delta / 2;
    topLayer.cannonjs.position[direction] -= delta / 2;

    const shape = new CANNON.Box(
      new CANNON.Vec3(newWidth / 2, BOX_HEIGHT / 2, newDepth / 2)
    );
    topLayer.cannonjs.shapes = [];
    topLayer.cannonjs.addShape(shape);
  }

  _missedTheSpot() {
    const topLayer = this.stack[this.stack.length - 1];

    const finalScore = this.stats.currentGameStats.score;
    const gameStats = this.stats.getGameSummary();

    this.finalScore = finalScore;

    this._addOverhang(
      topLayer.threejs.position.x,
      topLayer.threejs.position.z,
      topLayer.width,
      topLayer.depth
    );

    this.world.removeBody(topLayer.cannonjs);
    this.scene.remove(topLayer.threejs);
    this.stack.pop();

    this.gameEnded = true;

    this.stats.endGame();

    this._startZoomOutIfNeeded();

    if (this.finalScore >= 20) {
      this.pendingGameOver = {
        gameStats,
        score: finalScore,
      };
      this.gameOverShown = false;
      this.gameOverDelayElapsed = 0;
    } else {
      // Show results immediately for scores < 20
      this.feedback.showGameOverFeedback(gameStats);
      this.ui.showResults(gameStats, finalScore);
      this.gameOverShown = true;
      this.pendingGameOver = null;
    }
    this.gameOverShown = false;
    this.gameOverDelayElapsed = 0;

    this.ui.updateHUD(this.stats, this.gameModes.getCurrentConfig(), this.gameEnded);
  }

  _animate(time) {
    if (this.lastTime) {
      const timePassed = time - this.lastTime;
      const currentLevel = this.stack.length - 2;
      let speed = this.gameModes.getSpeed(currentLevel);

      if (this.autopilot) {
        speed *= AUTOPILOT_SPEED_FACTOR;
      }

      const topLayer = this.stack[this.stack.length - 1];
      const previousLayer = this.stack[this.stack.length - 2];

      if (!this.isZoomingOut) {
        if (this.camera.position.y < BOX_HEIGHT * (this.stack.length - 2) + 4) {
          this.camera.position.y += speed * 10;
        }
      }

      if (this.gameEnded && !this.gameOverShown && this.pendingGameOver) {
        this.gameOverDelayElapsed += timePassed;

        if (this.gameOverDelayElapsed >= this.gameOverDelayDuration) {
          this.feedback.showGameOverFeedback(this.pendingGameOver.gameStats);
          this.ui.showResults(
            this.pendingGameOver.gameStats,
            this.pendingGameOver.score
          );
          this.gameOverShown = true;
        }
      }

      const boxShouldMove =
        !this.gameEnded &&
        (!this.autopilot ||
          (this.autopilot &&
            topLayer.threejs.position[topLayer.direction] <
            previousLayer.threejs.position[topLayer.direction] +
            this.robotPrecision));

      if (boxShouldMove) {
        const direction = topLayer.direction;
        const currentPos = topLayer.threejs.position[direction];
        const movement = speed * timePassed;

        if (topLayer.bounceDirection === undefined) {
          topLayer.bounceDirection = 1;
        }

        let nextPos = currentPos + (movement * topLayer.bounceDirection);

        if (nextPos >= MOVE_BOUNDS.max) {
          topLayer.bounceDirection = -1;
          nextPos = MOVE_BOUNDS.max - 0.1;
        } else if (nextPos <= MOVE_BOUNDS.min) {
          topLayer.bounceDirection = 1;
          nextPos = MOVE_BOUNDS.min + 0.1;
        }

        topLayer.threejs.position[direction] = nextPos;
        topLayer.cannonjs.position[direction] = nextPos;
      } else {
        if (this.autopilot) {
          this._splitBlockAndNextOneIfOverlaps();
          this._setRobotPrecision();
        }
      }

      this._updatePerfectBorders(timePassed);
      this._updateZoomOut(timePassed);
      this._updatePhysics(timePassed);
      this._updateLightningEffects(timePassed);
      this.renderer.render(this.scene, this.camera);
    }
    this.lastTime = time;
  }

  _updatePhysics(timePassed) {
    this.world.step(timePassed / 1000);

    this.overhangs.forEach(el => {
      el.threejs.position.copy(el.cannonjs.position);
      el.threejs.quaternion.copy(el.cannonjs.quaternion);
    });
  }

  onResize() {
    const aspect = window.innerWidth / window.innerHeight;
    const width = 10;
    const height = width / aspect;

    this.camera.left = width / -2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = height / -2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  showReview() {
    const gameStats = this.stats.getGameSummary();
    const allTimeStats = this.stats.getAllTimeStats();
    this.review.show(gameStats, allTimeStats);
  }

  _spawnPerfectBorder(layer) {
    const borderGeo = new THREE.BoxGeometry(layer.width, BOX_HEIGHT, layer.depth);
    const borderEdges = new THREE.EdgesGeometry(borderGeo);

    const borderMat = new THREE.LineBasicMaterial({
      color: 0x00ff00,      // Bright green
      transparent: true,
      opacity: 1.0,
      linewidth: 15,
    });

    const border = new THREE.LineSegments(borderEdges, borderMat);

    // Add a glowing outer border
    const glowMat = new THREE.LineBasicMaterial({
      color: 0x88ff88,      // Lighter green
      transparent: true,
      opacity: 0.5,
      linewidth: 25,        // Thicker for glow effect
    });

    const glowBorder = new THREE.LineSegments(borderEdges, glowMat);

    // Position both borders
    border.position.copy(layer.threejs.position);
    border.position.y -= BOX_HEIGHT / 2 + 0.02;

    glowBorder.position.copy(layer.threejs.position);
    glowBorder.position.y -= BOX_HEIGHT / 2 + 0.01; // Slightly higher

    // Store both for fading
    border.userData = { ttl: 500, startTtl: 500 };
    glowBorder.userData = { ttl: 500, startTtl: 500 };

    this.scene.add(border);
    this.scene.add(glowBorder);
    this.perfectBorders.push(border);
    this.perfectBorders.push(glowBorder);
  }

  _updatePerfectBorders(deltaMs) {
    for (let i = this.perfectBorders.length - 1; i >= 0; i--) {
      const border = this.perfectBorders[i];
      border.userData.ttl -= deltaMs;

      const t = Math.max(border.userData.ttl, 0);
      const alpha = t / border.userData.startTtl;

      // fade opacity
      border.material.opacity = alpha;

      if (border.userData.ttl <= 0) {
        this.scene.remove(border);
        this.perfectBorders.splice(i, 1);
      }
    }
  }

  _startZoomOutIfNeeded() {
    const level = this.finalScore; // how many layers left

    // only zoom out for tall towers
    if (level < 25) return;

    this.isZoomingOut = true;
    this.zoomElapsed = 0;

    // starting camera state
    this.zoomFromPos = this.camera.position.clone();
    this.zoomFromZoom = this.camera.zoom;

    // estimate top of tower
    const topY = BOX_HEIGHT * (level + 2);

    // pull camera up and back a bit
    this.zoomToPos = new THREE.Vector3(
      this.camera.position.x + 8,  // move out on X
      topY * 0.9 + 4,              // move up so tower fits
      this.camera.position.z + 8   // move back on Z
    );

    // zoom out (orthographic: < 1 = farther view)
    this.zoomToZoom = 0.2;      // tweak to taste
  }

  _updateZoomOut(deltaMs) {
    if (!this.isZoomingOut) return;

    this.zoomElapsed += deltaMs;
    const tRaw = Math.min(this.zoomElapsed / this.zoomDuration, 1);
    // ease-out cubic
    const t = 1 - Math.pow(1 - tRaw, 3);

    // interpolate camera position
    this.camera.position.lerpVectors(this.zoomFromPos, this.zoomToPos, t);
    // interpolate zoom
    this.camera.zoom =
      this.zoomFromZoom + (this.zoomToZoom - this.zoomFromZoom) * t;
    this.camera.updateProjectionMatrix();

    if (t >= 1) {
      this.isZoomingOut = false;
    }
  }
}
