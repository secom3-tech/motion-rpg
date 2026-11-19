/**
 * Lightweight inline SVG icons for obtainable/locked gear.
 * Pure visual data; never affects game state or combat stats.
 */
const parts={
 sword:'<path d="M39 7l8 7-5 34-8 3-5-6Z" fill="#c5dce4" stroke="#ebf6ef" stroke-width="2"/><path d="M39 11L34 47" stroke="#f9fcff" stroke-width="2"/><path d="M22 48l29 6" stroke="#d5b477" stroke-width="7" stroke-linecap="round"/><path d="M37 51l-9 19" stroke="#735037" stroke-width="7"/><circle cx="27" cy="71" r="4" fill="#d5b477"/>',
 greatsword:'<path d="M38 1L51 17 45 56 31 58 28 14Z" fill="#a4cae7" stroke="#e3f8ff" stroke-width="3"/><path d="M39 4L38 53" stroke="#f8ffff" stroke-width="3"/><path d="M20 57h40" stroke="#c5dcff" stroke-width="9"/><path d="M40 58v16" stroke="#384857" stroke-width="7"/>',
 bow:'<path d="M50 5Q9 32 42 74" fill="none" stroke="#caa170" stroke-width="9"/><path d="M50 5L42 74" stroke="#e8e6d3" stroke-width="2"/><path d="M17 44h48" stroke="#e0c19a" stroke-width="4"/><path d="M17 44l10-5v10Z" fill="#cfdce0"/>',
 staff:'<path d="M38 75L44 22" stroke="#a68055" stroke-width="9" stroke-linecap="round"/><path d="M45 23L29 13 41 4 57 15Z" fill="#97dbdb" stroke="#d5f1eb" stroke-width="3"/><circle cx="44" cy="16" r="20" fill="#78dbd7" opacity=".18"/>',
 axe:'<path d="M30 72L49 13" stroke="#b18c5e" stroke-width="9"/><path d="M44 12Q59 8 69 22L57 39 37 32 33 18Z" fill="#c8d1d4" stroke="#edf4ef" stroke-width="3"/>',
 hunterCap:'<path d="M19 45L25 26Q40 17 56 27L62 46Z" fill="#7c5e42" stroke="#b9946c" stroke-width="4"/><path d="M11 48Q40 39 70 49Q45 63 16 53Z" fill="#604c3b" stroke="#b9946c" stroke-width="3"/>',
 bare:'<circle cx="40" cy="32" r="19" fill="#c1a07e"/><path d="M23 31Q20 7 45 9Q64 11 59 35L55 26 37 24 27 34Z" fill="#47352f"/>',
 hood:'<path d="M18 63Q10 31 27 13Q49 -5 63 20L66 64 56 70H25Z" fill="#2d6750" stroke="#8dbb86" stroke-width="4"/><path d="M29 46Q26 17 43 18Q58 19 56 46" fill="#101e1f"/>',
 ironHelm:'<path d="M20 54V31Q18 10 39 9Q60 10 61 32v23L49 65l-7-14-12 14Z" fill="#91aeb8" stroke="#ebf6ff" stroke-width="4"/><path d="M24 38h34" stroke="#2c404a" stroke-width="8"/><path d="M40 9v29" stroke="#c7d5d7" stroke-width="5"/>',
 circlet:'<path d="M14 43Q39 18 66 43" fill="none" stroke="#e7c97f" stroke-width="9"/><path d="M40 29L50 41 40 52 30 41Z" fill="#83d5cd"/>',
 traveler:'<path d="M27 10l13 9 13-9 16 26-11 8 1 28H21l1-28-12-8Z" fill="#6f8b94" stroke="#d3d0b8" stroke-width="3"/>',
 hunter:'<path d="M23 11l16 13 17-13 14 25-13 11 3 25H18l4-25L10 36Z" fill="#637d5d" stroke="#a7b18b" stroke-width="3"/><path d="M21 29l36 33" stroke="#b9976c" stroke-width="7"/>',
 leather:'<path d="M22 11l18 12 17-12 14 27-16 9 5 25H20l5-25-15-9Z" fill="#8f6547" stroke="#c99c6e" stroke-width="4"/><path d="M20 43h40M40 20v52" stroke="#543b2f" stroke-width="6"/>',
 iron:'<path d="M21 9l19 9 18-9 13 26-16 14 7 26H18l6-26L9 35Z" fill="#9eb4bc" stroke="#ebf4f5" stroke-width="4"/><path d="M40 18v53M19 38h43" stroke="#466075" stroke-width="6"/>',
 forest:'<path d="M21 11l19 13 17-13 15 27-14 11 4 23H18l3-23L7 38Z" fill="#447d63" stroke="#a2d69c" stroke-width="4"/><path d="M38 32l10 13-9 15-10-15Z" fill="#b9d67c"/>',
 satchel:'<rect x="14" y="31" width="52" height="42" rx="9" fill="#9d7653" stroke="#d4ab7b" stroke-width="4"/><path d="M20 36Q20 8 41 8Q61 8 61 36" fill="none" stroke="#6d5036" stroke-width="8"/><path d="M19 43h42l-8 14H26Z" fill="#bb9369"/><path d="M36 48h9" stroke="#f0c37b" stroke-width="5"/>',
 none:'<circle cx="40" cy="40" r="25" stroke="#a0b3a5" stroke-width="4" fill="none"/><path d="M21 58l38-38" stroke="#a0b3a5" stroke-width="4"/>',
 shield:'<path d="M40 6Q59 17 69 21L65 53Q52 72 40 77Q22 67 15 53L11 21Z" fill="#879ea9" stroke="#e4d7ae" stroke-width="5"/><path d="M40 15v54M19 36h42" stroke="#c8b17a" stroke-width="7"/>',
 orb:'<circle cx="40" cy="41" r="27" fill="#358da2" stroke="#b8e8e7" stroke-width="6"/><path d="M29 39l12-21 17 19-17 22Z" fill="#9ce9e9" opacity=".7"/><circle cx="40" cy="40" r="37" stroke="#91dae6" stroke-width="3" opacity=".45" fill="none"/>',
 lantern:'<path d="M29 22Q40 3 51 22" fill="none" stroke="#c4a56b" stroke-width="6"/><path d="M23 23h34l5 45H18Z" fill="#ad8b56" stroke="#d5b675" stroke-width="5"/><path d="M29 31h22l4 28H25Z" fill="#ffde91"/><circle cx="40" cy="45" r="31" fill="#ffd77d" opacity=".13"/>',
 bandage:'<g transform="rotate(-22 40 40)"><rect x="12" y="24" width="56" height="33" rx="10" fill="#dfcda9" stroke="#b49277" stroke-width="3"/><rect x="26" y="19" width="28" height="43" rx="4" fill="#f4e9c9" stroke="#b69c7c" stroke-width="2"/><path d="M34 30h12M40 24v27" stroke="#9c6e57" stroke-width="6"/><path d="M16 35l9 2M55 42l9 4M30 55l15-4" stroke="#b39a77" stroke-width="2" opacity=".8"/></g>',
 potion:'<g stroke-linejoin="round"><path d="M34 14h12v17c12 8 17 16 17 30 0 11-10 15-23 15S17 72 17 61c0-14 5-22 17-30Z" fill="#659f8f" stroke="#cceadd" stroke-width="3"/><path d="M23 46Q40 55 57 45L58 64Q40 76 22 63Z" fill="#c66481" stroke="#f4c3cf" stroke-width="2"/><path d="M34 12h13v8H33Z" fill="#9d7551" stroke="#e6be91" stroke-width="2"/><path d="M28 39q10-9 22 0M29 57q10 3 22-1" stroke="#f7e4ec" stroke-opacity=".7" stroke-width="2" fill="none"/><circle cx="38" cy="57" r="6" fill="#f7c9d5" opacity=".75"/></g>',
 torch:'<path d="M39 72L47 28" stroke="#a47e55" stroke-width="12" stroke-linecap="round"/><path d="M40 73L46 30" stroke="#dbb579" stroke-width="3"/><path d="M35 39L54 44" stroke="#e0c593" stroke-width="7"/><path d="M32 31Q19 16 42 4Q56 22 48 33Q65 17 59 41Q46 57 32 43Z" fill="#fdbb59" stroke="#fff1a3" stroke-width="3"/><path d="M37 38Q32 24 45 17Q51 28 46 40Z" fill="#fff3ca"/>',
 map:'<path d="M9 20l19-7 21 5 22-8v51l-22 8-21-5-19 7Z" fill="#d8c190" stroke="#eee0bb" stroke-width="3"/><path d="M28 13v51M49 18v51" stroke="#a18865" stroke-width="2"/><path d="M18 35q10 15 24 6t17 15" stroke="#7a9479" stroke-width="4" fill="none" stroke-dasharray="3 4"/><circle cx="59" cy="28" r="5" fill="#b97665"/><path d="M16 61l9-8 9 6" stroke="#a08064" stroke-width="3" fill="none"/>'
};
/** Six starter and mage equipment portraits rendered as hand-painted sprite artwork. */
const illustrated={
 sword:[0,0], bow:[1,0], hunterCap:[2,0],
 hunter:[0,1], satchel:[1,1], staff:[2,1]
};
const ATLAS="./assets/gear-illustrations.webp?v=0.43.1";
const craftIllustrated={bare:[0,0],traveler:[1,0],sword:[2,0],none:[3,0],
 hood:[0,1],leather:[1,1],lantern:[2,1],axe:[3,1],
 staff:[0,2],orb:[1,2],circlet:[2,2],forest:[3,2],
 shield:[0,3],ironHelm:[1,3],iron:[2,3],greatsword:[3,3]};
const CRAFT_ATLAS="./assets/blacksmith-craft-v1.webp?v=1.0";
const tones={weapon:"#1d464f",head:"#35423f",armor:"#254a43",offhand:"#4b4437"};
export function itemIllustration(id,slot="weapon"){
 const craft=craftIllustrated[id];
 if(craft){
  const [column,row]=craft;
  return '<svg class="itemArtwork paintedEquipment" viewBox="0 0 96 96" role="img" aria-label="장비 일러스트" xmlns="http://www.w3.org/2000/svg" style="overflow:hidden;border-radius:12px"><image href="'+CRAFT_ATLAS+'" x="'+(-column*96)+'" y="'+(-row*96)+'" width="384" height="384" preserveAspectRatio="none"/><path d="M2 2h92v92H2z" fill="none" stroke="#e1ca8c" stroke-opacity=".28" stroke-width="2"/></svg>';
 }
 const sprite=illustrated[id];
 if(sprite){
  const [column,row]=sprite;
  return '<svg class="itemArtwork paintedEquipment" viewBox="0 0 96 96" role="img" aria-label="장비 일러스트" xmlns="http://www.w3.org/2000/svg" style="overflow:hidden;border-radius:12px"><image href="'+ATLAS+'" x="'+(-column*96)+'" y="'+(-row*96)+'" width="288" height="192" preserveAspectRatio="none"/><path d="M2 2h92v92H2z" fill="none" stroke="#e1ca8c" stroke-opacity=".36" stroke-width="2"/></svg>';
 }
 const drawing=parts[id]||parts.none;const base=tones[slot]||tones.weapon;
 const gradient="itm-"+id.replace(/[^a-zA-Z]/g,"");
 return '<svg class="itemArtwork" viewBox="0 0 80 80" role="img" aria-label="장비 일러스트 · '+id+'" xmlns="http://www.w3.org/2000/svg">'+
  '<defs><radialGradient id="'+gradient+'" cx=".35" cy=".23" r=".86"><stop stop-color="#758f79" stop-opacity=".72"/><stop offset=".52" stop-color="'+base+'"/><stop offset="1" stop-color="#0a1f24"/></radialGradient></defs>'+
  '<rect x="2" y="2" width="76" height="76" rx="15" fill="url(#'+gradient+')" stroke="#e2ce9d" stroke-opacity=".7" stroke-width="2"/>'+
  '<path d="M7 54Q36 40 72 55V65Q40 81 7 63Z" fill="#020e15" opacity=".20"/><circle cx="40" cy="27" r="29" fill="#f4dfac" opacity=".07"/>'+
  '<g style="filter:drop-shadow(0 4px 3px #04140fc0)">'+drawing+'</g>'+
  '<path d="M10 13Q27 5 43 8M11 68Q36 76 61 68" fill="none" stroke="#f6e1ac" stroke-opacity=".28" stroke-width="1.5"/>'+
  '<path d="M63 12l1 6 5 1-5 1-1 6-2-6-5-1 5-1Z" fill="#ffedc2" opacity=".45"/></svg>';
}
