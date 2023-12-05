import GUI from 'lil-gui';
import {TextureLoader,MeshBasicMaterial,ShaderMaterial,FileLoader,Vector2} from 'three'
import { saveAs } from 'file-saver';

const gui = new GUI();
const listGui= gui.addFolder('list');
let inspect=gui.addFolder('inspector');

const addNewObj={
    currentName:'',
    newName:'',
    addNew:()=>{},
    objectNames:[],
    objects:{},
    getOutput:function(){
        const out={};
        for(let name in this.objects){
            if(this.objects[name].isImage)
                out[name]={image:this.objects[name].image};
            else
                out[name]={shader:this.objects[name].shader};
            out[name].position=this.objects[name].position;
            out[name].rotation=this.objects[name].rotation;
            out[name].scale=this.objects[name].scale;
            out[name].color=this.objects[name].children[0].material.color;
            out[name].text=this.objects[name].text;
            out[name].isHD=this.objects[name].isHD||false;
            out[name].light={
                position:this.objects[name].children[1].position,
                power:this.objects[name].children[1].power,
                color:this.objects[name].children[1].color
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
    currentShader:'',
    currentImage:'',
    image:true,
    scene:null,
    uniformObjects:[],
    geometry:{},
    blend:{}
};
listGui.add(addNewObj, 'newName');
listGui.add(addNewObj,'addNew');
listGui.add(addNewObj,'print');
listGui.add(addNewObj,'save');
let chooser=listGui.addFolder('chooser');

const shaders=['spiral','water','rinnegan','sharingan'];
const images=['DeitectivesIntro.jpg','GatoStart.png','SpaceGeoIntro.png'];

const textureLoader=new TextureLoader();
const loader=new FileLoader();

function changeObj(name, obj){
    addNewObj.currentName=name;
    if(!(name in addNewObj.objects)){
        if(name!=''){
            addNewObj.objects[name]=obj;
            addNewObj.objectNames.push(name);
        }
        chooser.destroy();
        chooser=listGui.addFolder('chooser')
        chooser.add(addNewObj, 'currentName', addNewObj.objectNames)
            .onChange(v=>{
                console.log(v+' '+addNewObj.currentName);
                changeObj(v,addNewObj.objects[v]);
            });
    }
    inspect.destroy();
    if(name=='')
        return;
    inspect=gui.addFolder('inspector');
    inspect.add(addNewObj,'remove');

    let image;
    const imageEditor=isImage=>{
        image=inspect.addFolder('image');
        if(isImage)
            image.add(addNewObj,'currentImage',images)
                .onChange(v=>textureLoader
                        .load('images/'+v,data=>{
                            obj.children[obj.children.length-1].material=new MeshBasicMaterial({map:data,...addNewObj.blend});
                            obj.isImage=true;
                            obj.image=v;
                        }));
        else
            image.add(addNewObj,'currentShader',shaders)
                .onChange(v=>loader
                    .load('shaders/'+v+'.vert',vert=>loader
                        .load('shaders/'+v+'.frag',frag=>{
                            obj.children[obj.children.length-1].material=new ShaderMaterial({
                                uniforms:{iTime:{value:100.0}},
                                fragmentShader:frag,
                                vertexShader:vert,
                                ...addNewObj.blend
                            });
                            if(!addNewObj.uniformObjects.includes(obj.children[obj.children.length-1].material.uniforms))
                                addNewObj.uniformObjects.push(obj.children[obj.children.length-1].material.uniforms);
                            obj.isImage=false;
                            obj.shader=v;
                        })));
    };
    inspect.add(addNewObj,'image')
        .onChange(v=>{
            image.destroy();
            imageEditor(v);
        });
    if(!obj.isHD)
        obj.isHD=false;
    inspect.add(obj, 'isHD')
        .onChange(v=>{
            obj.isHD=v;
            if(v)
                obj.children[obj.children.length-1].geometry=addNewObj.geometry.HD;
            else
                obj.children[obj.children.length-1].geometry=addNewObj.geometry.normal;
        });

    if(!obj.text)
        obj.text='';
    inspect.add(obj,'text');
    inspect.addColor(obj.children[0].material,'color');
    
    vec3Control(inspect,'position',obj.position,1,20,.001);
    vec3Control(inspect,'scale',obj.scale,1,10,.001);
    vec3Control(inspect,'rotation',obj.rotation,180/Math.PI,180,.1);
    
    vec3Control(inspect,'light position',obj.children[1].position,1,20,.001);
    inspect.addColor(obj.children[1],'color');
    inspect.add(obj.children[1],'power',0,100,.1);
    
    imageEditor(false);
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

export {addNewObj,changeObj,vec3Control};