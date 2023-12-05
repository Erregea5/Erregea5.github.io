import * as three from 'three';
import {FirstPersonControls} from 'three/examples/jsm/controls/FirstPersonControls';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {addNewObj,changeObj} from './setPaintings';
import {sceneGui,GuiObjects} from './setScene';

let scene, camera, renderer, controls;

const objectLoader=new three.ObjectLoader();
const imageLoader=new three.TextureLoader();
const fileLoader=new three.FileLoader();
const geometryLoader=new GLTFLoader();

const paintingGeometry=new three.PlaneGeometry(1.512,1.512);
const paintingGeometryHD=new three.PlaneGeometry(1.512,1.512,300);
const uniformObjects=[];

const blend={blending:three.CustomBlending,blendEquation:three.AddEquation};

function init(){
    scene = new three.Scene();
    camera = new three.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    renderer = new three.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    
    initController();
    createScene();
    createPaintings();
    //debug
    addNewObj.scene=scene;
    addNewObj.uniformObjects=uniformObjects;
    addNewObj.geometry={normal:paintingGeometry,HD:paintingGeometryHD};
    addNewObj.blend=blend;
    addNewObj.addNew=()=>{
        if(addNewObj.newName=='')
            return;
        if(addNewObj.newName in addNewObj.objects){
            changeObj(addNewObj.newName,addNewObj.objects[addNewObj.newName]);
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
            changeObj(addNewObj.newName,data.scene);
        });
    }
    

    //release
    //setPaintings();
}

function initController(){
    controls=new FirstPersonControls(camera,renderer.domElement)
    controls.movementSpeed = 5;
    controls.lookSpeed = 0;
    window.onkeydown=ev=>{
        if(ev.key=='q') controls.lookSpeed = 0; 
        if(ev.key=='e') controls.lookSpeed += .01;
    };
    controls.noFly = true;
    controls.activeLook=true;
}

function createScene(){
    //const props= require('./sceneProps.json');
    const propsString= localStorage.getItem('sceneProps');
    console.log('props:'+propsString);
    let props;
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
                position:new three.Vector3(0,1.5,0),
                scale:new three.Vector3(1,1,1)
            }
        };
    
    GuiObjects.camera=camera;
    
    const ambientLight=new three.AmbientLight(props.ambient.color);
    scene.add(ambientLight);
    GuiObjects.ambient=ambientLight;

    const spotLight = new three.SpotLight(props.spotLight.color,props.spotLight.power);
    spotLight.position.copy(props.spotLight.position);
    scene.add(spotLight);
    GuiObjects.spotLight=spotLight;

    const spotLightHelper = new three.SpotLightHelper(spotLight);
    scene.add(spotLightHelper);

    const floorGeometry=new three.PlaneGeometry(100,100);
    const floorMaterial=new three.MeshPhongMaterial({color:props.floor.color,side:three.DoubleSide});
    const floor=new three.Mesh(floorGeometry,floorMaterial);
    floor.rotateX(Math.PI/2);
    floor.position.copy(props.floor.position);
    floor.scale.copy(props.floor.scale);
    scene.add(floor);
    GuiObjects.floor=floor;

    geometryLoader.load('meshes/museum.glb',(data)=>{
        data.scene.children[0].material.side=three.DoubleSide;
        data.scene.children[0].material.color.setHex(props.museum.color);
        data.scene.children[0].position.copy(props.museum.position);
        data.scene.children[0].rotation.set(props.museum.rotation._x,props.museum.rotation._y,props.museum.rotation._z,'XYZ');
        data.scene.children[0].scale.copy(props.museum.scale);
        scene.add(data.scene);
        spotLight.target=data.scene.children[0];
        GuiObjects.museum=data.scene.children[0];
    });

    const skyGeometry=new three.SphereGeometry(1);
    fileLoader.load('shaders/sky.vert',vshader=>
        fileLoader.load('shaders/sky.frag',fshader=>{ 
            const skyMaterial=new three.ShaderMaterial({
                uniforms:{iTime:{value:1.0}},
                vertexShader:vshader,
                fragmentShader:fshader,
                side:three.DoubleSide
            });
            uniformObjects.push(skyMaterial.uniforms);
            const skyBox=new three.Mesh(skyGeometry,skyMaterial);
            skyBox.position.copy(props.skyBox.position);
            skyBox.scale.copy(props.skyBox.scale);
            scene.add(skyBox);
            GuiObjects.skyBox=skyBox;
            sceneGui();
        }));
}

function createPaintings(){
    //const paintings= require('./paintings.json');
    const paintingsString=localStorage.getItem('paintings');
    console.log('paintings: '+paintingsString);
    if(!paintingsString)
        return;
    const paintings=JSON.parse(paintingsString);
    for(let name in paintings){
        const painting=paintings[name];
        geometryLoader.load('meshes/paintingFrame.glb',(data)=>{
            data.scene.children[0].material.color.setHex(painting.color);
            data.scene.position.copy(painting.position);
            data.scene.rotation.set(painting.rotation._x,painting.rotation._y,painting.rotation._z);
            data.scene.scale.copy(painting.scale);
            data.scene.text=painting.text;
            data.scene.isHD=painting.isHD;

            const add=paint=>{
                const spotLight = new three.SpotLight(painting.light.color,painting.light.power);
                spotLight.position.copy(painting.light.position);
                spotLight.target=paint;
                data.scene.add(spotLight);
                const spotLightHelper = new three.SpotLightHelper(spotLight);
                data.scene.add(spotLightHelper);

                paint.rotateX(Math.PI/2);
                data.scene.add(paint);
                scene.add(data.scene);
                changeObj(name,data.scene);
            };
            const paintGeo=painting.isHD?paintingGeometryHD:paintingGeometry;
            if(painting.image){
                data.scene.image=painting.image;
                imageLoader.load('images/'+painting.image,(data)=>
                    add(new three.Mesh(paintGeo, new three.MeshBasicMaterial({map:data,...blend}))));
            }
            else{
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
            }
        });
    }
}

const bounds={
    y:.6,
    bigBound:{lo:new three.Vector3(-1.867,.6,-19.35),hi:new three.Vector3(5.5,.6,8.898)},
    smallBound:{lo:new three.Vector3(-1.867,.6,-7.5),hi:new three.Vector3(15.5,.6,-2.9)},
    e:.5,
    keepInBounds:function(pos){
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
    }
};


let curText='';
function renderText(text){
    if(text==curText)
       return;
    console.log(text);
    curText=text;
}

const clock=new three.Clock();
const distanceToPaintings2=30;

function animate() {
	requestAnimationFrame( animate );
    controls.update(clock.getDelta());
    bounds.keepInBounds(camera.position);
    for(let uniform of uniformObjects){
        if(uniform.iTime)
            uniform.iTime.value=clock.elapsedTime;
    }
    for(let painting in addNewObj.objects){
        if(addNewObj.objects[painting].position)
        if(addNewObj.objects[painting].position.distanceToSquared(camera.position)<=distanceToPaintings2)
            renderText(addNewObj.objects[painting].text);
    }
	renderer.render( scene, camera );
}

init();
animate();