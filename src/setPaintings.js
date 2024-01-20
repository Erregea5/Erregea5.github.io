import GUI from 'lil-gui';
import {TextureLoader,MeshBasicMaterial,ShaderMaterial,FileLoader} from 'three'
import { saveAs } from 'file-saver';

let gui, listGui, inspect, chooser;
let textureLoader, loader;

const state={
    currentName:'',newName:'',
    currentShader:'',currentImage:'',currentCanvas:'',currentType:'shader',
    addNewGame:()=>{},addNewPainting:()=>{},
    objectNames:[],objects:{},
    getOutput:function(){
        const out={};
        for(let name in this.objects){
            const object=this.objects[name];
            const cout=out[name]={};
            
            cout.frameType=object.frameType;
            cout[object.imageType]=object[object.imageType];
            cout.imageType=object.imageType;
            cout.position=object.position;
            cout.rotation=object.rotation;
            cout.scale=object.scale;
            cout.color=object.children[0].material.color;
            cout.text=object.text;
            cout.action=object.action;
            cout.isHD=object.isHD||false;
            cout.light={
                position:object.children[1].position,
                power:object.children[1].power,
                color:object.children[1].color
            };
        }
        return out;
    },
    print:function(){
        const out=this.getOutput();
        console.log(out);
        saveAs(new Blob([JSON.stringify(out)], {type: 'application/json'}),'paintings.json');
    },
    save:function(){
        const out=this.getOutput();
        localStorage.removeItem('paintings');
        localStorage.setItem('paintings',JSON.stringify(out));
    },
    remove:function(){
        if(this.objectNames.length==0)
            return;
        this.scene.remove(this.objects[this.currentName]);
        delete this.objects[this.currentName];
        this.objectNames.splice(this.objectNames.findIndex(x=>x==this.currentName),1);
        changeObj('',null);
    },
    scene:null,
    uniformObjects:[],
    geometry:{},
    blend:{},
    actions:[],
    canvasNames:[],canvases:{}
};

const imageTypes=['image','shader','canvas'];
const shaders=['spiral','water'];
const images=['DeitectivesIntro.jpg','GatoStart.png','SpaceGeoIntro.png'];

function init(){
    gui = new GUI();
    listGui= gui.addFolder('list');
    inspect=gui.addFolder('inspector');
    listGui.add(state, 'newName');
    listGui.add(state,'addNewPainting');
    listGui.add(state,'addNewGame');
    listGui.add(state,'print');
    listGui.add(state,'save');
    chooser=listGui.addFolder('chooser');
    textureLoader=new TextureLoader();
    loader=new FileLoader();
}

const vectorGui=obj=>{
    inspect.addColor(obj.children[0].material,'color');
    
    vec3Control(inspect,'position',obj.position,1,20,.001);
    vec3Control(inspect,'scale',obj.scale,1,10,.001);
    vec3Control(inspect,'rotation',obj.rotation,180/Math.PI,180,.1);
    
    vec3Control(inspect,'light position',obj.children[1].position,1,20,.001);
    inspect.addColor(obj.children[1],'color');
    inspect.add(obj.children[1],'power',0,100,.1);
};

const imageGui=obj=>{
    if(!obj.imageType)
        obj.imageType='shader';
    else
        state['current'+obj.imageType.charAt(0).toUpperCase() + obj.imageType.slice(1)]=obj[obj.imageType];
    state.currentType=obj.imageType;

    let imageFolder;
    const imageEditor=type=>{
        imageFolder=inspect.addFolder('image');
        obj.imageType=type;
        switch(type){
        case 'image':
            imageFolder.add(state,'currentImage',images)
                .onChange(image=>textureLoader
                        .load('images/'+image,data=>{
                            data.anisotropy=2;
                            obj.children[obj.children.length-1].material=new MeshBasicMaterial({map:data,...state.blend});
                            obj.image=image;
                        }));
            break;
        case 'shader':
            imageFolder.add(state,'currentShader',shaders)
                .onChange(shader=>loader
                    .load('shaders/'+shader+'.vert',vert=>loader
                        .load('shaders/'+shader+'.frag',frag=>{
                            obj.children[obj.children.length-1].material=new ShaderMaterial({
                                uniforms:{iTime:{value:100.0}},
                                fragmentShader:frag,
                                vertexShader:vert,
                                ...state.blend
                            });
                            if(!state.uniformObjects.includes(obj.children[obj.children.length-1].material.uniforms))
                                state.uniformObjects.push(obj.children[obj.children.length-1].material.uniforms);
                            obj.shader=shader;
                        })));
            break;
        case 'canvas':
            imageFolder.add(state,'currentCanvas',state.canvasNames)
                .onChange(canvas=>{
                    obj.children[obj.children.length-1].material=new MeshBasicMaterial({map:state.canvases[canvas],...state.blend});
                    obj.canvas=canvas;
                });
        }
    };
    inspect.add(state,'currentType',imageTypes)
        .onChange(v=>{
            imageFolder.destroy();
            imageEditor(v);
        });

    if(!obj.isHD)
        obj.isHD=false;
    inspect.add(obj, 'isHD')
        .onChange(v=>{
            obj.isHD=v;
            if(v)
                obj.children[obj.children.length-1].geometry=state.geometry.HD;
            else
                obj.children[obj.children.length-1].geometry=state.geometry.normal;
        });
    return imageEditor;
};

const textGui=obj=>{
    const text=inspect.addFolder('text');
    if(!obj.text)
        obj.text={top:'',bottom:'',link:'',href:''};
    text.add(obj.text,'top');
    text.add(obj.text,'bottom');
    
    const link=text.addFolder('link');
    link.add(obj.text,'link');
    link.add(obj.text,'href');
    
    if(!obj.action)
        obj.action='none';
    inspect.add(obj,'action',state.actions);
};

function changeObj(name, obj){
    state.currentName=name;
    if(!(name in state.objects)){
        if(name!=''){
            state.objects[name]=obj;
            state.objectNames.push(name);
        }
        chooser.destroy();
        chooser=listGui.addFolder('chooser')
        chooser.add(state, 'currentName', state.objectNames)
            .onChange(v=>{
                console.log(v+' '+state.currentName);
                changeObj(v,state.objects[v]);
            });
    }
    inspect.destroy();
    if(name=='')
        return;
    inspect=gui.addFolder('inspector');
    inspect.add(state,'remove');

    const imageEditor=imageGui(obj);
    textGui(obj);
    vectorGui(obj);

    imageEditor(obj.imageType);
}

function vec3Control(folder,name,vec3,f,bound,step){
    const vecGui=folder.addFolder(name);
    let tempVec;
    if(vec3.x!=undefined)
        tempVec={x:vec3.x*f,y:vec3.y*f,z:vec3.z*f};
    else
        tempVec={_x:vec3._x*f,_y:vec3._y*f,_z:vec3._z*f};
    for(let d in tempVec)
        vecGui.add(tempVec, d, -bound, bound, step)
            .onChange(v=>vec3[d]=v/f);
}

export {state as paintingState,changeObj,vec3Control,init as paintingGuiInit};