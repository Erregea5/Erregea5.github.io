import * as three from 'three';
import {FirstPersonControls} from 'three/examples/jsm/controls/FirstPersonControls';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {paintingState,changeObj,paintingGuiInit} from './setPaintings';
import {sceneGui,sceneState} from './setScene';
import * as dodgeGame from './games/dodge'

const DEBUG=true;

let scene, camera, renderer;

const objectLoader=new three.ObjectLoader();
const imageLoader=new three.TextureLoader();
const fileLoader=new three.FileLoader();
const geometryLoader=new GLTFLoader();

const paintingGeometry=new three.PlaneGeometry(1.512,1.512);
const paintingGeometryHD=new three.PlaneGeometry(1.512,1.512,300);
const uniformObjects=[];

const blend={blending:three.CustomBlending,blendEquation:three.AddEquation};

const captionDiv=document.createElement('div');
captionDiv.className='no-caption';
document.body.appendChild(captionDiv);
const caption={
    top:document.createElement('div'),
    bottom:document.createElement('div'),
    link:document.createElement('a'),
};
for(let e in caption)
    captionDiv.appendChild(caption[e]);
const button=document.createElement('button');
button.textContent='E';
button.className='action';

let paused=true;
const canvases={dodgeGame:new three.CanvasTexture(dodgeGame.canvas)};
const actions={
    none:null,
    drink:()=>{console.log('drink');camera.health-=10;},
    walkThrough:()=>{console.log('walk');camera.position.y=10;},
    dodgeGame:()=>{
        paused=!paused;
        if(paused)
            dodgeGame.onPause();
        else
            dodgeGame.onPlay();
        }
};
let actionList=[];
for(let action in actions)
    actionList.push(action);

function init(){
    scene = new three.Scene();
    camera = new three.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.health=100;

    renderer = new three.WebGLRenderer();
    window.onresize=(ev)=>{
        camera.aspect=window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    
    createScene();
    createPaintings();

    if(DEBUG){
        paintingGuiInit();
        paintingState.scene=scene;
        paintingState.uniformObjects=uniformObjects;
        paintingState.geometry={normal:paintingGeometry,HD:paintingGeometryHD};
        paintingState.blend=blend;
        paintingState.actions=actionList;
        paintingState.canvases=canvases;
        for(let canvas in paintingState.canvases){
            paintingState.canvases[canvas].anisotropy=4;
            paintingState.canvasNames.push(canvas);
        }

        paintingState.addNew=()=>{
            if(paintingState.newName=='')
                return;
            if(paintingState.newName in paintingState.objects){
                changeObj(paintingState.newName,paintingState.objects[paintingState.newName]);
                return;
            }
            geometryLoader.load('meshes/paintingFrame.glb',(data)=>{
                data.scene.children[0].material.color.setHex(0x2f1f3f);
                const material = new three.ShaderMaterial(blend);
                const painting = new three.Mesh(paintingGeometry, material);
                const spotLight = new three.SpotLight(0xffffff,1000);
                spotLight.target=painting;
                data.scene.add(spotLight);
                const spotLightHelper = new three.SpotLightHelper(spotLight);
                data.scene.add(spotLightHelper);

                painting.rotateX(Math.PI/2);
                data.scene.add(painting);
                data.scene.rotateX(-Math.PI/2);

                scene.add(data.scene);
                changeObj(paintingState.newName,data.scene);
            });
        }
    }
}

function createScene(){
    let props;
    if(DEBUG){
        const propsString= localStorage.getItem('sceneProps');
        console.log('props:'+propsString);
        if(propsString)
            props=JSON.parse(propsString);
        else
            props={
                museum:{
                    color:0x2f1f3f,
                    position:new three.Vector3(0,0,0),
                    rotation:new three.Euler(0,0,0,'XYZ'),
                    scale:new three.Vector3(1,1,1)
                },
                ambient:{color:0xffffff},
                spotLight:{
                    color:0xffffff,
                    position:new three.Vector3(0,15,0),
                    power:1000.0
                },
                floor:{
                    position:new three.Vector3(0,0,0),
                    color:0x6f4f7f,
                    scale:new three.Vector3(1,1,1)
                },
                skyBox:{
                    position:new three.Vector3(0,2.5,0),
                    scale:new three.Vector3(1,1,1)
                }
            };
    }
    else
        props= require('./sceneProps.json');
    
    const ambientLight=new three.AmbientLight(props.ambient.color);
    scene.add(ambientLight);

    const spotLight = new three.SpotLight(props.spotLight.color);
    spotLight.power=props.spotLight.power;
    spotLight.position.copy(props.spotLight.position);
    scene.add(spotLight);

    const spotLightHelper = new three.SpotLightHelper(spotLight);
    scene.add(spotLightHelper);

    const floorGeometry=new three.PlaneGeometry(100,100);
    const floorMaterial=new three.MeshPhongMaterial({color:props.floor.color,side:three.DoubleSide});
    const floor=new three.Mesh(floorGeometry,floorMaterial);
    floor.rotateX(Math.PI/2);
    floor.position.copy(props.floor.position);
    floor.scale.copy(props.floor.scale);
    scene.add(floor);

    
    geometryLoader.load('meshes/museum.glb',(data)=>{
        data.scene.children[0].material.side=three.DoubleSide;
        data.scene.children[0].material.color.setHex(props.museum.color);
        data.scene.children[0].position.copy(props.museum.position);
        data.scene.children[0].rotation.set(props.museum.rotation._x,props.museum.rotation._y,props.museum.rotation._z,'XYZ');
        data.scene.children[0].scale.copy(props.museum.scale);
        scene.add(data.scene);
        spotLight.target=data.scene.children[0];
        if(DEBUG)
            sceneState.museum=data.scene.children[0];
    });

    const eyeGeometry=new three.PlaneGeometry(2,2);
    const cubeEyeSides=[
        {eye:'rinnegan',position:new three.Vector3(0,1,0)},
        {eye:'rinnegan',position:new three.Vector3(0,-1,0)},
        {eye:'byakugan',position:new three.Vector3(1,0,0)},
        {eye:'ketsuryugan',position:new three.Vector3(-1,0,0)},
        {eye:'sharingan',position:new three.Vector3(0,0,1)},
        {eye:'mangekyo',position:new three.Vector3(0,0,-1)}
    ];
    fileLoader.load('shaders/eyes/eyes.vert',vshader=>{
        const eyes=new three.Scene();
        for(let side of cubeEyeSides){
                fileLoader.load('shaders/eyes/'+side.eye+'.frag',fshader=>{
                    const eyeMaterial=new three.ShaderMaterial({
                        uniforms:{iTime:{value:100.0}},
                        fragmentShader:fshader,
                        vertexShader:vshader
                    });
                    uniformObjects.push(eyeMaterial.uniforms);
                    const eye=new three.Mesh(eyeGeometry,eyeMaterial);
                    eye.position.copy(side.position);
                    eye.lookAt(new three.Vector3(0,0,0));
                    eyes.add(eye);
                })
        }
        const skyGeometry=new three.SphereGeometry(1);
        fileLoader.load('shaders/sky.vert',vshader=>
            fileLoader.load('shaders/sky.frag',fshader=>{ 
                const skyMaterial=new three.ShaderMaterial({
                    uniforms:{iTime:{value:1.0}},
                    vertexShader:vshader,
                    fragmentShader:fshader
                });
                uniformObjects.push(skyMaterial.uniforms);
                const epilepsy=new three.Mesh(skyGeometry,skyMaterial);
                epilepsy.rotateZ(Math.PI/2);
                epilepsy.scale.set(.1,.1,.1);
                eyes.add(epilepsy);

                eyes.position.set(1,0,4);

                eyes.position.copy(props.skyBox.position);
                eyes.scale.copy(props.skyBox.scale);
                scene.add(eyes);
                
                if(DEBUG){
                    sceneState.camera=camera;
                    sceneState.spotLight=spotLight;
                    sceneState.ambient=ambientLight;
                    sceneState.floor=floor;
                    sceneState.skyBox=eyes;
                    sceneGui();
                }
            }));
    });
}

function createPaintings(){
    let paintings;
    if(DEBUG){
        const paintingsString=localStorage.getItem('paintings');
        console.log('paintings: '+paintingsString);
        if(!paintingsString)
            return;
        paintings=JSON.parse(paintingsString);
    }
    else
        paintings= require('./paintings.json');
    for(let name in paintings){
        const painting=paintings[name];
        geometryLoader.load('meshes/paintingFrame.glb',(data)=>{
            data.scene.children[0].material.color.setHex(painting.color);
            data.scene.position.copy(painting.position);
            data.scene.rotation.set(painting.rotation._x,painting.rotation._y,painting.rotation._z);
            data.scene.scale.copy(painting.scale);
            data.scene.text=painting.text;
            data.scene.action=painting.action;
            data.scene.isHD=painting.isHD;
            data.scene.imageType=painting.imageType;

            const add=paint=>{
                const spotLight = new three.SpotLight(painting.light.color);
                spotLight.power=painting.light.power;
                spotLight.target=paint;
                data.scene.add(spotLight);
                const spotLightHelper = new three.SpotLightHelper(spotLight);
                data.scene.add(spotLightHelper);

                paint.rotateX(Math.PI/2);
                spotLight.position.copy(painting.light.position);
                data.scene.add(paint);
                scene.add(data.scene);
                if(DEBUG)
                    changeObj(name,data.scene);
            };
            const paintGeo=painting.isHD?paintingGeometryHD:paintingGeometry;
            switch(painting.imageType){
            case('image'):
                data.scene.image=painting.image;
                imageLoader.load('images/'+painting.image,(data)=>{
                    data.anisotropy=4;
                    add(new three.Mesh(paintGeo, new three.MeshBasicMaterial({map:data,...blend})))
                });
                break;
            case('shader'):
                data.scene.shader=painting.shader;
                fileLoader.load('shaders/'+painting.shader+'.vert',(vshader)=>
                    fileLoader.load('shaders/'+painting.shader+'.frag',(fshader)=>{ 
                        const mesh=new three.Mesh(paintGeo, new three.ShaderMaterial({
                            uniforms:{iTime:{value:100.0}},
                            vertexShader:vshader,
                            fragmentShader:fshader,
                            ...blend
                        }));
                        add(mesh);
                        uniformObjects.push(mesh.material.uniforms);
                    }));
                break;
            case('canvas'):
                data.scene.canvas=painting.canvas;
                canvases[painting.canvas].anisotropy=4;
                add(new three.Mesh(paintGeo,new three.MeshBasicMaterial({map:canvases[painting.canvas],...blend})));
                break;
            }
        });
    }
}

const constraints={
    y:.6,
    bigBound:{lo:new three.Vector3(-1.867,.6,-19.35),hi:new three.Vector3(5.5,.6,8.898)},
    smallBound:{lo:new three.Vector3(-1.867,.6,-7.5),hi:new three.Vector3(15.5,.6,-2.9)},
    e:.5,
    controls:undefined,
    moveForward:0,moveBackward:0,moveLeft:0,moveRight:0,
    velocity:new three.Vector3(0,0,0),
    direction:new three.Vector2(0,0),
    init:function(){
        this.controls=new PointerLockControls(camera,renderer.domElement);
        window.onkeydown=ev=>{
            if(ev.key=='e') button.click();
            if(ev.key=='q') {
                if(this.controls.isLocked)this.controls.unlock();
                else this.controls.lock();
            }
            switch ( ev.code ) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = 1;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = 1;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = 1;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = 1;
                    break;
            }
        };
        window.onkeyup=ev=> {
            switch ( ev.code ) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = 0;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = 0;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = 0;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = 0;
                    break;
            }
        };
    },
    move:function(delta){
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.y = this.moveForward-this.moveBackward;
        this.direction.x = this.moveRight-this.moveLeft;
        this.direction.normalize();

        if ( this.moveForward || this.moveBackward ) this.velocity.z -= this.direction.y * 40.0 * delta;
        if ( this.moveLeft || this.moveRight ) this.velocity.x -= this.direction.x * 40.0 * delta;

        this.controls.moveRight( - this.velocity.x * delta );
        this.controls.moveForward( - this.velocity.z * delta );
    },
    keepInBounds:function(pos){
        if(Math.abs(pos.y-10)<this.e){
            pos.y=10;
            camera.health-=1;
            return;
        }
        // pos=new three.Vector3();
        let upperBound=new three.Vector3();
        upperBound.copy(this.bigBound.hi);
        let lowerBound=new three.Vector3();
        lowerBound.copy(this.bigBound.lo);

        if((pos.z<this.smallBound.hi.z+this.e)&&(pos.z>this.smallBound.lo.z-this.e)){
            upperBound.copy(this.smallBound.hi);
            if(pos.x>=this.bigBound.hi.x)
                lowerBound.copy(this.smallBound.lo);
            else
                upperBound.setZ(this.bigBound.hi.z);
        }
        
        pos.clamp(lowerBound,upperBound);
    },
    manageHealth:function(){
        if(camera.health==0){
            camera.position.set(0,0,0);
            camera.health=100;
        }
    }
};

let none={top:'',bottom:'',link:'',href:''};
let curText={top:'',bottom:'',link:'',href:''};
function renderText(text,action){
    let k=true;
    for(let t in text)
        if(text[t]!=curText[t])
            k=false;
        
    if(k)return;

    if(text==none)
        captionDiv.className='no-caption';
    else
        captionDiv.className='caption';

    for(let t in caption){
        caption[t].textContent=text[t];
        curText[t]=text[t]
    }
    if(text.href!='')
        caption.link.href=text.href;

    if(action){
        if(!caption.hasButton){
            caption.hasButton=true;
            caption[0].append(button);
        }
        button.onclick=action;
    }
    else if(caption.hasButton){
        caption.hasButton=false;
        button.remove();
        button.onclick=()=>{console.log('hi')};
    }
}

const clock=new three.Clock();
const distanceToPaintings2=20;

function animate() {
	requestAnimationFrame( animate );
    constraints.manageHealth();
    constraints.move(clock.getDelta());
    constraints.keepInBounds(camera.position);
    for(let uniform of uniformObjects){
        if(uniform.iTime)
            uniform.iTime.value=clock.elapsedTime;
    }
    let text=none;
    let action=null;
    for(let painting in paintingState.objects){
        if(paintingState.objects[painting].position)
        if(paintingState.objects[painting].position.distanceToSquared(camera.position)<=distanceToPaintings2){
            text=paintingState.objects[painting].text;
            action=actions[paintingState.objects[painting].action];
            break;
        }
    }
    for(let canvas in canvases)
        canvases[canvas].needsUpdate=true;
    renderText(text,action);
	renderer.render( scene, camera );
}

init();
constraints.init();
animate();