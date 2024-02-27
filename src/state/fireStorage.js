import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getBlob, uploadString, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCF2ytbFFvzFuouAuJxIPsUsb7WbPn5-VE",
  authDomain: "experiment1-2637d.firebaseapp.com",
  projectId: "experiment1-2637d",
  storageBucket: "experiment1-2637d.appspot.com",
  messagingSenderId: "106220505749",
  appId: "1:106220505749:web:eb3fc91d552fb20132699c",
  measurementId: "G-6F5HVJ2D4G"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const loadImage=name=>{
  const fileRef=ref(storage,name);
  return getBlob(fileRef)
    .then(blob=>createImageBitmap(blob));
};

const saveImage=(canvas,name)=>{
  const fileRef=ref(storage,name);
  canvas.toBlob(data=>uploadBytes(fileRef, data)
    .then(()=>console.log('Uploaded '+name)));
};

const deleteImage=name=>{
  const fileRef=ref(storage,name);
  return deleteObject(fileRef)
    .then(()=>console.log('Deleted '+name));
};

const loadImageData=()=>{
  return getString('images')
    .then(text=>text.split(',').map(val=>{
      const info=val.split(':');
      return {name:info[0],caption:info[1]};
    }));
};

const saveImageData=arr=>{
  const fileRef=ref(storage,'images.txt');
  const info=arr.map(val=>val.name+':'+val.caption).join(',');
  return uploadString(fileRef,info)
    .then(()=>console.log('Uploaded image data'));
};

const images=[];
const MAX_IMAGES=5;

function loadImages(callback){
  return loadImageData()
    .then(arr=>{
      arr.forEach(val=>{
        images.push(val);
        loadImage(val.name) 
          .then(img=>callback({...val,img:img}));
      }
    )});
}

function saveImages(newImage,canvas,caption){
  saveImage(canvas,newImage);
  while(images.length>=MAX_IMAGES)
    deleteImage(images.splice(0,1));
  images.push({name:newImage,caption});
  saveImageData(images);
}

function getString(name){
  const fileRef=ref(storage,name+'.txt');
  return getBlob(fileRef)
    .then(blob=>blob.text());
}

function saveString(name,str){
  const fileRef=ref(storage,name+'.txt');
  return uploadString(fileRef,str)
    .then(()=>console.log('Uploaded '+name));
};

export {loadImages,saveImages,images,getString,saveString};