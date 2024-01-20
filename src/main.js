import * as three from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {paintingState,changeObj,paintingGuiInit} from './setPaintings';
import {sceneGui,sceneState} from './setScene';
import {renderText,button,actionList,canvases,games,paused} from './textGui';
import * as constraints from './constraints';

const DEBUG=true;

let scene, camera, renderer;

const imageLoader=new three.TextureLoader();
const fileLoader=new three.FileLoader();
const geometryLoader=new GLTFLoader();

const paintingGeometry=new three.PlaneGeometry(1.512,1.512);
const paintingGeometryHD=new three.PlaneGeometry(1.512,1.512,300);
const uniformObjects=[];

const blend={blending:three.CustomBlending,blendEquation:three.AddEquation};

function init(){
    scene = new three.Scene();
    camera = new three.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.health=100;

    renderer = new three.WebGLRenderer();
    window.onresize=ev=>{
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

        const addNew=(model,add)=>{
            if(paintingState.newName=='')
                return;
            if(paintingState.newName in paintingState.objects){
                changeObj(paintingState.newName,paintingState.objects[paintingState.newName]);
                return;
            }
            loadGeometry(model,(data)=>{
                data.scene.children[0].material.color.setHex(0x2f1f3f);
                const material = new three.ShaderMaterial(blend);
                const painting = new three.Mesh(paintingGeometry, material);
                const spotLight = new three.SpotLight(0xffffff,1000);
                spotLight.target=painting;
                data.scene.add(spotLight);

                add(painting,data.scene);

                scene.add(data.scene);
                changeObj(paintingState.newName,data.scene);
            });
        }
        paintingState.addNewPainting=()=>addNew('meshes/paintingFrame.glb',(painting,scene)=>{
            painting.rotateX(Math.PI/2);
            scene.add(painting);
            scene.rotateX(-Math.PI/2)
            scene.frameType='painting';
        });
        paintingState.addNewGame=()=>addNew('meshes/arcade.glb',(painting,scene)=>{
            painting.rotateZ(20*Math.PI/180);
            painting.scale.set(6.4,10,10);
            painting.rotateY(Math.PI/2);
            scene.rotateY(-Math.PI/2);
            scene.scale.set(.1,.1,.1);
            
            painting.position.set(.26*10,1.142*10,0);
            scene.add(painting);
            scene.frameType='game';
        });
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
        props= require('./state/sceneProps.json');
    
    const ambientLight=new three.AmbientLight(props.ambient.color);
    scene.add(ambientLight);

    const spotLight = new three.SpotLight(props.spotLight.color);
    spotLight.power=props.spotLight.power;
    spotLight.position.copy(props.spotLight.position);
    scene.add(spotLight);

    const floorGeometry=new three.PlaneGeometry(100,100);
    const floorMaterial=new three.MeshPhongMaterial({color:props.floor.color,side:three.DoubleSide});
    const floor=new three.Mesh(floorGeometry,floorMaterial);
    floor.rotateX(Math.PI/2);
    floor.position.copy(props.floor.position);
    floor.scale.copy(props.floor.scale);
    scene.add(floor);

    const setupMesh=(url,name,callback)=>{
        const originalName=name;
        if(!name||!props[name])
            name='museum';
        geometryLoader.load(url,(data)=>{
            data.scene.children[0].material.side=three.DoubleSide;
            data.scene.children[0].material.color.setHex(props[name].color);
            data.scene.children[0].position.copy(props[name].position);
            data.scene.children[0].rotation.set(props[name].rotation._x,props[name].rotation._y,props[name].rotation._z,'XYZ');
            data.scene.children[0].scale.copy(props[name].scale);
            scene.add(data.scene);
            if(callback)
                callback(data);
            if(DEBUG)
                sceneState[originalName]=data.scene.children[0];
        });
    };

    setupMesh('meshes/gallery.glb','museum',data=>
        spotLight.target=data.scene.children[0]);
    setupMesh('meshes/snake.glb','snake');
    setupMesh('meshes/elephant.glb','elephant');
    setupMesh('meshes/baseballBat.glb','baseballBat');
    setupMesh('meshes/cutieCashew.glb','cutieCashew');


    const eyeGeometry=new three.PlaneGeometry(2,2);
    const cubeEyeSides=[
        {eye:'rinnegan',position:new three.Vector3(0,1,0)},
        {eye:'rinnegan',position:new three.Vector3(0,-1,0)},
        {eye:'byakugan',position:new three.Vector3(1,0,0)},
        {eye:'ketsuryugan',position:new three.Vector3(-1,0,0)},
        {eye:'sharingan',position:new three.Vector3(0,0,1)},
        {eye:'mangekyo',position:new three.Vector3(0,0,-1)}
    ];
    let eyes;
    const sendToGui=()=>{
        sceneState.camera=camera;
        sceneState.spotLight=spotLight;
        sceneState.ambient=ambientLight;
        sceneState.floor=floor;
        sceneState.skyBox=eyes;
        console.log('scene gui',sceneState)
        sceneGui();
    }
    fileLoader.load('shaders/eyes/eyes.vert',vshader=>{
        eyes=new three.Scene();
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
                
                if(DEBUG)
                    sendToGui();
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
        paintings= require('./state/paintings.json');
    for(let name in paintings){
        const painting=paintings[name];
        const modelUrl=painting.frameType==='painting'?'meshes/paintingFrame.glb':'meshes/arcade.glb';
        loadGeometry(modelUrl,data=>{
            data.scene.children[0].material.color.setHex(painting.color);
            data.scene.position.copy(painting.position);
            data.scene.rotation.set(painting.rotation._x,painting.rotation._y,painting.rotation._z);
            data.scene.scale.copy(painting.scale);
            data.scene.text=painting.text;
            data.scene.action=painting.action;
            data.scene.isHD=painting.isHD;
            data.scene.imageType=painting.imageType;
            data.scene.frameType=painting.frameType;

            const add=paint=>{
                const spotLight = new three.SpotLight(painting.light.color);
                spotLight.power=painting.light.power;
                spotLight.target=paint;
                data.scene.add(spotLight);
                if(painting.frameType==='painting')
                    paint.rotateX(Math.PI/2);
                else{
                    paint.rotateZ(20*Math.PI/180);
                    paint.scale.set(6.4,10,10);
                    paint.rotateY(Math.PI/2);
                    paint.position.set(.26*10,1.142*10,0);
                }
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

const geometryCache={};
function loadGeometry(text,callback){
    if(geometryCache[text])
        callback({scene:geometryCache[text].clone(true)});
    else
        geometryLoader.load(text,data=>{
            geometryCache[text]=data.scene;
            callback({scene:data.scene.clone(true)});
        });
}

const clock=new three.Clock();
function update(){
    constraints.manageHealth();
    constraints.move(clock.getDelta());
    //constraints.keepInBounds(camera.position);
    for(let uniform of uniformObjects)
        if(uniform.iTime)
            uniform.iTime.value=clock.elapsedTime;
    
    for(let canvas in canvases)
        canvases[canvas].needsUpdate=true;
    
    renderText(camera);
}

function animate() {
    if(games.paused)
    	requestAnimationFrame(animate);
    update();
	renderer.render(scene,camera);
}

for(let game in games){
    if(game==='paused')
        continue;
    const unbindKeys=()=>{
        console.log('go carsu')
        games[game].bindKeys(constraints.player);
        animate();
    };
    games[game].unbindKeys=unbindKeys;
}

init();
constraints.init(button,renderer,camera,games);
animate();