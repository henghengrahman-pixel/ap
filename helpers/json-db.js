
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

function ensureDir(dir){
  if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
}

function filePath(name){
  ensureDir(DATA_DIR);
  return path.join(DATA_DIR, name);
}

function readJson(name, fallback=[]){
  const target = filePath(name);
  if(!fs.existsSync(target)) return fallback;
  try{
    return JSON.parse(fs.readFileSync(target,'utf8'));
  }catch{
    return fallback;
  }
}

function writeJson(name,data){
  const target = filePath(name);
  const tmp = target + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data,null,2));
  fs.renameSync(tmp,target);
}

module.exports = {readJson,writeJson};
