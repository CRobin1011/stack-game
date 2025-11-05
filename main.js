import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { StatsManager } from './js/stats.js'
import { GameModes } from './js/gameModes.js'
import { FeedbackSystem } from './js/feedback.js'
import { ReviewSystem } from './js/review.js'

window.focus()

// Game State
let camera, scene, renderer
let world
let lastTime
let stack
let overhangs
const boxHeight = 1
const originalBoxSize = 3
let autopilot
let gameEnded
let robotPrecision
let gameStartTime
let lastClickTime
let blockMoveStartTime

// Game Systems
const stats = new StatsManager()
const gameModes = new GameModes()
const feedback = new FeedbackSystem()
const review = new ReviewSystem()

// DOM Elements
const scoreElement = document.getElementById('score')
const instructionsElement = document.getElementById('instructions')
const resultsElement = document.getElementById('results')
const gameHudElement = document.getElementById('game-hud')
const currentModeElement = document.getElementById('current-mode')
const currentComboElement = document.getElementById('current-combo')
const currentFocusElement = document.getElementById('current-focus')

// Mode Selection Elements
const modeSelector = document.getElementById('mode-selector')
const selectModeBtn = document.getElementById('select-mode-btn')
const quickStartBtn = document.getElementById('quick-start-btn')
const startSelectedModeBtn = document.getElementById('start-selected-mode')

// Result Elements
const finalScoreElement = document.getElementById('final-score-value')
const quickComboElement = document.getElementById('quick-combo')
const quickFocusElement = document.getElementById('quick-focus')
const viewReviewBtn = document.getElementById('view-review-btn')
const playAgainBtn = document.getElementById('play-again-btn')

// Stats Panel Elements
const statsPanel = document.getElementById('stats-panel')
const menuBtn = document.getElementById('menu-btn')

let selectedMode = GameModes.CLASSIC

init()

function setRobotPrecision() {
    robotPrecision = Math.random() * 1 - 0.5
}

function init() {
    setupEventListeners()
    setupThreeJS()
    setupGame()
    
    // Apply initial mode styling
    gameModes.applyModeStyles()
    
    // Update UI
    updateHUD()
}

function setupEventListeners() {
    // Mode selection
    selectModeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        showModeSelector()
    })
    quickStartBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        // Direct start classic mode without showing mode selector
        selectedMode = GameModes.CLASSIC
        startGame(GameModes.CLASSIC)
    })
    startSelectedModeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        hideModeSelector()
        startGame(selectedMode)
    })
    
    // Mode cards
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation()
            document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'))
            card.classList.add('selected')
            selectedMode = card.dataset.mode
        })
    })
    
    // Game controls
    window.addEventListener('mousedown', eventHandler)
    window.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            event.preventDefault()
            eventHandler()
        }
    })
    
    // Results
    viewReviewBtn.addEventListener('click', showReview)
    playAgainBtn.addEventListener('click', () => startGame(gameModes.getCurrentMode()))
    
    // Menu
    menuBtn.addEventListener('click', showStatsPanel)
    
    // Review callbacks
    review.setOnPlayAgain(() => startGame(gameModes.getCurrentMode()))
    review.setOnViewStats(showStatsPanel)
    
    // Window resize
    window.addEventListener('resize', onWindowResize)
}

function setupThreeJS() {
    const aspect = window.innerWidth / window.innerHeight
    const width = 10
    const height = width / aspect

    camera = new THREE.OrthographicCamera(
        width / -2,
        width / 2,
        height / 2,
        height / -2,
        0,
        100
    )

    camera.position.set(4, 4, 4)
    camera.lookAt(0, 0, 0)

    scene = new THREE.Scene()

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const dLight = new THREE.DirectionalLight(0xffffff, 0.6)
    dLight.position.set(10, 20, 0)
    scene.add(dLight)

    renderer = new THREE.WebGLRenderer({antialias: true})
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setAnimationLoop(animate)
    renderer.setPixelRatio(window.devicePixelRatio)
    document.body.appendChild(renderer.domElement)
}

function setupGame() {
    autopilot = true
    gameEnded = false
    lastTime = 0
    stack = []
    overhangs = []
    setRobotPrecision()

    world = new CANNON.World()
    world.gravity.set(0, -10, 0)
    world.broadphase = new CANNON.NaiveBroadphase()
    world.solver.iterations = 40

    addLayer(0, 0, originalBoxSize, originalBoxSize)
    addLayer(-10, 0, originalBoxSize, originalBoxSize, 'x')
    
    // Hide game HUD initially
    if (gameHudElement) {
        gameHudElement.style.display = 'none'
    }
}

function showModeSelector() {
    modeSelector.classList.remove('hidden')
    instructionsElement.style.display = 'none'
    requestAnimationFrame(() => {
        modeSelector.classList.add('show')
    })
}

function hideModeSelector() {
    modeSelector.classList.remove('show')
    setTimeout(() => {
        modeSelector.classList.add('hidden')
    }, 300)
}

function showStatsPanel() {
    updateStatsPanel()
    statsPanel.classList.remove('hidden')
    requestAnimationFrame(() => {
        statsPanel.classList.add('show')
    })
}

function hideStatsPanel() {
    statsPanel.classList.remove('show')
    setTimeout(() => {
        statsPanel.classList.add('hidden')
    }, 300)
}

function updateStatsPanel() {
    const allTimeStats = stats.getAllTimeStats()
    
    document.getElementById('total-games').textContent = allTimeStats.gamesPlayed
    document.getElementById('high-score').textContent = allTimeStats.highScore
    document.getElementById('avg-focus').textContent = Math.round(allTimeStats.averageFocusIndex)
    document.getElementById('accuracy').textContent = Math.round((1 - allTimeStats.averageErrorPercentage / 100) * 100) + '%'
    
    document.getElementById('total-score').textContent = allTimeStats.totalScore
    document.getElementById('longest-combo').textContent = allTimeStats.longestCombo
    document.getElementById('total-perfects').textContent = allTimeStats.totalPerfects
    document.getElementById('best-error').textContent = Math.round(allTimeStats.bestErrorPercentage) + '%'
    document.getElementById('play-time').textContent = Math.round(allTimeStats.totalPlayTime / 60000) + 'm'
    document.getElementById('best-focus-index').textContent = allTimeStats.bestFocusIndex
}

function startGame(mode = GameModes.CLASSIC) {
    // Set game mode
    gameModes.setMode(mode)
    
    // Initialize game state
    autopilot = false
    gameEnded = false
    lastTime = 0
    gameStartTime = Date.now()
    lastClickTime = Date.now()
    stack = []
    overhangs = []

    // Clear feedback
    feedback.clearAllPopups()

    // Hide UI elements
    if (instructionsElement) instructionsElement.style.display = 'none'
    if (resultsElement) resultsElement.style.display = 'none'
    if (modeSelector) hideModeSelector()

    // Show game HUD and hide initial screens
    if (gameHudElement) {
        gameHudElement.style.display = 'flex'
    }

    // Reset score display
    if (scoreElement) scoreElement.innerText = 0

    // Clear world and scene
    if (world) {
        while (world.bodies.length > 0) {
            world.removeBody(world.bodies[0])
        }
    }
    if (scene) {
        while (scene.children.find((c) => c.type === 'Mesh')) {
            const mesh = scene.children.find((c) => c.type === 'Mesh')
            scene.remove(mesh)
        }
        addLayer(0, 0, originalBoxSize, originalBoxSize)
        addLayer(-10, 0, originalBoxSize, originalBoxSize, 'x')
    }
    if (camera) {
        camera.position.set(4, 4, 4)
        camera.lookAt(0, 0, 0)
    }

    // Start tracking stats
    stats.startGame()
    
    // Update HUD
    updateHUD()
    
    // Record block movement start time
    blockMoveStartTime = Date.now()
}

function addLayer(x, z, width, depth, direction) {
    const y = boxHeight * stack.length
    const layer = generateBox(x, y, z, width, depth, false)
    layer.direction = direction
    stack.push(layer)
}

function addOverHang(x, z, width, depth) {
    const y = boxHeight * (stack.length - 1)
    const overhang = generateBox(x, y, z, width, depth, true)
    overhangs.push(overhang)
}

function generateBox(x, y, z, width, depth, falls) {
    const geometry = new THREE.BoxGeometry(width, boxHeight, depth)
    const color = new THREE.Color(`hsl(${30 + stack.length * 4}, 100%, 50%)`)
    const material = new THREE.MeshLambertMaterial({color})
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    scene.add(mesh)

    const shape = new CANNON.Box(
        new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
    )
    let mass = falls ? 5 : 0
    mass *= width / originalBoxSize
    mass *= depth / originalBoxSize
    const body = new CANNON.Body({mass, shape})
    body.position.set(x, y, z)
    world.addBody(body)

    return {
        threejs: mesh,
        cannonjs: body,
        width,
        depth
    }
}

function cutBox(topLayer, overlap, size, delta) {
    const direction = topLayer.direction
    const newWidth = direction === 'x' ? overlap : topLayer.width
    const newDepth = direction === 'z' ? overlap : topLayer.depth

    topLayer.width = newWidth
    topLayer.depth = newDepth

    topLayer.threejs.scale[direction] = overlap / size
    topLayer.threejs.position[direction] -= delta / 2

    topLayer.cannonjs.position[direction] -= delta / 2

    const shape = new CANNON.Box(
        new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
    )
    topLayer.cannonjs.shapes = []
    topLayer.cannonjs.addShape(shape)
}

function eventHandler(event) {
    // Only handle events that are not from buttons or UI elements
    if (event && event.target) {
        // Ignore clicks on buttons, inputs, and UI elements
        if (event.target.tagName === 'BUTTON' || 
            event.target.closest('button') ||
            event.target.closest('.mode-selector') ||
            event.target.closest('.stats-panel') ||
            event.target.closest('#instructions') ||
            event.target.closest('#results')) {
            return
        }
    }
    
    if (autopilot) {
        // Only show mode selector if clicking the game canvas area
        if (!event || event.target === renderer.domElement || event.target === document.body) {
            showModeSelector()
        }
    } else {
        splitBlockAndNextOneIfOverlaps()
    }
}

function splitBlockAndNextOneIfOverlaps() {
    if (gameEnded) return

    const currentTime = Date.now()
    const topLayer = stack[stack.length - 1]
    const previousLayer = stack[stack.length - 2]
    const direction = topLayer.direction

    const size = direction === 'x' ? topLayer.width : topLayer.depth
    const delta = topLayer.threejs.position[direction] - previousLayer.threejs.position[direction]
    const overhangSize = Math.abs(delta)
    const overlap = size - overhangSize

    // Calculate timing error (difference from optimal timing)
    const timingError = currentTime - lastClickTime - 500 // assuming 500ms is optimal
    
    // Calculate alignment offset percentage
    const alignmentOffset = (overhangSize / size) * 100

    // Check if there's any overlap at all
    if (overlap > 0.1) { // Small threshold to account for floating point precision
        // Successful placement
        const errorPercentage = (overhangSize / size) * 100
        const isPerfect = errorPercentage < 5 // Perfect if less than 5% error

        if (isPerfect) {
            stats.addPerfect()
            feedback.showPerfectFeedback()
        }

        // Add error metrics
        stats.addError(errorPercentage, Math.abs(timingError), alignmentOffset)
        
        // Add score
        stats.addScore()
        
        // Cut the box
        cutBox(topLayer, overlap, size, delta)

        // Create overhang if there is one
        if (overhangSize > 0.1) {
            const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta)
            const overhangX = direction === 'x' 
                ? topLayer.threejs.position.x + overhangShift 
                : topLayer.threejs.position.x
            const overhangZ = direction === 'z' 
                ? topLayer.threejs.position.z + overhangShift 
                : topLayer.threejs.position.z
            const overhangWidth = direction === 'x' ? overhangSize : topLayer.width
            const overhangDepth = direction === 'z' ? overhangSize : topLayer.depth

            addOverHang(overhangX, overhangZ, overhangWidth, overhangDepth)
        }

        // Prepare next layer
        const nextX = direction === 'x' ? topLayer.threejs.position.x : -10
        const nextZ = direction === 'z' ? topLayer.threejs.position.z : -10
        const newWidth = topLayer.width
        const newDepth = topLayer.depth
        const nextDirection = direction === 'x' ? 'z' : 'x'

        // Update score display
        const currentScore = stack.length - 1
        if (scoreElement) scoreElement.innerText = currentScore

        // Check for milestone feedback
        feedback.showMilestoneMessage(currentScore)
        
        // Check for combo feedback
        feedback.showComboFeedback(stats.currentGameStats.combo, gameModes.getCurrentMode())
        
        // Check for mode-specific feedback
        const modeMessage = gameModes.getModeSpecificFeedback(currentScore, stats.currentGameStats.combo)
        feedback.showModeSpecificFeedback(modeMessage)

        // Add next layer
        addLayer(nextX, nextZ, newWidth, newDepth, nextDirection)
        
        // Record new block movement start time
        blockMoveStartTime = currentTime
        
    } else {
        // Missed the spot - no overlap, game over
        console.log('GAME OVER - No overlap detected')
        stats.resetCombo()
        missedTheSpot()
    }

    // Update last click time
    lastClickTime = currentTime
    
    // Update HUD
    updateHUD()
}

function missedTheSpot() {
    const topLayer = stack[stack.length - 1]
    
    // Add the falling block as an overhang
    addOverHang(
        topLayer.threejs.position.x,
        topLayer.threejs.position.z,
        topLayer.width,
        topLayer.depth
    )
    
    // Remove from stack and physics world
    world.removeBody(topLayer.cannonjs)
    scene.remove(topLayer.threejs)
    stack.pop() // Remove the failed block from stack

    gameEnded = true
    
    // End game stats
    stats.endGame()
    
    // Show game over feedback
    const gameStats = stats.getGameSummary()
    feedback.showGameOverFeedback(gameStats)
    
    // Update results display
    updateResultsDisplay(gameStats)
    
    // Hide game HUD
    if (gameHudElement) gameHudElement.style.display = 'none'
    
    // Show results
    if (resultsElement && !autopilot) {
        resultsElement.style.display = 'flex'
    }
}

function updateResultsDisplay(gameStats) {
    if (finalScoreElement) {
        finalScoreElement.textContent = stats.currentGameStats.score
    }
    if (quickComboElement) {
        quickComboElement.textContent = gameStats.longestCombo.current
    }
    if (quickFocusElement) {
        quickFocusElement.textContent = gameStats.focusIndex
    }
}

function updateHUD() {
    if (currentModeElement) {
        currentModeElement.textContent = gameModes.getCurrentConfig().name
    }
    if (currentComboElement) {
        currentComboElement.textContent = stats.currentGameStats.combo
    }
    if (currentFocusElement && !gameEnded) {
        // Calculate real-time focus approximation
        const realTimeFocus = Math.max(0, Math.min(100, 
            stats.calculateFocusIndex() + Math.random() * 10 - 5
        ))
        currentFocusElement.textContent = Math.round(realTimeFocus)
    }
}

function showReview() {
    const gameStats = stats.getGameSummary()
    const allTimeStats = stats.getAllTimeStats()
    review.show(gameStats, allTimeStats)
    resultsElement.style.display = 'none'
}

function animate(time) {
    if (lastTime) {
        const timePassed = time - lastTime
        const currentLevel = stack.length - 2
        let speed = gameModes.getSpeed(currentLevel)
        
        // Slow down speed for autopilot/background mode
        if (autopilot) {
            speed = speed * 0.3 // Make autopilot 70% slower for a more chill background
        }

        const topLayer = stack[stack.length - 1]
        const previousLayer = stack[stack.length - 2]

        // Update camera position
        if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
            camera.position.y += speed * 10
        }

        const boxShouldMove =
            !gameEnded &&
            (!autopilot ||
                (autopilot &&
                topLayer.threejs.position[topLayer.direction] <
                    previousLayer.threejs.position[topLayer.direction] +
                        robotPrecision))

        if (boxShouldMove) {
            const direction = topLayer.direction
            const currentPos = topLayer.threejs.position[direction]
            const movement = speed * timePassed
            
            // Check bounds and implement bouncing
            const maxBounds = 6  // Reduced bounds to make bouncing more visible
            const minBounds = -5
            
            // Initialize bounce direction if not set
            if (topLayer.bounceDirection === undefined) {
                topLayer.bounceDirection = 1 // Start moving in positive direction
            }
            
            // Calculate next position
            let nextPos = currentPos + (movement * topLayer.bounceDirection)
            
            // Check for bouncing
            if (nextPos >= maxBounds) {
                topLayer.bounceDirection = -1 // Reverse to negative direction
                nextPos = maxBounds - 0.1 // Keep within bounds
            } else if (nextPos <= minBounds) {
                topLayer.bounceDirection = 1 // Reverse to positive direction  
                nextPos = minBounds + 0.1 // Keep within bounds
            }
            
            // Update positions
            topLayer.threejs.position[direction] = nextPos
            topLayer.cannonjs.position[direction] = nextPos
            
        } else {
            if (autopilot) {
                splitBlockAndNextOneIfOverlaps()
                setRobotPrecision()
            }
        }

        updatePhysics(timePassed)
        renderer.render(scene, camera)
    }
    lastTime = time
}

function updatePhysics(timePassed) {
    world.step(timePassed / 1000)

    overhangs.forEach((el) => {
        el.threejs.position.copy(el.cannonjs.position)
        el.threejs.quaternion.copy(el.cannonjs.quaternion)
    })
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight
    const width = 10
    const height = width / aspect

    camera.left = width / -2
    camera.right = width / 2
    camera.top = height / 2
    camera.bottom = height / -2
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}

// Additional event listeners for stats panel
document.addEventListener('DOMContentLoaded', () => {
    // Stats panel close handlers
    const statsCloseBtn = document.querySelector('.stats-close')
    const statsBackdrop = document.querySelector('.stats-backdrop')
    const closeStatsBtn = document.getElementById('close-stats-btn')
    
    if (statsCloseBtn) statsCloseBtn.addEventListener('click', hideStatsPanel)
    if (statsBackdrop) statsBackdrop.addEventListener('click', hideStatsPanel)
    if (closeStatsBtn) closeStatsBtn.addEventListener('click', hideStatsPanel)
    
    // Reset stats button
    const resetStatsBtn = document.getElementById('reset-stats-btn')
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
                localStorage.removeItem('stackGameStats')
                stats.stats = stats.loadStats()
                updateStatsPanel()
                feedback.showPopup('📊 Statistics reset!', 'milestone', 2000)
            }
        })
    }
    
    // Mode selector backdrop
    const modeBackdrop = document.querySelector('.mode-backdrop')
    if (modeBackdrop) {
        modeBackdrop.addEventListener('click', hideModeSelector)
    }
    
    // Initialize default selected mode
    const classicCard = document.querySelector('.mode-card[data-mode="classic"]')
    if (classicCard) {
        classicCard.classList.add('selected')
    }
})