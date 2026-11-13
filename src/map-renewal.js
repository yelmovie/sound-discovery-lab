// Traced on the map at 900 × 506. Patches retain the original painted walls
// and only close/restyle the relevant building, leaving roads and trees alone.
const mapArt=[
 {edge:[[87,121],[116,84],[128,63],[135,42],[158,37],[166,62],[202,57],[224,74],[249,91],[270,122],[263,146],[253,179],[231,198],[191,207],[150,190],[111,174],[96,154]],door:[209,166],tone:'#83e0eb'},
 {edge:[[360,102],[384,74],[380,59],[390,43],[402,41],[407,26],[430,14],[471,13],[489,28],[502,50],[515,73],[532,108],[526,130],[499,140],[476,153],[431,154],[400,144],[379,130]],door:[449,117],tone:'#ffd869'},
 {edge:[[620,142],[647,112],[664,92],[682,86],[693,71],[715,65],[749,74],[774,84],[792,110],[811,114],[826,142],[818,168],[791,185],[763,199],[722,209],[681,194],[638,183],[625,169]],door:[718,184],tone:'#dfbdf9'},
 {edge:[[607,348],[626,326],[638,296],[673,278],[696,277],[700,268],[713,267],[716,250],[744,245],[764,250],[769,273],[752,297],[747,313],[761,342],[759,377],[736,401],[702,428],[666,430],[627,411],[608,385]],door:[681,405],tone:'#91e0b0'},
 {edge:[[149,342],[179,306],[195,297],[203,279],[219,268],[230,285],[248,296],[272,311],[287,329],[310,327],[330,343],[332,374],[312,387],[280,399],[249,414],[217,411],[183,391],[170,374]],door:[250,388],tone:'#f0a884'},
 {edge:[[401,263],[417,248],[431,228],[441,218],[451,199],[465,209],[476,237],[490,252],[490,273],[473,293],[421,292],[400,281]],door:[452,246],tone:'#b4fcff'},
];
export function paintSoundBuilding(c,image,world,index,restored,amount=1){
 if(!amount)return;
 const art=mapArt[index],sx=world.width/900,sy=world.height/506;
 c.save();c.globalAlpha=amount;c.scale(sx,sy);
 if(!restored){
  c.beginPath();art.edge.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
  c.filter='saturate(35%) brightness(68%)';c.drawImage(image,0,0,900,506);c.filter='none';
  if(index<5){const [x,y]=art.door;c.fillStyle='#4d3e37';c.fillRect(x-8,y-2,16,14);c.fillStyle='#8f795f';c.fillRect(x-9,y+1,18,3);c.fillRect(x-8,y+7,17,3);}
  c.restore();return;
 }
 const [x,y]=art.door;c.translate(x,y);
 const glow=c.createRadialGradient(0,1,1,0,2,30);glow.addColorStop(0,art.tone+'ad');glow.addColorStop(1,art.tone+'00');c.fillStyle=glow;c.fillRect(-30,-29,60,60);
 const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const dot=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
 if(index<5){box(-6,-6,12,17,'#5a4933');box(-4,-4,8,13,'#ffce81');box(-3,-4,6,10,'#fff6c1');}
 c.translate(index===5?0:18,index===5?11:11);
 if(index===0){box(-8,0,16,4,'#9b603e');box(-1,-10,2,12,'#705839');c.strokeStyle=art.tone;c.lineWidth=2;c.beginPath();c.moveTo(-4,-14);c.lineTo(-4,-7);c.quadraticCurveTo(0,0,4,-7);c.lineTo(4,-14);c.stroke();}
 if(index===1){dot(0,0,7,'#8c503f');dot(0,-5,7,'#fff0bb');dot(0,-5,4,art.tone);box(-8,1,16,3,'#9b603e');}
 if(index===2){box(-7,-10,14,15,'#613e4a');for(let i=0;i<4;i++)box(-5+i*3,-8,2,10-i,art.tone);}
 if(index===3){box(-1,-11,2,16,'#775942');dot(0,-13,4,art.tone);for(let i=1;i<4;i++){c.strokeStyle=art.tone;c.globalAlpha=amount*(1-i*.18);c.lineWidth=1;c.beginPath();c.arc(0,-13,3+i*3,-2.75,-.4);c.stroke();}}
 if(index===4){box(-8,-1,16,6,'#a5774d');for(let i=0;i<3;i++){box(-7+i*5,-11,3,11,'#8b9859');dot(-6+i*5,-12,4,'#d4d8a0');}}
 if(index===5){for(const dx of [-31,0,31]){box(dx-1,1,2,11,'#715942');dot(dx,0,4,'#e7ce77');dot(dx-1,-1,2,art.tone);}}
 c.restore();
}
