import GUI from 'lil-gui';
import {vec3Control} from './setPaintings';
import { saveAs } from 'file-saver';

const state={
    camera:0,museum:0,ambient:0,spotLight:0,floor:0,skyBox:0
};

function sceneGui(){
    const gui = new GUI();
    gui.domElement.style='position: absolute; top: 0px; left: 0px;';
    const sceneObjects={
        museum:{
            color:state.museum.material,
            position:state.museum,
            rotation:state.museum,
            scale:state.museum
        },
        ambient:{color:state.ambient},
        spotLight:{
            color:state.spotLight,
            position:state.spotLight,
            power:state.spotLight
        },
        floor:{
            position:state.floor,
            color:state.floor.material,
            scale:state.floor
        },
        skyBox:{
            position:state.skyBox,
            scale:state.skyBox
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
        printPosition:()=>console.log(state.camera.position)
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

export {state as sceneState, sceneGui};