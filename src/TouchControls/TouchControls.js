import * as THREE from 'three'
import RotationPad from './RotationPad.js'
import MovementPad from './MovementPad.js'


class TouchControls {
    rotationPad
    movementPad
    container
    config
    //fpsBody
    mouse
    enabled = true
    #scene
    #rotationMatrices
    #hitObjects
    #velocity
    fpsBody
    #maxPitch
    #isRightMouseDown = false
    #moveForward = false
    #moveBackward = false
    #moveLeft = false
    #moveRight = false
    #moveForwardLocked = false
    #moveBackwardLocked = false
    #moveLeftLocked = false
    #moveRightLocked = false
    #ztouch = 1
    #xtouch = 1
    
    constructor(container, camera, options) {
        this.container = container
        this.config = Object.assign({
            delta: 0.75,            // coefficient of movement
            moveSpeed: 0.5,         // speed of movement
            rotationSpeed: 0.002,   // coefficient of rotation
            maxPitch: 55,           // max camera pitch angle
            hitTest: true,          // stop on hitting objects
            hitTestDistance: 40,    // distance to test for hit
            //hitTestObjects: []       // objects to test for hits
        }, options)

        this.#rotationMatrices = []
        this.#hitObjects = []
        this.#maxPitch = this.config.maxPitch * Math.PI / 180
        this.#velocity = new THREE.Vector3(0, 0, 0)
        this.mouse = new THREE.Vector2()

        // this.fpsBody = new THREE.Object3D()
        // this.fpsBody.name = 'cameraHolder'
        // this.fpsBody.add(camera)

        //this.fpsBody = new THREE.Object3D()
        this.fpsBody=camera

        if(window.hasTouchPadDevice){
            // Creating rotation pad
            this.rotationPad = new RotationPad(container)
            this.rotationPad.padElement.addEventListener('YawPitch', (event) =>{
                let rotation = this.#calculateCameraRotation(event.detail.deltaX, event.detail.deltaY)
                this.setRotation(rotation.rx, rotation.ry)
            })

            // Creating movement pad
            this.movementPad = new MovementPad(container)
            this.movementPad.padElement.addEventListener('move', (event) => {
                this.#ztouch = Math.abs(event.detail.deltaY)
                this.#xtouch = Math.abs(event.detail.deltaX)

                if (event.detail.deltaY == event.detail.middle) {
                    this.#ztouch = 1
                    this.#moveForward = this.#moveBackward = false
                } else {
                    if (event.detail.deltaY > event.detail.middle) {
                        this.#moveForward = true
                        this.#moveBackward = false
                    }
                    else if (event.detail.deltaY < event.detail.middle) {
                        this.#moveForward = false
                        this.#moveBackward = true
                    }
                }

                if (event.detail.deltaX == event.detail.middle) {
                    this.#xtouch = 1
                    this.#moveRight = this.#moveLeft = false
                } else {
                    if (event.detail.deltaX < event.detail.middle) {
                        this.#moveRight = true
                        this.#moveLeft = false
                    }
                    else if (event.detail.deltaX > event.detail.middle) {
                        this.#moveRight = false
                        this.#moveLeft = true
                    }
                }
            })
            this.movementPad.padElement.addEventListener('stopMove', (event) => {
                this.#ztouch = this.#xtouch = 1
                this.#moveForward = this.#moveBackward = this.#moveLeft = this.#moveRight = false
            })
        }

        this.container.addEventListener('contextmenu', (event) => {event.preventDefault()})
        // this.container.addEventListener('mousedown', (event) => this.onMouseDown(event))
        // this.container.addEventListener('mouseup', (event) => this.onMouseUp(event))

        document.addEventListener('keydown', (event) => this.onKeyDown(event))
        document.addEventListener('keyup', (event) => this.onKeyUp(event))
        // document.addEventListener('mousemove', (event) => this.onMouseMove(event))
        // document.addEventListener('mouseout', (event) => this.onMouseOut(event))

        this.#prepareRotationMatrices()
    }

    //
    // Events
    //
    // onMouseDown(event) {
    //     if (this.enabled && event.button === 2) {
    //         this.#isRightMouseDown = true
    //         event.preventDefault()
    //         event.stopPropagation()
    //     }
    // }

    // onMouseUp(event) {
    //     if (this.enabled && event.button === 2) {
    //         this.#isRightMouseDown = false
    //     }
    // }

    // onMouseMove(event) {
    //     this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    //     this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    //     if (!this.enabled || !this.#isRightMouseDown)
    //         return

    //     let movementX = event.movementX || 0
    //     let movementY = event.movementY || 0
    //     let rotation = this.#calculateCameraRotation(-1 * movementX, -1 * movementY)

    //     // console.log(this.mouse, '\n', movementX, rotation)
    //     this.setRotation(rotation.rx, rotation.ry)
    // }

    // onMouseOut(e) {
    //     this.#isRightMouseDown = false
    //     // this.stopMouseMoving()
    // }

    onKeyDown(e) {
        if (!this.enabled)
            return

        switch (e.keyCode) {
            case 38: // up
            case 87: // w
                this.#moveForward = true
                break

            case 37: // left
            case 65: // a
                this.#moveLeft = true
                break

            case 40: // down
            case 83: // s
                this.#moveBackward = true
                break

            case 39: // right
            case 68: // d
                this.#moveRight = true
                break
        }
    }

    onKeyUp(e) {
        switch (e.keyCode) {
            case 38: // up
            case 87: // w
                this.#moveForward = false
                break

            case 37: // left
            case 65: // a
                this.#moveLeft = false
                break

            case 40: // down
            case 83: // a
                this.#moveBackward = false
                break

            case 39: // right
            case 68: // d
                this.#moveRight = false
                break

        }
    }

    //
    // Private functions
    //
    #prepareRotationMatrices() {
        let rotationMatrixF = new THREE.Matrix4()
        rotationMatrixF.makeRotationY(0)
        this.#rotationMatrices.push(rotationMatrixF)  // forward direction

        let rotationMatrixB = new THREE.Matrix4()
        rotationMatrixB.makeRotationY(180 * Math.PI / 180)
        this.#rotationMatrices.push(rotationMatrixB)  // backward direction

        let rotationMatrixL = new THREE.Matrix4()
        rotationMatrixL.makeRotationY(90 * Math.PI / 180)
        this.#rotationMatrices.push(rotationMatrixL)  // left direction

        let rotationMatrixR = new THREE.Matrix4()
        rotationMatrixR.makeRotationY((360 - 90) * Math.PI / 180)
        this.#rotationMatrices.push(rotationMatrixR)  // right direction
    }

    #calculateCameraRotation(dx, dy, factor) {
        let rFactor = factor ? factor : this.config.rotationSpeed
        let ry = this.fpsBody.rotation.y - (dx * rFactor)
        let rx = this.fpsBody.rotation.x - (dy * rFactor)
        rx = Math.max(-this.#maxPitch, Math.min(this.#maxPitch, rx))

        return {
            rx: rx,
            ry: ry
        }
    }

    #lockDirectionByIndex(index) {
        if (index == 0)
            this.lockMoveForward(true)
        else if (index == 1)
            this.lockMoveBackward(true)
        else if (index == 2)
            this.lockMoveLeft(true)
        else if (index == 3)
            this.lockMoveRight(true)
    }

    //
    // Public functions
    //
    update() {
        if (this.config.hitTest)
            this.hitTest()

        this.#velocity.x += (-1 * this.#velocity.x) * this.config.delta
        this.#velocity.z += (-1 * this.#velocity.z) * this.config.delta

        if (this.#moveForward && !this.#moveForwardLocked) {
            this.#velocity.z -= this.#ztouch * this.config.moveSpeed * this.config.delta
        }
        if (this.#moveBackward && !this.#moveBackwardLocked) {
            this.#velocity.z += this.#ztouch * this.config.moveSpeed * this.config.delta
        }
        if (this.#moveLeft && !this.#moveLeftLocked){
            this.#velocity.x -= this.#xtouch * this.config.moveSpeed * this.config.delta
        }
        if (this.#moveRight && !this.#moveRightLocked){
            this.#velocity.x += this.#xtouch * this.config.moveSpeed * this.config.delta
        }

        this.fpsBody.translateX(this.#velocity.x)
        this.fpsBody.translateY(this.#velocity.y)
        this.fpsBody.translateZ(this.#velocity.z)
    }

    //changed to only check only user specified objects
    hitTest() {
        this.unlockAllDirections()
        this.#hitObjects = []
        let cameraDirection = this.getCameraDirection()

        for (let i = 0; i < 4; i++) {
            // Apply rotation for each direction
            let direction = cameraDirection.clone()
            direction.applyMatrix4(this.#rotationMatrices[i])
            
            // this.#scene.remove(this.arrows[i]);
            // this.arrows[i] = new THREE.ArrowHelper(direction, new THREE.Vector3(0,0,0), 100, Math.random() * 0xffffff );
            // this.#scene.add(this.arrows[i]);
            
            let rayCaster = new THREE.Raycaster(this.fpsBody.position, direction)
            for(let testObject of this.config.hitTestObjects){
                //console.log(this.config)
                let intersects = rayCaster.intersectObject(testObject)
                if ((intersects.length > 0 && intersects.some(val=>val.distance < this.config.hitTestDistance))) {
                    this.#lockDirectionByIndex(i)
                    this.#hitObjects.push(intersects[0])
                    break;
                }
            }
        }

        return this.#hitObjects
    }

    //changed name and rotation
    getCameraDirection() {
        let direction = new THREE.Vector3(0, 0, -1)
        let rotation = new THREE.Euler(0, 0, 0, 'XYZ')

        let rx = this.fpsBody.rotation.x
        let ry = this.fpsBody.rotation.y

        rotation.set(rx, ry, 0)
        direction.applyEuler(rotation)
        direction.y=0;
        //console.log(direction)
        
        return direction
    }

    isMoveLeft() {
        return this.#moveLeft
    }

    isMoveRight() {
        return this.#moveRight
    }

    isMoveForward() {
        return this.#moveForward
    }

    isMoveBackward() {
        return this.#moveBackward
    }

    lockMoveForward(isLocked) {
        this.#moveForwardLocked = isLocked
    }

    lockMoveBackward(isLocked) {
        this.#moveBackwardLocked = isLocked
    }

    lockMoveLeft(isLocked) {
        this.#moveLeftLocked = isLocked
    }

    lockMoveRight(isLocked) {
        this.#moveRightLocked = isLocked
    }

    unlockAllDirections() {
        this.lockMoveForward(false)
        this.lockMoveBackward(false)
        this.lockMoveLeft(false)
        this.lockMoveRight(false)
    }

    //no need except to debug
    // addToScene(scene) {
    //     this.#scene = scene
    //     this.#scene.add(this.fpsBody)
    //     this.arrows=[
    //         new THREE.ArrowHelper(),
    //         new THREE.ArrowHelper(),
    //         new THREE.ArrowHelper(),
    //         new THREE.ArrowHelper(),
    //     ];
    //     this.arrows.forEach(x=>this.#scene.add(x));
    // }

    setPosition(x, y, z) {
        this.fpsBody.position.set(x, y, z)
    }

    stopMouseMoving() {
        this.#isRightMouseDown = false
    }
    
    setRotation(x, y) {
        if (x !== null)
          this.fpsBody.rotation.x = x

        if (y !== null)
          this.fpsBody.rotation.y = y
    }

    getHitObjects() {
        return this.#hitObjects
    }
}


export default TouchControls
