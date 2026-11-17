/**
 * Lightweight layered 2D character illustration, not a real-time 3D mesh.
 * Presentation only: never mutates equipped/owned items or combat statistics.
 */
import {sanitizeLoadout,describeLoadout} from "./avatar.mjs";

const ILLUSTRATION=String.raw`<svg id="heroPortrait" viewBox="0 0 430 545" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="portraitTitle" preserveAspectRatio="xMidYMid meet">
<title id="portraitTitle">숲의 모험가 캐릭터 일러스트</title>
<defs>
 <linearGradient id="mist" x2="0" y2="1"><stop stop-color="#668f7c"/><stop offset=".52" stop-color="#385951"/><stop offset="1" stop-color="#182c2b"/></linearGradient>
 <linearGradient id="skin" x2=".6" y2="1"><stop stop-color="#f9d2ae"/><stop offset=".48" stop-color="#c9906f"/><stop offset="1" stop-color="#815943"/></linearGradient>
 <linearGradient id="hair" x2=".8" y2="1"><stop stop-color="#5c4936"/><stop offset=".55" stop-color="#342e2d"/><stop offset="1" stop-color="#191e23"/></linearGradient>
 <linearGradient id="coat" x2=".9" y2="1"><stop stop-color="var(--armor-light)"/><stop offset=".42" stop-color="var(--armor-base)"/><stop offset="1" stop-color="var(--armor-dark)"/></linearGradient>
 <linearGradient id="leather" x2=".7" y2="1"><stop stop-color="#b78b60"/><stop offset="1" stop-color="#534335"/></linearGradient>
 <linearGradient id="metal" x2=".8" y2="1"><stop stop-color="#f2e2bf"/><stop offset=".33" stop-color="#b2b9ba"/><stop offset=".61" stop-color="#5c7481"/><stop offset="1" stop-color="#2c3d49"/></linearGradient>
 <radialGradient id="light"><stop stop-color="#dfce8b" stop-opacity=".73"/><stop offset="1" stop-color="#f7e8b1" stop-opacity="0"/></radialGradient>
 <linearGradient id="cape" x2=".9" y2="1"><stop stop-color="#617c67"/><stop offset=".5" stop-color="#3a5146"/><stop offset="1" stop-color="#21352f"/></linearGradient>
 <filter id="shadow"><feDropShadow dx="0" dy="10" stdDeviation="11" flood-color="#0b201f" flood-opacity=".58"/></filter>
</defs>
<style>
svg {--armor-base:#59715b;--armor-dark:#2a3f39;--armor-light:#8c9b74}
svg[data-armor="traveler"]{--armor-base:#567f83;--armor-dark:#284a59;--armor-light:#a9ada1}
svg[data-armor="leather"]{--armor-base:#846044;--armor-dark:#48362d;--armor-light:#c19a60}
svg[data-armor="iron"]{--armor-base:#758c9b;--armor-dark:#384a58;--armor-light:#d7dfe0}
svg[data-armor="forest"]{--armor-base:#356f5c;--armor-dark:#1e453a;--armor-light:#a5c59a}
.gear-head,.gear-weapon,.gear-offhand {display:none}
svg[data-head="hunterCap"] .head-hunterCap,svg[data-head="hood"] .head-hood,svg[data-head="ironHelm"] .head-ironHelm,svg[data-head="circlet"] .head-circlet {display:block}
svg[data-weapon="bow"] .weapon-bow,svg[data-weapon="sword"] .weapon-sword,svg[data-weapon="greatsword"] .weapon-greatsword,svg[data-weapon="axe"] .weapon-axe,svg[data-weapon="staff"] .weapon-staff {display:block}
svg[data-offhand="satchel"] .offhand-satchel,svg[data-offhand="shield"] .offhand-shield,svg[data-offhand="orb"] .offhand-orb,svg[data-offhand="lantern"] .offhand-lantern {display:block}
</style>
<rect width="430" height="545" fill="url(#mist)"/>
<circle cx="297" cy="99" r="171" fill="url(#light)"/>
<path d="M0 245L59 195 88 234 141 177 194 229 257 177 319 229 365 195 430 233V545H0Z" fill="#42665a" opacity=".65"/>
<path d="M0 335L60 286 100 309 158 261 194 310 240 276 294 314 355 260 430 318V545H0Z" fill="#224a42" opacity=".7"/>
<path d="M39 545V256M390 545V213" stroke="#1b372d" stroke-width="22"/>
<path d="M0 285Q75 237 119 289M322 256Q368 215 430 270" stroke="#396f52" stroke-width="50" fill="none" opacity=".6"/>
<ellipse cx="215" cy="529" rx="195" ry="29" fill="#0c2420" opacity=".65"/>
<!-- Long cloak and asymmetrical shoulder silhouette -->
<g filter="url(#shadow)">
<path d="M176 246Q133 241 102 277Q70 315 51 436L22 545H403L372 413Q356 308 314 268Q288 244 257 245Z" fill="url(#cape)" stroke="#17362e" stroke-width="7"/>
<path d="M95 361Q114 289 158 275L135 515 110 545H36Z" fill="#345046" opacity=".8"/>
<path d="M341 343Q325 296 282 280L307 517 341 545H405Z" fill="#213f39" opacity=".8"/>
<!-- armor and chest -->
<path d="M161 274Q210 293 262 270L304 311 319 455 286 545H123L100 448 123 309Z" fill="url(#coat)" stroke="#1c3632" stroke-width="8"/>
<path d="M162 287Q209 315 259 284L268 415Q217 454 150 409Z" fill="var(--armor-light)" opacity=".25"/>
<path d="M196 286L202 458 173 544H147L176 457Z" fill="#d2bea1" opacity=".18"/>
<path d="M262 303L275 415 300 534L278 545 243 428Z" fill="#172e2c" opacity=".23"/>
<path d="M128 354Q208 386 300 353L310 381Q212 420 120 386Z" fill="url(#leather)" stroke="#3e3127" stroke-width="5"/>
<path d="M175 366L228 391 246 375 192 347Z" fill="#d6c39c" opacity=".45"/>
<path d="M203 355L230 365 225 395 200 391Z" fill="#bea67b" stroke="#49382d" stroke-width="5"/>
<path d="M209 366L216 370 213 383 204 380Z" fill="#36463a"/>
<!-- layered shirt collar, scarf -->
<path d="M164 267Q216 290 262 265L251 313 219 332 175 310Z" fill="#a0957a" stroke="#654d3d" stroke-width="5"/>
<path d="M168 268Q183 284 216 289Q250 283 265 266L253 302 226 316 183 304Z" fill="#75634e"/>
<path d="M167 290Q186 319 229 320L199 346 155 323Z" fill="#9e7d58"/>
<path d="M130 300Q108 326 97 387L63 472" stroke="#7a8e7f" stroke-width="7" opacity=".56"/>
<!-- arms -->
<path d="M119 298Q86 303 69 361L50 451 87 468 119 389 146 335Z" fill="url(#coat)" stroke="#273a37" stroke-width="8"/>
<path d="M286 300Q333 310 356 365L375 454 334 468 300 391 265 340Z" fill="url(#coat)" stroke="#273a37" stroke-width="8"/>
<path d="M65 443L100 447 103 499 54 506Z M337 447L375 443 390 501 340 506Z" fill="url(#leather)" stroke="#392f2b" stroke-width="5"/>
<path d="M125 303L151 342 168 328 148 286Z M280 294L266 332 288 347 315 317Z" fill="#c4ac83" opacity=".45"/>
<!-- neck and face -->
<path d="M180 223L187 289Q213 316 244 288L250 220Z" fill="url(#skin)" stroke="#654c3f" stroke-width="5"/>
<path d="M155 148Q149 113 161 94Q177 65 213 63Q262 61 277 110L273 173 264 216Q245 258 213 265Q171 254 162 211Z" fill="url(#skin)" stroke="#58453c" stroke-width="6"/>
<path d="M169 138Q185 128 200 138L198 149Q178 150 170 143ZM225 137Q246 125 263 134L262 145Q240 147 229 147Z" fill="#342d2a"/>
<path d="M175 150Q187 147 199 150M228 150Q242 145 259 151" stroke="#f8e5cc" stroke-width="5" fill="none"/>
<path d="M183 153L189 151M237 152L244 150" stroke="#26363b" stroke-width="4"/>
<path d="M212 147L201 190 214 196" fill="none" stroke="#986c55" stroke-width="4"/>
<path d="M195 220Q214 228 237 213" fill="none" stroke="#68473e" stroke-width="4" stroke-linecap="round"/>
<path d="M176 194Q180 222 194 238M259 192Q245 236 232 240" stroke="#ad775d" stroke-width="4" opacity=".34"/>
<!-- hair with layered locks -->
<path d="M153 159Q130 118 145 85Q148 49 185 49Q211 18 244 45Q280 39 283 79Q304 104 275 153L265 112Q245 101 240 88Q200 115 169 100Z" fill="url(#hair)" stroke="#29272a" stroke-width="7"/>
<path d="M149 107Q149 77 178 56Q172 94 173 117L158 146ZM180 58Q214 27 248 54Q220 81 179 102Z" fill="#544332" opacity=".65"/>
<path d="M257 66Q280 78 277 124L267 143 252 99Z" fill="#2b292a"/>
<path d="M162 91Q176 81 183 72M193 57Q216 50 231 55" fill="none" stroke="#94775a" stroke-width="6" opacity=".48"/>
</g>
<!-- headgear variants -->
<g class="gear-head head-hunterCap" filter="url(#shadow)"><path d="M144 115L155 57Q201 21 260 59L274 110Q210 89 144 115Z" fill="url(#leather)" stroke="#433627" stroke-width="7"/><path d="M124 119Q211 86 286 118Q254 132 212 129Q156 146 124 119Z" fill="#665035" stroke="#3f332c" stroke-width="5"/><path d="M189 74L223 80 236 96 202 100Z" fill="#d2b37d"/></g>
<g class="gear-head head-hood" filter="url(#shadow)"><path d="M124 192Q116 77 151 46Q208-18 270 47Q307 107 292 185L263 216Q275 111 254 84Q216 46 172 85Q148 119 164 222Z" fill="#2a5945" stroke="#1b3d33" stroke-width="8"/><path d="M133 145Q159 54 213 51Q268 56 284 142" fill="none" stroke="#7ca077" stroke-width="15"/></g>
<g class="gear-head head-ironHelm" filter="url(#shadow)"><path d="M151 188L151 94Q168 43 215 38Q272 37 278 104V201L250 225 238 189H186L177 228Z" fill="url(#metal)" stroke="#354d5b" stroke-width="8"/><path d="M151 133L282 130 270 172 165 174Z" fill="#213944"/><path d="M175 147H262" stroke="#f9dab3" stroke-width="8" opacity=".75"/><path d="M215 45V137M160 116H272" stroke="#ebd3ac" stroke-width="8" opacity=".55"/></g>
<g class="gear-head head-circlet" filter="url(#shadow)"><path d="M160 112Q211 96 270 112" fill="none" stroke="#eed5a1" stroke-width="10"/><path d="M196 103L215 86 233 106 215 124Z" fill="#88c8c6" stroke="#edd9a7" stroke-width="6"/></g>
<!-- weapons carried vertically, to retain readable item change -->
<g class="gear-weapon weapon-bow" filter="url(#shadow)"><path d="M355 484Q428 380 388 224Q373 177 393 137" fill="none" stroke="#b18b61" stroke-width="18" stroke-linecap="round"/><path d="M393 137Q439 302 355 484" fill="none" stroke="#d7d9b7" stroke-width="3"/><path d="M388 226L360 469" stroke="#4c3a2d" stroke-width="5"/></g>
<g class="gear-weapon weapon-sword" filter="url(#shadow)"><path d="M359 460L379 181 393 151 404 180 377 461Z" fill="url(#metal)" stroke="#354c57" stroke-width="6"/><path d="M337 458H405" stroke="#d9b77d" stroke-width="15" stroke-linecap="round"/><path d="M371 458L366 528" stroke="#664b3a" stroke-width="16"/><circle cx="366" cy="535" r="10" fill="#d1b983"/></g>
<g class="gear-weapon weapon-greatsword" filter="url(#shadow)"><path d="M333 451L368 105 386 58 406 104 388 451Z" fill="url(#metal)" stroke="#384a51" stroke-width="7"/><path d="M325 455H412" stroke="#d4b77a" stroke-width="19"/><path d="M369 455L364 532" stroke="#594435" stroke-width="19"/></g>
<g class="gear-weapon weapon-staff" filter="url(#shadow)"><path d="M372 531L371 204 382 127" fill="none" stroke="#815d40" stroke-width="19" stroke-linecap="round"/><path d="M375 146Q345 100 374 73Q408 92 389 134Z" fill="#8fdbbd" stroke="#d9c991" stroke-width="7"/><circle cx="383" cy="114" r="67" fill="url(#light)"/></g>
<g class="gear-weapon weapon-axe" filter="url(#shadow)"><path d="M374 526L380 180" stroke="#7b553e" stroke-width="19" stroke-linecap="round"/><path d="M373 184Q413 116 428 187L416 260 380 253Z" fill="url(#metal)" stroke="#364c55" stroke-width="6"/></g>
<!-- offhand secondary equipment -->
<g class="gear-offhand offhand-satchel" filter="url(#shadow)"><path d="M36 421Q65 385 102 430L103 499Q64 528 27 494Z" fill="#836044" stroke="#4e3a2e" stroke-width="8"/><path d="M36 437Q60 456 100 442" fill="none" stroke="#caa77a" stroke-width="7"/><path d="M56 447L83 448 76 471 59 468Z" fill="#d5b375"/></g>
<g class="gear-offhand offhand-shield" filter="url(#shadow)"><path d="M43 365Q105 357 118 385L112 478Q85 528 42 534L9 475 13 386Z" fill="url(#metal)" stroke="#ccb47e" stroke-width="10"/><path d="M59 375V513M20 436H110" stroke="#e0d3b0" stroke-width="8"/></g>
<g class="gear-offhand offhand-orb"><circle cx="53" cy="451" r="48" fill="url(#light)"/><circle cx="54" cy="448" r="31" fill="#86d1d1" stroke="#b8e8d8" stroke-width="7"/><path d="M41 429L61 409 76 439" fill="none" stroke="#f4fff2" stroke-width="6"/></g>
<g class="gear-offhand offhand-lantern" filter="url(#shadow)"><path d="M30 388Q51 363 74 390" fill="none" stroke="#beab73" stroke-width="9"/><path d="M31 393L25 487H85L77 394Z" fill="#d5b77d" stroke="#6d5a41" stroke-width="8"/><path d="M43 413H69L75 473H35Z" fill="#ffe0a0" opacity=".87"/><circle cx="53" cy="445" r="57" fill="url(#light)"/></g>
<path d="M0 510Q212 490 430 520V545H0Z" fill="#0c2825" opacity=".35"/>
</svg>`;

export function renderHeroIllustration(container,equipment){
 if(!container)return;
 const gear=sanitizeLoadout(equipment);
 if(!container.firstElementChild)container.innerHTML=ILLUSTRATION;
 const art=container.querySelector("svg");
 if(!art)return;
 for(const slot of ["head","armor","weapon","offhand"])art.dataset[slot]=gear[slot];
 const title=art.querySelector("title");
 if(title)title.textContent="모험가 외형: "+describeLoadout(gear);
}
