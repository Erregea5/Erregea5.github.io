import GUI from 'lil-gui';
import {vec3Control} from './setPaintings';
import { saveAs } from 'file-saver';

const gui = new GUI();
gui.domElement.style='position: absolute; top: 2px; left: 2px;'

function vec3(){
    this.x=0
}
const obj={
    camera:0,museum:0,ambient:0,spotLight:0,floor:0,skyBox:0
};

function sceneGui(){
    const sceneObjects={
        museum:{
            color:obj.museum.material,
            position:obj.museum,
            rotation:obj.museum,
            scale:obj.museum
        },
        ambient:{color:obj.ambient},
        spotLight:{
            color:obj.spotLight,
            position:obj.spotLight,
            power:obj.spotLight
        },
        floor:{
            position:obj.floor,
            color:obj.floor.material,
            scale:obj.floor
        },
        skyBox:{
            position:obj.skyBox,
            scale:obj.skyBox
        }
    };
    const printObj={
        getOutput:()=>{
            const out=sceneObjects;
            for(let obj in out)
                for(let prop in out[obj])
                    out[obj][prop]=out[obj][prop][prop];
            return out;
        },
        print:function(){
            const out=this.getOutput();
            console.log(out);
            saveAs(new Blob([JSON.stringify(out)], {type: 'application/json'}),'sceneProps.json');
        },
        save:function(){
            const out=this.getOutput();
            localStorage.removeItem('sceneProps');
            localStorage.setItem('sceneProps',JSON.stringify(out));
        },
        printPosition:()=>console.log(obj.camera.position)
    };
    gui.add(printObj,'print');
    gui.add(printObj,'save');
    gui.add(printObj,'printPosition');
    for(let object in sceneObjects){
        let folder=gui.addFolder(object);
        for(let prop in sceneObjects[object]){
            if(prop=='color')
                folder.addColor(sceneObjects[object][prop],prop);
            else if(sceneObjects[object][prop][prop].x!=undefined||sceneObjects[object][prop][prop]._x!=undefined){
                let input={f:1,max:100,step:.01};
                if(prop=='rotation')
                    input={f:180/Math.PI,max:180,step:.1};

                vec3Control(folder,prop,sceneObjects[object][prop][prop],input.f,input.max,input.step);
            }
            else
                folder.add(sceneObjects[object][prop],prop);
        }
    }
}
export {obj as GuiObjects, sceneGui};