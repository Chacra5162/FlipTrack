const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./gate-iT3LxX7I.js","./vendor-supabase-jY4wIOEF.js"])))=>i.map(i=>d[i]);
import{c as Gc}from"./vendor-supabase-jY4wIOEF.js";const Vc="modulepreload",Yc=function(t,e){return new URL(t,e).href},Yi={},vr=function(e,n,s){let o=Promise.resolve();if(n&&n.length>0){const i=document.getElementsByTagName("link"),r=document.querySelector("meta[property=csp-nonce]"),l=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));o=Promise.allSettled(n.map(c=>{if(c=Yc(c,s),c in Yi)return;Yi[c]=!0;const d=c.endsWith(".css"),u=d?'[rel="stylesheet"]':"";if(!!s)for(let v=i.length-1;v>=0;v--){const h=i[v];if(h.href===c&&(!d||h.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${c}"]${u}`))return;const y=document.createElement("link");if(y.rel=d?"stylesheet":Vc,d||(y.as="script"),y.crossOrigin="",y.href=c,l&&y.setAttribute("nonce",l),document.head.appendChild(y),d)return new Promise((v,h)=>{y.addEventListener("load",v),y.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${c}`)))})}))}function a(i){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=i,window.dispatchEvent(r),!r.defaultPrevented)throw i}return o.then(i=>{for(const r of i||[])r.status==="rejected"&&a(r.reason);return e().catch(a)})},_a="https://gqructzvlkafclooybnc.supabase.co",Ca="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcnVjdHp2bGthZmNsb295Ym5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODIyNTAsImV4cCI6MjA4Njk1ODI1MH0.-H5p1Oq-ImveB636xgWI-Rrc23wzj7-_Vps6xeHrHtA",jo=["Shirts","T-Shirts","Pants","Jeans","Shorts","Jackets","Hoodies","Sweaters","Dresses","Skirts","Socks","Underwear","Activewear","Swimwear","Outerwear","Suits","Loungewear"],hr={Clothing:{subcats:{Men:jo,Women:jo,Children:jo,Footwear:["Men","Women","Children"],"Men's Accessories":[],"Women's Accessories":[]}},Books:{subcats:{Fiction:["Literary","Sci-Fi","Fantasy","Mystery","Thriller","Romance","Horror","Historical"],"Non-Fiction":["Biography","History","Science","Self-Help","Business","Travel","Cooking","Health"],Textbooks:["Math","Science","Engineering","Medicine","Law","Business","Humanities","Computer Science"],Children:["Picture Books","Middle Grade","Young Adult","Board Books","Activity Books"],"Rare & Collectible":["First Editions","Signed Copies","Antiquarian","Limited Editions"],"Comics & Graphic Novels":[],"Art & Photography":[],Reference:[]}}};Object.fromEntries(Object.entries(hr).map(([t,e])=>[t,Object.keys(e.subcats)]));Object.fromEntries(Object.entries(hr).flatMap(([,t])=>Object.entries(t.subcats).filter(([,e])=>e.length).map(([e,n])=>[e,n])));const Jm=["eBay","Amazon","Etsy","Facebook Marketplace","Depop","Poshmark","Mercari","Grailed","StockX","GOAT","Vinted","Tradesy","The RealReal","Vestiaire Collective","Reverb","Discogs","Craigslist","OfferUp","Nextdoor","Whatnot","TikTok Shop","Instagram","Shopify","Walmart Marketplace","Newegg","Bonanza","Ruby Lane","Chairish","1stDibs","Swappa","Decluttr","Unlisted","Other"],br=[{label:"General",items:["eBay","Amazon","Etsy","Facebook Marketplace"]},{label:"Fashion",items:["Depop","Poshmark","Mercari","Grailed","StockX","GOAT","Vinted","Tradesy","The RealReal","Vestiaire Collective"]},{label:"Music",items:["Reverb","Discogs"]},{label:"Local",items:["Craigslist","OfferUp","Nextdoor"]},{label:"Social",items:["Whatnot","TikTok Shop","Instagram"]},{label:"Retail",items:["Shopify","Walmart Marketplace","Newegg","Bonanza","Ruby Lane","Chairish","1stDibs"]},{label:"Tech",items:["Swappa","Decluttr"]},{label:"Other",items:["Unlisted","Other"]}],Kc=t=>({eBay:"plt-ebay",Amazon:"plt-amazon",Etsy:"plt-etsy","Facebook Marketplace":"plt-fb",Depop:"plt-depop",Poshmark:"plt-poshmark",Mercari:"plt-mercari",Grailed:"plt-grailed",StockX:"plt-stockx",GOAT:"plt-goat",Vinted:"plt-vinted",Tradesy:"plt-tradesy","The RealReal":"plt-realreal","Vestiaire Collective":"plt-vestiaire",Reverb:"plt-reverb",Discogs:"plt-discogs",Craigslist:"plt-craigslist",OfferUp:"plt-offerup",Nextdoor:"plt-nextdoor",Whatnot:"plt-whatnot","TikTok Shop":"plt-tiktok",Instagram:"plt-instagram",Shopify:"plt-shopify","Walmart Marketplace":"plt-walmart",Newegg:"plt-newegg",Bonanza:"plt-bonanza","Ruby Lane":"plt-bonanza",Chairish:"plt-chairish","1stDibs":"plt-1stdibs",Swappa:"plt-swappa",Decluttr:"plt-decluttr"})[t]||"plt-other",sa={eBay:{pct:.1325,flat:.3,label:"13.25% + $0.30"},Amazon:{pct:.15,flat:0,label:"15% referral"},Etsy:{pct:.065,flat:.2,label:"6.5% + $0.20 + 3% processing",processing:.03},"Facebook Marketplace":{pct:.05,flat:0,label:"5% (or $0.40 min)"},Depop:{pct:.1,flat:0,label:"10%"},Poshmark:{pct:.2,flat:0,label:"20% (or $2.95 if under $15)"},Mercari:{pct:.1,flat:0,label:"10%"},Grailed:{pct:.09,flat:0,label:"9% + 3.49% processing",processing:.0349},StockX:{pct:.1,flat:0,label:"~10% (varies by level)"},GOAT:{pct:.095,flat:5,label:"9.5% + $5 cashout"},Vinted:{pct:0,flat:0,label:"0% seller fees (buyer pays)"},Tradesy:{pct:.198,flat:0,label:"19.8%"},"The RealReal":{pct:.45,flat:0,label:"45% avg commission"},"Vestiaire Collective":{pct:.15,flat:0,label:"15%"},Reverb:{pct:.05,flat:.25,label:"5% + $0.25"},Discogs:{pct:.08,flat:0,label:"8%"},Whatnot:{pct:.08,flat:0,label:"8% + 2.9% processing + $0.30",processing:.029,processingFlat:.3},"TikTok Shop":{pct:.08,flat:0,label:"8%"},Shopify:{pct:.029,flat:.3,label:"2.9% + $0.30 processing"},"Walmart Marketplace":{pct:.15,flat:0,label:"15% referral"},Newegg:{pct:.12,flat:0,label:"8-15% (avg 12%)"},Swappa:{pct:.03,flat:0,label:"3% (buyer pays most)"}};function Jc(t,e){const n=sa[t];if(!n)return null;let s=e*n.pct+(n.flat||0);return n.processing&&(s+=e*n.processing),n.processingFlat&&(s+=n.processingFlat),t==="Poshmark"&&e<15&&(s=2.95),t==="Facebook Marketplace"&&(s=Math.max(s,.4)),Math.round(s*100)/100}const Ho=["Shirts","T-Shirts","Pants","Jeans","Shorts","Jackets","Hoodies","Sweaters","Dresses","Skirts","Socks","Underwear","Activewear","Swimwear","Outerwear","Suits","Loungewear"],wr={Clothing:{subcats:{Men:Ho,Women:Ho,Children:Ho,Footwear:["Sneakers","Boots","Sandals","Dress Shoes","Athletic","Flats","Heels","Loafers","Slippers"],"Men's Accessories":["Watches","Belts","Wallets","Hats","Ties","Sunglasses","Bags","Cufflinks","Scarves","Gloves"],"Women's Accessories":["Handbags","Jewelry","Scarves","Belts","Hats","Sunglasses","Watches","Hair Accessories","Gloves","Wallets"]}},Books:{subcats:{Fiction:["Literary","Sci-Fi","Fantasy","Mystery","Thriller","Romance","Horror","Historical"],"Non-Fiction":["Biography","History","Science","Self-Help","Business","Travel","Cooking","Health"],Textbooks:["Math","Science","Engineering","Medicine","Law","Business","Humanities","Computer Science"],Children:["Picture Books","Middle Grade","Young Adult","Board Books","Activity Books"],"Rare & Collectible":["First Editions","Signed Copies","Antiquarian","Limited Editions"],"Comics & Graphic Novels":["Marvel","DC","Manga","Indie","Graphic Memoirs","Omnibus","Trade Paperback"],"Art & Photography":["Photography","Illustration","Fine Art","Digital Art","Architecture","Fashion"],Reference:["Dictionaries","Encyclopedias","Guides","Atlases","Manuals"]}},Electronics:{subcats:{"Phones & Tablets":["iPhone","Samsung","iPad","Android Tablet","Google Pixel","Cases","Chargers","Screen Protectors"],Computers:["Laptops","Desktops","Monitors","Keyboards","Mice","Webcams","Docking Stations"],Audio:["Headphones","Earbuds","Speakers","Turntables","Receivers","Microphones"],Cameras:["DSLR","Mirrorless","Point & Shoot","Film","Lenses","Tripods","Bags"],Gaming:["Consoles","Controllers","Games","Headsets","Handhelds","VR","Accessories"],"Smart Home":["Speakers","Lights","Thermostats","Cameras","Plugs","Displays"],Accessories:["Cables","Chargers","Batteries","Cases","Stands","Adapters","Storage"]}},"Toys & Games":{subcats:{"Action Figures":["Marvel","DC","Star Wars","Anime","GI Joe","TMNT","Transformers","Vintage"],"Board Games":["Strategy","Party","Family","Cooperative","Card Games","Classic","RPG"],"Building Sets":["LEGO","Mega Bloks","K'NEX","Magnetic","Wooden"],Dolls:["Barbie","American Girl","Bratz","Porcelain","Fashion","Baby Dolls"],"Video Games":["PlayStation","Xbox","Nintendo","PC","Retro","Handheld"],Outdoor:["Bikes","Scooters","Water Toys","Sports","Playsets"],Puzzles:["Jigsaw","3D","Brain Teasers","Wooden","Floor"],"Collectible Toys":["Funko Pop","Hot Wheels","Trading Cards","Beanie Babies","Vintage"]}},"Home & Garden":{subcats:{Kitchen:["Appliances","Cookware","Bakeware","Utensils","Storage","Drinkware","Cutlery"],Decor:["Wall Art","Candles","Vases","Frames","Mirrors","Clocks","Figurines"],Furniture:["Tables","Chairs","Shelving","Desks","Dressers","Nightstands","Benches"],Bedding:["Sheets","Comforters","Pillows","Blankets","Duvet Covers","Mattress Pads"],Bath:["Towels","Shower Curtains","Mats","Accessories","Storage","Organizers"],Tools:["Power Tools","Hand Tools","Tool Sets","Hardware","Painting","Electrical"],Garden:["Planters","Tools","Decor","Lighting","Furniture","Seeds & Plants"]}},"Sports & Outdoors":{subcats:{Fitness:["Weights","Resistance Bands","Yoga","Cardio","Mats","Apparel","Trackers"],Cycling:["Bikes","Helmets","Lights","Locks","Apparel","Parts","Accessories"],Camping:["Tents","Sleeping Bags","Backpacks","Lanterns","Stoves","Coolers","Chairs"],"Team Sports":["Baseball","Basketball","Football","Soccer","Hockey","Volleyball"],"Water Sports":["Kayaking","Fishing","Surfing","Swimming","Snorkeling","Boating"],"Winter Sports":["Skiing","Snowboarding","Ice Skating","Sleds","Apparel"],Golf:["Clubs","Bags","Balls","Apparel","Accessories","Shoes"]}},Collectibles:{subcats:{"Trading Cards":["Pokémon","Magic: The Gathering","Yu-Gi-Oh","Sports Cards","Vintage"],"Coins & Currency":["US Coins","World Coins","Paper Money","Silver","Gold","Tokens"],Stamps:["US Stamps","World Stamps","First Day Covers","Collections","Vintage"],Figurines:["Funko Pop","Precious Moments","Hummel","Department 56","Anime"],Memorabilia:["Sports","Music","Movie","TV","Political","Military","Autographs"],Vintage:["Advertising","Toys","Glassware","Pottery","Jewelry","Signs","Maps"],Antiques:["Furniture","China","Silver","Art","Books","Clocks","Textiles"]}},"Health & Beauty":{subcats:{Skincare:["Cleansers","Moisturizers","Serums","Masks","Sunscreen","Anti-Aging"],Makeup:["Foundation","Lipstick","Eyeshadow","Mascara","Brushes","Palettes"],"Hair Care":["Shampoo","Conditioner","Styling","Tools","Treatments","Accessories"],Fragrance:["Perfume","Cologne","Body Spray","Sets","Travel Size","Vintage"],"Personal Care":["Oral Care","Shaving","Deodorant","Body Wash","Lotions"]}},"Crafts & DIY":{subcats:{Sewing:["Fabric","Patterns","Notions","Machines","Thread","Accessories"],"Art Supplies":["Paints","Brushes","Canvas","Paper","Pencils","Markers","Pastels"],Scrapbooking:["Paper","Stickers","Albums","Tools","Stamps","Embellishments"],"Knitting & Crochet":["Yarn","Needles","Hooks","Patterns","Kits","Accessories"],"Beading & Jewelry":["Beads","Wire","Tools","Findings","Kits","Charms"]}}},Zt=Object.fromEntries(Object.entries(wr).map(([t,e])=>[t,Object.keys(e.subcats)])),Ba=Object.fromEntries(Object.entries(wr).flatMap(([,t])=>Object.entries(t.subcats).filter(([,e])=>e.length).map(([e,n])=>[e,n]))),S=t=>{const e=Number(t||0);return"$"+(isFinite(e)?e:0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})},Y=t=>{const e=t*100;return(isFinite(e)?e:0).toFixed(1)+"%"},se=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6),Qc=/^\d{4}-\d{2}-\d{2}$/,mt=t=>{if(!t)return"";const e=String(t),n=Qc.test(e)?new Date(e+"T00:00:00"):new Date(e);return isNaN(n)?"":n.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})},ot=(t=new Date)=>`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`,x=t=>{const e=document.createElement("div");return e.textContent=t,e.innerHTML},ge=t=>String(t||"").replace(/&/g,"&amp;").replace(/'/g,"&#39;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),Xc=(t,e)=>{let n;return(...s)=>{clearTimeout(n),n=setTimeout(()=>t(...s),e)}};let In=null,Jn=null;function xr(t){if(Jn=document.activeElement,In=document.querySelector(t),!In)return;const e=In.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');e.length&&e[0].focus(),document.addEventListener("keydown",$r)}function Ta(){document.removeEventListener("keydown",$r),Jn&&Jn.focus&&Jn.focus(),In=null,Jn=null}function $r(t){if(!In)return;if(t.key==="Escape"){Ta(),typeof window.closeDrawer=="function"&&window.closeDrawer(),typeof window.closeAdd=="function"&&window.closeAdd();return}if(t.key!=="Tab")return;const e=In.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');if(!e.length)return;const n=e[0],s=e[e.length-1];t.shiftKey&&document.activeElement===n?(t.preventDefault(),s.focus()):!t.shiftKey&&document.activeElement===s&&(t.preventDefault(),n.focus())}function w(t,e,n){const s=document.getElementById("toast");s&&(s.getAttribute("role")||(s.setAttribute("role","status"),s.setAttribute("aria-live","polite")),s.textContent=t,s.className="toast"+(e?" err":""),s.classList.add("on"),setTimeout(()=>s.classList.remove("on"),n||2300))}const Pa=(()=>{let t=null;function e(){return t||(t=new(window.AudioContext||window.webkitAudioContext)),t.state==="suspended"&&t.resume(),t}function n(s,o,a,i,r,l,c){const d=e(),u=d.createOscillator(),p=d.createGain();u.connect(p),p.connect(d.destination),u.type=o,u.frequency.value=s,p.gain.setValueAtTime(a,d.currentTime+i),p.gain.linearRampToValueAtTime(0,d.currentTime+i+r),u.start(d.currentTime+i),u.stop(d.currentTime+i+r+.01)}return{create(){n(523.25,"sine",.18,0,.1),n(783.99,"sine",.18,.1,.14),navigator.vibrate&&navigator.vibrate([30,40,60])},edit(){n(440,"sine",.14,0,.08),n(554.37,"sine",.12,.07,.1),navigator.vibrate&&navigator.vibrate(25)},sale(){n(523.25,"triangle",.15,0,.07),n(659.25,"triangle",.15,.07,.07),n(783.99,"triangle",.16,.14,.07),n(1046.5,"triangle",.18,.21,.14),navigator.vibrate&&navigator.vibrate([20,30,20,30,80])},expense(){n(220,"sine",.2,0,.06),n(174.61,"sine",.16,.05,.12),navigator.vibrate&&navigator.vibrate([60,20,30])}}})(),bo=Pa,Zc="fliptrack",td=1,ed={inventory:{keyPath:"id"},sales:{keyPath:"id"},expenses:{keyPath:"id"},supplies:{keyPath:"id"},trash:{keyPath:"id"},meta:{keyPath:"key"}};let $e=null,an=!0;const oa=[];let Gs=!1;function nd(){try{return!!(window.indexedDB||window.webkitIndexedDB||window.mozIndexedDB)}catch{return!1}}function jt(t,e){console.error(`[IDB ${t}]`,(e==null?void 0:e.message)||e)}async function sd(){for(;oa.length>0;){const{resolve:t,reject:e,fn:n}=oa.shift();try{const s=await n();t(s)}catch(s){e(s)}}}function bs(t){return new Promise((e,n)=>{$e!==null?t().then(e).catch(n):Gs?oa.push({resolve:e,reject:n,fn:t}):n(new Error("IndexedDB not initialized"))})}async function od(){if($e!==null)return $e;if(!nd())throw an=!1,new Error("IndexedDB is not available in this browser");return new Promise((t,e)=>{Gs=!0;const n=indexedDB.open(Zc,td);n.onerror=()=>{Gs=!1,an=!1,jt("open",n.error),e(n.error)},n.onsuccess=()=>{$e=n.result,Gs=!1,sd(),t($e)},n.onupgradeneeded=s=>{const o=s.target.result;Object.entries(ed).forEach(([a,i])=>{if(!o.objectStoreNames.contains(a))try{o.createObjectStore(a,{keyPath:i.keyPath})}catch(r){jt(`create store ${a}`,r)}})}})}async function Wn(t){return an?bs(async()=>new Promise((e,n)=>{try{const a=$e.transaction([t],"readonly").objectStore(t).getAll();a.onerror=()=>{jt(`getAll ${t}`,a.error),n(a.error)},a.onsuccess=()=>{e(a.result)}}catch(s){jt(`getAll ${t}`,s),n(s)}})):[]}async function Jt(t,e){if(an)return bs(async()=>new Promise((n,s)=>{try{const o=$e.transaction([t],"readwrite"),a=o.objectStore(t),i=a.clear();i.onerror=()=>{jt(`putAll clear ${t}`,i.error),s(i.error)},i.onsuccess=()=>{e.forEach(r=>{try{a.put(r)}catch(l){jt(`putAll add ${t}`,l)}})},o.onerror=()=>{jt(`putAll transaction ${t}`,o.error),s(o.error)},o.oncomplete=()=>{n()}}catch(o){jt(`putAll ${t}`,o),s(o)}}))}async function ad(t,e){if(an)return bs(async()=>new Promise((n,s)=>{try{const i=$e.transaction([t],"readwrite").objectStore(t).put(e);i.onerror=()=>{jt(`putOne ${t}`,i.error),s(i.error)},i.onsuccess=()=>{n(i.result)}}catch(o){jt(`putOne ${t}`,o),s(o)}}))}async function gt(t){if(an)return bs(async()=>new Promise((e,n)=>{try{const a=$e.transaction(["meta"],"readonly").objectStore("meta").get(t);a.onerror=()=>{jt(`getMeta ${t}`,a.error),n(a.error)},a.onsuccess=()=>{const i=a.result;e(i?i.value:void 0)}}catch(s){jt(`getMeta ${t}`,s),n(s)}}))}async function et(t,e){if(an)return bs(async()=>ad("meta",{key:t,value:e}))}let Wo=!1,Sr=null;function Ma(){const t=document.getElementById("offlineBanner");t&&(navigator.onLine?(t.style.display="none",t.setAttribute("aria-live","polite"),t.setAttribute("role","status"),t.textContent="",document.body.style.paddingTop="",Wo&&Sr&&(Wo=!1,w("Back online — syncing…"),tl().catch(e=>console.warn("FlipTrack: reconnect sync failed:",e.message)))):(t.style.display="",t.setAttribute("aria-live","assertive"),t.setAttribute("role","alert"),t.textContent="You are offline - data will sync when you reconnect",document.body.style.paddingTop="28px",Wo=!0))}window.addEventListener("online",Ma);window.addEventListener("offline",Ma);navigator.onLine||Ma();function kr(t){Sr=t}const id=`${_a}/functions/v1/ebay-auth`;let ze=!1,Rn=!1,rn=null,so=null,Se=null,Ki=null,Qn=!1,bt=null;async function Qm(t){bt=t;try{const e=await gt("ebay_auth");e&&(ze=e.connected||!1,Rn=e.isSandbox||!1,rn=e.ebayUsername||null,so=e.connectedAt||null),await aa()}catch(e){console.warn("FlipTrack: eBay auth init error:",e.message),setTimeout(async()=>{try{bt=dt()||bt,await aa()}catch{}},3e3)}}async function rd(){if(bt||(bt=dt()),!bt)throw new Error("Not authenticated");let{data:{session:t}}=await bt.auth.getSession();if(!t||t.expires_at&&t.expires_at*1e3<Date.now()+6e4){const{data:e,error:n}=await bt.auth.refreshSession();if(n)throw console.warn("FlipTrack: refresh token failed, signing out:",n.message),await bt.auth.signOut(),w("Session expired — please log in again",!0),typeof window.authSignOut=="function"&&window.authSignOut(),new Error("Session expired");e.session&&(t=e.session)}if(!t)throw new Error("Session expired — please log in again");return{"Content-Type":"application/json",Authorization:`Bearer ${t.access_token}`,apikey:Ca}}async function ws(t,e={}){const n=await rd();n["x-ebay-action"]=t;const s=new AbortController,o=setTimeout(()=>s.abort(),15e3);let a;try{a=await fetch(id,{method:"POST",headers:n,body:JSON.stringify({...e,isSandbox:Rn}),signal:s.signal})}catch(l){throw clearTimeout(o),l.name==="AbortError"?new Error("Request timed out — try again"):new Error("Network error — check your internet connection")}clearTimeout(o);const i=a.headers.get("content-type")||"";let r;if(i.includes("application/json"))r=await a.json();else{const l=await a.text();if(!a.ok)throw new Error(`Server error (${a.status}): ${l.slice(0,100)}`);try{r=JSON.parse(l)}catch{throw new Error(`Unexpected response (${a.status})`)}}if(!a.ok)throw console.error("[eBay] API ERROR:",r.method,r.path,"→",r.ebayStatus||a.status),console.error("[eBay] Error message:",r.error),r.ebayErrors&&console.error("[eBay] Full eBay errors:",JSON.stringify(r.ebayErrors,null,2)),r.sentPayload&&console.error("[eBay] Payload sent:",JSON.stringify(r.sentPayload)),new Error(r.error||`Edge function error: ${a.status}`);return r}async function aa(){var e;if(bt||(bt=dt()),!bt){for(let n=0;n<50&&(bt=dt(),!bt);n++)await new Promise(s=>setTimeout(s,100));if(!bt)return console.warn("eBay status check: Supabase client not initialized"),Qn=!0,typeof window.renderCrosslistDashboard=="function"&&window.renderCrosslistDashboard(),{connected:!1,error:"Not initialized"}}let t=null;for(let n=0;n<30;n++){try{const s=await bt.auth.getSession();t=(e=s==null?void 0:s.data)==null?void 0:e.session}catch{}if(t)break;await new Promise(s=>setTimeout(s,200))}if(!t)return console.warn("eBay status check: no auth session after waiting"),Qn=!0,typeof window.renderCrosslistDashboard=="function"&&window.renderCrosslistDashboard(),{connected:!1,error:"No session"};try{const n=await ws("status");return ze=n.connected,rn=n.ebay_username||null,so=n.connected_at||null,await et("ebay_auth",{connected:ze,isSandbox:Rn,ebayUsername:rn,connectedAt:so}),Qn=!0,typeof window.renderCrosslistDashboard=="function"&&window.renderCrosslistDashboard(),n}catch(n){return console.warn("eBay status check failed:",n.message),Qn=!0,typeof window.renderCrosslistDashboard=="function"&&window.renderCrosslistDashboard(),{connected:ze,error:n.message}}}function ld(){return/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||window.innerWidth<=820}async function cd(t=!1){Rn=t;try{const e=await ws("authorize");if(Ki=e.state,await et("ebay_csrf_state",Ki),ld())return w("Redirecting to eBay…"),window.location.href=e.authUrl,!0;const n=700,s=650,o=Math.round((screen.width-n)/2),a=Math.round((screen.height-s)/2);return Se=window.open(e.authUrl,"ebay-auth",`width=${n},height=${s},left=${o},top=${a},resizable=yes,scrollbars=yes`),Se?(w("Opening eBay authorization…"),dd(),!0):(w("Redirecting to eBay…"),window.location.href=e.authUrl,!0)}catch(e){return w(`eBay connect error: ${e.message}`,!0),!1}}function dd(){const t=setInterval(()=>{Se&&Se.closed&&(clearInterval(t),Se=null)},500);setTimeout(()=>clearInterval(t),3e5)}async function Xm(t,e){try{const n=await gt("ebay_csrf_state");if(e&&n&&e!==n)throw new Error("State mismatch — possible CSRF attack. Please try again.");const s=await ws("callback",{code:t});s.success&&(ze=!0,rn=s.ebay_username||null,await et("ebay_auth",{connected:!0,isSandbox:Rn,ebayUsername:rn,connectedAt:new Date().toISOString()}),await et("ebay_csrf_state",null),w("eBay account connected!"),Se&&!Se.closed&&Se.close(),Se=null,typeof window.renderCrosslistDashboard=="function"&&window.renderCrosslistDashboard())}catch(n){w(`eBay auth error: ${n.message}`,!0)}}async function pd(){try{await ws("disconnect"),ze=!1,rn=null,so=null,await et("ebay_auth",{connected:!1,isSandbox:Rn,ebayUsername:null,connectedAt:null}),w("eBay account disconnected"),typeof window.renderCrosslistDashboard=="function"&&window.renderCrosslistDashboard()}catch(t){w(`Disconnect error: ${t.message}`,!0)}}function ft(){return ze}function ud(){return Qn}function fd(){return rn}async function X(t,e,n=null){if(!ze)throw new Error("eBay not connected");return ws("api",{method:t,path:e,body:n})}function Z(t){return Array.isArray(t.platforms)&&t.platforms.length?t.platforms:t.platform?[t.platform]:[]}function Da(t,e){if(!Array.isArray(t))return t;const n=t.includes("Unlisted"),s=t.some(o=>o!=="Unlisted"&&o!=="Other");if(!n||!s)return t;if(e==="Unlisted")t.length=0,t.push("Unlisted");else{const o=t.indexOf("Unlisted");o!==-1&&t.splice(o,1)}return t}function cs(t,e=[]){const n=document.getElementById(t);if(!n)return;const s=new Set(Array.isArray(e)?e:[e].filter(Boolean));let o="";br.forEach(a=>{o+=`<div class="plat-picker-group-label">${a.label}</div>
    <div class="plat-picker-chips">`,a.items.forEach(i=>{const r=s.has(i)?"active":"";o+=`<span class="plat-pick-chip ${r}" data-plat="${i}" onclick="togglePlatChip(this,'${t}')">${i}</span>`}),o+="</div>"}),n.innerHTML=o}function Zm(t,e){const n=t.classList.contains("active");if(t.classList.toggle("active"),!n){const s=document.getElementById(e);if(!s)return;if(t.dataset.plat==="Unlisted")s.querySelectorAll(".plat-pick-chip.active").forEach(a=>{a.dataset.plat!=="Unlisted"&&a.classList.remove("active")});else{const a=s.querySelector('.plat-pick-chip[data-plat="Unlisted"]');a&&a.classList.remove("active")}}}function Er(t){const e=document.getElementById(t);if(!e)return[];const n=[...e.querySelectorAll(".plat-pick-chip.active")].map(s=>s.dataset.plat);return Da(n)}function md(){cs("d_plat_picker",[]),cs("f_plat_picker",[])}md();function gd(t){const e=Z(t);if(!e.length)return'<span class="platform-tag plt-other">—</span>';const n=t.platformStatus||{},s=e.slice(0,2),o=e.length-s.length;let a=s.map(i=>{const r=n[i]||"active",l=r==="sold"?'<span style="color:var(--good);font-size:8px;margin-left:2px" title="Sold">●</span>':r==="delisted"?'<span style="color:var(--muted);font-size:8px;margin-left:2px;text-decoration:line-through" title="Delisted">●</span>':"";return`<span class="platform-tag ${Kc(i)}">${x(i)}${l}</span>`}).join(" ");return o>0&&(a+=` <span class="cross-listed-badge" title="${x(e.slice(2).join(", "))}">+${o}</span>`),a}const wo={eBay:{days:30,label:"30-day or GTC",renewable:!0},Amazon:{days:0,label:"Until sold/removed",renewable:!1},Etsy:{days:120,label:"4-month listing",renewable:!0},"Facebook Marketplace":{days:7,label:"7-day listing",renewable:!0},Depop:{days:0,label:"Until sold/removed",renewable:!1},Poshmark:{days:0,label:"Active until sold (share to refresh)",renewable:!1},Mercari:{days:0,label:"Until sold/removed",renewable:!1},Grailed:{days:0,label:"Until sold/removed",renewable:!1},StockX:{days:30,label:"30-day ask",renewable:!0},GOAT:{days:30,label:"30-day listing",renewable:!0},Vinted:{days:0,label:"Until sold/removed",renewable:!1},Tradesy:{days:0,label:"Until sold/removed",renewable:!1},"The RealReal":{days:0,label:"Consignment period",renewable:!1},"Vestiaire Collective":{days:0,label:"Until sold/removed",renewable:!1},Reverb:{days:0,label:"Until sold/removed",renewable:!1},Discogs:{days:0,label:"Until sold/removed",renewable:!1},Craigslist:{days:45,label:"45-day listing",renewable:!0},OfferUp:{days:0,label:"Until sold/removed",renewable:!1},Nextdoor:{days:30,label:"30-day listing",renewable:!0},Whatnot:{days:0,label:"Live auction",renewable:!1},"TikTok Shop":{days:0,label:"Until sold/removed",renewable:!1},Instagram:{days:0,label:"Until sold/removed",renewable:!1},Shopify:{days:0,label:"Until sold/removed",renewable:!1},"Walmart Marketplace":{days:0,label:"Until sold/removed",renewable:!1},Newegg:{days:0,label:"Until sold/removed",renewable:!1},Bonanza:{days:0,label:"Until sold/removed",renewable:!1},"Ruby Lane":{days:0,label:"Until sold/removed",renewable:!1},Chairish:{days:0,label:"Until sold/removed",renewable:!1},"1stDibs":{days:0,label:"Until sold/removed",renewable:!1},Swappa:{days:30,label:"30-day listing",renewable:!0},Decluttr:{days:0,label:"Until sold/removed",renewable:!1}},La=["active","sold","sold-elsewhere","delisted","expired","draft"],oo={active:"Active",sold:"Sold","sold-elsewhere":"Sold Elsewhere",delisted:"Delisted",expired:"Expired",draft:"Draft"},ao={active:"var(--good)",sold:"var(--accent)","sold-elsewhere":"var(--accent2)",delisted:"var(--muted)",expired:"var(--danger)",draft:"var(--warn)"};function Aa(t,e){const n=wo[t];if(!n||n.days===0)return null;const s=new Date(e);return isNaN(s.getTime())?null:(s.setDate(s.getDate()+n.days),ot(s))}function Ir(t,e){const n=Aa(t,e);if(!n)return null;const s=new Date;s.setHours(0,0,0,0);const o=new Date(n);return o.setHours(0,0,0,0),Math.ceil((o-s)/864e5)}function Tt(t,e,n){const s=k.find(o=>o.id===t);if(!s)return!1;if(s.platformStatus||(s.platformStatus={}),s.platformStatus[e]=n,n==="active"&&Array.isArray(s.platforms)){const o=s.platforms.indexOf("Unlisted");o!==-1&&s.platforms.splice(o,1)}return j("inv",t),!0}function qe(t,e,n){const s=k.find(a=>a.id===t);if(!s)return;s.platformListingDates||(s.platformListingDates={}),s.platformListingExpiry||(s.platformListingExpiry={}),s.platformListingDates[e]=n||ot();const o=Aa(e,s.platformListingDates[e]);o?s.platformListingExpiry[e]=o:delete s.platformListingExpiry[e],j("inv",t)}function xo(t,e){const n=k.find(o=>o.id===t);if(!n)return;const s=ot();n.lastRelisted||(n.lastRelisted={}),n.lastRelisted[e]=s,qe(t,e,s),Tt(t,e,"active")}function _r(t,e){const n=k.find(a=>a.id===t);if(!n)return[];const s=Z(n);n.platformStatus||(n.platformStatus={}),n.platformStatus[e]="sold";const o=[];if((n.qty||0)<=0)for(const a of s){if(a===e)continue;const i=n.platformStatus[a];(i==="active"||!i)&&(n.platformStatus[a]="sold-elsewhere",o.push(a))}return j("inv",t),o}function Fn(t){const e=new Date;e.setHours(0,0,0,0);const n=[];for(const s of t){const o=Z(s),a=s.platformStatus||{},i=s.platformListingDates||{},r=s.platformListingExpiry||{};for(const l of o){if(a[l]&&a[l]!=="active")continue;const c=r[l];c&&new Date(c)<e&&n.push({item:s,platform:l,expiryDate:c,listedDate:i[l]||null})}}return n}function Cr(t,e=7){const n=new Date;n.setHours(0,0,0,0);const s=new Date(n);s.setDate(s.getDate()+e);const o=[];for(const a of t){const i=Z(a),r=a.platformStatus||{},l=a.platformListingDates||{},c=a.platformListingExpiry||{};for(const d of i){if(r[d]&&r[d]!=="active")continue;const u=c[d];if(u){const p=new Date(u);if(p>=n&&p<=s){const y=Math.ceil((p-n)/864e5);o.push({item:a,platform:d,expiryDate:u,daysLeft:y,listedDate:l[d]||null})}}}}return o.sort((a,i)=>a.daysLeft-i.daysLeft)}function yd(){const t=Fn(k);let e=0;for(const{item:n,platform:s}of t)n.platformStatus||(n.platformStatus={}),n.platformStatus[s]!=="expired"&&(n.platformStatus[s]="expired",j("inv",n.id),e++);return e>0&&(O(),w(`${e} listing${e>1?"s":""} expired — relist from Crosslist tab`)),e}function Br(t){const e=Z(t),n=t.platformStatus||{};let s=0,o=0,a=0,i=0,r=0,l=0;for(const c of e){const d=n[c]||"active";d==="active"?s++:d==="sold"?o++:d==="sold-elsewhere"?a++:d==="expired"?i++:d==="delisted"?r++:d==="draft"&&l++}return{totalPlatforms:e.length,active:s,sold:o,soldElsewhere:a,expired:i,delisted:r,draft:l}}function vd(t){let e=0,n=0,s=0,o=0,a=0,i=0;s=Cr(t,7).length;for(const l of t){if((l.qty||0)<=0)continue;const c=Br(l);e+=c.active,n+=c.expired,o+=c.soldElsewhere,c.totalPlatforms===0?a++:c.totalPlatforms===1&&i++}return{totalActive:e,totalExpired:n,totalExpiringSoon:s,totalSoldElsewhere:o,itemsNotListed:a,itemsSinglePlatform:i}}function tg(){let t=0;for(const e of k){const n=Z(e);if(n.length){e.platformListingDates||(e.platformListingDates={}),e.platformListingExpiry||(e.platformListingExpiry={}),e.platformStatus||(e.platformStatus={});for(const s of n){if(!e.platformListingDates[s]){const o=e.added?ot(new Date(e.added)):ot();e.platformListingDates[s]=o;const a=Aa(s,o);a&&(e.platformListingExpiry[s]=a),t++}e.platformStatus[s]||(e.platformStatus[s]="active")}t>0&&j("inv",e.id)}}t>0&&O()}let _n=null,za=!1;function hd(t=36e5){_n&&clearInterval(_n),za=!0,_n=setInterval(()=>ia(),t),ia()}function bd(){za=!1,_n&&(clearInterval(_n),_n=null)}function Ji(){return za}function ia(){const t=Fn(k);let e=0;for(const{item:n,platform:s}of t){const o=wo[s];!o||!o.renewable||(xo(n.id,s),e++)}return e>0&&(O(),V(),w(`Auto-relisted ${e} expired listing${e>1?"s":""}`)),e}function wd(){return Fn(k).filter(({platform:e})=>{const n=wo[e];return n&&n.renewable})}function eg(t){const e=Fn(k).filter(s=>s.platform===t);let n=0;for(const{item:s}of e)xo(s.id,t),n++;return n>0&&(O(),V(),w(`Relisted ${n} ${t} listing${n>1?"s":""}`)),n}function xd(t){const{category:e,platform:n,adjustType:s,adjustValue:o,minDaysListed:a}=t,i=Date.now();let r=0;for(const l of k){if((l.qty||0)<=0||e&&(l.category||"").toLowerCase()!==e.toLowerCase()||n&&!Z(l).includes(n)||a&&Math.floor((i-new Date(l.added||i).getTime())/864e5)<a)continue;let c=l.price||0;s==="percent"?c=c*(1+o/100):c=c+o,c=Math.max(.01,Math.round(c*100)/100),c!==l.price&&(l.price=c,j("inv",l.id),r++)}return r>0&&(O(),V(),w(`Adjusted prices on ${r} item${r>1?"s":""}`)),r}const Tr={name:"Name",sku:"SKU",upc:"UPC",category:"Category",subcategory:"Subcategory",subtype:"Type",condition:"Condition",cost:"Cost",price:"Price",fees:"Fees",ship:"Shipping",brand:"Brand",color:"Color",size:"Size",material:"Material",model:"Model",style:"Style",pattern:"Pattern",source:"Source",notes:"Notes",url:"URL",qty:"Stock"};function $d(t){const e={};for(const n of Object.keys(Tr))e[n]=t[n]??"";return e._platforms=(t.platforms||[]).join(", "),e}function Sd(t,e){const n=k.find(a=>a.id===t);if(!n||!e)return;n.itemHistory||(n.itemHistory=[]);const s=[];for(const[a,i]of Object.entries(Tr)){const r=e[a]??"",l=n[a]??"",c=typeof r=="number"?String(r):String(r).trim(),d=typeof l=="number"?String(l):String(l).trim();if(c!==d){if(a==="price")continue;s.push({field:i,from:c||"(empty)",to:d||"(empty)"})}}const o=(n.platforms||[]).join(", ");e._platforms!==o&&s.push({field:"Platforms",from:e._platforms||"(none)",to:o||"(none)"}),s.length!==0&&(Array.isArray(n.itemHistory)||(n.itemHistory=[]),n.itemHistory.push({date:Date.now(),type:"edit",changes:s}),n.itemHistory.length>100&&(n.itemHistory=n.itemHistory.slice(-100)))}function kd(t){const e=k.find(o=>o.id===t);if(!e)return[];const n=[];for(const o of e.priceHistory||[])n.push({date:o.date,type:"price",...o});for(const o of e.itemHistory||[])n.push({date:o.date,...o});const s=B.filter(o=>o.itemId===t);for(const o of s)n.push({date:typeof o.date=="number"?o.date:new Date(o.date).getTime(),type:"sale",price:o.price,qty:o.qty,platform:o.platform});return n.sort((o,a)=>(a.date||0)-(o.date||0)),n}function Ed(t){const e=kd(t);return e.length?`<div style="max-height:400px;overflow-y:auto">${e.slice(0,50).map(s=>{const o=`<span style="font-size:11px;color:var(--muted)">${mt(s.date)}</span>`;if(s.type==="price"){const a=s.source||"manual";let i="";return a==="sold"?i=`<span style="font-size:10px;background:var(--danger);color:#fff;padding:2px 6px;border-radius:3px">${s.platform||"SOLD"}</span>`:a==="repricing"?i='<span style="font-size:10px;background:var(--accent2);color:#fff;padding:2px 6px;border-radius:3px">AUTO</span>':a==="ebay-sync"?i='<span style="font-size:10px;background:#3483fa;color:#fff;padding:2px 6px;border-radius:3px">eBay</span>':i='<span style="font-size:10px;background:var(--surface3);color:var(--text);padding:2px 6px;border-radius:3px">Manual</span>',`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div><span style="font-size:12px;font-weight:500">Price → ${S(s.price)}</span> ${i}<br>${o}</div>
      </div>`}if(s.type==="sale"){const a=(s.price||0)*(s.qty||1);return`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div><span style="font-size:12px;font-weight:500;color:var(--good)">💰 Sold × ${s.qty||1}</span>
          <span style="font-size:10px;background:var(--danger);color:#fff;padding:2px 6px;border-radius:3px;margin-left:4px">${s.platform||""}</span>
          <br>${o}</div>
        <div style="font-weight:600;color:var(--good)">${S(a)}</div>
      </div>`}if(s.type==="edit"&&s.changes){const a=s.changes.map(i=>`<span style="color:var(--muted)">${x(i.field)}:</span> <s style="color:var(--danger);font-size:11px">${x(i.from)}</s> → <span style="color:var(--good);font-size:11px">${x(i.to)}</span>`).join("<br>");return`<div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:12px;font-weight:500">✏️ Edited (${s.changes.length} field${s.changes.length>1?"s":""})</div>
        <div style="font-size:11px;margin:4px 0;line-height:1.6">${a}</div>
        ${o}
      </div>`}return s.description?`<div style="display:flex;align-items:center;gap:6px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div><span style="font-size:12px">${{listed:"📤",delisted:"🚫",created:"✨",relisted:"🔄"}[s.type]||"📋"} ${x(s.description)}</span><br>${o}</div>
      </div>`:""}).join("")}</div>`:'<div style="padding:12px;color:var(--muted);font-size:12px">No history yet.</div>'}function Ra(t,e,n="manual"){const s=k.find(o=>o.id===t);s&&(s.priceHistory||(s.priceHistory=[]),s.priceHistory.push({date:Date.now(),price:e,source:n}),s.priceHistory.length>50&&s.priceHistory.shift(),j("inv",t),O())}function Pr(t,e,n){const s=k.find(o=>o.id===t);s&&(s.priceHistory||(s.priceHistory=[]),s.priceHistory.push({date:Date.now(),price:e,source:"sold",platform:n}),s.priceHistory.length>50&&s.priceHistory.shift(),j("inv",t),O())}function Fa(t){const e=k.find(n=>n.id===t);return(e==null?void 0:e.priceHistory)||[]}function Id(t){const e=Fa(t);if(e.length<2)return"stable";const n=e.slice(-5),s=n[0].price,o=n[n.length-1].price;return o>s*1.02?"up":o<s*.98?"down":"stable"}function ng(t){const e=Fa(t);if(e.length<2)return'<div style="padding:10px;color:var(--muted);font-size:12px">No price history yet</div>';const n=e.slice(-20),s=n.map(l=>l.price),o=Math.min(...s),a=Math.max(...s),i=a-o||1;return`
    <div style="padding:8px;background:var(--surface2);border-radius:4px">
      <div style="display:flex;align-items:flex-end;height:40px;margin-bottom:6px;gap:2px">
        ${s.map(l=>{const c=(l-o)/i*100,d=l===s[s.length-1]?"var(--accent)":Id(t)==="up"?"var(--good)":"var(--warn)";return`<div style="display:inline-block;width:4px;height:${Math.max(c,5)}%;background:${d};margin:0 1px;border-radius:2px" title="${S(l)}"></div>`}).join("")}
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted)">
        <span>${S(o)}</span>
        <span>${S(a)}</span>
        <span style="font-weight:500;color:var(--text)">${n.length} changes</span>
      </div>
    </div>
  `}function sg(t){const e=Fa(t);return e.length?`
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead style="background:var(--surface2);border-bottom:2px solid var(--border)">
        <tr>
          <th style="padding:6px 8px;text-align:left;font-weight:500">Date</th>
          <th style="padding:6px 8px;text-align:right;font-weight:500">Price</th>
          <th style="padding:6px 8px;text-align:center;font-weight:500">Source</th>
        </tr>
      </thead>
      <tbody>${e.slice(-20).reverse().map(s=>{const o=s.source==="sold"?`<span style="font-size:10px;background:var(--danger);color:white;padding:2px 6px;border-radius:3px">${s.platform||"SOLD"}</span>`:s.source==="repricing"?'<span style="font-size:10px;background:var(--accent2);color:white;padding:2px 6px;border-radius:3px">AUTO</span>':s.source==="ebay-sync"?'<span style="font-size:10px;background:#3483fa;color:white;padding:2px 6px;border-radius:3px">eBay</span>':"";return`
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:6px 8px;font-size:12px;color:var(--muted)">${mt(s.date)}</td>
        <td style="padding:6px 8px;text-align:right;font-weight:500">${S(s.price)}</td>
        <td style="padding:6px 8px;text-align:center">${o}</td>
      </tr>
    `}).join("")}</tbody>
    </table>
  `:'<div style="padding:10px;color:var(--muted);font-size:12px">No price history</div>'}let Xn=null,Vs=!1;const qs=t=>t[Math.floor(Math.random()*t.length)],_d=["You are a seasoned thrift-store curator who tells the story behind every piece.","You are a fashion-forward stylist writing listings that feel like personal shopping recommendations.","You are a vintage boutique owner known for vivid, sensory descriptions that make buyers feel the fabric.","You are an energetic reseller who writes punchy, scroll-stopping copy with personality.","You are a luxury consignment specialist who highlights quality, craftsmanship, and investment value.","You are a streetwear culture writer who connects pieces to trends, aesthetics, and movements.","You are a sustainable fashion advocate who celebrates secondhand style and conscious closets."],Cd=["Use a storytelling approach — paint a scene where someone is wearing this item.","Lead with the most unique or eye-catching detail about this piece.",'Write as if recommending this to a friend who asked "what should I wear?"',"Focus on the lifestyle or occasion this piece is perfect for.","Emphasize texture, fit, and how the item feels — make it tangible.","Open with a bold, confident statement that stops the scroll.","Highlight what makes this piece a smart buy — value, versatility, or rarity.","Channel editorial magazine energy — aspirational but approachable."],Bd=["Start the description with a question that draws the reader in.","Open with a vivid one-liner that captures the item's vibe.","Begin with a bold claim about why this piece stands out.","Start with a relatable scenario where someone would reach for this item.","Lead with the brand story or heritage if the brand is notable.","Open with a seasonal or trend reference that makes the item timely."],Td=["End with a friendly, conversational call to action.","Close with urgency — hint that this piece won't last long.","Finish by suggesting how to style or pair this item, then invite the buyer to act.","End with a confidence-boosting statement about the buyer's future outfit.","Close with a bundle/savings incentive if the platform supports it."],Pd={Depop:1e3,Mercari:1e3,Poshmark:1500,eBay:4e3};function og(t){Xn=t}async function Oa(t,e={}){var n,s,o;if(Vs)throw new Error("Already generating — please wait");if(!Xn)throw new Error("Sign in to use AI features");try{const{data:{session:a},error:i}=await Xn.auth.getSession();if(i||!a){const{error:r}=await Xn.auth.refreshSession();if(r)throw new Error("Session expired — please sign in again")}}catch(a){throw new Error(a.message||"Sign in to use AI features")}Vs=!0;try{const a=e.platform||Z(t)[0]||"eBay",i=e.tone||"professional",r=Md(t,a,i,e.includeKeywords!==!1);console.log("[AI] Invoking anthropic-proxy…",{platform:a,tone:i,itemName:t.name});const{data:l,error:c}=await Xn.functions.invoke("anthropic-proxy",{body:{model:"claude-haiku-4-5-20251001",max_tokens:1024,temperature:.95,messages:[{role:"user",content:r}]}});if(c){let u="AI request failed";try{if(c.context&&typeof c.context.json=="function"){const p=await c.context.json();console.error("[AI] Edge Function error body:",p),p!=null&&p.error&&(u=typeof p.error=="string"?p.error:p.error.message||JSON.stringify(p.error))}else console.error("[AI] Error (no context):",c.message||c),c.message&&(u=c.message)}catch(p){console.error("[AI] Could not parse error response:",p)}throw new Error(u)}if(l!=null&&l.error){const u=typeof l.error=="string"?l.error:l.error.message||JSON.stringify(l.error);throw console.error("[AI] Response contained error:",u),new Error(u)}if((l==null?void 0:l.type)==="error"){const u=((n=l.error)==null?void 0:n.message)||"Unknown AI error";throw console.error("[AI] Anthropic error passed through:",u),new Error(u)}const d=((o=(s=l==null?void 0:l.content)==null?void 0:s[0])==null?void 0:o.text)||"";if(!d)throw console.error("[AI] Empty response. Full data:",JSON.stringify(l).slice(0,500)),new Error("Empty AI response — please try again");return console.log("[AI] Generation complete, parsing response…"),Dd(d)}finally{Vs=!1}}function Md(t,e,n,s){const o=[];t.name&&o.push(`Item: ${t.name}`),t.category&&o.push(`Category: ${t.category}`),t.subcategory&&o.push(`Subcategory: ${t.subcategory}`),t.condition&&o.push(`Condition: ${t.condition}`),t.upc&&o.push(`UPC: ${t.upc}`),t.isbn&&o.push(`ISBN: ${t.isbn}`),t.author&&o.push(`Author: ${t.author}`),t.price&&o.push(`Price: $${t.price}`),t.dimL&&t.dimW&&t.dimH&&o.push(`Dimensions: ${t.dimL} × ${t.dimW} × ${t.dimH} ${t.dimUnit||"in"}`),t.weight&&o.push(`Weight: ${t.weight} ${t.dimUnit==="cm"?"kg":"lb"}`),t.brand&&t.brand!=="Unbranded"&&o.push(`Brand: ${t.brand}`),t.color&&o.push(`Color: ${t.color}`),t.size&&o.push(`Size: ${t.size}`),t.material&&o.push(`Material: ${t.material}`),t.style&&o.push(`Style: ${t.style}`),t.model&&o.push(`Model: ${t.model}`);const a={eBay:"eBay: max 80 char title, include brand/model/key specs. Description should be detailed HTML-safe text. Focus on product features and specifications.",Poshmark:`Poshmark: max 80 char title with brand name first.
DESCRIPTION MUST include these sections in this order:
1. Opening hook — 1-2 sentences about the item (e.g. "Gorgeous [brand] [item]!")
2. Details — bullet style with brand, size, color, material, measurements if known
3. Condition — honest, specific (NWT, NWOT, EUC, GUC, etc.)
4. Style tip — suggest how to wear/style it
5. Closing — "Bundle for a discount!" or similar Poshmark-style CTA
TONE: Friendly, enthusiastic, like a boutique owner. Use phrases like "So cute!", "Gorgeous!", "Perfect for..."
DO NOT use hashtags. Poshmark uses style tags separately.`,Mercari:`Mercari: max 80 char title, brand + key detail + size.
DESCRIPTION should be:
1. Short and honest — Mercari buyers value transparency
2. Start with what the item is in 1 sentence
3. List key details: brand, size, color, material, condition
4. Mention any flaws honestly — builds trust and prevents returns
5. End with "Ships fast! Message me with any questions."
TONE: Casual, direct, trustworthy. No hype — just honest details.
Keep it under 150 words. Mercari shoppers skim quickly.`,Depop:`Depop: max 80 char title, brand + vibe + size.
STRICT LIMIT: Description MUST be under 1000 characters total (including hashtags and spaces).
DESCRIPTION format:
1. One punchy sentence about the item — capture the vibe/aesthetic
2. Key details on separate lines: brand, size, color, condition (use Depop lingo: NWT, NWOT, EUC, GUC)
3. End with 5-8 hashtags on one line (e.g. #vintage #streetwear #y2k)
TONE: Trendy, Gen-Z, casual. Use aesthetic references (cottagecore, Y2K, streetwear, minimalist, etc.).
Keep it SHORT — Depop has a 1000 character limit. Aim for 80-120 words max.`,Etsy:"Etsy: include relevant search terms. Description should tell a story about the item. Emphasize uniqueness.","Facebook Marketplace":"Facebook Marketplace: casual, local-friendly. Mention pickup/shipping availability.",Amazon:"Amazon: bullet-point style features. Focus on product specifications and condition details."},i=qs(_d),r=qs(Cd),l=qs(Bd),c=qs(Td);return`${i} Generate an optimized marketplace listing.

WRITING STYLE: ${r}
OPENING APPROACH: ${l}
CLOSING APPROACH: ${c}

IMPORTANT: Write a UNIQUE, creative description. Avoid generic phrases like "This [item] is perfect for…" or "Look no further!" — find a fresh angle every time.

ITEM DETAILS:
${o.join(`
`)}

PLATFORM: ${e}
${a[e]||""}

TONE: ${n}

REQUIREMENTS:
- Generate a compelling title (under 80 characters) — vary word order and phrasing from typical listings
- Generate a description appropriate for the platform${e==="Depop"?" (MUST be under 1000 characters total)":e==="Mercari"?" (under 150 words)":" (150-300 words)"}
${s?"- Include 5-8 relevant search keywords":""}
- Include condition details and any flaws
- End with a call to action matching the closing approach above

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
TITLE: [your title here]
DESCRIPTION:
[your description here]
${s?"KEYWORDS: [comma-separated keywords]":""}
SEO_TIPS: [2-3 tips for better listing visibility]`}function Dd(t){const e=t.match(/TITLE:\s*(.+?)(?:\n|$)/),n=t.match(/DESCRIPTION:\s*([\s\S]*?)(?=KEYWORDS:|SEO_TIPS:|$)/),s=t.match(/KEYWORDS:\s*(.+?)(?:\n|$)/),o=t.match(/SEO_TIPS:\s*([\s\S]*?)$/);return{title:e?e[1].trim():"",description:n?n[1].trim():"",keywords:s?s[1].split(",").map(a=>a.trim()).filter(Boolean):[],seoTips:o?o[1].split(`
`).map(a=>a.replace(/^[-•*]\s*/,"").trim()).filter(Boolean):[]}}async function ag(t,e={}){const n=F(t);if(!n)throw new Error("Item not found");w("Generating AI listing…");const s=await Oa(n,e);return(s.title||s.description)&&(n.aiListing||(n.aiListing={}),n.aiListing.title=s.title,n.aiListing.description=s.description,n.aiListing.keywords=s.keywords,n.aiListing.generatedAt=new Date().toISOString(),n.aiListing.platform=e.platform||"",j("inv",t),O(),w("AI listing generated ✓")),s}function ig(t){var o;const e=t.aiListing||{},n=e.title||e.description;let s='<div class="ai-panel">';return n&&(s+=`
      <div class="ai-existing">
        <div class="ai-label">AI-Generated Title:</div>
        <div class="ai-title">${x(e.title)}</div>
        <div class="ai-label" style="margin-top:8px">AI-Generated Description:</div>
        <div class="ai-desc">${x(e.description).replace(/\n/g,"<br>")}</div>
        ${(o=e.keywords)!=null&&o.length?`<div class="ai-keywords">${e.keywords.map(a=>`<span class="ai-kw">${x(a)}</span>`).join("")}</div>`:""}
        <div class="ai-meta">Generated ${e.generatedAt?new Date(e.generatedAt).toLocaleDateString():""} ${e.platform?`for ${e.platform}`:""}</div>
      </div>
      <div class="ai-actions">
        <button class="btn-sm" onclick="aiCopyListing('${t.id}')">📋 Copy</button>
        <button class="btn-sm" onclick="aiRegenerate('${t.id}')">🔄 Regenerate</button>
      </div>
    `),s+=`
    <div class="ai-generate">
      <div class="ai-gen-row">
        <select id="aiPlatform" class="ai-select">
          <option value="">Any Platform</option>
          <option value="eBay">eBay</option>
          <option value="Poshmark">Poshmark</option>
          <option value="Mercari">Mercari</option>
          <option value="Depop">Depop</option>
          <option value="Etsy">Etsy</option>
          <option value="Facebook Marketplace">Facebook</option>
          <option value="Amazon">Amazon</option>
        </select>
        <select id="aiTone" class="ai-select">
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="urgent">Urgent/Sale</option>
          <option value="luxury">Luxury</option>
        </select>
      </div>
      <button class="btn-primary ai-gen-btn" onclick="aiGenerate('${t.id}')" ${Vs?"disabled":""}>
        ✨ ${n?"Regenerate":"Generate"} AI Listing
      </button>
      <div class="ai-cost-note">~$0.002 per generation (Claude Haiku)</div>
    </div>
  `,s+="</div>",s}async function rg(t){const e=F(t);if(!(e!=null&&e.aiListing))return;const n=`${e.aiListing.title}

${e.aiListing.description}`;try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(n);else{const s=document.createElement("textarea");s.value=n,s.style.position="fixed",s.style.opacity="0",document.body.appendChild(s),s.select(),document.execCommand("copy"),document.body.removeChild(s)}w("AI listing copied to clipboard ✓")}catch{w("Copy failed — try selecting the text manually",!0)}}async function Mr(t,e,n=!1){const s=F(t);if(!s)throw new Error("Item not found");s.crosslistCache||(s.crosslistCache={});const o=s.crosslistCache[e];if(o&&!n)return o;w(`Generating ${e} listing…`);const a=await Oa(s,{platform:e}),i=Pd[e];return i&&a.description.length>i&&(a.description=a.description.slice(0,i-3).replace(/\s\S*$/,"")+"..."),s.crosslistCache[e]={title:a.title,description:a.description,keywords:a.keywords,generatedAt:new Date().toISOString()},j("inv",t),O(),w(`${e} listing ready ✓`),s.crosslistCache[e]}async function lg(t,e){try{const n=await Mr(t,e),s=`${n.title}

${n.description}`;await navigator.clipboard.writeText(s),w(`${e} listing copied ✓`)}catch(n){w(`Failed: ${n.message}`,!0)}}const Na=50,Dr="ft_notifications";let At=[],Re=0,ns=!1;function Ld(){try{At=JSON.parse(localStorage.getItem(Dr)||"[]").slice(0,Na),Re=At.filter(t=>!t.read).length}catch{At=[],Re=0}}function Ua(){localStorage.setItem(Dr,JSON.stringify(At.slice(0,Na)))}function ce(t,e,n,s){At.unshift({id:Date.now().toString(36),type:t,title:e,message:n,actionId:s||null,time:new Date().toISOString(),read:!1}),At=At.slice(0,Na),Re=At.filter(o=>!o.read).length,Ua(),$o()}function cg(){At.forEach(t=>t.read=!0),Re=0,Ua(),$o(),qa()}function dg(){At=[],Re=0,Ua(),$o(),qa()}function $o(){const t=document.getElementById("notifBadge");t&&(Re>0?(t.textContent=Re>9?"9+":Re,t.style.display=""):t.style.display="none")}function Ad(t){const e=Date.now()-new Date(t).getTime(),n=Math.floor(e/6e4);if(n<1)return"just now";if(n<60)return n+"m ago";const s=Math.floor(n/60);return s<24?s+"h ago":Math.floor(s/24)+"d ago"}function zd(t){switch(t){case"stock":return"📦";case"sync":return"🔄";case"price":return"💲";case"sale":return"🎉";case"info":return"ℹ️";default:return"🔔"}}function qa(){const t=document.getElementById("notifList");if(t){if(!At.length){t.innerHTML='<div class="notif-empty">No notifications yet</div>';return}t.innerHTML=At.slice(0,20).map(e=>`
    <div class="notif-item${e.read?"":" unread"}" data-nid="${e.id}"${e.actionId?` onclick="openDrawer('${ge(e.actionId)}')"`:""}>
      <span class="notif-icon">${zd(e.type)}</span>
      <div class="notif-body">
        <div class="notif-title">${x(e.title)}</div>
        <div class="notif-msg">${x(e.message)}</div>
      </div>
      <span class="notif-time">${Ad(e.time)}</span>
    </div>
  `).join("")}}function pg(){ns=!ns;const t=document.getElementById("notifDropdown");t&&(ns?(t.classList.add("on"),qa()):t.classList.remove("on"))}function Rd(){ns=!1;const t=document.getElementById("notifDropdown");t&&t.classList.remove("on")}function Fd(){const t=Date.now(),e=parseInt(localStorage.getItem("ft_notif_stock_check")||"0");if(t-e<36e5)return;localStorage.setItem("ft_notif_stock_check",t.toString());const n=k.filter(l=>l.bulk&&l.qty===0),s=k.filter(l=>l.bulk&&l.qty>0&&l.qty<=(l.lowAlert||2)),o=k.filter(l=>(l.qty||0)<=0?!1:Math.floor((t-new Date(l.added||t).getTime())/864e5)>=60&&!B.some(d=>d.itemId===l.id));n.length&&ce("stock","Out of Stock",`${n.length} item${n.length>1?"s":""} need restocking`),s.length&&ce("stock","Low Stock Warning",`${s.length} item${s.length>1?"s are":" is"} running low`),o.length&&ce("price","Stale Inventory",`${o.length} item${o.length>1?"s":""} listed 60+ days with no sales — consider repricing`);const a=k.filter(l=>{if((l.qty||0)<=0)return!1;const c=Math.floor((t-new Date(l.added||t).getTime())/864e5);return c>=30&&c<60&&!B.some(d=>d.itemId===l.id)});a.length&&ce("price","Reprice Suggestion",`${a.length} item${a.length>1?"s":""} listed 30+ days without a sale — lower price by 10-15%?`);const i=k.filter(l=>{if((l.qty||0)<=0)return!1;const c=l.platformListingDates;return c?Object.entries(c).some(([d,u])=>{const p=new Date(u).getTime(),y=Math.floor((t-p)/864e5);return y>=27&&y<=30}):!1});i.length&&ce("info","Listings Expiring Soon",`${i.length} listing${i.length>1?"s":""} expiring in the next 3 days — relist or renew`);const r=k.filter(l=>{if((l.qty||0)<=0)return!1;const c=l.platforms||[];if(c.length>0&&!c.every(u=>u==="Unlisted"))return!1;const{m:d}={m:l.price?(l.price-(l.cost||0))/l.price:0};return d>=.5&&(l.price||0)>=20});r.length&&ce("info","Unlisted High-Margin Items",`${r.length} item${r.length>1?"s have":" has"} 50%+ margin but ${r.length>1?"aren't":"isn't"} listed on any platform`)}function ug(){const t={};for(const e of k){const n=e.category||"Uncategorized";t[n]||(t[n]={cat:n,items:0,sold:0,totalDays:0,revenue:0,profit:0}),t[n].items++}for(const e of B){const n=k.find(o=>o.id===e.itemId),s=(n==null?void 0:n.category)||"Uncategorized";if(t[s]||(t[s]={cat:s,items:0,sold:0,totalDays:0,revenue:0,profit:0}),t[s].sold++,t[s].revenue+=e.price||0,t[s].profit+=(e.price||0)-(e.fees||0)-(e.ship||0)-((n==null?void 0:n.cost)||0),n!=null&&n.added&&e.date){const o=Math.max(1,Math.floor((new Date(e.date).getTime()-new Date(n.added).getTime())/864e5));t[s].totalDays+=o}}return Object.values(t).map(e=>({...e,avgDaysToSell:e.sold>0?Math.round(e.totalDays/e.sold):null,sellThrough:e.items>0?Math.round(e.sold/(e.items+e.sold)*100):0})).sort((e,n)=>(e.avgDaysToSell||999)-(n.avgDaysToSell||999))}let Qi=!1;function fg(){Qi||(Qi=!0,Ld(),$o(),Fd(),document.addEventListener("click",t=>{ns&&!t.target.closest("#notifDropdown")&&!t.target.closest("#notifBellBtn")&&Rd()}))}function mg(t){try{if(typeof t!="function")return;const e=t();if(!e||!e.length)return;for(const n of e){if(At.some(a=>a.actionId===`wn_show_${n.id}`&&a.type==="show"))continue;const o=n.time?` at ${n.time}`:"";ce("show",`Whatnot Show Today${o}`,`"${n.name}" — ${n.items.length} items prepped`,`wn_show_${n.id}`)}}catch{}}function gg(t,e,n){ce("sale","Show Complete",`"${t}" ended — ${e} sold, $${(n||0).toFixed(2)} revenue`,null)}const lt="/sell/inventory/v1",Od="/sell/fulfillment/v1",ds={new:{id:1e3,enumVal:"NEW"},nwt:{id:1e3,enumVal:"NEW"},"new/sealed":{id:1e3,enumVal:"NEW"},"like new":{id:3e3,enumVal:"LIKE_NEW"},nwot:{id:1500,enumVal:"NEW_OTHER"},"open box":{id:1500,enumVal:"NEW_OTHER"},excellent:{id:2750,enumVal:"USED_EXCELLENT"},refurbished:{id:2750,enumVal:"SELLER_REFURBISHED"},euc:{id:4e3,enumVal:"USED_VERY_GOOD"},"very good":{id:4e3,enumVal:"USED_VERY_GOOD"},good:{id:5e3,enumVal:"USED_GOOD"},guc:{id:5e3,enumVal:"USED_GOOD"},acceptable:{id:6e3,enumVal:"USED_ACCEPTABLE"},fair:{id:6e3,enumVal:"USED_ACCEPTABLE"},poor:{id:7e3,enumVal:"FOR_PARTS_OR_NOT_WORKING"}},Go="/sell/account/v1";let Mn=null,ss=!1,Cn=null,js=null,Ye=null,Xi={},Vo=!1;async function yg(){Mn=await gt("ebay_last_sync")}function vg(){Cn&&clearInterval(Cn),Cn=setInterval(()=>{ft()&&!ss&&Lr().catch(t=>{console.warn("eBay sync error:",t.message),w("eBay sync failed — will retry",!0)})},3e5)}function Nd(){Cn&&(clearInterval(Cn),Cn=null)}async function Lr(){var t,e,n,s;if(!ft())throw new Error("eBay not connected");if(ss)throw new Error("Sync already in progress");ss=!0;try{let o=0,a=0,i=0,r=0;const l=100;let c=!0;for(;c;){const p=(await X("GET",`${lt}/inventory_item?limit=${l}&offset=${r}`)).inventoryItems||[];p.length<l&&(c=!1);for(const y of p){const v=y.sku;let h=k.find(m=>m.sku&&m.sku===v)||k.find(m=>m.ebayItemId&&m.ebayItemId===v);if(h){o++;let m=!1;(!h.ebayItemId||h.ebayItemId!==v)&&(h.ebayItemId=v,m=!0);const f=(t=y.availability)==null?void 0:t.shipToLocationAvailability;f&&(f.quantity||0)===0&&((e=h.platformStatus)==null?void 0:e.eBay)==="active"&&(Tt(h.id,"eBay","sold"),m=!0);const E=y.product;E&&(!h.name&&E.title&&(h.name=E.title,m=!0),!h.upc&&((n=E.upc)!=null&&n.length)&&(h.upc=E.upc[0],m=!0),(s=E.imageUrls)!=null&&s.length&&(!h.images||!h.images.length)&&(h.images=E.imageUrls,h.image=E.imageUrls[0],m=!0)),m&&(j("inv",h.id),i++)}else a++}r+=l}const d=await qd();return i+=d,await Ud(),Mn=new Date().toISOString(),await et("ebay_last_sync",Mn),i>0&&(O(),V()),{matched:o,unmatched:a,updated:i}}finally{ss=!1}}async function Ud(){var t,e;try{const n=Mn?new Date(Mn):new Date(Date.now()-864e5),s=new Date,o=d=>d.toISOString().replace(/\.\d{3}Z$/,"Z"),a=o(n),i=o(s),r=`creationdate:[${a}..${i}]`,c=(await X("GET",`${Od}/order?filter=${encodeURIComponent(r)}&limit=50`)).orders||[];for(const d of c)for(const u of d.lineItems||[]){const p=u.sku;if(!p)continue;const y=k.find(v=>v.ebayItemId===p||v.sku===p);if(y&&((t=y.platformStatus)==null?void 0:t.eBay)!=="sold"){const v=parseInt(u.quantity,10)||1;y.qty=Math.max(0,(y.qty||1)-v),Tt(y.id,"eBay","sold"),y.qty<=0&&_r(y.id,"eBay");const h=parseFloat(((e=u.total)==null?void 0:e.value)||"0");h>0&&Pr(y.id,h,"eBay"),j("inv",y.id);const m=y.name||y.sku||"Item",f=h>0?` for $${h.toFixed(2)}`:"";w(`🎉 eBay Sale! ${m}${f}`),ce("sale","eBay Sale",`${m} sold${f}`,y.id);try{Pa.sale()}catch{}}}Vo=!1}catch(n){Vo||(console.warn("eBay orders sync error:",n.message),Vo=!0)}}async function qd(){var e,n;let t=0;try{const s=k.filter(a=>{var i;return a.ebayItemId&&((i=a.platformStatus)==null?void 0:i.eBay)==="active"});if(s.length===0)return 0;const o=5;for(let a=0;a<s.length;a+=o){const i=s.slice(a,a+o),r=await Promise.allSettled(i.map(l=>X("GET",`${lt}/offer?sku=${encodeURIComponent(l.ebayItemId)}`).then(c=>({item:l,resp:c}))));for(const l of r){if(l.status!=="fulfilled")continue;const{item:c,resp:d}=l.value,u=(d==null?void 0:d.offers)||[];if(u.length===0)continue;const p=parseFloat(((n=(e=u[0].pricingSummary)==null?void 0:e.price)==null?void 0:n.value)||"0");if(p<=0)continue;const y=c.price||0;Math.abs(p-y)>=.01&&(console.log(`[eBay] Price sync: "${c.name}" $${y.toFixed(2)} → $${p.toFixed(2)} (from eBay)`),c.price=p,Ra(c.id,p,"ebay-sync"),j("inv",c.id),t++)}}t>0&&console.log(`[eBay] Synced ${t} price(s) from eBay`)}catch(s){console.warn("[eBay] Price sync error:",s.message)}return t}function ja(t){const e=(t.condition||"good").toLowerCase().trim(),n=ds[e]||ds.good,s=n.enumVal==="NEW"||n.enumVal==="NEW_OTHER"||n.enumVal==="LIKE_NEW",o=(t.images||[]).filter(v=>v&&typeof v=="string"&&v.startsWith("http")).slice(0,12);if(o.length===0)throw new Error("eBay requires at least one image. Add a photo to this item first.");const a={availability:{shipToLocationAvailability:{quantity:t.qty||1}},condition:String(n.enumVal),product:{title:(t.name||"Item").slice(0,80),description:jd(t),imageUrls:o}};!s&&t.conditionDesc&&(a.conditionDescription=String(t.conditionDesc).slice(0,1e3));const i=Ar(t);Object.keys(i).length>0&&(a.product.aspects=i);const r=t.dimUnit||"in",l=parseFloat(t.weightMaj)||0,c=parseFloat(t.weightMin)||0;let d;r==="cm"?d=(l+c/1e3)*2.205:d=l+c/16,d<=0&&(d=1),a.packageWeightAndSize={weight:{value:Math.round(d*100)/100,unit:"POUND"}};const u=parseFloat(t.dimL)||0,p=parseFloat(t.dimW)||0,y=parseFloat(t.dimH)||0;if(u>0&&p>0&&y>0){let v=u,h=p,m=y;r==="cm"&&(v=u/2.54,h=p/2.54,m=y/2.54),a.packageWeightAndSize.dimensions={length:Math.round(v*10)/10,width:Math.round(h*10)/10,height:Math.round(m*10)/10,unit:"INCH"}}return t.upc&&(a.product.upc=[t.upc]),t.isbn&&(a.product.isbn=[t.isbn]),t.mpn&&(a.product.mpn=t.mpn),a}async function Ha(t){if(!t.ebayDesc&&!t._aiDesc)try{console.log("[eBay] Generating AI description for",t.name);const e=await Oa(t,{platform:"eBay"});e.description&&(t.ebayDesc=e.description.slice(0,4e3),e.title&&!t.aiListing&&(t.aiListing={title:e.title,description:e.description,keywords:e.keywords,generatedAt:new Date().toISOString(),platform:"eBay"}),j("inv",t.id),O(),console.log("[eBay] AI description generated and saved"))}catch(e){console.warn("[eBay] AI description generation failed, using template:",e.message)}}function jd(t){if(t.ebayDesc)return String(t.ebayDesc).slice(0,4e3);const e=c=>String(c).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),n=e(t.name||"Item"),s=t.brand&&t.brand!=="Unbranded"?e(t.brand)+" ":"",o=[],a=(c,d)=>{d&&o.push(`<b>${c}:</b> ${e(d)}`)};a("Brand",t.brand&&t.brand!=="Unbranded"?t.brand:null),a("Model",t.model),a("Color",t.color),a("Size",t.size),a("Material",t.material),a("Style",t.style),a("Pattern",t.pattern),a("Condition",t.condition),a("Author",t.author),a("Publisher",t.publisher),a("ISBN",t.isbn);const i=o.length>0?`<p>${o.join(" &bull; ")}</p>`:"",l=`<div style="font-family:sans-serif;max-width:700px;margin:0 auto"><h2 style="margin:0 0 8px">${s}${n}</h2>`+i+""+'<p style="color:#555;font-size:13px">Ships within 1 business day. Check out my other listings!</p></div>';return l.length>4e3?`<div><h2>${s}${n}</h2><p>${o.slice(0,6).join(" &bull; ")}</p></div>`.slice(0,4e3):l}function Hd(t){if(t.department)return t.department;const e=(t.subcategory||"").toLowerCase(),n=(t.subtype||"").toLowerCase(),s=(t.name||"").toLowerCase();return e.includes("men")&&!e.includes("women")?"Men's":e.includes("women")?"Women's":e.includes("children")||e.includes("kid")||e.includes("boy")||e.includes("girl")?"Kids":n.includes("men")&&!n.includes("women")?"Men's":n.includes("women")?"Women's":/\bmen'?s?\b/i.test(s)&&!/\bwomen/i.test(s)?"Men's":/\bwomen'?s?\b/i.test(s)?"Women's":/\bboy'?s?\b/i.test(s)?"Boys'":/\bgirl'?s?\b/i.test(s)?"Girls'":/\bkids?\b|\bchild/i.test(s)?"Unisex Kids":(/\bunisex\b/i.test(s),"Unisex Adults")}function Ar(t){const e={};e.Brand=[t.brand||"Unbranded"],t.color&&(e.Color=[t.color]),t.size&&(e.Size=[t.size]),t.material&&(e.Material=[t.material]),t.style&&(e.Style=[t.style]),t.pattern&&(e.Pattern=[t.pattern]),t.model&&(e.Model=[t.model]),t.mpn&&(e.MPN=[t.mpn]);const n=t.department||Hd(t);return e.Department=[n],e["Size Type"]=[t.sizeType||"Regular"],t.inseam&&(e.Inseam=[t.inseam]),t.garmentCare&&(e["Garment Care"]=[t.garmentCare]),t.shoeSize&&(e["US Shoe Size"]=[t.shoeSize]),t.shoeWidth&&(e["Shoe Width"]=[t.shoeWidth]),t.author&&(e.Author=[t.author]),t.publisher&&(e.Publisher=[t.publisher]),t.edition&&(e.Edition=[t.edition]),t.pubYear&&(e["Publication Year"]=[String(t.pubYear)]),t.coverType&&(e.Format=[t.coverType==="hardcover"?"Hardcover":"Paperback"]),t.isbn&&(e.ISBN=[t.isbn]),e}function Wd(t){const e=[],n=/item specific (\w[\w\s/&'-]*?) is missing/gi;let s;for(;(s=n.exec(t))!==null;)e.push(s[1].trim());return e}async function Wa(t,e,n){try{await X("PUT",`${lt}/inventory_item/${encodeURIComponent(t)}`,e);return}catch(s){const o=Wd(s.message||"");if(o.length===0)throw s;console.log("[eBay] Missing aspects detected:",o.join(", "),"— auto-filling and retrying"),e.product||(e.product={}),e.product.aspects||(e.product.aspects={});for(const a of o){if(e.product.aspects[a])continue;const i=zr[a.toLowerCase()];e.product.aspects[a]=[i?String(i(n)):"N/A"]}console.log("[eBay] Retrying PUT with patched aspects"),await X("PUT",`${lt}/inventory_item/${encodeURIComponent(t)}`,e)}}async function Ga(t){var o;if(!ft())throw new Error("eBay not connected");const e=F(t);if(!e)throw new Error("Item not found");const n=e.ebayItemId||e.sku||`FT-${t.slice(0,12)}`;await Ha(e);const s=ja(e);try{const a=await Va(e.name||"item");if(a){const i=await Ya(a,s.condition);i!==s.condition&&(console.log("[eBay] Condition",s.condition,"not valid for category",a,"→ using",i),s.condition=String(i)),(o=s.product)!=null&&o.aspects&&await io(s.product.aspects,a,e)}}catch(a){console.warn("[eBay] Pre-fill skipped:",a.message)}console.log("[eBay] Inventory payload:",JSON.stringify(s,null,2));try{await Wa(n,s,e),e.ebayItemId=n,e.platforms||(e.platforms=[]),e.platforms.includes("eBay")||e.platforms.push("eBay");const a=e.platforms.indexOf("Unlisted");return a!==-1&&e.platforms.splice(a,1),e.platformStatus||(e.platformStatus={}),e.platformStatus.eBay="draft",qe(t,"eBay",ot()),j("inv",t),O(),w(`Pushed "${x(e.name)}" to eBay inventory (SKU: ${n})`),{success:!0,sku:n}}catch(a){return w(`eBay push error: ${a.message}`,!0),{success:!1,sku:n}}}async function Gd(t){var o,a;if(!ft())throw new Error("eBay not connected");const e=F(t);if(!e)throw new Error("Item not found");if(!e.ebayItemId)throw new Error("Item not on eBay");const n=e.ebayItemId;await Ha(e);const s=ja(e);try{const i=await Va(e.name||"item");if(i){const r=await Ya(i,s.condition);r!==s.condition&&(console.log("[eBay] Condition",s.condition,"not valid for category",i,"→ using",r),s.condition=String(r)),(o=s.product)!=null&&o.aspects&&await io(s.product.aspects,i,e)}}catch(i){console.warn("[eBay] Pre-fill skipped:",i.message)}console.log("[eBay] Updating inventory item:",n),await Wa(n,s,e),console.log("[eBay] Inventory item updated");try{const i=await X("GET",`${lt}/offer?sku=${encodeURIComponent(n)}`);if(((a=i==null?void 0:i.offers)==null?void 0:a.length)>0){const r=i.offers[0],l=r.offerId,c=e.price||0;if(c>0){const u={pricingSummary:{price:{value:c.toFixed(2),currency:"USD"}},availableQuantity:e.qty||1};r.categoryId&&(u.categoryId=r.categoryId),r.listingPolicies&&(u.listingPolicies=r.listingPolicies),r.merchantLocationKey&&(u.merchantLocationKey=r.merchantLocationKey),r.format&&(u.format=r.format),r.listingDuration&&(u.listingDuration=r.listingDuration),console.log("[eBay] Updating offer price to $"+c.toFixed(2)),await X("PUT",`${lt}/offer/${l}`,u)}console.log("[eBay] Re-publishing offer to push changes live:",l);const d=await X("POST",`${lt}/offer/${l}/publish`);console.log("[eBay] Listing updated live, listingId:",d.listingId)}else console.log("[eBay] No offer found — inventory item updated but listing may need manual publish")}catch(i){console.warn("[eBay] Re-publish note:",i.message)}return{success:!0}}async function Vd(t){var s,o,a;if(!ft())return{success:!1};const e=F(t);if(!e||!e.ebayItemId)return{success:!1};if(!e.price||e.price<=0)return{success:!1};const n=e.ebayItemId;try{const i=await X("GET",`${lt}/offer?sku=${encodeURIComponent(n)}`);if(!((s=i==null?void 0:i.offers)!=null&&s.length))return console.log("[eBay] No offer found for SKU",n,"— skipping price push"),{success:!1};const r=i.offers[0],l=r.offerId,c=parseFloat(((a=(o=r.pricingSummary)==null?void 0:o.price)==null?void 0:a.value)||"0");if(Math.abs(c-e.price)<.01)return console.log("[eBay] Price already in sync ($"+e.price.toFixed(2)+")"),{success:!0};const d={pricingSummary:{price:{value:e.price.toFixed(2),currency:"USD"}},availableQuantity:e.qty||1};return r.categoryId&&(d.categoryId=r.categoryId),r.listingPolicies&&(d.listingPolicies=r.listingPolicies),r.merchantLocationKey&&(d.merchantLocationKey=r.merchantLocationKey),r.format&&(d.format=r.format),r.listingDuration&&(d.listingDuration=r.listingDuration),console.log("[eBay] Pushing price update: $"+c.toFixed(2)+" → $"+e.price.toFixed(2)),await X("PUT",`${lt}/offer/${l}`,d),await X("POST",`${lt}/offer/${l}/publish`),console.log("[eBay] Price synced to eBay ✓"),{success:!0}}catch(i){return console.warn("[eBay] Price push failed:",i.message),{success:!1}}}async function Yd(){var t,e,n,s,o,a;if(js)return js;try{const i="marketplace_id=EBAY_US",[r,l,c]=await Promise.all([X("GET",`${Go}/payment_policy?${i}`),X("GET",`${Go}/return_policy?${i}`),X("GET",`${Go}/fulfillment_policy?${i}`)]),d=(e=(t=r==null?void 0:r.paymentPolicies)==null?void 0:t[0])==null?void 0:e.paymentPolicyId,u=(s=(n=l==null?void 0:l.returnPolicies)==null?void 0:n[0])==null?void 0:s.returnPolicyId,p=(a=(o=c==null?void 0:c.fulfillmentPolicies)==null?void 0:o[0])==null?void 0:a.fulfillmentPolicyId;return d&&u&&p?(js={paymentPolicyId:d,returnPolicyId:u,fulfillmentPolicyId:p},js):null}catch(i){return console.warn("[eBay] Could not fetch business policies:",i.message),null}}async function Va(t){var e,n;try{const s=encodeURIComponent(t.slice(0,100)),o=await X("GET",`/commerce/taxonomy/v1/category_tree/0/get_category_suggestions?q=${s}`),a=(e=o==null?void 0:o.categorySuggestions)==null?void 0:e[0];return((n=a==null?void 0:a.category)==null?void 0:n.categoryId)||null}catch(s){return console.warn("[eBay] Category suggestion failed:",s.message),null}}async function Kd(){if(Ye)return Ye;try{const t=await X("GET",`${lt}/location?limit=5`),e=(t==null?void 0:t.locations)||[];if(e.length>0)return Ye=e[0].merchantLocationKey,console.log("[eBay] Found merchant location:",Ye),Ye;const n="fliptrack-default";return console.log("[eBay] Creating default merchant location…"),await X("POST",`${lt}/location/${n}`,{location:{address:{postalCode:"10001",country:"US"}},locationTypes:["WAREHOUSE"],name:"Default",merchantLocationStatus:"ENABLED"}),Ye=n,console.log("[eBay] Created merchant location:",n),Ye}catch(t){return console.warn("[eBay] Could not fetch/create merchant location:",t.message),null}}async function Ya(t,e){var n,s,o,a;try{const i=await X("GET",`/commerce/taxonomy/v1/category_tree/0/get_item_conditions_policies?category_id=${t}`),r=((s=(n=i==null?void 0:i.itemConditionPolicies)==null?void 0:n[0])==null?void 0:s.itemConditions)||[],l=r.map(h=>String(h.conditionId));console.log("[eBay] Valid conditions for category",t,":",l.join(","));const c=Object.values(ds),d=(o=c.find(h=>h.enumVal===e))==null?void 0:o.id;if(d&&l.includes(String(d)))return e;const u=[3e3,4e3,5e3,6e3,2750,7e3,1500,1e3],p=[1e3,1500,3e3],v=["NEW","NEW_OTHER","LIKE_NEW"].includes(e)?p:u;for(const h of v)if(l.includes(String(h))){const m=c.find(f=>f.id===h);if(m)return console.log("[eBay] Condition",e,"not valid, falling back to",m.enumVal),m.enumVal}if(r.length>0&&((a=r[0])!=null&&a.conditionId)){const h=c.find(m=>m.id===parseInt(r[0].conditionId));if(h)return h.enumVal}return e}catch(i){return console.warn("[eBay] Could not fetch valid conditions:",i.message),e}}async function Jd(t){const e=Xi[t];if(e&&Date.now()-e.timestamp<36e5)return e.aspects;try{const n=await X("GET",`/commerce/taxonomy/v1/category_tree/0/get_item_aspects_for_category?category_id=${t}`),o=((n==null?void 0:n.aspects)||[]).map(a=>{var i,r;return{name:a.localizedAspectName||"",required:((i=a.aspectConstraint)==null?void 0:i.aspectRequired)===!0,mode:((r=a.aspectConstraint)==null?void 0:r.aspectMode)||"FREE_TEXT",values:(a.aspectValues||[]).map(l=>l.localizedValue).filter(Boolean)}});return Xi[t]={aspects:o,timestamp:Date.now()},console.log("[eBay] Fetched",o.length,"aspects for category",t,"—",o.filter(a=>a.required).length,"required"),o}catch(n){return console.warn("[eBay] Could not fetch required aspects for category",t,":",n.message),[]}}const zr={type:t=>t.subtype||t.subcategory||"Other",style:t=>t.style||"Classic",closure:t=>"Pull On",pattern:t=>t.pattern||"Solid",material:t=>t.material||"N/A",color:t=>t.color||"Multicolor",features:t=>"N/A",theme:t=>"Classic",occasion:t=>"Casual",season:t=>"All Seasons",fit:t=>"Regular",rise:t=>"Mid Rise","leg style":t=>"Straight","sleeve length":t=>"Short Sleeve",neckline:t=>"Crew Neck",vintage:t=>"No","country/region of manufacture":t=>"Unknown",character:t=>"N/A",model:t=>t.model||"N/A",connectivity:t=>"N/A","number of items in set":t=>"1","unit type":t=>"Unit","unit quantity":t=>"1"};async function io(t,e,n){const s=await Jd(e);if(!s.length)return t;const o={};for(const i of Object.keys(t))o[i.toLowerCase()]=i;let a=0;for(const i of s){if(!i.required)continue;const r=i.name,l=r.toLowerCase();if(o[l])continue;const c=zr[l];if(c){const d=c(n);if(i.mode==="SELECTION_ONLY"&&i.values.length>0){const u=i.values.find(p=>p.toLowerCase()===String(d).toLowerCase());t[r]=[u||i.values[0]]}else t[r]=[String(d)];a++;continue}i.values.length>0?(t[r]=[i.values[0]],a++):(t[r]=["N/A"],a++)}return a>0&&console.log("[eBay] Auto-filled",a,"missing required aspects for category",e),t}async function So(t,e={}){var y,v,h,m,f,E;if(!ft())throw new Error("eBay not connected");const n=F(t);if(!n)throw new Error("Item not found");if(!n.ebayItemId)throw new Error("Item not in eBay inventory. Push it first.");const s=n.ebayItemId,o=n.price||0;if(o<=0)throw new Error("Item needs a price before listing");let a=e.categoryId||null;if(a||(a=await Va(n.name||"item")),!a)throw new Error("Could not determine eBay category. Please set a category for this item.");const i=(n.condition||"good").toLowerCase().trim(),r=ds[i]||ds.good,l=await Ya(a,r.enumVal);l!==r.enumVal&&console.log("[eBay] Overriding condition from",r.enumVal,"to",l,"for category",a),await Ha(n);try{const $=ja(n);$.condition=String(l),(y=$.product)!=null&&y.aspects&&await io($.product.aspects,a,n),console.log("[eBay] Re-pushing inventory item with validated condition:",l),await Wa(s,$,n),console.log("[eBay] Inventory re-push succeeded")}catch($){console.warn("[eBay] Full re-push failed:",$.message,"— trying aspect-only patch");try{const I=await X("GET",`${lt}/inventory_item/${encodeURIComponent(s)}`),M=Ar(n);await io(M,a,n),I.product||(I.product={}),I.product.aspects={...I.product.aspects||{},...M},I.condition=String(l),console.log("[eBay] Patching aspects + condition on existing inventory item"),await X("PUT",`${lt}/inventory_item/${encodeURIComponent(s)}`,I),console.log("[eBay] Aspect patch succeeded")}catch(I){console.warn("[eBay] Aspect patch also failed:",I.message)}}const c=e.paymentPolicyId||e.returnPolicyId||e.fulfillmentPolicyId;let d=null;if(c)d={},e.paymentPolicyId&&(d.paymentPolicyId=e.paymentPolicyId),e.returnPolicyId&&(d.returnPolicyId=e.returnPolicyId),e.fulfillmentPolicyId&&(d.fulfillmentPolicyId=e.fulfillmentPolicyId);else{const $=await Yd();$&&(d={paymentPolicyId:$.paymentPolicyId,returnPolicyId:$.returnPolicyId,fulfillmentPolicyId:$.fulfillmentPolicyId})}if(!d)throw new Error("eBay requires business policies (payment, return, shipping). Set these up in eBay Seller Hub first.");const u=await Kd();if(!u)throw new Error("Could not set up eBay inventory location. Go to eBay Seller Hub → Shipping → Locations and add one.");const p={sku:s,marketplaceId:"EBAY_US",format:"FIXED_PRICE",listingDuration:e.listingDuration||"GTC",categoryId:a,merchantLocationKey:u,listingPolicies:d,pricingSummary:{price:{value:o.toFixed(2),currency:"USD"}},availableQuantity:n.qty||1};try{let $=null;try{const N=await X("GET",`${lt}/offer?sku=${encodeURIComponent(s)}`);((v=N==null?void 0:N.offers)==null?void 0:v.length)>0&&($=N.offers[0].offerId,console.log("[eBay] Found existing offer:",$,"— updating it"))}catch{}if($){const{sku:N,marketplaceId:W,...L}=p;console.log("[eBay] Updating offer:",$,JSON.stringify(L));try{await X("PUT",`${lt}/offer/${$}`,L)}catch(q){console.warn("[eBay] Offer update failed:",q.message,"— deleting and recreating");try{await X("DELETE",`${lt}/offer/${$}`)}catch{}$=null}}if(!$){console.log("[eBay] Creating offer:",JSON.stringify(p));const N=await X("POST",`${lt}/offer`,p);if($=N.offerId,!$){const W=((m=(h=N.errors)==null?void 0:h[0])==null?void 0:m.longMessage)||((E=(f=N.errors)==null?void 0:f[0])==null?void 0:E.message)||"";throw new Error(W||"Could not create offer. Set up business policies in eBay Seller Hub first.")}}console.log("[eBay] Publishing offer:",$);const M=(await X("POST",`${lt}/offer/${$}/publish`)).listingId;return n.platformStatus.eBay="active",n.ebayListingId=M,n.url=M?`https://www.ebay.com/itm/${M}`:n.url,qe(t,"eBay",ot()),j("inv",t),O(),w(`Listed on eBay! Item #${M}`),{success:!0,listingId:M}}catch($){return console.error("[eBay] PUBLISH ERROR DETAIL:",$.message),w(`eBay listing error: ${$.message}`,!0),{success:!1}}}async function Qd(t){if(!ft())throw new Error("eBay not connected");const e=F(t);if(!e||!e.ebayItemId)throw new Error("Item not on eBay");try{return await X("PUT",`${lt}/inventory_item/${encodeURIComponent(e.ebayItemId)}`,{availability:{shipToLocationAvailability:{quantity:0}}}),Tt(t,"eBay","delisted"),j("inv",t),O(),w("eBay listing ended"),{success:!0}}catch(n){return w(`eBay end listing error: ${n.message}`,!0),{success:!1}}}function Xd(){return ss}function Zd(){return Mn}const tp=`${_a}/functions/v1/etsy-auth`;let ke=!1,Fe=null,ln=null,ps=null,Ee=null,Zi=null,us=null;async function ep(t){us=t;try{const e=await gt("etsy_auth");e&&(ke=e.connected||!1,Fe=e.shopName||null,ln=e.shopId||null,ps=e.connectedAt||null),await ra()}catch(e){console.warn("FlipTrack: Etsy auth init error:",e.message),setTimeout(async()=>{try{await ra()}catch{}},3e3)}}async function np(){if(!us)throw new Error("Not authenticated");const{data:{session:t}}=await us.auth.getSession();if(!t)throw new Error("Session expired — please log in again");return{"Content-Type":"application/json",Authorization:`Bearer ${t.access_token}`,apikey:Ca}}async function xs(t,e={}){const n=await np();n["x-etsy-action"]=t;const s=new AbortController,o=setTimeout(()=>s.abort(),15e3);let a;try{a=await fetch(tp,{method:"POST",headers:n,body:JSON.stringify(e),signal:s.signal})}catch(r){throw clearTimeout(o),r.name==="AbortError"?new Error("Request timed out — try again"):new Error("Network error — check your internet connection")}clearTimeout(o);const i=await a.json();if(!a.ok)throw new Error(i.error||`Edge function error: ${a.status}`);return i}async function ra(){var t;if(us){let e=null;for(let n=0;n<30;n++){try{const s=await us.auth.getSession();e=(t=s==null?void 0:s.data)==null?void 0:t.session}catch{}if(e)break;await new Promise(s=>setTimeout(s,200))}if(!e)return console.warn("Etsy status check: no auth session after waiting"),{connected:ke,error:"No session"}}try{const e=await xs("status");return ke=e.connected,Fe=e.shop_name||null,ln=e.shop_id||null,ps=e.connected_at||null,await et("etsy_auth",{connected:ke,shopName:Fe,shopId:ln,connectedAt:ps}),typeof window.renderCrosslistDashboard=="function"&&window.renderCrosslistDashboard(),e}catch(e){return console.warn("Etsy status check failed:",e.message),{connected:ke}}}function sp(){return/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||window.innerWidth<=820}async function Rr(){try{const t=await xs("authorize");if(Zi=t.state,await et("etsy_csrf_state",Zi),sp())return w("Redirecting to Etsy…"),window.location.href=t.authUrl,!0;const e=700,n=700,s=Math.round((screen.width-e)/2),o=Math.round((screen.height-n)/2);return Ee=window.open(t.authUrl,"etsy-auth",`width=${e},height=${n},left=${s},top=${o},resizable=yes,scrollbars=yes`),Ee?(w("Opening Etsy authorization…"),op(),!0):(w("Redirecting to Etsy…"),window.location.href=t.authUrl,!0)}catch(t){return w(`Etsy connect error: ${t.message}`,!0),!1}}function op(){const t=setInterval(()=>{Ee&&Ee.closed&&(clearInterval(t),Ee=null)},500);setTimeout(()=>clearInterval(t),3e5)}async function ap(t,e){try{const n=await gt("etsy_csrf_state");if(e&&n&&e!==n)throw new Error("State mismatch — possible CSRF attack. Please try again.");const s=await xs("callback",{code:t});s.success&&(ke=!0,Fe=s.shop_name||null,ln=s.shop_id||null,await et("etsy_auth",{connected:!0,shopName:Fe,shopId:ln,connectedAt:new Date().toISOString()}),await et("etsy_csrf_state",null),w(`Etsy shop "${Fe||"connected"}" linked!`),Ee&&!Ee.closed&&Ee.close(),Ee=null,typeof window.renderCrosslistDashboard=="function"&&window.renderCrosslistDashboard())}catch(n){w(`Etsy auth error: ${n.message}`,!0)}}async function Fr(){try{await xs("disconnect"),ke=!1,Fe=null,ln=null,ps=null,await et("etsy_auth",{connected:!1,shopName:null,shopId:null,connectedAt:null}),w("Etsy shop disconnected"),typeof window.renderCrosslistDashboard=="function"&&window.renderCrosslistDashboard()}catch(t){w(`Disconnect error: ${t.message}`,!0)}}function ct(){return ke}function Or(){return Fe}function Rt(){return ln}function ip(){return ps}async function Pt(t,e,n=null){if(!ke)throw new Error("Etsy not connected");return xs("api",{method:t,path:e,body:n})}const hg=Object.freeze(Object.defineProperty({__proto__:null,checkEtsyStatus:ra,connectEtsy:Rr,disconnectEtsy:Fr,etsyAPI:Pt,getEtsyConnectedAt:ip,getEtsyShopId:Rt,getEtsyShopName:Or,handleEtsyCallback:ap,initEtsyAuth:ep,isEtsyConnected:ct},Symbol.toStringTag,{value:"Module"})),Ka="active",rp="inactive",lp="draft",Yo={who_made:"someone_else",when_made:"2020_2025",is_supply:!1},cp="physical";let Dn=null,vn=!1,Bn=null,Ko=!1;async function bg(){Dn=await gt("etsy_last_sync")}function wg(){Bn&&clearInterval(Bn),Bn=setInterval(()=>{ct()&&!vn&&Nr().catch(t=>{console.warn("Etsy sync error:",t.message),w("Etsy sync failed — will retry",!0)})},3e5)}function dp(){Bn&&(clearInterval(Bn),Bn=null)}async function Nr(){var e,n,s,o;if(!ct())throw new Error("Etsy not connected");if(vn)throw new Error("Sync already in progress");vn=!0;const t=Rt();if(!t)return vn=!1,Ko||(console.warn("Etsy sync: No shop ID available — skipping until reconnected."),Ko=!0),{matched:0,unmatched:0,updated:0};Ko=!1;try{let a=0,i=0,r=0,l=0;const c=100;let d=!0;for(;d;){const p=(await Pt("GET",`/application/shops/${t}/listings?state=${Ka}&limit=${c}&offset=${l}&includes=Images`)).results||[];p.length<c&&(d=!1);for(const y of p){const v=String(y.listing_id),h=y.skus&&y.skus[0]||null;let m=null;if(h&&(m=k.find(f=>f.sku&&f.sku===h)),m||(m=k.find(f=>f.etsyListingId&&f.etsyListingId===v)),m){a++;let f=!1;(!m.etsyListingId||m.etsyListingId!==v)&&(m.etsyListingId=v,f=!0),y.quantity!==void 0&&(y.quantity||0)===0&&((e=m.platformStatus)==null?void 0:e.Etsy)==="active"&&(Tt(m.id,"Etsy","sold"),f=!0),!m.name&&y.title&&(m.name=y.title,f=!0),(n=y.images)!=null&&n.length&&(!m.images||!m.images.length)&&(m.images=y.images.sort((E,$)=>E.rank-$.rank).map(E=>E.url_570xN||E.url_fullxfull).filter(Boolean),m.images.length&&(m.image=m.images[0]),f=!0),!m.price&&((s=y.price)!=null&&s.amount)&&(m.price=y.price.amount/y.price.divisor,f=!0),(o=y.tags)!=null&&o.length&&!m.tags&&(m.tags=y.tags,f=!0),f&&(j("inv",m.id),r++)}else i++}l+=c}return await pp(t),Dn=new Date().toISOString(),await et("etsy_last_sync",Dn),r>0&&(O(),V()),{matched:a,unmatched:i,updated:r}}finally{vn=!1}}async function pp(t){var e,n;try{const s=Math.floor(Dn?new Date(Dn).getTime()/1e3:(Date.now()-864e5)/1e3),a=(await Pt("GET",`/application/shops/${t}/receipts?min_created=${s}&limit=50`)).results||[];for(const i of a){const r=i.transactions||[];for(const l of r){const c=String(l.listing_id),d=l.sku||"",u=k.find(p=>p.etsyListingId===c||d&&p.sku===d);if(u&&((e=u.platformStatus)==null?void 0:e.Etsy)!=="sold"){const p=parseInt(l.quantity,10)||1;u.qty=Math.max(0,(u.qty||1)-p),Tt(u.id,"Etsy","sold"),u.qty<=0&&_r(u.id,"Etsy");const y=(n=l.price)!=null&&n.amount?l.price.amount/l.price.divisor:0;y>0&&Pr(u.id,y,"Etsy"),j("inv",u.id);const v=u.name||u.sku||"Item",h=y>0?` for $${y.toFixed(2)}`:"";w(`🎉 Etsy Sale! ${v}${h}`),ce("sale","Etsy Sale",`${v} sold${h}`,u.id);try{Pa.sale()}catch{}}}}}catch(s){console.warn("Etsy receipts sync error:",s.message)}}function up(t){var n,s;const e={title:(t.name||"Item").slice(0,140),description:fp(t),quantity:t.qty||1,price:t.price||0,who_made:Yo.who_made,when_made:Yo.when_made,is_supply:Yo.is_supply,type:cp,shipping_profile_id:null,taxonomy_id:null};if(t.sku&&(e.sku=t.sku),(n=t.tags)!=null&&n.length)e.tags=t.tags.slice(0,13).map(o=>o.slice(0,20));else{const o=[];if(t.name){const a=t.name.split(/\s+/).filter(i=>i.length>2).slice(0,8);o.push(...a.map(i=>i.slice(0,20)))}t.category&&o.push(t.category.slice(0,20)),t.subcategory&&o.push(t.subcategory.slice(0,20)),e.tags=o.slice(0,13)}return(s=t.materials)!=null&&s.length&&(e.materials=t.materials.slice(0,13).map(o=>o.slice(0,45))),e}function fp(t){const e=[];return t.condition&&e.push(`Condition: ${t.condition}`),t.category&&e.push(`Category: ${t.category}`),t.subcategory&&e.push(`Subcategory: ${t.subcategory}`),e.push(""),e.push("Ships fast! Check my shop for bundle deals and more items."),e.join(`
`)}async function Ur(t,e={}){if(!ct())throw new Error("Etsy not connected");const n=Rt();if(!n)throw new Error("No shop ID. Please reconnect Etsy.");const s=F(t);if(!s)throw new Error("Item not found");const o=up(s);if((s.price||0)<=0)throw new Error("Item needs a price before listing");e.taxonomyId&&(o.taxonomy_id=e.taxonomyId),e.shippingProfileId&&(o.shipping_profile_id=e.shippingProfileId);const i=!o.taxonomy_id||!o.shipping_profile_id;i&&(o.state=lp);try{const r=await Pt("POST",`/application/shops/${n}/listings`,o),l=String(r.listing_id);s.etsyListingId=l,s.platforms||(s.platforms=[]),s.platforms.includes("Etsy")||s.platforms.push("Etsy");const c=s.platforms.indexOf("Unlisted");c!==-1&&s.platforms.splice(c,1),s.platformStatus||(s.platformStatus={}),s.platformStatus.Etsy=i?"draft":"active",qe(t,"Etsy",ot()),j("inv",t),O();const d=i?"draft (complete on Etsy)":"active";return w(`Listed "${x(s.name)}" on Etsy as ${d}`),{success:!0,listingId:l,isDraft:i}}catch(r){return w(`Etsy listing error: ${r.message}`,!0),{success:!1}}}async function ko(t,e={}){if(!ct())throw new Error("Etsy not connected");const n=Rt(),s=F(t);if(!s||!s.etsyListingId)throw new Error("Item not on Etsy");try{return await Pt("PATCH",`/application/shops/${n}/listings/${s.etsyListingId}`,e),w("Etsy listing updated"),{success:!0}}catch(o){return w(`Etsy update error: ${o.message}`,!0),{success:!1}}}async function mp(t){if(!ct())throw new Error("Etsy not connected");const e=Rt(),n=F(t);if(!n||!n.etsyListingId)throw new Error("Item not on Etsy");try{return await Pt("PATCH",`/application/shops/${e}/listings/${n.etsyListingId}`,{state:rp}),Tt(t,"Etsy","delisted"),j("inv",t),O(),w("Etsy listing deactivated"),{success:!0}}catch(s){return w(`Etsy deactivate error: ${s.message}`,!0),{success:!1}}}async function gp(t){if(!ct())throw new Error("Etsy not connected");const e=Rt(),n=F(t);if(!n||!n.etsyListingId)return Ur(t);try{return await Pt("PATCH",`/application/shops/${e}/listings/${n.etsyListingId}`,{state:Ka,quantity:n.qty||1}),Tt(t,"Etsy","active"),qe(t,"Etsy",ot()),j("inv",t),O(),w("Etsy listing renewed ($0.20 fee)"),{success:!0}}catch(s){return w(`Etsy renew error: ${s.message}`,!0),{success:!1}}}function yp(){return vn}function vp(){return Dn}async function hp(t){if(!ct())throw new Error("Etsy not connected");const e=F(t);if(!e||!e.etsyListingId)throw new Error("Item not on Etsy");try{return await ko(t,{quantity:Math.max(0,e.qty||0)}),w(`Qty synced to Etsy: ${e.qty||0}`),{success:!0}}catch(n){return w(`Qty sync error: ${n.message}`,!0),{success:!1}}}async function bp(){if(!ct())throw new Error("Etsy not connected");const t=Rt();if(!t)throw new Error("No shop ID");let e=0,n=0;const s=100;let o=!0;for(;o;){const i=(await Pt("GET",`/application/shops/${t}/listings?state=${Ka}&limit=${s}&offset=${n}`)).results||[];i.length<s&&(o=!1);for(const r of i){const l=String(r.listing_id),c=r.skus&&r.skus[0]||null;let d=c?k.find(u=>u.sku&&u.sku===c):null;if(d||(d=k.find(u=>u.etsyListingId&&u.etsyListingId===l)),d&&r.quantity!==void 0){const u=r.quantity||0;u!==(d.qty||0)&&(d.qty=u,j("inv",d.id),e++)}}n+=s}return e>0&&(O(),V()),{pulled:e}}async function wp(){const t=await bp(),e=k.filter(s=>s.etsyListingId&&(s.qty||0)>0);let n=0;for(const s of e)try{await ko(s.id,{quantity:s.qty||0}),n++}catch{}return{pulled:t.pulled,pushed:n}}async function xp(t){if(!ct())throw new Error("Etsy not connected");const e=Rt(),n=F(t);if(!n||!n.etsyListingId)throw new Error("Item not on Etsy");const s=n.images||(n.image?[n.image]:[]);if(!s.length)throw new Error("No photos to upload");let o=0;for(const a of s)try{await Pt("POST",`/application/shops/${e}/listings/${n.etsyListingId}/images`,{image_url:a}),o++}catch(i){console.warn("Etsy photo upload error:",i.message)}return o>0?w(`${o} photo${o>1?"s":""} pushed to Etsy`):w("No photos could be uploaded",!0),{uploaded:o}}async function $p(){if(!ct())throw new Error("Etsy not connected");const t=Rt();if(!t)throw new Error("No shop ID");try{const e=await Pt("GET",`/application/shops/${t}`);return{numFavorers:e.num_favorers||0,totalSold:e.transaction_sold_count||0,activeListings:e.listing_active_count||0,digitalListings:e.digital_listing_count||0,reviewCount:e.review_count||0,reviewAvg:e.review_average||0,shopCreated:e.create_date||null,shopName:e.shop_name||"",currencyCode:e.currency_code||"USD"}}catch(e){return console.warn("Etsy shop stats error:",e.message),null}}function Sp(){const t=(typeof window<"u"&&window.sales||[]).filter(i=>(i.platform||"").toLowerCase()==="etsy"),e=t.reduce((i,r)=>i+(r.price||0),0),n=t.length?e/t.length:0,s={};t.forEach(i=>{const r=i.name||"Unknown";s[r]=(s[r]||0)+1});const o=Object.entries(s).sort((i,r)=>r[1]-i[1]).slice(0,5).map(([i,r])=>({name:i,count:r})),a={};return t.forEach(i=>{const r=new Date(i.date||i.soldDate),l=`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}`;a[l]=(a[l]||0)+(i.price||0)}),{totalRevenue:e,avgPrice:n,totalSales:t.length,topItems:o,monthlyRevenue:a}}async function kp(){if(!ct())throw new Error("Etsy not connected");const t=Rt();if(!t)throw new Error("No shop ID");try{const n=((await Pt("GET",`/application/shops/${t}/reviews?limit=25`)).results||[]).map(s=>({id:s.review_id,rating:s.rating||0,message:s.review||"",createdAt:s.created_timestamp?new Date(s.created_timestamp*1e3).toISOString():null,buyerName:s.buyer_user_id?`Buyer #${s.buyer_user_id}`:"Anonymous",listingId:s.listing_id||null,transactionId:s.transaction_id||null}));return await et("etsyLastReviewCheck",Date.now()),n}catch(e){return console.warn("Etsy reviews error:",e.message),[]}}function Ep(t){if(!t||!t.length)return{avg:0,count:0,distribution:{5:0,4:0,3:0,2:0,1:0}};const e={5:0,4:0,3:0,2:0,1:0};let n=0;return t.forEach(s=>{const o=Math.min(5,Math.max(1,Math.round(s.rating)));e[o]++,n+=s.rating}),{avg:n/t.length,count:t.length,distribution:e}}async function Ip(t,e,n){if(!ct())throw new Error("Etsy not connected");const s=Rt();if(!s)throw new Error("No shop ID");try{return await Pt("POST",`/application/shops/${s}/receipts/${t}/tracking`,{tracking_code:e,carrier_name:n}),w("Tracking info sent to Etsy"),{success:!0}}catch(o){return w(`Tracking error: ${o.message}`,!0),{success:!1}}}async function qr(){if(!ct())throw new Error("Etsy not connected");const t=Rt();if(!t)throw new Error("No shop ID");try{return((await Pt("GET",`/application/shops/${t}/receipts?was_shipped=false&limit=50`)).results||[]).map(n=>{var s;return{receiptId:n.receipt_id,buyerName:n.name||"Unknown",buyerEmail:n.buyer_email||"",totalPrice:(s=n.grandtotal)!=null&&s.amount?n.grandtotal.amount/n.grandtotal.divisor:0,createdAt:n.create_timestamp?new Date(n.create_timestamp*1e3).toISOString():null,items:(n.transactions||[]).map(o=>{var a;return{title:o.title||"",quantity:o.quantity||1,price:(a=o.price)!=null&&a.amount?o.price.amount/o.price.divisor:0,listingId:o.listing_id}}),shippingAddress:n.formatted_address||""}})}catch(e){return console.warn("Etsy pending receipts error:",e.message),[]}}function _p(){return["usps","ups","fedex","dhl","other","canada-post","royal-mail","australia-post","ups-mi","fedex-smartpost"]}async function jr(t){if(!ct())return{success:!1};const e=F(t);if(!e||!e.etsyListingId||!e.price)return{success:!1};try{return await ko(t,{price:e.price}),{success:!0}}catch(n){return console.warn("Etsy price sync error:",n.message),{success:!1}}}const Cp=new Set(["the","and","for","with","this","that","from","are","was","has","have","been","not","but","all","can","had","her","his","its","new","our","one","two","you","very","will","size","item"]);function Hr(t){const e=F(t);if(!e)return[];const n=new Set;if(e.name&&e.name.split(/[\s\-_,]+/).filter(a=>a.length>2&&!Cp.has(a.toLowerCase())).forEach(a=>n.add(a.toLowerCase().slice(0,20))),e.category&&n.add(e.category.toLowerCase().slice(0,20)),e.subcategory&&n.add(e.subcategory.toLowerCase().slice(0,20)),e.subtype&&n.add(e.subtype.toLowerCase().slice(0,20)),e.condition){const a=e.condition.toLowerCase();a.includes("vintage")&&n.add("vintage"),a.includes("new")&&n.add("new"),a.includes("nwt")&&(n.add("nwt"),n.add("new with tags"))}const s=(e.category||"").toLowerCase();(s.includes("clothing")||s.includes("shirt")||s.includes("dress"))&&n.add("fashion"),s.includes("shoe")&&n.add("footwear"),(s.includes("toy")||s.includes("game"))&&n.add("collectible");const o=new Set((e.tags||[]).map(a=>a.toLowerCase()));return Array.from(n).filter(a=>!o.has(a)&&a.length>=2).slice(0,13)}async function Bp(t,e){if(!ct())throw new Error("Etsy not connected");const n=F(t);if(!n||!n.etsyListingId)throw new Error("Item not on Etsy");const s=e.slice(0,13).map(o=>o.slice(0,20));return n.tags=s,j("inv",n.id),O(),await ko(t,{tags:s}),w(`${s.length} tags saved to Etsy`),{success:!0}}function Tp(t,e=0){const s=t*.065,o=(t+e)*.03+.25,a=e*.065,i=.2+s+o+a;return{listingFee:.2,transactionFee:+s.toFixed(2),processingFee:+o.toFixed(2),shippingTransactionFee:+a.toFixed(2),totalFees:+i.toFixed(2)}}async function Pp(){var s,o;if(!ct())return{synced:0};const t=Rt();if(!t)return{synced:0};const e=await gt("etsyLastExpenseSync")||0,n=Math.floor(e?e/1e3:(Date.now()-7*864e5)/1e3);try{const i=(await Pt("GET",`/application/shops/${t}/receipts?min_created=${n}&limit=50`)).results||[];let r=0;for(const l of i){const c=l.transactions||[];for(const d of c){const u=(s=d.price)!=null&&s.amount?d.price.amount/d.price.divisor:0,p=(o=d.shipping_cost)!=null&&o.amount?d.shipping_cost.amount/d.shipping_cost.divisor:0;if(u>0){const y=Tp(u,p),v=String(d.listing_id),h=k.find(m=>m.etsyListingId===v);h&&(h.etsyFees||(h.etsyFees={}),h.etsyFees[l.receipt_id]={...y,salePrice:u,shippingCost:p,date:l.create_timestamp?new Date(l.create_timestamp*1e3).toISOString():new Date().toISOString()},j("inv",h.id),r++)}}}return await et("etsyLastExpenseSync",Date.now()),r>0&&O(),{synced:r}}catch(a){return console.warn("Etsy expense sync error:",a.message),{synced:0}}}let Ht=null,Ct=null,Wr=null,ro="login",Jo=!1,Gr=!1,Gn=null;async function Mp(){return Gn||(Gn=(async()=>{try{const{data:t,error:e}=await Ht.auth.refreshSession();if(e)throw e;return t.session&&(Ct=t.session.user),t}finally{Gn=null}})(),Gn)}function Dp(){return Ct?Ct.id:null}function St(){return Ct}function lo(t){ro=t;const e=t==="login",n=document.getElementById("authTabLogin"),s=document.getElementById("authTabSignup"),o=document.getElementById("authSubmitBtn"),a=document.getElementById("authForgotWrap");n&&(n.style.borderBottomColor=e?"var(--accent)":"transparent"),s&&(s.style.borderBottomColor=e?"transparent":"var(--accent)"),n&&(n.style.color=e?"var(--text)":"var(--muted)"),s&&(s.style.color=e?"var(--muted)":"var(--text)"),o&&(o.textContent=e?"Sign In":"Create Account"),a&&(a.style.display=e?"":"none"),Qt("","")}function Qt(t,e){const n=document.getElementById("authErr"),s=document.getElementById("authOk");n&&(n.style.display="none"),s&&(s.style.display="none"),t&&(e==="ok"?s&&(s.textContent=t,s.style.display=""):n&&(n.textContent=t,n.style.display=""))}async function Lp(){const t=document.getElementById("authEmail"),e=document.getElementById("authPass"),n=document.getElementById("authSubmitBtn"),s=t?t.value.trim():"",o=e?e.value:"";if(!s||!o){Qt("Please enter your email and password.","err");return}if(!Ht||!Gr){Qt("App is still loading — please wait a moment and try again.","err");return}n&&(n.textContent="…",n.disabled=!0),Qt("","");try{if(ro==="login"){if(Ct&&Ct.email!==s)try{await Ht.auth.signOut({scope:"local"})}catch{}const{error:a}=await Ht.auth.signInWithPassword({email:s,password:o});if(a)throw a}else{const{error:a}=await Ht.auth.signUp({email:s,password:o});if(a)throw a;Qt("Account created! Check your email to confirm, then sign in.","ok"),lo("login");return}}catch(a){Qt(a.message||"Sign in failed — please try again.","err")}finally{n&&(n.textContent=ro==="login"?"Sign In":"Create Account",n.disabled=!1)}}async function Ap(){const t=document.getElementById("authEmail"),e=t?t.value.trim():"";if(!e){Qt("Enter your email address first.","err");return}const{error:n}=await Ht.auth.resetPasswordForEmail(e,{redirectTo:location.origin});n?Qt(n.message,"err"):Qt("Password reset email sent — check your inbox.","ok")}async function zp(){Ja(),Nd(),dp(),clearTimeout(Wr),Ct=null,await Ht.auth.signOut(),k.length=0,B.length=0,J.length=0,localStorage.removeItem("ft3_inv"),localStorage.removeItem("ft3_sal"),localStorage.removeItem("ft3_exp"),V(),_t("disconnected"),hn()}function hn(){const t=window.location.hash;if(!t||t!=="#signup"&&t!=="#signin"){window.location.href="./";return}const e=document.getElementById("authOv");if(e){e.style.display="flex";const n=document.getElementById("authEmail"),s=document.getElementById("authPass");n&&(n.value=""),s&&(s.value=""),Qt("",""),lo(t==="#signup"?"signup":"login")}}function Vr(){const t=document.getElementById("authOv");t&&(t.style.display="none")}function Rp(){const t=document.getElementById("accountMenuEmail");t&&Ct&&(t.textContent=Ct.email);const e=document.getElementById("accountMenuOv");e&&(e.style.display="flex")}function Ja(){const t=document.getElementById("accountMenuOv");t&&(t.style.display="none")}async function tr(t){if(Jo)return;Jo=!0,Ct=t,kr(t),Vr();const e=document.getElementById("syncDotLbl");e&&(e.textContent=t.email.split("@")[0]),_t("syncing");try{await Promise.race([tl(),new Promise((n,s)=>setTimeout(()=>s(new Error("Sync timed out")),1e4))]),Vp().catch(n=>console.warn("FlipTrack: supplies pull error:",n.message));try{const{loadUserTier:n,applyNavLocks:s}=await vr(async()=>{const{loadUserTier:o,applyNavLocks:a}=await import("./gate-iT3LxX7I.js");return{loadUserTier:o,applyNavLocks:a}},__vite__mapDeps([0,1]),import.meta.url);await n(),s()}catch(n){console.warn("FlipTrack: tier init error:",n.message)}typeof window.updateDashStats=="function"&&window.updateDashStats(),typeof window.renderCurrentView=="function"&&window.renderCurrentView()}catch(n){_t("error",n.message)}finally{Jo=!1}}async function Fp(){Ht=Gc(_a,Ca),Gr=!0;const t=document.getElementById("authSubmitBtn");t&&(t.disabled=!1,t.textContent=ro==="login"?"Sign In":"Create Account"),Ht.auth.onAuthStateChange((e,n)=>{e==="SIGNED_OUT"?(Ct=null,kr(null),clearTimeout(Wr),_t("disconnected"),hn()):e==="SIGNED_IN"&&(n!=null&&n.user)?(!Ct||Ct.id!==n.user.id)&&tr(n.user):n!=null&&n.user&&(Ct=n.user)});try{const{data:{session:e},error:n}=await Ht.auth.getSession();if(n){console.warn("FlipTrack: session restore failed:",n.message);try{await Ht.auth.signOut({scope:"local"})}catch{}hn()}else e!=null&&e.user?await tr(e.user):hn()}catch(e){console.warn("FlipTrack: initAuth error:",e.message),hn()}}let er=!1;function Op(){if(er)return;er=!0;const t=document.getElementById("accountMenuOv");t&&t.addEventListener("click",function(e){e.target===this&&Ja()})}function dt(){return Ht}const xg=Object.freeze(Object.defineProperty({__proto__:null,authForgotPassword:Ap,authSignOut:zp,authSubmit:Lp,closeAccountMenu:Ja,getAccountId:Dp,getCurrentUser:St,getSupabaseClient:dt,hideAuthModal:Vr,initAuth:Fp,openAccountMenu:Rp,safeRefreshSession:Mp,setAuthMsg:Qt,setupAuthEventListeners:Op,showAuthModal:hn,switchAuthTab:lo},Symbol.toStringTag,{value:"Module"})),co="item-images";function Np(t){var e;try{const[n,s]=t.split(","),o=((e=n.match(/:(.*?);/))==null?void 0:e[1])||"image/jpeg",a=atob(s),i=new Uint8Array(a.length);for(let r=0;r<a.length;r++)i[r]=a.charCodeAt(r);return new Blob([i],{type:o})}catch(n){throw new Error("Failed to convert image: "+n.message)}}async function Qa(t,e,n){const s=dt(),o=St();if(!s||!o)throw new Error("Not authenticated");const a=Np(t),i=o.id,r=`${e}_${n}_${Date.now()}.jpg`,l=`${i}/${r}`,{error:c}=await s.storage.from(co).upload(l,a,{contentType:"image/jpeg",upsert:!0});if(c)throw new Error(c.message);const{data:{publicUrl:d}}=s.storage.from(co).getPublicUrl(l);return d}async function Up(t){const e=dt(),n=St();if(!(!e||!n||!t||!t.includes("/storage/")))try{const s=`/object/public/${co}/`,o=t.indexOf(s);if(o===-1)return;const a=decodeURIComponent(t.slice(o+s.length));await e.storage.from(co).remove([a])}catch(s){console.warn("FlipTrack: storage delete failed:",s.message)}}const Ln=t=>typeof t=="string"&&t.startsWith("http");async function Yr(){const t=dt(),e=St();if(!t||!e)return;let n=0;for(const s of k){const o=qp(s);let a=!1;const i=[];for(let r=0;r<o.length;r++){const l=o[r];if(!l||Ln(l)){i.push(l);continue}try{const c=await Qa(l,s.id,r);i.push(c),a=!0,n++}catch(c){i.push(l),console.warn("FlipTrack: migration upload failed for",s.id,c.message)}}a&&(s.images=i,s.image=i[0]||null)}return n>0&&(O(),window.renderInv&&window.renderInv(),console.log(`FlipTrack: Migrated ${n} photo${n>1?"s":""} to cloud storage`)),n}function qp(t){return t.images&&Array.isArray(t.images)?t.images:t.image?[t.image]:[]}const nr="fliptrack",te="syncQueue";let Vn=null;function Xa(){return Vn?Promise.resolve(Vn):new Promise((t,e)=>{const n=indexedDB.open(nr);n.onsuccess=()=>{const s=n.result;if(s.objectStoreNames.contains(te))Vn=s,t(s);else{const o=s.version+1;s.close();const a=indexedDB.open(nr,o);a.onupgradeneeded=i=>{const r=i.target.result;r.objectStoreNames.contains(te)||r.createObjectStore(te,{keyPath:"id",autoIncrement:!0})},a.onsuccess=()=>{Vn=a.result,t(Vn)},a.onerror=()=>e(a.error)}},n.onerror=()=>e(n.error)})}async function Zn(t,e,n){try{if(await Kr()>=1e3){console.warn("FlipTrack: offline queue is full (1000 items), skipping enqueue");return}const a=(await Xa()).transaction(te,"readwrite");a.objectStore(te).add({action:t,table:e,payload:n,ts:Date.now(),retries:0}),await new Promise((i,r)=>{a.oncomplete=i,a.onerror=r})}catch(s){console.warn("FlipTrack: offline queue enqueue failed:",s.message)}}async function jp(){try{const t=await Xa(),n=t.transaction(te,"readonly").objectStore(te),s=await new Promise((o,a)=>{const i=n.getAll();i.onsuccess=()=>o(i.result),i.onerror=a});if(s.length){const o=t.transaction(te,"readwrite");o.objectStore(te).clear(),await new Promise((a,i)=>{o.oncomplete=a,o.onerror=i})}return s.sort((o,a)=>o.ts-a.ts)}catch(t){return console.warn("FlipTrack: offline queue dequeue failed:",t.message),[]}}async function Kr(){try{const e=(await Xa()).transaction(te,"readonly");return new Promise((n,s)=>{const o=e.objectStore(te).count();o.onsuccess=()=>n(o.result),o.onerror=s})}catch{return 0}}async function Hp(t,e){const n=await jp();if(!n.length)return{ok:0,failed:0,dropped:0};let s=0,o=0,a=0;for(const i of n)try{if(i.action==="upsert"){const l=(Array.isArray(i.payload)?i.payload:[i.payload]).map(d=>({...d,account_id:e,updated_at:new Date(i.ts).toISOString()})),{error:c}=await t.from(i.table).upsert(l,{onConflict:"id"});if(c)throw new Error(c.message);s++}else if(i.action==="delete"){const r=Array.isArray(i.payload)?i.payload:[i.payload];await t.from(i.table).delete().in("id",r),s++}}catch(r){console.warn(`FlipTrack: replay failed for ${i.table}:`,r.message);const l=(i.retries||0)+1;l>=5?(console.warn(`FlipTrack: Dropping queue entry after ${l} retries: ${i.action} on ${i.table}`),a++):(await Zn(i.action,i.table,i.payload),o++)}return console.log(`FlipTrack: Replayed offline queue — ${s} ok, ${o} failed, ${a} dropped`),{ok:s,failed:o,dropped:a}}let Qo=!1,sr=!1;function Wp(t,e){if(sr)return;sr=!0;const n=async()=>{if(Qo||!await Kr())return;const o=t();if(!(!o||!o.sb||!o.accountId)){Qo=!0;try{const a=await Hp(o.sb,o.accountId);e&&e(a)}finally{Qo=!1}}};window.addEventListener("online",()=>{setTimeout(n,2e3)}),document.addEventListener("visibilitychange",()=>{!document.hidden&&navigator.onLine&&setTimeout(n,1e3)})}const Jr="ft_last_sync";function Qr(){localStorage.setItem(Jr,new Date().toISOString()),Ys()}function Ys(){const t=document.getElementById("syncTimestamp");if(!t)return;const e=localStorage.getItem(Jr);if(!e){t.textContent="",or();return}const n=Date.now()-new Date(e).getTime(),s=Math.floor(n/6e4);let o;if(s<1)o="just now";else if(s<60)o=s+"m ago";else{const a=Math.floor(s/60);a<24?o=a+"h ago":o=Math.floor(a/24)+"d ago"}t.textContent="Synced "+o,or()}function or(){const t=document.getElementById("syncPendingBadge");if(t)try{const e=ni(),n=e.inv.length+e.sales.length+e.expenses.length+e.deleted.ft_inventory.length+e.deleted.ft_sales.length+e.deleted.ft_expenses.length;n>0?(t.textContent=n+" pending",t.style.display="inline"):t.style.display="none"}catch{t.style.display="none"}}function Xo(){const t=document.getElementById("offlineIndicator");t&&(t.style.display=navigator.onLine?"none":"inline")}function $g(){Ys(),Xo(),setInterval(Ys,3e4),window.addEventListener("online",()=>{Xo(),Ys()}),window.addEventListener("offline",Xo)}function _t(t,e){const n=document.getElementById("syncDot"),s=document.getElementById("syncDotLbl");if(!n||!s)return;n.className="sync-dot";const o=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),a={disconnected:{cls:"",txt:"Offline"},connected:{cls:"connected",txt:`Synced ${o}`},syncing:{cls:"syncing",txt:"Syncing…"},error:{cls:"error",txt:e||"Sync error"}},i=a[t]||a.disconnected;i.cls&&n.classList.add(i.cls),s.textContent=i.txt}async function Xr(){const t=dt(),e=St();if(!t||!e)return;if(await oi(),!navigator.onLine){await ar(),la();return}const n=e.id,s=ni();try{try{await Yr()}catch(o){console.warn("FlipTrack: image migration skipped:",o.message)}if(s.inv.length){const o=s.inv.map(i=>{const r={...i};return r.images&&(r.images=r.images.map(l=>Ln(l)?l:null).filter(Boolean)),r.image&&!Ln(r.image)&&delete r.image,r.images&&r.images.length&&(r.image=r.images[0]),{id:i.id,account_id:n,data:r,updated_at:new Date().toISOString()}}),{error:a}=await t.from("ft_inventory").upsert(o,{onConflict:"id"});if(a)throw new Error(a.message)}if(s.sales.length){const o=s.sales.map(i=>({id:i.id,account_id:n,data:i,updated_at:new Date().toISOString()})),{error:a}=await t.from("ft_sales").upsert(o,{onConflict:"id"});if(a)throw new Error(a.message)}if(s.expenses.length){const o=s.expenses.map(a=>({id:a.id,account_id:n,data:a,updated_at:new Date().toISOString()}));try{const{error:a}=await t.from("ft_expenses").upsert(o,{onConflict:"id"});a&&console.warn("FlipTrack: expenses push error:",a.message)}catch(a){console.warn("FlipTrack: ft_expenses not available:",a.message)}}for(const[o,a]of Object.entries(s.deleted))if(a.length)try{await t.from(o).delete().in("id",a)}catch(i){console.warn(`FlipTrack: delete from ${o} failed:`,i.message)}await et("lastSyncPush",new Date().toISOString()).catch(o=>console.warn("FlipTrack: sync push timestamp save failed:",o.message)),la()}catch(o){throw console.warn("FlipTrack: push failed, queueing for retry:",o.message),await ar(),o}}async function ar(){const t=ni();if(t.inv.length){const e=t.inv.map(n=>({id:n.id,data:{...n}}));await Zn("upsert","ft_inventory",e)}if(t.sales.length){const e=t.sales.map(n=>({id:n.id,data:n}));await Zn("upsert","ft_sales",e)}if(t.expenses.length){const e=t.expenses.map(n=>({id:n.id,data:n}));await Zn("upsert","ft_expenses",e)}for(const[e,n]of Object.entries(t.deleted))n.length&&await Zn("delete",e,n)}async function Gp(){const t=dt(),e=St();if(!t||!e)return;const n=e.id;try{await Yr()}catch(r){console.warn("FlipTrack: image migration skipped:",r.message)}const s=k.map(r=>{const l={...r};return l.images&&(l.images=l.images.map(c=>Ln(c)?c:null).filter(Boolean)),l.image&&!Ln(l.image)&&delete l.image,l.images&&l.images.length&&(l.image=l.images[0]),{id:r.id,account_id:n,data:l,updated_at:new Date().toISOString()}}),o=B.map(r=>({id:r.id,account_id:n,data:r,updated_at:new Date().toISOString()})),[a,i]=await Promise.all([s.length?t.from("ft_inventory").upsert(s,{onConflict:"id"}):Promise.resolve({}),o.length?t.from("ft_sales").upsert(o,{onConflict:"id"}):Promise.resolve({})]);if(a.error||i.error)throw new Error((a.error||i.error).message);try{const r=J.map(l=>({id:l.id,account_id:n,data:l,updated_at:new Date().toISOString()}));r.length&&await t.from("ft_expenses").upsert(r,{onConflict:"id"})}catch(r){console.warn("FlipTrack: ft_expenses not available:",r.message)}la()}async function $s(t,e){const n=dt(),s=St();if(!(!n||!s||!e.length))try{await n.from(t).delete().in("id",e)}catch(o){console.warn(`FlipTrack: delete from ${t} failed:`,o.message)}}async function Zr(){const t=dt(),e=St();if(!t||!e)return!1;const n=e.id;let s=await gt("lastSyncPull").catch(()=>null);s&&k.length===0&&B.length===0&&(console.log("FlipTrack: local data empty with stale lastPull — forcing full pull"),s=null);let o=t.from("ft_inventory").select("id, data, updated_at").eq("account_id",n),a=t.from("ft_sales").select("id, data, updated_at").eq("account_id",n);s&&(o=o.gt("updated_at",s),a=a.gt("updated_at",s));const[{data:i,error:r},{data:l,error:c}]=await Promise.all([o,a]);if(r||c)throw new Error((r||c).message);let d=null;try{let u=t.from("ft_expenses").select("id, data, updated_at").eq("account_id",n);s&&(u=u.gt("updated_at",s));const{data:p,error:y}=await u;y||(d=p)}catch{}if(s){const u=(p,y)=>{if(!(!y||!y.length))for(const v of y){if(!v.data)continue;const h=p.findIndex(m=>m.id===v.id);if(h!==-1){const m=p[h]._localUpdatedAt||0;(v.updated_at?new Date(v.updated_at).getTime():Date.now())>=m&&(p[h]=v.data)}else p.push(v.data)}};u(k,i),u(B,l),u(J,d)}else i&&(k.length=0,k.push(...i.map(u=>u.data).filter(Boolean))),l&&(B.length=0,B.push(...l.map(u=>u.data).filter(Boolean))),d&&(J.length=0,J.push(...d.map(u=>u.data).filter(Boolean)));return await et("lastSyncPull",new Date().toISOString()).catch(u=>console.warn("FlipTrack: sync pull timestamp save failed:",u.message)),O(),!0}async function Vp(){const t=dt(),e=St();if(!(!t||!e))try{const n=e.id,{data:s}=await t.from("ft_supplies").select("data").eq("account_id",n);s&&s.length&&(ye.length=0,ye.push(...s.map(o=>o.data).filter(Boolean))),su()}catch(n){console.warn("FlipTrack: supplies pull error:",n.message)}}let bn=!1;async function tl(){if(bn)return;bn=!0;const t=dt(),e=St();if(!t||!e){bn=!1;return}await oi(),_t("syncing");try{await Zr(),await Gp(),_t("connected"),Qr(),V()}catch(n){_t("error",n.message)}finally{bn=!1}}let ir=null;function Ss(){const t=dt(),e=St();!t||!e||navigator.onLine&&(bn||(clearTimeout(ir),ir=setTimeout(async()=>{if(!bn){await oi(),_t("syncing");try{await Xr(),_t("connected"),Qr()}catch(n){_t("error",n.message)}}},2e3)))}async function Sg(){const t=dt(),e=St();if(!(!t||!e)){_t("syncing");try{await Zr(),V(),_t("connected")}catch(n){_t("error",n.message)}}}function kg(){Wp(()=>{const t=dt(),e=St();return!t||!e?null:{sb:t,accountId:e.id}},t=>{t.ok>0&&(_t("connected"),w(`Synced ${t.ok} offline change${t.ok>1?"s":""} ✓`)),t.failed>0&&_t("error",`${t.failed} sync retries pending`),t.dropped>0&&console.warn(`FlipTrack: ${t.dropped} queue item(s) permanently dropped after max retries`)})}let k=[],B=[],J=[],ye=[],Za=new Set,ti=new Set,ei=new Set,el=new Set,Oe={ft_inventory:new Set,ft_sales:new Set,ft_expenses:new Set};function ni(){return{inv:[...Za].map(e=>k.find(n=>n.id===e)).filter(Boolean),sales:[...ti].map(e=>B.find(n=>n.id===e)).filter(Boolean),expenses:[...ei].map(e=>J.find(n=>n.id===e)).filter(Boolean),deleted:{ft_inventory:[...Oe.ft_inventory],ft_sales:[...Oe.ft_sales],ft_expenses:[...Oe.ft_expenses]}}}function la(){Za.clear(),ti.clear(),ei.clear(),el.clear(),Oe.ft_inventory.clear(),Oe.ft_sales.clear(),Oe.ft_expenses.clear()}function j(t,e){const n=Date.now();if(t==="inv"){Za.add(e);const s=k.find(o=>o.id===e);s&&(s._localUpdatedAt=n)}else if(t==="sales"){ti.add(e);const s=B.find(o=>o.id===e);s&&(s._localUpdatedAt=n)}else if(t==="expenses"){ei.add(e);const s=J.find(o=>o.id===e);s&&(s._localUpdatedAt=n)}else if(t==="supplies"){el.add(e);const s=ye.find(o=>o.id===e);s&&(s._localUpdatedAt=n)}}function nl(t,e){Oe[t]&&Oe[t].add(e)}let sl={};function si(){sl=Object.fromEntries(k.map(t=>[t.id,t]))}function F(t){return sl[t]||null}let Ce=null;function ol(t){Ce=t}let Bt=new Set,xt=new Set,Yp="all",Kp="all",K=new Set,Ks=[],cn=!1;async function Eg(){try{await od(),cn=!0,await gt("migrated_from_ls")||(await Jp(),await et("migrated_from_ls",!0));const[e,n,s,o,a]=await Promise.all([Wn("inventory"),Wn("sales"),Wn("expenses"),Wn("supplies"),Wn("trash")]);k.length=0,k.push(...e),B.length=0,B.push(...n),J.length=0,J.push(...s),ye.length=0,ye.push(...o),Wt.length=0,Wt.push(...a),console.log(`FlipTrack: Loaded from IndexedDB — ${k.length} items, ${B.length} sales`)}catch(t){console.warn("FlipTrack: IndexedDB unavailable, using localStorage fallback:",t.message),cn=!1,Qp()}si()}function de(t,e=[]){try{const n=localStorage.getItem(t);if(!n)return e;const s=JSON.parse(n);return Array.isArray(s)?s:e}catch(n){return console.warn(`FlipTrack: corrupt localStorage key "${t}", using fallback:`,n.message),e}}async function Jp(){const t=de("ft3_inv"),e=de("ft3_sal"),n=de("ft3_exp"),s=de("ft_supplies"),o=de("ft_trash");(t.length||e.length||n.length||s.length)&&(await Promise.all([t.length?Jt("inventory",t):Promise.resolve(),e.length?Jt("sales",e):Promise.resolve(),n.length?Jt("expenses",n):Promise.resolve(),s.length?Jt("supplies",s):Promise.resolve(),o.length?Jt("trash",o):Promise.resolve()]),console.log(`FlipTrack: Migrated ${t.length} items from localStorage to IndexedDB`))}function Qp(){k.length=0,k.push(...de("ft3_inv")),B.length=0,B.push(...de("ft3_sal")),J.length=0,J.push(...de("ft3_exp")),ye.length=0,ye.push(...de("ft_supplies")),Wt.length=0,Wt.push(...de("ft_trash"))}let Je=!0,rr=null,ca=Promise.resolve();const O=()=>{si(),Xp(),tu(),Je&&Ss()};function Xp(){clearTimeout(rr),rr=setTimeout(()=>{ca=ca.then(()=>Zp()).catch(t=>{throw console.warn("FlipTrack: IDB persist chain error:",t.message),t})},200)}async function Zp(){if(cn)try{await Promise.all([Jt("inventory",k),Jt("sales",B),Jt("expenses",J),Jt("supplies",ye)])}catch(t){console.warn("FlipTrack: IDB persist failed:",t.message)}}function oi(){return ca}function tu(){try{localStorage.setItem("ft3_inv",JSON.stringify(k)),localStorage.setItem("ft3_sal",JSON.stringify(B)),localStorage.setItem("ft3_exp",JSON.stringify(J)),Je=!0}catch(t){if(t.name==="QuotaExceededError"||t.name==="NS_ERROR_DOM_QUOTA_REACHED"||t.code===22)try{const e=k.map(n=>{const s={...n};return delete s.image,delete s.images,s});localStorage.setItem("ft3_inv",JSON.stringify(e)),localStorage.setItem("ft3_sal",JSON.stringify(B)),localStorage.setItem("ft3_exp",JSON.stringify(J)),Je=!0}catch(e){console.warn("FlipTrack: localStorage full:",e.message),Je=!1,cn&&(Je=!0)}else console.warn("FlipTrack: save error:",t.message),Je=!1,cn&&(Je=!0)}}function V(){si()}function da(t){return t.replace(/\w\S*/g,e=>e.charAt(0).toUpperCase()+e.slice(1).toLowerCase())}function al(t){if(!t)return t;const e=t.trim(),n=e.toLowerCase(),s=k.find(o=>(o.category||"").toLowerCase()===n);return s?s.category:da(e)}function Ig(){const t={},e={};let n=0;for(const s of k){if(s.category){const o=s.category.toLowerCase();t[o]||(t[o]=da(s.category)),s.category!==t[o]&&(s.category=t[o],n++)}if(s.subcategory){const o=s.subcategory.toLowerCase();e[o]||(e[o]=da(s.subcategory)),s.subcategory!==e[o]&&(s.subcategory=e[o],n++)}}return n}let Wt=[];function il(){const t=Date.now()-6048e5;Wt=Wt.filter(e=>e.deletedAt>t).slice(-30),cn&&Jt("trash",Wt).catch(e=>{console.warn("FlipTrack: trash IDB save failed:",e.message),w("⚠ Save error — check storage",!0)});try{localStorage.setItem("ft_trash",JSON.stringify(Wt))}catch(e){console.warn("FlipTrack: trash localStorage save failed:",e.message),w("⚠ Save error — check storage",!0)}}function ai(t){const e=k.find(n=>n.id===t);e&&(eu("delete",{...e}),Wt.push({...JSON.parse(JSON.stringify(e)),deletedAt:Date.now()}),il(),k.splice(k.indexOf(e),1),nl("ft_inventory",t))}function _g(t){let e=typeof t=="number"?t:Wt.findIndex(a=>a.id===t);const n=Wt[e];if(!n)return;const{deletedAt:s,...o}=n;k.push(o),j("inv",o.id),Wt.splice(e,1),il(),O(),V()}function eu(t,e){Ks.push({action:t,data:e,ts:Date.now()}),Ks.length>20&&Ks.shift()}function Cg(t){const e=document.getElementById("toast");if(!e)return;e.textContent="";const n=document.createElement("span");n.textContent=t+" ";const s=document.createElement("button");s.textContent="Undo",s.style.cssText="background:rgba(0,0,0,0.3);border:1px solid rgba(0,0,0,0.4);color:#fff;padding:3px 10px;margin-left:8px;cursor:pointer;font-family:Syne,sans-serif;font-weight:700;font-size:11px",s.onclick=()=>{nu(),e.classList.remove("on")},e.appendChild(n),e.appendChild(s),e.classList.remove("err"),e.classList.add("on"),setTimeout(()=>e.classList.remove("on"),8e3)}function nu(){const t=Ks.pop();if(t){if(t.action==="delete")k.push(t.data),j("inv",t.data.id),O(),V();else if(t.action==="sold"){const e=k.find(s=>s.id===t.data.itemId);e&&(e.qty=(e.qty||0)+(t.data.qty||1),j("inv",e.id));const n=B.findIndex(s=>s.id===t.data.saleId);n!==-1&&(nl("ft_sales",t.data.saleId),B.splice(n,1)),O(),V()}}}function su(){cn&&Jt("supplies",ye).catch(t=>{console.warn("FlipTrack: supplies IDB local save failed:",t.message),w("⚠ Supplies save error",!0)});try{localStorage.setItem("ft_supplies",JSON.stringify(ye))}catch(t){console.warn("FlipTrack: supplies localStorage save failed:",t.message),w("⚠ Supplies save error",!0)}}function qt(t){const e=t.cost||0,n=t.price||0,s=t.fees||0,o=t.ship||0,a=n-e-s-o,i=n?a/n:0,r=e?a/e:0;return{cost:e,price:n,fees:s,ship:o,pu:a,m:i,roi:r}}function rl(t,e,n){return n?t===0?"low":t<=(e||2)?"warn":"ok":"ok"}function wn(t){return t>=.35?"mb-high":t>=.15?"mb-mid":"mb-low"}function ou(t){const e=qt(t).m;return wn(e)}let Bg=()=>{};function Lt(t,e={}){const{min:n=0,max:s=1/0,allowZero:o=!0,integer:a=!1}=e;if(t===""||t===null||t===void 0)return NaN;const i=a?parseInt(t,10):parseFloat(t);return isNaN(i)?NaN:!o&&i===0?NaN:i<n||i>s?NaN:Math.round(i*100)/100}function Ie(t,e={}){const n=Lt(t.value,e);if(isNaN(n)){t.classList.add("input-error"),t.setAttribute("aria-invalid","true");let o=t.parentElement.querySelector(".validation-hint");o||(o=document.createElement("span"),o.className="validation-hint",o.setAttribute("role","alert"),t.parentElement.appendChild(o));const a=e.fieldName||"Value";return t.value.trim()===""?o.textContent=`${a} is required`:e.integer?o.textContent=`${a} must be a whole number`:o.textContent=`${a} must be a valid number`,null}t.classList.remove("input-error"),t.removeAttribute("aria-invalid");const s=t.parentElement.querySelector(".validation-hint");return s&&s.remove(),n}const au=["Like New","Very Good","Good","Acceptable","Poor"],iu=["NWT","NWOT","EUC","GUC","Fair","Poor","New/Sealed","Refurbished"];function An(t){if(!t)return!1;const e=t.toLowerCase().trim();return e==="books"||e==="book"||e==="textbooks"||e==="textbook"||e.startsWith("book")||e.endsWith("books")}function Eo(t){const e=document.getElementById(t==="f"?"f_cat":"d_cat"),n=e?e.value.trim():"",s=An(n),o=document.getElementById(t+"_book_fields");o&&o.classList.toggle("on",s),ll(t,s)}function ll(t,e){var a;const n=document.getElementById(t+"_cond_picker");if(!n)return;const s=((a=document.getElementById(t+"_condition"))==null?void 0:a.value)||"",o=e?au:iu;n.innerHTML=o.map(i=>`<button type="button" class="cond-tag" onclick="setCondTag('${t}','${i}',this)">${i}</button>`).join(""),s&&fu(t,s)}function ru(t){var a;const e=document.getElementById(t+"_rank_display"),n=parseInt((a=document.getElementById(t+"_sales_rank"))==null?void 0:a.value)||0;if(!e)return;if(!n){e.innerHTML="";return}let s,o;n<1e5?(s="var(--good)",o="Fast seller — high demand"):n<5e5?(s="var(--accent)",o="Moderate — sells within weeks"):n<1e6?(s="var(--warn)",o="Slow — may take months"):(s="var(--danger)",o="Very slow — consider skipping"),e.innerHTML=`<span class="rank-dot" style="background:${s}"></span><span class="rank-label">#${n.toLocaleString()} — ${o}</span>`}async function Tg(t){const e=t+"_isbn",{openScanner:n}=await vr(async()=>{const{openScanner:a}=await import("./scanner-BURkNh3V.js");return{openScanner:a}},[],import.meta.url),s=document.getElementById(e);if(!s)return;const o=()=>{s.removeEventListener("input",o),setTimeout(()=>{s.value.replace(/[-\s]/g,"").length>=10&&lu(t)},900)};s.addEventListener("input",o),setTimeout(()=>s.removeEventListener("input",o),6e4),n(e)}async function lu(t){var s,o,a,i;const e=((s=document.getElementById(t+"_isbn"))==null?void 0:s.value.replace(/[-\s]/g,""))||"";if(!e||e.length!==10&&e.length!==13){w("Enter a valid ISBN-10 or ISBN-13",!0);return}const n=document.getElementById(t+"_isbn_btn");n&&(n.disabled=!0,n.textContent="⏳ Looking up…");try{const l=await(await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${e}&format=json&jscmd=data`)).json(),c=`ISBN:${e}`;if(!l[c]){w("ISBN not found — try entering details manually",!0);return}const d=l[c],u=document.getElementById(t==="f"?"f_name":"d_name");u&&d.title&&!u.value&&(u.value=d.title);const p=document.getElementById(t+"_author");p&&((o=d.authors)!=null&&o.length)&&(p.value=d.authors.map(m=>m.name).join(", "));const y=document.getElementById(t+"_publisher");y&&((a=d.publishers)!=null&&a.length)&&(y.value=d.publishers[0].name);const v=document.getElementById(t+"_pub_year");if(v&&d.publish_date){const m=d.publish_date.match(/\d{4}/);m&&(v.value=m[0])}const h=document.getElementById(t==="f"?"f_cat":"d_cat");if(h&&!An(h.value)&&(h.value="Books",t==="f"?pu():uu()),(i=d.subjects)!=null&&i.length){const m=document.getElementById(t+"_subcat_txt");m&&!m.value&&(m.value=d.subjects[0].name)}w("ISBN found: "+(d.title||e)+" ✓")}catch(r){w("ISBN lookup failed: "+r.message,!0)}finally{n&&(n.disabled=!1,n.textContent="🔍 Lookup")}}function Pg(t){var f,E,$;const e=parseFloat((f=document.getElementById(t==="f"?"f_price":"d_price"))==null?void 0:f.value)||0,n=parseFloat((E=document.getElementById(t==="f"?"f_cost":"d_cost"))==null?void 0:E.value)||0,s=parseFloat(($=document.getElementById(t==="f"?"f_ship":"d_ship"))==null?void 0:$.value)||4.5,o=document.getElementById(t+"_fba_panel");if(!o)return;if(!e){w("Set a list price first",!0);return}const a=e*.15,i=1.8,r=3.07,l=.1,c=a+i+r+l,d=e-n-c,u=e>=10?3.99:3.49,p=a+i,y=s,v=e-n-p-y+u,h=d>v,m=I=>`<span style="color:${I>=0?"var(--good)":"var(--danger)"}">${S(I)}</span>`;o.classList.add("on"),o.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--accent3);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;text-align:center">FBA</div>
        <div class="fba-row"><span class="fba-lbl">Referral (15%)</span><span class="fba-val">${S(a)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Closing Fee</span><span class="fba-val">${S(i)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Fulfillment</span><span class="fba-val">${S(r)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Storage/mo</span><span class="fba-val">${S(l)}</span></div>
        <div class="fba-row fba-total"><span class="fba-lbl">Profit</span><span class="fba-val">${m(d)}</span></div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;text-align:center">Self-Ship</div>
        <div class="fba-row"><span class="fba-lbl">Referral (15%)</span><span class="fba-val">${S(a)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Closing Fee</span><span class="fba-val">${S(i)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Shipping</span><span class="fba-val">${S(y)}</span></div>
        <div class="fba-row"><span class="fba-lbl">Ship Credit</span><span class="fba-val" style="color:var(--good)">+${S(u)}</span></div>
        <div class="fba-row fba-total"><span class="fba-lbl">Profit</span><span class="fba-val">${m(v)}</span></div>
      </div>
    </div>
    <div class="fba-winner" style="background:${h?"rgba(123,97,255,0.1);color:var(--accent3)":"rgba(87,200,255,0.1);color:var(--accent)"}">
      ${h?"📦 FBA wins":"📮 Self-Ship wins"} by ${S(Math.abs(d-v))} per unit
    </div>
    <div style="margin-top:10px;padding:8px 10px;background:rgba(255,184,0,0.06);border:1px solid rgba(255,184,0,0.15);font-size:10px;color:var(--warn);font-family:'DM Mono',monospace">⚠ Fee estimates shown are for Books/Media category. Other categories (electronics, apparel, etc.) have different fee structures.</div>`}function cl(t){var e,n,s,o,a,i,r,l;return{isbn:((e=document.getElementById(t+"_isbn"))==null?void 0:e.value.trim())||"",author:((n=document.getElementById(t+"_author"))==null?void 0:n.value.trim())||"",publisher:((s=document.getElementById(t+"_publisher"))==null?void 0:s.value.trim())||"",edition:((o=document.getElementById(t+"_edition"))==null?void 0:o.value.trim())||"",printing:((a=document.getElementById(t+"_printing"))==null?void 0:a.value.trim())||"",pubYear:parseInt((i=document.getElementById(t+"_pub_year"))==null?void 0:i.value)||null,signed:((r=document.getElementById(t+"_signed"))==null?void 0:r.checked)||!1,salesRank:parseInt((l=document.getElementById(t+"_sales_rank"))==null?void 0:l.value)||null}}function cu(t,e){document.getElementById(t+"_isbn").value=e.isbn||"",document.getElementById(t+"_author").value=e.author||"",document.getElementById(t+"_publisher").value=e.publisher||"",document.getElementById(t+"_edition").value=e.edition||"",document.getElementById(t+"_printing").value=e.printing||"",document.getElementById(t+"_pub_year").value=e.pubYear||"",document.getElementById(t+"_signed").checked=!!e.signed,document.getElementById(t+"_sales_rank").value=e.salesRank||"",ru(t);const n=document.getElementById(t+"_fba_panel");n&&(n.classList.remove("on"),n.innerHTML="")}function du(t){["isbn","author","publisher","edition","printing","pub_year","sales_rank"].forEach(a=>{const i=document.getElementById(t+"_"+a);i&&(i.value="")});const e=document.getElementById(t+"_signed");e&&(e.checked=!1);const n=document.getElementById(t+"_rank_display");n&&(n.innerHTML="");const s=document.getElementById(t+"_fba_panel");s&&(s.classList.remove("on"),s.innerHTML="");const o=document.getElementById(t+"_book_fields");o&&o.classList.remove("on")}function dl(t){if(!t)return[];if(Zt[t])return Zt[t];const e=t.toLowerCase(),n=Object.keys(Zt).find(s=>s.toLowerCase()===e);return n?Zt[n]:[]}function pu(){const t=document.getElementById("f_cat").value.trim(),e=dl(t),n=document.getElementById("f_subcat_dl");n&&(n.innerHTML=e.map(s=>`<option value="${s}">`).join(""))}function uu(){const t=document.getElementById("d_cat").value.trim(),e=dl(t),n=document.getElementById("d_subcat_dl");n&&(n.innerHTML=e.map(s=>`<option value="${s}">`).join(""))}function fu(t,e){const n=document.getElementById(t+"_condition"),s=document.getElementById(t+"_cond_picker");!n||!s||(n.value=e||"",s.querySelectorAll(".cond-tag").forEach(o=>{o.classList.toggle("active",o.textContent.trim()===e)}))}const pl=encodeURIComponent,mu={eBay:t=>`https://www.ebay.com/sell/create?item_title=${pl((t.name||"").slice(0,80))}`,Poshmark:()=>"https://poshmark.com/create-listing",Mercari:()=>"https://www.mercari.com/sell/",Depop:()=>"https://www.depop.com/products/create/",Etsy:()=>"https://www.etsy.com/your/shops/me/tools/listings/create","Facebook Marketplace":()=>"https://www.facebook.com/marketplace/create/item/",Amazon:()=>"https://sellercentral.amazon.com/product-search/search",Grailed:()=>"https://www.grailed.com/sell",StockX:()=>"https://stockx.com/sell",GOAT:()=>"https://www.goat.com/sell",Vinted:()=>"https://www.vinted.com/items/new","The RealReal":()=>"https://www.therealreal.com/consign","Vestiaire Collective":()=>"https://www.vestiairecollective.com/sell/",Reverb:()=>"https://reverb.com/sell",Discogs:()=>"https://www.discogs.com/sell/list",Craigslist:()=>"https://post.craigslist.org/",OfferUp:()=>"https://offerup.com/post",Nextdoor:()=>"https://nextdoor.com/for_sale_and_free/",Whatnot:t=>"https://www.whatnot.com/sell","TikTok Shop":()=>"https://seller-us.tiktok.com/",Instagram:()=>"https://www.instagram.com/",Shopify:()=>"https://admin.shopify.com/","Walmart Marketplace":()=>"https://seller.walmart.com/",Newegg:()=>"https://seller.newegg.com/",Bonanza:()=>"https://www.bonanza.com/booths/items/new","Ruby Lane":()=>"https://www.rubylane.com/",Chairish:()=>"https://www.chairish.com/consign","1stDibs":()=>"https://www.1stdibs.com/dealers/",Swappa:()=>"https://swappa.com/sell",Decluttr:()=>"https://www.decluttr.com/sell-my-stuff"};function ul(t,e){if(e.url&&Z(e).length===1)return e.url;const n=mu[t];return n?n(e):`https://www.google.com/search?q=${pl(t+" sell "+(e.name||""))}`}function ii(t,e){const n={"{name}":t.name||"","{condition}":t.condition||"Good","{category}":t.category||"","{subcategory}":t.subcategory||"","{subtype}":t.subtype||"","{sku}":t.sku||"","{upc}":t.upc||"","{price}":t.price?`$${t.price.toFixed(2)}`:"","{source}":t.source||"","{notes}":t.notes||"","{dimensions}":t.dimL&&t.dimW&&t.dimH?`${t.dimL} × ${t.dimW} × ${t.dimH} ${t.dimUnit||"in"}`:"","{weight}":t.weight?`${t.weight} ${t.dimUnit==="cm"?"kg":"lb"}`:"","{author}":t.author||"","{isbn}":t.isbn||""},s=i=>{let r=i;for(const[l,c]of Object.entries(n))r=r.replaceAll(l,c);return r.replace(/\s{2,}/g," ").trim()};if(e)return{title:s(e.titleFormula||"{name}"),description:s(e.descriptionTemplate||"")};const o=t.name||"Item",a=[];return t.condition&&a.push(`Condition: ${t.condition}`),t.category&&a.push(`Category: ${t.category}`),t.subcategory&&a.push(`Subcategory: ${t.subcategory}`),t.upc&&a.push(`UPC: ${t.upc}`),t.notes&&a.push(`
${t.notes}`),a.push(`
Ships fast! Check my other listings for bundle deals.`),{title:o,description:a.join(`
`)}}async function gu(t,e){const{title:n,description:s}=ii(t,e),o=`${n}

${s}`;try{return await navigator.clipboard.writeText(o),w("Listing text copied to clipboard ✓"),!0}catch{const i=document.createElement("textarea");i.value=o,i.style.position="fixed",i.style.opacity="0",document.body.appendChild(i),i.select();try{document.execCommand("copy"),w("Listing text copied ✓")}catch{w("Copy failed — select text manually",!0)}return document.body.removeChild(i),!1}}const On={d:"in",f:"in"};function fl(t,e){var i,r;On[t]=e,(i=document.getElementById(`${t}_unit_in`))==null||i.classList.toggle("active",e==="in"),(r=document.getElementById(`${t}_unit_cm`))==null||r.classList.toggle("active",e==="cm");const n=e==="in",s=document.getElementById(`${t}_wt_maj_lbl`),o=document.getElementById(`${t}_wt_min_lbl`),a=document.getElementById(`${t}_dim_unit_lbl`);s&&(s.textContent=n?"lb":"kg"),o&&(o.textContent=n?"oz":"g"),a&&(a.textContent=n?"in":"cm"),ml(t)}function ml(t){var l,c,d,u,p;const e=parseFloat((l=document.getElementById(`${t}_wt_maj`))==null?void 0:l.value)||0,n=parseFloat((c=document.getElementById(`${t}_wt_min`))==null?void 0:c.value)||0,s=parseFloat((d=document.getElementById(`${t}_len`))==null?void 0:d.value)||0,o=parseFloat((u=document.getElementById(`${t}_wid`))==null?void 0:u.value)||0,a=parseFloat((p=document.getElementById(`${t}_hgt`))==null?void 0:p.value)||0,i=On[t]||"in",r=document.getElementById(`${t}_dimwt_val`);if(r){if(s&&o&&a){let y;i==="in"?(y=s*o*a/139,r.textContent=`dim wt: ${y.toFixed(2)} lb`):(y=s*o*a/5e3,r.textContent=`dim wt: ${y.toFixed(2)} kg`);const v=i==="in"?e+n/16:(e+n/1e3)*2.205;r.style.color=y>v?"var(--danger)":"var(--accent)",r.title=y>v?"Carrier may charge dimensional weight":"Actual weight is heavier"}else r.textContent="";gl(t)}}function Zo(t,e){return e==="cm"?t/2.54:t}function yu(t,e,n){return n==="in"?t+e/16:(t+e/1e3)*2.205}const vu=[{id:"poly-sm",icon:"📦",name:"Poly Mailer (S)",dims:[6,9,0],maxWt:.5,type:"mailer",note:"Clothing, soft goods under 8oz. Lightweight & waterproof."},{id:"poly-md",icon:"📦",name:"Poly Mailer (M)",dims:[10,13,0],maxWt:1,type:"mailer",note:"T-shirts, jeans, folded apparel. Most common reseller mailer."},{id:"poly-lg",icon:"📦",name:"Poly Mailer (L)",dims:[14.5,19,0],maxWt:2,type:"mailer",note:"Bulkier clothing, hoodies, jackets, multiple garments."},{id:"bubble-sm",icon:"🫧",name:"Bubble Mailer (S)",dims:[4,8,0],maxWt:.5,type:"mailer",note:"Jewelry, coins, small electronics, accessories."},{id:"bubble-md",icon:"🫧",name:"Bubble Mailer (M)",dims:[8.5,11,0],maxWt:1,type:"mailer",note:"Phone cases, small accessories, books under 1 lb."},{id:"bubble-lg",icon:"🫧",name:"Bubble Mailer (L)",dims:[10.5,16,0],maxWt:2,type:"mailer",note:"Shoes (soft), stacked books, light electronics."},{id:"flat-env",icon:"✉️",name:"USPS Flat Rate Env",dims:[12.5,9.5,0],maxWt:70,type:"flatrate",note:"Up to 70 lbs, flat rate pricing. Great for coins, hardware."},{id:"fr-padded",icon:"✉️",name:"USPS Padded Flat Rate",dims:[12.5,9.5,0],maxWt:70,type:"flatrate",note:"Same flat rate price but padded. Good for fragile flat items."},{id:"pri-sm",icon:"📫",name:"Priority Small Flat Rate",dims:[8.625,5.375,1.625],maxWt:70,type:"priority",note:"Wallets, sunglasses, cards, thin documents."},{id:"pri-md-1",icon:"📫",name:"Priority Medium (Top)",dims:[11,8.5,5.5],maxWt:70,type:"priority",note:"Most versatile flat rate — shoes, folded clothes, small appliances."},{id:"pri-md-2",icon:"📫",name:"Priority Medium (Side)",dims:[13.625,11.875,3.375],maxWt:70,type:"priority",note:"Wide, flat items — art prints, keyboards, flat goods."},{id:"pri-lg",icon:"📫",name:"Priority Large Flat Rate",dims:[12,12,5.5],maxWt:70,type:"priority",note:"Best for 2–20 lb items shipping coast-to-coast."},{id:"box-xs",icon:"🗃️",name:'Box 6×6×6"',dims:[6,6,6],maxWt:10,type:"box",note:"Mugs, small electronics, candles, collectibles."},{id:"box-sm",icon:"🗃️",name:'Box 8×8×8"',dims:[8,8,8],maxWt:20,type:"box",note:"Shoes, books, small appliances, hats."},{id:"box-md",icon:"🗃️",name:'Box 12×12×8"',dims:[12,12,8],maxWt:40,type:"box",note:"Handbags, boots, cameras + accessories, stacked books."},{id:"box-lg",icon:"🗃️",name:'Box 18×18×16"',dims:[18,18,16],maxWt:65,type:"box",note:"Coats, keyboards, record players, printers."},{id:"box-xl",icon:"🗃️",name:'Box 24×24×18"',dims:[24,24,18],maxWt:70,type:"box",note:"Luggage, monitors, large artwork, bundled clothing."}],hu=[{name:"Bubble wrap",icon:"🫧",when:(t,e)=>e||t>1},{name:"Packing peanuts",icon:"🤍",when:(t,e,n)=>e&&n>200},{name:"Kraft paper fill",icon:"📄",when:(t,e,n)=>n>100},{name:"Foam sheets",icon:"🟫",when:(t,e)=>e},{name:"Air pillows",icon:"💨",when:(t,e,n)=>n>300&&!e},{name:"Tissue paper",icon:"🎀",when:t=>t<1},{name:"Double-boxing",icon:"📦",when:(t,e)=>e&&t>5}];function gl(t){var q,D,_,A,T;const e=document.getElementById(`${t}_pkg_suggestion`);if(!e)return;const n=On[t]||"in",s=parseFloat((q=document.getElementById(`${t}_wt_maj`))==null?void 0:q.value)||0,o=parseFloat((D=document.getElementById(`${t}_wt_min`))==null?void 0:D.value)||0,a=parseFloat((_=document.getElementById(`${t}_len`))==null?void 0:_.value)||0,i=parseFloat((A=document.getElementById(`${t}_wid`))==null?void 0:A.value)||0,r=parseFloat((T=document.getElementById(`${t}_hgt`))==null?void 0:T.value)||0,l=s>0||o>0,c=a>0&&i>0&&r>0;if(!l&&!c){e.innerHTML="";return}const d=yu(s,o,n),u=Zo(a,n),p=Zo(i,n),y=Zo(r,n),v=c?[u,p,y].sort((P,R)=>R-P):[0,0,0],h=v[0]*v[1]*v[2],f=(h>0?d/(h/1728):0)>10||d>.5&&h<50,E=vu.map(P=>{const R=[...P.dims].sort((Ft,Pe)=>Pe-Ft);let G=d<=P.maxWt;if(c&&G&&(R[2]===0?((v[0]>R[0]-1||v[1]>R[1]-1)&&(G=!1),y>2&&(G=!1)):(v[0]>R[0]-1||v[1]>R[1]-1||v[2]>R[2]-.5)&&(G=!1)),!G)return null;const nt=R[0]*R[1]*Math.max(R[2],1);let be=1e3/(h>0?nt/h:nt);return P.type==="flatrate"&&d>3&&(be+=200),P.type==="flatrate"&&d>8&&(be+=400),P.type==="mailer"&&d<1&&!f&&(be+=300),P.type==="mailer"&&f&&(be-=200),{...P,score:be}}).filter(Boolean).sort((P,R)=>R.score-P.score);if(!E.length){e.innerHTML='<div class="pkg-suggest"><div class="pkg-suggest-hd"><span class="pkg-suggest-icon">⚠️</span><span class="pkg-suggest-ttl">No standard package found</span><span class="pkg-suggest-sub">May require custom or freight packaging</span></div></div>';return}const $=E.slice(0,3),I=hu.filter(P=>P.when(d,f,h)),M=$.map((P,R)=>{const G=P.dims[2]===0?`${P.dims[0]}" × ${P.dims[1]}"`:`${P.dims[0]}" × ${P.dims[1]}" × ${P.dims[2]}"`;return`<div class="pkg-card${R===0?" best":""}">
      ${R===0?'<div class="pkg-best-tag">Best fit</div>':""}
      <div class="pkg-card-ico">${P.icon}</div>
      <div class="pkg-card-name">${P.name}</div>
      <div class="pkg-card-dim">${G}</div>
      <div class="pkg-card-note">${P.note}</div>
    </div>`}).join(""),N=I.length?`<div class="pkg-padding-list">
    <span class="pkg-padding-ttl">Fill &amp; Protection:</span>
    ${I.map(P=>`<span class="pkg-pad-chip">${P.icon} ${P.name}</span>`).join("")}
  </div>`:"",W=l?`${d.toFixed(2)} lb`:"weight not set",L=c?`${u.toFixed(1)}" × ${p.toFixed(1)}" × ${y.toFixed(1)}"`:"dims not set";e.innerHTML=`<div class="pkg-suggest">
    <div class="pkg-suggest-hd">
      <span class="pkg-suggest-icon">📬</span>
      <span class="pkg-suggest-ttl">Packaging Suggestions</span>
      <span class="pkg-suggest-sub">${W} · ${L}</span>
    </div>
    <div class="pkg-cards">${M}</div>
    ${N}
  </div>`}function bu(t,e){var o,a;const n=e.dimUnit||"in";On[t]=n,(o=document.getElementById(`${t}_unit_in`))==null||o.classList.toggle("active",n==="in"),(a=document.getElementById(`${t}_unit_cm`))==null||a.classList.toggle("active",n==="cm"),fl(t,n);const s={wt_maj:"weightMaj",wt_min:"weightMin",len:"dimL",wid:"dimW",hgt:"dimH"};for(const[i,r]of Object.entries(s)){const l=document.getElementById(`${t}_${i}`);l&&(l.value=e[r]||"")}ml(t)}function yl(t){var e,n,s,o,a;return{dimUnit:On[t]||"in",weightMaj:parseFloat((e=document.getElementById(`${t}_wt_maj`))==null?void 0:e.value)||0,weightMin:parseFloat((n=document.getElementById(`${t}_wt_min`))==null?void 0:n.value)||0,dimL:parseFloat((s=document.getElementById(`${t}_len`))==null?void 0:s.value)||0,dimW:parseFloat((o=document.getElementById(`${t}_wid`))==null?void 0:o.value)||0,dimH:parseFloat((a=document.getElementById(`${t}_hgt`))==null?void 0:a.value)||0}}function wu(t){["wt_maj","wt_min","len","wid","hgt"].forEach(e=>{const n=document.getElementById(`${t}_${e}`);n&&(n.value="")}),On[t]="in",fl(t,"in")}let pe=[];function ri(){return pe}function xu(t){pe=t}function li(){pe=[]}function Vt(t){return t.images&&t.images.length?[...t.images]:t.image?[t.image]:[]}function $u(t,e,n){const s=t.target.files[0];if(t.target.value="",!s)return;const o=e==="f"?"f:"+n:Ce+":"+n;ci(s,o)}function Su(t,e,n){if(t.stopPropagation(),t.preventDefault(),e==="f")pe.splice(n,1),me("f",pe);else{const s=k.find(i=>i.id===Ce);if(!s)return;const o=Vt(s),a=o[n];o.splice(n,1),s.images=o,s.image=o[0]||null,O(),me("d",o),window.renderInv&&window.renderInv(),Ln(a)&&Up(a)}}function me(t,e){for(let n=0;n<3;n++){const s=document.getElementById(t+"Slot"+n),o=document.getElementById(t+"SlotImg"+n),a=document.getElementById(t+"SlotRm"+n),i=document.getElementById(t+"SlotAdd"+n),r=document.getElementById(t+"SlotBadge"+n),l=document.getElementById(t+"SlotInput"+n);s&&(n<e.length?(s.className="img-slot filled",o.src=e[n],o.style.display="block",a&&(a.style.display="flex"),i&&(i.style.display="none"),r&&(r.style.display=n===0?"block":"none"),l&&(l.style.pointerEvents="none",l.style.opacity="0")):n===e.length?(s.className="img-slot",o.src="",o.style.display="none",a&&(a.style.display="none"),i&&(i.style.display="flex",i.style.opacity="1"),r&&(r.style.display="none"),l&&(l.style.pointerEvents="auto",l.style.opacity="0")):(s.className="img-slot img-slot-locked",o.src="",o.style.display="none",a&&(a.style.display="none"),i&&(i.style.display="flex",i.style.opacity="0.3"),r&&(r.style.display="none"),l&&(l.style.pointerEvents="none",l.style.opacity="0")))}}function ku(){me("f",pe)}function Eu(t){const e=k.find(n=>n.id===t);me("d",e?Vt(e):[])}const Iu=15*1024*1024;function ci(t,e){if(t.size>Iu){w("Image too large (max 15 MB)",!0);return}const n=new FileReader;n.onload=s=>vl(s.target.result,t.type,e),n.readAsDataURL(t)}function _u(t){t.preventDefault()}function Cu(){}function Bu(t,e){t.preventDefault();const n=t.dataTransfer.files[0];n&&n.type.startsWith("image/")&&ci(n,e+":0")}let yt=[],Gt=0;function fs(){const t=document.getElementById("lightboxImg"),e=document.getElementById("lightboxCounter"),n=document.getElementById("lightboxPrev"),s=document.getElementById("lightboxNext");t&&(t.src=yt[Gt]||""),e&&(e.textContent=yt.length>1?`${Gt+1} / ${yt.length}`:""),n&&(n.style.display=yt.length>1?"flex":"none"),s&&(s.style.display=yt.length>1?"flex":"none")}function pa(){po||(document.addEventListener("keydown",El),document.addEventListener("touchstart",Il,{passive:!0}),document.addEventListener("touchend",_l),po=!0)}function Tu(t){const e=k.find(n=>n.id===t);if(yt=e?Vt(e):[],Gt=0,yt.length){fs(),document.getElementById("lightbox").classList.add("on"),pa();const n=document.getElementById("lightboxName");n&&(n.textContent=(e==null?void 0:e.name)||"")}}function Pu(t){if(!t)return;const e=Ce;if(e){const n=k.find(s=>s.id===e);if(n){yt=Vt(n),Gt=Math.max(0,yt.indexOf(t)),Gt===-1&&(yt=[t],Gt=0),fs(),document.getElementById("lightbox").classList.add("on"),pa();const s=document.getElementById("lightboxName");s&&(s.textContent=n.name||"");return}}yt=[t],Gt=0,fs(),document.getElementById("lightbox").classList.add("on"),pa()}function di(){yt.length<2||(Gt=(Gt-1+yt.length)%yt.length,fs())}function pi(){yt.length<2||(Gt=(Gt+1)%yt.length,fs())}let z={ctx:null,origDataUrl:null,mimeType:null,img:null,scale:1,rect:null,drag:null,dragStart:null,aspect:null};const ua="ontouchstart"in window||navigator.maxTouchPoints>0?14:7;function vl(t,e,n){z.ctx=n,z.origDataUrl=t,z.mimeType=e,z.aspect=null;const s=new Image;s.onload=()=>{z.img=s,document.getElementById("cropCanvasWrap");const o=document.getElementById("cropCanvas"),a=Math.min(window.innerWidth*.9,520),i=window.innerHeight*.55,r=Math.min(a/s.width,i/s.height,1);o.width=Math.round(s.width*r),o.height=Math.round(s.height*r),z.scale=r,z.rect={x:0,y:0,w:o.width,h:o.height},Te(),o.onmousedown=wl,o.onmousemove=xl,o.onmouseup=$l,o.removeEventListener("touchstart",fa),o.removeEventListener("touchmove",ma),o.removeEventListener("touchend",ga),o.addEventListener("touchstart",fa,{passive:!1}),o.addEventListener("touchmove",ma,{passive:!1}),o.addEventListener("touchend",ga,{passive:!1});const l=document.getElementById("cropOv");l.style.display="flex",l.classList.add("on")},s.src=t}function Te(){const t=document.getElementById("cropCanvas"),e=t.getContext("2d"),{img:n,scale:s,rect:o}=z;if(e.clearRect(0,0,t.width,t.height),e.drawImage(n,0,0,t.width,t.height),!o)return;e.fillStyle="rgba(0,0,0,0.55)",e.fillRect(0,0,t.width,o.y),e.fillRect(0,o.y+o.h,t.width,t.height-o.y-o.h),e.fillRect(0,o.y,o.x,o.h),e.fillRect(o.x+o.w,o.y,t.width-o.x-o.w,o.h),e.strokeStyle="#57c8ff",e.lineWidth=1.5,e.strokeRect(o.x+.5,o.y+.5,o.w-1,o.h-1),e.strokeStyle="rgba(87,200,255,0.25)",e.lineWidth=.5;for(let i=1;i<3;i++){const r=o.x+o.w/3*i,l=o.y+o.h/3*i;e.beginPath(),e.moveTo(r,o.y),e.lineTo(r,o.y+o.h),e.stroke(),e.beginPath(),e.moveTo(o.x,l),e.lineTo(o.x+o.w,l),e.stroke()}const a=[[o.x,o.y],[o.x+o.w,o.y],[o.x,o.y+o.h],[o.x+o.w,o.y+o.h]];for(const[i,r]of a)e.fillStyle="#57c8ff",e.beginPath(),e.arc(i,r,ua,0,Math.PI*2),e.fill(),e.fillStyle="#0a0a0f",e.beginPath(),e.arc(i,r,ua-2.5,0,Math.PI*2),e.fill()}function hl(t,e){const{rect:n}=z;if(!n)return null;const s=ua+3,o={nw:[n.x,n.y],ne:[n.x+n.w,n.y],sw:[n.x,n.y+n.h],se:[n.x+n.w,n.y+n.h]};for(const[a,[i,r]]of Object.entries(o))if(Math.abs(t-i)<s&&Math.abs(e-r)<s)return a;return t>n.x&&t<n.x+n.w&&e>n.y&&e<n.y+n.h?"move":"new"}function Et(t,e,n){return Math.max(e,Math.min(n,t))}function bl(t){if(!z.aspect)return t;const{w:e,h:n}=z.aspect,s=document.getElementById("cropCanvas");let o=t.w/e*n;return t.y+o>s.height&&(o=s.height-t.y,t.w=o/n*e),t.h=o,t}function wl(t){t.preventDefault();const e=document.getElementById("cropCanvas"),n=e.getBoundingClientRect(),s=e.width/n.width,o=e.height/n.height;ui((t.clientX-n.left)*s,(t.clientY-n.top)*o)}function xl(t){if(!z.drag)return;t.preventDefault();const e=document.getElementById("cropCanvas"),n=e.getBoundingClientRect(),s=e.width/n.width,o=e.height/n.height;fi((t.clientX-n.left)*s,(t.clientY-n.top)*o)}function $l(t){Io()}document.addEventListener("mouseup",()=>{z.drag&&Io()});function fa(t){t.preventDefault();const e=document.getElementById("cropCanvas"),n=e.getBoundingClientRect(),s=e.width/n.width,o=e.height/n.height,a=t.touches[0];ui((a.clientX-n.left)*s,(a.clientY-n.top)*o)}function ma(t){if(t.preventDefault(),!z.drag)return;const e=document.getElementById("cropCanvas"),n=e.getBoundingClientRect(),s=e.width/n.width,o=e.height/n.height,a=t.touches[0];fi((a.clientX-n.left)*s,(a.clientY-n.top)*o)}function ga(t){t.preventDefault(),Io()}function ui(t,e){const n=hl(t,e),s=z.rect||{x:0,y:0,w:0,h:0};z.drag=n,z.dragStart={mx:t,my:e,rx:s.x,ry:s.y,rw:s.w,rh:s.h};const o=document.getElementById("cropCanvas");o.style.cursor=n==="move"?"grabbing":n==="new"?"crosshair":"nwse-resize",n==="new"&&(z.rect={x:t,y:e,w:0,h:0})}function fi(t,e){if(!z.drag)return;const{drag:n,dragStart:s}=z,o=document.getElementById("cropCanvas"),a=o.width,i=o.height,r=t-s.mx,l=e-s.my,c=s;let d={...z.rect};if(n==="new")d.x=Math.min(c.rx,t),d.y=Math.min(c.ry,e),d.w=Math.abs(t-c.rx),d.h=Math.abs(e-c.ry),z.aspect&&(d=bl(d));else if(n==="move")d.x=Et(c.rx+r,0,a-c.rw),d.y=Et(c.ry+l,0,i-c.rh);else if(n==="nw"){const u=Et(c.rx+r,0,c.rx+c.rw-10),p=Et(c.ry+l,0,c.ry+c.rh-10);d.w=c.rx+c.rw-u,d.h=c.ry+c.rh-p,d.x=u,d.y=p,z.aspect&&(d.h=d.w/z.aspect.w*z.aspect.h,d.y=c.ry+c.rh-d.h)}else if(n==="ne"){d.w=Et(c.rw+r,10,a-c.rx);const u=Et(c.ry+l,0,c.ry+c.rh-10);d.h=c.ry+c.rh-u,d.y=u,z.aspect&&(d.h=d.w/z.aspect.w*z.aspect.h,d.y=c.ry+c.rh-d.h)}else if(n==="sw"){const u=Et(c.rx+r,0,c.rx+c.rw-10);d.w=c.rx+c.rw-u,d.x=u,d.h=Et(c.rh+l,10,i-c.ry),z.aspect&&(d.h=d.w/z.aspect.w*z.aspect.h)}else n==="se"&&(d.w=Et(c.rw+r,10,a-c.rx),d.h=Et(c.rh+l,10,i-c.ry),z.aspect&&(d.h=d.w/z.aspect.w*z.aspect.h));d.x=Et(d.x,0,a),d.y=Et(d.y,0,i),d.w=Et(d.w,0,a-d.x),d.h=Et(d.h,0,i-d.y),z.rect=d,Te()}function Io(){z.drag=null,z.dragStart=null,document.getElementById("cropCanvas").style.cursor="crosshair"}function Mu(){const t=document.getElementById("cropCanvas");z.rect={x:0,y:0,w:t.width,h:t.height},z.aspect=null,Te()}function Du(t,e){z.aspect={w:t,h:e};const n=document.getElementById("cropCanvas"),s=z.rect||{x:0,y:0,w:n.width,h:n.height};s.h=s.w/t*e,s.y+s.h>n.height&&(s.h=n.height-s.y,s.w=s.h/e*t),z.rect=s,Te()}function Lu(){const{img:t,scale:e}=z;if(!t)return;const n=z.rect||{x:0,y:0,w:t.width*e,h:t.height*e},s=n.x/e,o=n.y/e,a=n.w/e,i=n.h/e,r=Math.max(a,i),l=Math.round(r*.08),c=Math.round(r+l*2),d=document.createElement("canvas");d.width=c,d.height=c;const u=d.getContext("2d");u.fillStyle="#ffffff",u.fillRect(0,0,c,c);const p=Math.round((c-a)/2),y=Math.round((c-i)/2);u.drawImage(t,s,o,a,i,p,y,Math.round(a),Math.round(i));const v=d.toDataURL("image/jpeg",.92),h=new Image;h.onload=()=>{z.img=h;const m=document.getElementById("cropCanvas"),f=Math.min(window.innerWidth*.9,520),E=window.innerHeight*.55,$=Math.min(f/h.width,E/h.height,1);m.width=Math.round(h.width*$),m.height=Math.round(h.height*$),z.scale=$,z.rect={x:0,y:0,w:m.width,h:m.height},Te(),w("White background applied ✓")},h.src=v}function Au(){const{img:t,scale:e}=z;if(!t)return;const n=z.rect||{x:0,y:0,w:t.width*e,h:t.height*e},s=n.x/e,o=n.y/e,a=n.w/e,i=n.h/e,r=document.createElement("canvas");r.width=Math.round(a),r.height=Math.round(i);const l=r.getContext("2d");l.drawImage(t,s,o,a,i,0,0,r.width,r.height);const c=l.getImageData(0,0,r.width,r.height),d=c.data;let u=255,p=0;if(d.length<4){w("Image too small to enhance");return}for(let f=0;f<d.length;f+=16){const E=d[f]*.299+d[f+1]*.587+d[f+2]*.114;E<u&&(u=E),E>p&&(p=E)}const y=p-u;if(y<10){w("Image already well-exposed");return}const v=255/y;for(let f=0;f<d.length;f+=4)d[f]=Math.min(255,Math.max(0,(d[f]-u)*v)),d[f+1]=Math.min(255,Math.max(0,(d[f+1]-u)*v)),d[f+2]=Math.min(255,Math.max(0,(d[f+2]-u)*v));l.putImageData(c,0,0),l.globalCompositeOperation="saturation",l.fillStyle="hsl(0, 15%, 50%)",l.fillRect(0,0,r.width,r.height),l.globalCompositeOperation="source-over";const h=r.toDataURL("image/jpeg",.92),m=new Image;m.onload=()=>{z.img=m;const f=document.getElementById("cropCanvas"),E=Math.min(window.innerWidth*.9,520),$=window.innerHeight*.55,I=Math.min(E/m.width,$/m.height,1);f.width=Math.round(m.width*I),f.height=Math.round(m.height*I),z.scale=I,z.rect={x:0,y:0,w:f.width,h:f.height},Te(),w("Auto-enhanced ✓")},m.src=h}function zu(){const{img:t,scale:e}=z;if(!t)return;w("Removing background…");const n=z.rect||{x:0,y:0,w:t.width*e,h:t.height*e},s=n.x/e,o=n.y/e,a=n.w/e,i=n.h/e,r=document.createElement("canvas"),l=Math.round(a),c=Math.round(i);r.width=l,r.height=c;const d=r.getContext("2d");d.drawImage(t,s,o,a,i,0,0,l,c);const u=d.getImageData(0,0,l,c),p=u.data,y=[],v=Math.max(1,Math.floor(Math.min(l,c)/80));for(let T=0;T<l;T+=v){y.push([p[T*4],p[T*4+1],p[T*4+2]]);const P=((c-1)*l+T)*4;y.push([p[P],p[P+1],p[P+2]])}for(let T=0;T<c;T+=v){const P=T*l*4;y.push([p[P],p[P+1],p[P+2]]);const R=(T*l+l-1)*4;y.push([p[R],p[R+1],p[R+2]])}const h=T=>{const P=T.slice().sort((R,G)=>R-G);return P[Math.floor(P.length/2)]},m=h(y.map(T=>T[0])),f=h(y.map(T=>T[1])),E=h(y.map(T=>T[2])),$=42,I=new Uint8Array(l*c),M=[],N=T=>{const P=p[T]-m,R=p[T+1]-f,G=p[T+2]-E;return Math.sqrt(P*P+R*R+G*G)};for(let T=0;T<l;T++){N(T*4)<$&&(I[T]=1,M.push(T));const P=(c-1)*l+T;N(P*4)<$&&(I[P]=1,M.push(P))}for(let T=1;T<c-1;T++){const P=T*l;N(P*4)<$&&(I[P]=1,M.push(P));const R=T*l+l-1;N(R*4)<$&&(I[R]=1,M.push(R))}let W=0;for(;W<M.length;){const T=M[W++],P=T%l,R=(T-P)/l,G=[];P>0&&G.push(T-1),P<l-1&&G.push(T+1),R>0&&G.push(T-l),R<c-1&&G.push(T+l);for(const nt of G)I[nt]===0&&N(nt*4)<$&&(I[nt]=1,M.push(nt))}const L=new Float32Array(l*c);for(let T=0;T<I.length;T++)L[T]=I[T]===1?0:1;const q=2,D=new Float32Array(l*c);for(let T=0;T<c;T++)for(let P=0;P<l;P++){let R=0,G=0;for(let nt=-q;nt<=q;nt++){const kt=P+nt;kt>=0&&kt<l&&(R+=L[T*l+kt],G++)}D[T*l+P]=R/G}for(let T=0;T<l;T++)for(let P=0;P<c;P++){let R=0,G=0;for(let nt=-q;nt<=q;nt++){const kt=P+nt;kt>=0&&kt<c&&(R+=D[kt*l+T],G++)}L[P*l+T]=R/G}for(let T=0;T<l*c;T++){const P=Math.min(1,Math.max(0,L[T])),R=T*4;p[R]=Math.round(p[R]*P+255*(1-P)),p[R+1]=Math.round(p[R+1]*P+255*(1-P)),p[R+2]=Math.round(p[R+2]*P+255*(1-P)),p[R+3]=255}d.putImageData(u,0,0);const _=r.toDataURL("image/jpeg",.92),A=new Image;A.onload=()=>{z.img=A;const T=document.getElementById("cropCanvas"),P=Math.min(window.innerWidth*.9,520),R=window.innerHeight*.55,G=Math.min(P/A.width,R/A.height,1);T.width=Math.round(A.width*G),T.height=Math.round(A.height*G),z.scale=G,z.rect={x:0,y:0,w:T.width,h:T.height},Te(),w("Background removed ✓")},A.src=_}function Ru(){const{img:t,scale:e}=z;if(!t)return;const n=document.createElement("canvas");n.width=t.height,n.height=t.width;const s=n.getContext("2d");s.translate(n.width,0),s.rotate(Math.PI/2),s.drawImage(t,0,0);const o=n.toDataURL("image/jpeg",.92),a=new Image;a.onload=()=>{z.img=a;const i=document.getElementById("cropCanvas"),r=Math.min(window.innerWidth*.9,520),l=window.innerHeight*.55,c=Math.min(r/a.width,l/a.height,1);i.width=Math.round(a.width*c),i.height=Math.round(a.height*c),z.scale=c,z.rect={x:0,y:0,w:i.width,h:i.height},Te(),w("Rotated 90° ✓")},a.src=o}function Sl(){const t=document.getElementById("cropOv");t.classList.remove("on"),t.style.display="none",z={ctx:null,origDataUrl:null,mimeType:null,img:null,scale:1,rect:null,drag:null,dragStart:null,aspect:null}}function Fu(){const{img:t,rect:e,scale:n,ctx:s,mimeType:o}=z;if(!t||!e||e.w<2||e.h<2){Sl();return}const a=e.x/n,i=e.y/n,r=e.w/n,l=e.h/n,c=document.createElement("canvas");c.width=Math.round(r),c.height=Math.round(l),c.getContext("2d").drawImage(t,a,i,r,l,0,0,c.width,c.height);const d=c.toDataURL("image/jpeg",.92),u=document.getElementById("cropOv");u.classList.remove("on"),u.style.display="none";const p=s,y=Ce;z={ctx:null,origDataUrl:null,mimeType:null,img:null,scale:1,rect:null,drag:null,dragStart:null,aspect:null},kl(d,o,(v,h)=>{const[m,f]=(p||"").split(":"),E=parseInt(f)||0;if(m==="f")E>=pe.length?pe.push(v):pe[E]=v,me("f",pe),w("Photo added ✓");else{const $=m||y,I=k.find(M=>M.id===$);if(I){const M=Vt(I);E>=M.length?M.push(v):M[E]=v,I.images=M.slice(),I.image=M[0]||null,me("d",I.images),window.renderInv&&window.renderInv(),w("Photo added — uploading…"),Qa(v,$,E).then(N=>{const W=Vt(I),L=W.indexOf(v);L!==-1?W[L]=N:W[E]=N,I.images=W,I.image=W[0]||null,O(),me("d",I.images),window.renderInv&&window.renderInv(),w("Photo saved ✓")}).catch(N=>{console.warn("FlipTrack: upload failed, keeping base64:",N.message),O(),w("Photo saved locally ✓")})}}})}function kl(t,e,n){const i="image/jpeg",r=new Image;r.onload=()=>{if(Math.round(t.length*.75/1024)<=200&&r.width<=900&&r.height<=900){n(t,!1);return}const c=document.createElement("canvas"),d=c.getContext("2d");let u=r.width,p=r.height;if(u>900||p>900){const h=Math.min(900/u,900/p);u=Math.round(u*h),p=Math.round(p*h)}c.width=u,c.height=p,d.drawImage(r,0,0,u,p);let y=.85,v=c.toDataURL(i,y);for(;v.length*.75/1024>200&&y>.3;)y=Math.max(.3,y-.1),v=c.toDataURL(i,y);v.length*.75/1024>200&&(c.width=Math.round(u*.65),c.height=Math.round(p*.65),d.drawImage(r,0,0,c.width,c.height),v=c.toDataURL(i,.3)),n(v,!0)},r.src=t}function El(t){const e=document.getElementById("lightbox");!e||!e.classList.contains("on")||(t.key==="Escape"?Cl():t.key==="ArrowLeft"?di():t.key==="ArrowRight"&&pi())}let Js=0;function Il(t){const e=document.getElementById("lightbox");!e||!e.classList.contains("on")||(Js=t.touches[0].clientX)}function _l(t){const e=document.getElementById("lightbox");if(!e||!e.classList.contains("on")||!Js)return;const n=t.changedTouches[0].clientX-Js;Js=0,!(Math.abs(n)<50)&&(n>0?di():pi())}let po=!1;function Cl(){document.getElementById("lightbox").classList.remove("on"),document.getElementById("lightboxImg").src="",yt=[],Gt=0,po&&(document.removeEventListener("keydown",El),document.removeEventListener("touchstart",Il),document.removeEventListener("touchend",_l),po=!1)}const Mg=Object.freeze(Object.defineProperty({__proto__:null,clamp:Et,clearPendingAddImages:li,closeLightbox:Cl,compressImage:kl,cropApplyAspect:bl,cropAutoEnhance:Au,cropCancel:Sl,cropConfirm:Fu,cropDraw:Te,cropEndDrag:Io,cropHitTest:hl,cropMouseDown:wl,cropMouseMove:xl,cropMouseUp:$l,cropMoveDrag:fi,cropRemoveBg:zu,cropReset:Mu,cropRotate:Ru,cropSetAspect:Du,cropStartDrag:ui,cropTouchEnd:ga,cropTouchMove:ma,cropTouchStart:fa,cropWhiteBg:Lu,getItemImages:Vt,getPendingAddImages:ri,imgDragLeave:Cu,imgDragOver:_u,imgDrop:Bu,imgSlotChange:$u,imgSlotRemove:Su,lightboxNext:pi,lightboxPrev:di,openCropModal:vl,openLightbox:Tu,openLightboxUrl:Pu,readImgFile:ci,refreshImgSlots:me,renderAddFormImages:ku,renderDrawerImg:Eu,setPendingAddImages:xu},Symbol.toStringTag,{value:"Module"}));function mi(t){return(t.sku||t.id).replace(/[^A-Za-z0-9\-\.\ \$\/\+\%]/g,"").substring(0,40)||"ITEM"}function Bl(t,e){try{JsBarcode(t,e,{format:"CODE128",width:2,height:50,displayValue:!1,margin:0,background:"#ffffff",lineColor:"#000000"})}catch{JsBarcode(t,"FT"+e.replace(/[^A-Za-z0-9]/g,"").substring(0,20),{format:"CODE128",width:2,height:50,displayValue:!1,margin:0,background:"#ffffff",lineColor:"#000000"})}}function Tl(t){const e=document.getElementById("dBarcodeWrap");if(!e)return;const n=mi(t);e.innerHTML=`
    <div class="barcode-wrap">
      <svg id="dBarcodeSvg"></svg>
      <div class="barcode-sku-lbl">${n}</div>
    </div>
    <div class="barcode-actions">
      <button class="btn-secondary" style="font-size:11px;padding:5px 10px" onclick="printStickers(false,[activeDrawId])">🏷 Print Sticker</button>
      <span style="font-size:10px;color:var(--muted)">CODE128</span>
    </div>`;const s=document.getElementById("dBarcodeSvg");s&&Bl(s,n)}function Ou(t,e){let n;if(e)n=e.map(a=>k.find(i=>i.id===a)).filter(Boolean);else if(t&&K.size)n=[...K].map(a=>k.find(i=>i.id===a)).filter(Boolean);else{const a=(document.getElementById("invSearch").value||"").toLowerCase();n=k.filter(i=>{const r=!a||i.name.toLowerCase().includes(a)||(i.sku||"").toLowerCase().includes(a),l=Bt.size===0||Z(i).some(y=>Bt.has(y)),c=(i.category||"").toLowerCase(),d=xt.size===0||[...xt].some(y=>y.toLowerCase()===c);return r&&l&&d&&Yp==="all"&&Kp==="all"})}if(!n.length){w("No items to print",!0);return}const s=n.map(a=>{const i=mi(a),r="$"+Number(a.price||0).toFixed(2),l=Vt(a)[0]?`<img class="st-photo" src="${Vt(a)[0]}" alt="">`:"",c=[a.category,a.subcategory,a.subtype].filter(Boolean).join(" › ");return`
      <div class="sticker" data-sku="${ge(i)}">
        ${l}
        <div class="st-name">${x(a.name)}</div>
        ${c?`<div class="st-cat">${x(c)}</div>`:""}
        <div class="st-meta">
          <span class="st-platform">${Z(a).map(d=>x(d)).join(" · ")}</span>
          <span class="st-price">${r}</span>
        </div>
        <div class="st-bc-wrap">
          <svg class="bc-svg" data-val="${ge(i)}"></svg>
          <div class="st-sku">${x(i)}</div>
        </div>
      </div>`}).join(""),o=window.open("","_blank","width=900,height=700");o.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>FlipTrack — Inventory Stickers</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/JsBarcode.all.min.js"><\/script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Courier New', monospace;
    background: #f5f5f5;
    padding: 16px;
  }
  .print-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 2px solid #000;
  }
  .print-title { font-size: 20px; font-weight: 700; letter-spacing: 2px; }
  .print-meta  { font-size: 11px; color: #666; }
  .print-actions { display: flex; gap: 8px; }
  .print-btn {
    padding: 8px 18px;
    background: #000;
    color: #fff;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .print-btn.sec { background: #fff; color: #000; border: 1px solid #000; }

  .sticker-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .sticker {
    background: #fff;
    border: 1.5px solid #000;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    page-break-inside: avoid;
    break-inside: avoid;
    min-height: 160px;
  }
  .st-photo {
    width: 100%;
    height: 70px;
    object-fit: cover;
    border: 1px solid #eee;
    margin-bottom: 2px;
  }
  .st-name {
    font-size: 11px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.3px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .st-cat {
    font-size: 8px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .st-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2px;
  }
  .st-platform {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #f0f0f0;
    padding: 2px 5px;
    color: #333;
  }
  .st-price {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .st-bc-wrap {
    margin-top: auto;
    padding-top: 5px;
    border-top: 1px dashed #ccc;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .bc-svg { width: 100%; max-height: 44px; }
  .st-sku {
    font-size: 7.5px;
    letter-spacing: 1.5px;
    color: #444;
    text-transform: uppercase;
  }

  @media print {
    body { background: #fff; padding: 8px; }
    .print-header .print-actions { display: none; }
    .sticker-grid { gap: 6px; }
    .sticker { border: 1px solid #000; }
  }
  @page { margin: 12mm; }
</style>
</head>
<body>
<div class="print-header">
  <div>
    <div class="print-title">FLIPTRACK — INVENTORY STICKERS</div>
    <div class="print-meta">${n.length} item${n.length!==1?"s":""} · Generated ${new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
  </div>
  <div class="print-actions">
    <button class="print-btn sec" onclick="window.close()">✕ Close</button>
    <button class="print-btn" onclick="window.print()">⬛ Print</button>
  </div>
</div>
<div class="sticker-grid">${s}</div>
<script>
  window.onload = function() {
    document.querySelectorAll('.bc-svg').forEach(svg => {
      const val = svg.dataset.val;
      try {
        JsBarcode(svg, val, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: false,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000',
        });
      } catch(e) {
        JsBarcode(svg, 'FT' + val.replace(/[^A-Za-z0-9]/g,'').substring(0,20), {
          format:'CODE128', width:1.5, height:40, displayValue:false,
          margin:0, background:'#ffffff', lineColor:'#000000'
        });
      }
    });
    // Auto-show print dialog after barcodes render
    setTimeout(() => window.print(), 400);
  };
<\/script>
</body>
</html>`),o.document.close()}const Dg=Object.freeze(Object.defineProperty({__proto__:null,makeBarcodeValue:mi,printStickers:Ou,renderBarcode:Bl,renderDrawerBarcode:Tl},Symbol.toStringTag,{value:"Module"})),Pl=["Goodwill","Salvation Army","Thrift Store","Garage Sale","Estate Sale","Flea Market","Facebook Marketplace","OfferUp","Craigslist","Wholesale","Liquidation","Retail Arbitrage","Online Arbitrage","Dumpster Dive","Storage Unit","Auction","Personal Collection","Other"],Ml=["Unbranded","Nike","Adidas","Levi's","Under Armour","Champion","Carhartt","The North Face","Patagonia","Ralph Lauren","Tommy Hilfiger","Calvin Klein","Coach","Michael Kors","Gucci","Louis Vuitton","Apple","Samsung","Sony","Dell"],Dl="autocomplete_custom";async function Ll(){try{return await gt(Dl)||{sources:[],brands:[]}}catch(t){return console.warn("FlipTrack: autocomplete IDB load failed:",t.message),{sources:[],brands:[]}}}async function Nu(t,e){try{const n=await Ll(),s=new Set([...Pl.map(i=>i.toLowerCase()),...n.sources.map(i=>i.toLowerCase())]),o=new Set([...Ml.map(i=>i.toLowerCase()),...n.brands.map(i=>i.toLowerCase())]);let a=!1;for(const i of t)i&&!s.has(i.toLowerCase())&&(n.sources.push(i),s.add(i.toLowerCase()),a=!0);for(const i of e)i&&!o.has(i.toLowerCase())&&(n.brands.push(i),o.add(i.toLowerCase()),a=!0);a&&await et(Dl,n)}catch(n){console.warn("FlipTrack: autocomplete persist error:",n.message)}}function Uu(){const t=new Set,e=new Set;for(const n of k)n.source&&t.add(n.source.trim()),n.brand&&e.add(n.brand.trim());return{sources:[...t],brands:[...e]}}function lr(t,e){const n=document.getElementById(t);if(!n)return;const s=[...e].sort((o,a)=>o.localeCompare(a,void 0,{sensitivity:"base"}));n.innerHTML=s.map(o=>`<option value="${o.replace(/"/g,"&quot;")}">`).join("")}async function Al(){const t=Uu(),e=await Ll(),n=new Map;for(const o of[...Pl,...t.sources,...e.sources])o&&n.set(o.toLowerCase(),o);const s=new Map;for(const o of[...Ml,...t.brands,...e.brands])o&&s.set(o.toLowerCase(),o);lr("sourceList",[...n.values()]),lr("brandList",[...s.values()])}async function zl(t,e){const n=t?[t.trim()]:[],s=e?[e.trim()]:[];(n.length||s.length)&&await Nu(n,s)}function qu(t){const e=document.getElementById(t+"_smoke");if(!e)return;const n=parseInt(e.value,10),s=document.getElementById(t+"_smoke_lbl_free"),o=document.getElementById(t+"_smoke_lbl_exp");e.classList.remove("pos-free","pos-exp"),s&&s.classList.remove("on-free"),o&&o.classList.remove("on-exp"),n===0?(e.classList.add("pos-free"),s&&s.classList.add("on-free")):n===2&&(e.classList.add("pos-exp"),o&&o.classList.add("on-exp"))}function Rl(t){const e=document.getElementById(t+"_smoke");if(!e)return null;const n=parseInt(e.value,10);return n===0?"smoke-free":n===2?"smoke-exposure":null}function gi(t,e){const n=document.getElementById(t+"_smoke");n&&(e==="smoke-free"?n.value="0":e==="smoke-exposure"?n.value="2":n.value="1",qu(t))}function ju(t){const e=document.getElementById(t+"_cover");if(!e)return;const n=parseInt(e.value,10),s=document.getElementById(t+"_cover_lbl_soft"),o=document.getElementById(t+"_cover_lbl_hard");e.classList.remove("pos-soft","pos-hard"),s&&s.classList.remove("on-soft"),o&&o.classList.remove("on-hard"),n===0?(e.classList.add("pos-soft"),s&&s.classList.add("on-soft")):n===2&&(e.classList.add("pos-hard"),o&&o.classList.add("on-hard"))}function Fl(t){const e=document.getElementById(t+"_cover");if(!e)return null;const n=parseInt(e.value,10);return n===0?"softcover":n===2?"hardcover":null}function yi(t,e){const n=document.getElementById(t+"_cover");n&&(e==="softcover"?n.value="0":e==="hardcover"?n.value="2":n.value="1",ju(t))}function Lg(){const t=k.find(e=>e.id===Ce);t&&(Hu(t.id),hi())}function Hu(t){const e=k.find(r=>r.id===t);if(!e)return;const n=se(),s=ot().replace(/-/g,""),o=(e.category||"GEN").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4).padEnd(3,"X"),a=Math.random().toString(36).slice(2,5).toUpperCase(),i={...JSON.parse(JSON.stringify(e)),id:n,sku:o+"-"+s+"-"+a,added:new Date().toISOString(),platformStatus:{}};k.push(i),j("inv",i.id),O(),V(),bo.create(),w("Duplicated: "+i.name+" ✓"),Ss()}function Wu(t,e){document.querySelectorAll(".add-form-tab").forEach(c=>{c.style.color="var(--muted)",c.style.borderBottomColor="transparent",c.classList.remove("active")}),e&&(e.style.color="var(--accent)",e.style.borderBottomColor="var(--accent)",e.classList.add("active"));const n=["f_name","f_sku","f_upc","f_cat","f_source","f_subcat_txt","f_subtype_txt","f_plat_picker","f_bulk","f_qty","f_alert"].map(c=>document.getElementById(c)),s=["f_cost","f_price","f_fees","f_ship","f_condition","f_smoke"].map(c=>document.getElementById(c)),o=["f_ebay_fields","f_ebay_desc","f_notes","f_book_fields","fImgWrap"].map(c=>document.getElementById(c)),a=c=>{if(c){const d=c.closest(".fgrp")||c.closest(".full")||c;d.style.display=""}},i=c=>{if(c){const d=c.closest(".fgrp")||c.closest(".full")||c;d.style.display="none"}},r=document.querySelector(".profit-prev"),l=document.getElementById("f_dim_section");t==="basic"?(n.forEach(a),s.forEach(i),o.forEach(i),r&&(r.style.display="none"),l&&(l.style.display="none")):t==="pricing"?(n.forEach(i),s.forEach(a),o.forEach(i),r&&(r.style.display=""),l&&(l.style.display="none")):(n.forEach(i),s.forEach(i),o.forEach(a),r&&(r.style.display="none"),l&&(l.style.display=""))}function Ag(){const t=document.getElementById("addOv");t.classList.add("on"),li(),me("f",ri());const e=t.querySelector(".modal-bd");e&&(e.scrollTop=0);const n=t.querySelector(".modal");n&&(n.scrollTop=0),setTimeout(()=>xr("#addOv .modal"),100),Wu("basic",document.querySelector(".add-form-tab")),Al().catch(()=>{})}function cr(){Ta(),document.getElementById("addOv").classList.remove("on"),["f_name","f_sku","f_upc","f_cat","f_subcat_txt","f_subtype_txt","f_cost","f_price","f_fees","f_ship","f_notes","f_alert","f_source","f_condition","f_brand","f_color","f_size","f_sizeType","f_department","f_material","f_mpn","f_model","f_style","f_pattern","f_ebay_desc"].forEach(n=>{const s=document.getElementById(n);s&&(s.value="")}),document.getElementById("f_qty").value="1";const t=document.getElementById("f_bulk");t&&(t.checked=!1);const e=document.getElementById("f_bulk_fields");e&&(e.style.display="none"),document.querySelectorAll("#f_cond_picker .cond-tag").forEach(n=>n.classList.remove("active")),du("f"),ll("f",!1),li(),me("f",[]),wu("f"),cs("f_plat_picker",[]),Vu(),gi("f",null),yi("f",null)}function Gu(t){var n;const e=(n=document.getElementById(t+"_bulk"))==null?void 0:n.checked;if(t==="f"){const s=document.getElementById("f_bulk_fields");s&&(s.style.display=e?"block":"none");const o=document.getElementById("f_qty");!e&&o&&(o.value="1")}if(t==="d"){const s=document.getElementById("d_alert_grp");s&&(s.style.display=e?"":"none")}}function Vu(){const t=parseFloat(document.getElementById("f_cost").value)||0,e=parseFloat(document.getElementById("f_price").value)||0,n=parseFloat(document.getElementById("f_fees").value)||0,s=parseFloat(document.getElementById("f_ship").value)||0,o=e-t-n-s,a=e?o/e:null,i=t?o/t:null;document.getElementById("pp_profit").textContent=e||t?S(o):"—",document.getElementById("pp_margin").textContent=a!=null?Y(a):"—",document.getElementById("pp_roi").textContent=i!=null?Y(i):"—",document.getElementById("pp_profit").style.color=o>=0?"var(--good)":"var(--danger)"}function zg(){const e=[...k].sort((r,l)=>new Date(l.added||0)-new Date(r.added||0))[0];if(!e){w("No items to copy from",!0);return}const n=document.getElementById("f_source");n&&e.source&&(n.value=e.source);const s=document.getElementById("f_cat");s&&e.category&&(s.value=e.category,Qu());const o=document.getElementById("f_subcat_txt");o&&e.subcategory&&(o.value=e.subcategory);const a=document.getElementById("f_subtype_txt");a&&e.subtype&&(a.value=e.subtype),e.condition&&Ul("f",e.condition);const i=Z(e);i.length&&cs("f_plat_picker",i),Eo("f"),e.smoke&&gi("f",e.smoke),e.coverType&&yi("f",e.coverType),w("Prefilled from: "+e.name)}function Rg(){var He,ae,jn,Bs,Ts,Ps,pn,Ms,Ds,Ls,As,Ot,zs;const t=document.getElementById("f_name").value.trim();if(!t){w("Name required",!0);return}const e=document.getElementById("f_cost"),n=Lt(e.value,{});if(isNaN(n)&&e.value.trim()!==""){Ie(e,{fieldName:"Cost"});return}const s=document.getElementById("f_price"),o=Lt(s.value,{});if(isNaN(o)&&s.value.trim()!==""){Ie(s,{fieldName:"Price"});return}if(!o){w("Price required",!0);return}const a=document.getElementById("f_fees"),i=Lt(a.value,{allowZero:!0});if(isNaN(i)&&a.value.trim()!==""){Ie(a,{fieldName:"Fees"});return}const r=document.getElementById("f_ship"),l=Lt(r.value,{allowZero:!0});if(isNaN(l)&&r.value.trim()!==""){Ie(r,{fieldName:"Shipping"});return}const c=document.getElementById("f_qty"),d=Lt(c.value,{integer:!0,min:1}),u=((He=document.getElementById("f_bulk"))==null?void 0:He.checked)||!1,p=u?isNaN(d)?1:d:1,y=document.getElementById("f_alert"),v=Lt(y.value,{integer:!0,min:1}),h=u?isNaN(v)?2:v:2,m=al(document.getElementById("f_cat").value.trim()),f=ot().replace(/-/g,""),E=(m||"GEN").trim().toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4).padEnd(3,"X"),$=Math.random().toString(36).slice(2,5).toUpperCase(),I=E+"-"+f+"-"+$,M=(document.getElementById("f_upc").value||"").trim();if(M){const pt=k.find(vt=>vt.upc===M);if(pt&&!confirm(`An item with UPC "${M}" already exists:

"${pt.name}" (Qty: ${pt.qty})

Add as a new item anyway, or cancel to update the existing one?`)){cr(),typeof window.openDrawer=="function"&&window.openDrawer(pt.id);return}}const N=Da(Er("f_plat_picker")),W=N[0]||"",L=se(),q=ri().slice(),D=Rl("f"),_=Fl("f"),A=(document.getElementById("f_subcat_txt").value||"").trim(),T=(document.getElementById("f_subtype_txt").value||"").trim();A&&T&&((ae=window._saveCustomType)==null||ae.call(window,A,T));const P=(((jn=document.getElementById("f_brand"))==null?void 0:jn.value)||"").trim(),R=(((Bs=document.getElementById("f_color"))==null?void 0:Bs.value)||"").trim(),G=(((Ts=document.getElementById("f_size"))==null?void 0:Ts.value)||"").trim(),nt=(((Ps=document.getElementById("f_material"))==null?void 0:Ps.value)||"").trim(),kt=(((pn=document.getElementById("f_mpn"))==null?void 0:pn.value)||"").trim(),be=(((Ms=document.getElementById("f_model"))==null?void 0:Ms.value)||"").trim(),Ft=(((Ds=document.getElementById("f_style"))==null?void 0:Ds.value)||"").trim(),Pe=(((Ls=document.getElementById("f_pattern"))==null?void 0:Ls.value)||"").trim(),Po=(((As=document.getElementById("f_sizeType"))==null?void 0:As.value)||"").trim(),Mo=(((Ot=document.getElementById("f_department"))==null?void 0:Ot.value)||"").trim(),je=(((zs=document.getElementById("f_ebay_desc"))==null?void 0:zs.value)||"").trim();k.push({id:L,name:t,sku:document.getElementById("f_sku").value.trim()||I,upc:document.getElementById("f_upc").value.trim()||"",category:m,subcategory:A,subtype:T,platform:W,platforms:N,cost:isNaN(n)?0:n,price:o,qty:p,bulk:u,fees:isNaN(i)?0:i,ship:isNaN(l)?0:l,lowAlert:h,notes:document.getElementById("f_notes").value.trim(),source:document.getElementById("f_source").value.trim(),condition:document.getElementById("f_condition").value.trim(),smoke:D,coverType:An(m)?_:null,brand:P,color:R,size:G,sizeType:Po,department:Mo,material:nt,mpn:kt,model:be,style:Ft,pattern:Pe,ebayDesc:je,images:q,image:q[0]||null,...yl("f"),...An(m)?cl("f"):{},added:new Date().toISOString()}),j("inv",L),O(),cr(),V(),bo.create(),w("Item added ✓");const qn=k.find(pt=>pt.id===L);qn&&zl(qn.source,qn.brand).catch(()=>{});const we=N.includes("eBay")&&ft();if(q.length&&dt()&&St()){const pt=k.find(vt=>vt.id===L);pt&&Promise.all(q.map((vt,ie)=>Qa(vt,L,ie).catch(Rs=>(console.warn("FlipTrack: upload failed for slot",ie,Rs.message),vt)))).then(vt=>{!Array.isArray(vt)||!vt.length||(pt.images=vt,pt.image=vt[0]||null,j("inv",pt.id),O(),window.renderInv&&window.renderInv(),we&&dr(L).catch(ie=>{console.warn("FlipTrack: auto eBay list failed:",ie.message),w("eBay auto-list failed — try manually",!0)}),ta(L,N).catch(ie=>{console.warn("FlipTrack: crosslist cache failed:",ie.message),w("Crosslist cache generation failed",!0)}))}).catch(vt=>{console.error("FlipTrack: image upload chain failed:",vt.message)})}else we?(dr(L).catch(pt=>{console.warn("FlipTrack: auto eBay list failed:",pt.message),w("eBay auto-list failed — try manually",!0)}),ta(L,N).catch(pt=>{console.warn("FlipTrack: crosslist cache failed:",pt.message),w("Crosslist cache generation failed",!0)})):ta(L,N).catch(pt=>{console.warn("FlipTrack: crosslist cache failed:",pt.message),w("Crosslist cache generation failed",!0)})}async function dr(t){try{if(w("Listing on eBay…"),!(await Ga(t)).success)return;const n=await So(t);n.success&&w(`Listed on eBay! Item #${n.listingId}`)}catch(e){console.warn("[eBay] Auto-list failed:",e.message),w(`eBay auto-list: ${e.message}`,!0)}}const Yu=new Set(["Poshmark","Mercari","Depop","Grailed","Facebook Marketplace","StockX","GOAT","Vinted","Craigslist","OfferUp"]);async function ta(t,e){const n=e.filter(s=>Yu.has(s));if(n.length)for(const s of n)try{await Mr(t,s)}catch(o){console.warn(`[Crosslist] AI gen failed for ${s}:`,o.message)}}let ya=null;function _o(t){if(!t)return[];if(Zt[t])return Zt[t];const e=t.toLowerCase(),n=Object.keys(Zt).find(s=>s.toLowerCase()===e);return n?Zt[n]:[]}function vi(t,e,n){const s=_o(e),o=document.getElementById(t);if(!o)return;const a=t==="d_subcat"?"d_subcat_grp":"f_subcat_grp",i=document.getElementById(a);s.length?(o.innerHTML='<option value="">— None —</option>'+s.map(r=>`<option value="${r}" ${r===n?"selected":""}>${r}</option>`).join(""),i&&(i.style.display="")):(o.innerHTML='<option value="">— None —</option>',i&&(i.style.display="none"))}const Ol="ft_custom_types";function Nl(){try{return JSON.parse(localStorage.getItem(Ol))||{}}catch{return{}}}function Ku(t,e){if(!t||!e||(Ba[t]||[]).includes(e))return;const s=Nl();s[t]||(s[t]=[]),!s[t].includes(e)&&(s[t].push(e),localStorage.setItem(Ol,JSON.stringify(s)))}function Ju(t){const e=Ba[t]||[],n=Nl()[t]||[],s=[...new Set(k.filter(a=>(a.subcategory||"")===t&&a.subtype).map(a=>a.subtype))],o=[...e];for(const a of[...n,...s])o.includes(a)||o.push(a);return o}function ks(t,e,n){const s=t+"_subtype_txt",o=t+"_subtype_dl",a=t+"_subtype_lbl",i=document.getElementById(s),r=document.getElementById(o),l=document.getElementById(a);if(!i)return;const c=["Men","Women","Children"].includes(e)?"Clothing Type":"Type";l&&(l.textContent=c);const d=Ju(e);r&&(r.innerHTML=d.map(u=>`<option value="${u}">`).join("")),i.value=n||""}function Fg(){const t=document.getElementById("d_cat").value.trim(),e=_o(t),n=document.getElementById("d_subcat_dl");n&&(n.innerHTML=e.map(s=>`<option value="${s}">`).join("")),vi("d_subcat",t,document.getElementById("d_subcat_txt").value),ks("d",(document.getElementById("d_subcat_txt").value||"").trim(),""),Eo("d")}function Og(){var e;const t=((e=document.getElementById("d_subtype_txt"))==null?void 0:e.value)||"";ks("d",(document.getElementById("d_subcat_txt").value||"").trim(),t)}function Qu(){const t=document.getElementById("f_cat").value.trim(),e=_o(t),n=document.getElementById("f_subcat_dl");n&&(n.innerHTML=e.map(s=>`<option value="${s}">`).join("")),vi("f_subcat",t,document.getElementById("f_subcat_txt").value),ks("f",(document.getElementById("f_subcat_txt").value||"").trim(),""),Eo("f")}function Ng(){var e;const t=((e=document.getElementById("f_subtype_txt"))==null?void 0:e.value)||"";ks("f",(document.getElementById("f_subcat_txt").value||"").trim(),t)}function Ug(t){ol(t);const e=k.find(m=>m.id===t);if(!e)return;ya=$d(e),Al().catch(()=>{}),document.getElementById("dName").textContent=e.name,document.getElementById("dSku").textContent=e.sku?`SKU: ${e.sku}`:"No SKU";const{pu:n,m:s,roi:o}=qt(e),a=B.filter(m=>m.itemId===t),i=a.reduce((m,f)=>m+(f.qty||0),0),r=a.reduce((m,f)=>m+(f.price||0)*(f.qty||0),0),l=rl(e.qty,e.lowAlert,e.bulk);document.getElementById("dMets").innerHTML=`
    <div class="d-met"><div class="dm-lbl">In Stock</div><div class="dm-val" style="color:${ou(l)}">${e.qty||0}</div></div>
    <div class="d-met"><div class="dm-lbl">Profit/Unit</div><div class="dm-val" style="color:var(--good)">${S(n)}</div></div>
    <div class="d-met"><div class="dm-lbl">Margin</div><div class="dm-val" style="color:var(--accent)">${Y(s)}</div></div>
    <div class="d-met"><div class="dm-lbl">ROI</div><div class="dm-val" style="color:var(--accent3)">${Y(o)}</div></div>
    <div class="d-met"><div class="dm-lbl">Units Sold</div><div class="dm-val">${i}</div></div>
    <div class="d-met"><div class="dm-lbl">Total Revenue</div><div class="dm-val">${S(r)}</div></div>`;const c={d_name:"name",d_sku:"sku",d_upc:"upc",d_cat:"category",d_cost:"cost",d_price:"price",d_fees:"fees",d_ship:"ship",d_notes:"notes",d_url:"url",d_alert:"lowAlert",d_source:"source",d_brand:"brand",d_color:"color",d_size:"size",d_sizeType:"sizeType",d_department:"department",d_material:"material",d_mpn:"mpn",d_model:"model",d_style:"style",d_pattern:"pattern",d_ebay_desc:"ebayDesc"};for(const[m,f]of Object.entries(c)){const E=document.getElementById(m);E&&(E.value=e[f]||"")}const d=document.getElementById("d_subcat_txt");d&&(d.value=e.subcategory||"");const u=_o(e.category||""),p=document.getElementById("d_subcat_dl");p&&(p.innerHTML=u.map(m=>`<option value="${m}">`).join(""));const y=document.getElementById("d_bulk");y&&(y.checked=!!e.bulk,Gu("d")),cs("d_plat_picker",Z(e)),Zu(e),Xu(e),Ul("d",e.condition||""),gi("d",e.smoke||null),vi("d_subcat",e.category||"",e.subcategory||""),ks("d",e.subcategory||"",e.subtype||""),Eo("d"),An(e.category)&&(cu("d",e),yi("d",e.coverType||null)),window.renderDrawerImg&&window.renderDrawerImg(e.id),Tl(e),bu("d",e),gl("d");const v=document.getElementById("d_ship_summary");if(v){const m=[],f=parseFloat(e.weightMaj)||0,E=parseFloat(e.weightMin)||0;if(f||E){const $=e.dimUnit==="cm"?`${f} kg ${E} g`:`${f} lb ${E} oz`;m.push($)}e.dimL&&e.dimW&&e.dimH&&m.push(`${e.dimL}×${e.dimW}×${e.dimH} ${e.dimUnit||"in"}`),v.textContent=m.length?`Package: ${m.join(" · ")}`:"Add dimensions above to see package info"}const h=document.getElementById("dHistory");h.innerHTML=Ed(t),document.getElementById("drawerOv").classList.add("on"),document.getElementById("drawer").classList.add("on"),setTimeout(()=>xr("#drawer"),100)}function qg(t,e){document.querySelectorAll(".drawer-tab-panel").forEach(n=>n.classList.remove("active")),document.querySelectorAll(".drawer-tab").forEach(n=>n.classList.remove("active")),document.getElementById("dtab-"+t).classList.add("active"),e.classList.add("active")}function hi(){Ta(),document.getElementById("drawerOv").classList.remove("on"),document.getElementById("drawer").classList.remove("on"),document.querySelectorAll(".drawer-tab-panel").forEach(n=>n.classList.remove("active")),document.querySelectorAll(".drawer-tab").forEach(n=>n.classList.remove("active"));const t=document.getElementById("dtab-details");t&&t.classList.add("active");const e=document.querySelector(".drawer-tab");e&&e.classList.add("active"),ol(null)}function Xu(t){const e=document.getElementById("d_fee_calc");if(!e)return;const n=Z(t),s=t.price||0;if(!n.length||!s){e.innerHTML='<div style="font-size:11px;color:var(--muted);padding:4px 0">Add platforms and a price to see fee estimates</div>';return}e.innerHTML=n.filter(o=>sa[o]).map(o=>{var l;const a=Jc(o,s),i=s-a-(t.cost||0)-(t.ship||0),r=((l=sa[o])==null?void 0:l.label)||"";return`<div class="fee-row">
      <span class="fee-plat">${o}</span>
      <span class="fee-detail">${r}</span>
      <span class="fee-amt" style="color:var(--accent2)">-${S(a)}</span>
      <span class="fee-net ${i>=0?"pos":"neg"}">Net: ${S(i)}</span>
    </div>`}).join("")}function Zu(t){const e=document.getElementById("d_listing_status_wrap"),n=document.getElementById("d_listing_status"),s=Z(t);if(!s.length||s.length<1){e.style.display="none";return}e.style.display="";const o=t.platformStatus||{},a=t.platformListingDates||{};n.innerHTML=s.map(i=>{const r=o[i]||"active",l=oo[r]||r,c=ao[r]||"var(--muted)",d=a[i],u=Ir(i,d);let p="";u!==null&&(u<0?p=`<span class="ls-expiry ls-expired">Expired ${Math.abs(u)}d ago</span>`:u<=3?p=`<span class="ls-expiry ls-urgent">${u}d left</span>`:u<=7?p=`<span class="ls-expiry ls-warning">${u}d left</span>`:p=`<span class="ls-expiry">${u}d left</span>`);const y=d?`<span class="ls-date">Listed ${d}</span>`:"",v=r==="expired"||r==="delisted"||r==="sold-elsewhere";return`<div class="ls-badge-enhanced" data-status="${r}" data-plat="${x(i)}">
      <div class="ls-badge-top">
        <span class="ls-dot" style="background:${c}"></span>
        <span class="ls-plat-name">${x(i)}</span>
        <span class="ls-label" style="color:${c}" onclick="toggleListingStatus(this.closest('.ls-badge-enhanced'))">${l}</span>
        ${p}
      </div>
      <div class="ls-badge-bottom">
        ${y}
        <div class="ls-badge-actions">
          ${v?`<button class="btn-xs btn-accent" onclick="clRelistFromDrawer('${t.id}','${x(i)}')">Relist</button>`:""}
          <button class="btn-xs" onclick="clOpenLink('${x(i)}','${t.id}')" title="Open on ${x(i)}">↗</button>
          <button class="btn-xs" onclick="clCopyListing('${t.id}')" title="Copy listing text">📋</button>
        </div>
      </div>
    </div>`}).join("")}function jg(t){const e=La,n=t.getAttribute("data-status"),s=e[(e.indexOf(n)+1)%e.length];t.setAttribute("data-status",s);const o=t.querySelector(".ls-label"),a=t.querySelector(".ls-dot");o&&(o.textContent=oo[s]||s,o.style.color=ao[s]||"var(--muted)"),a&&(a.style.background=ao[s]||"var(--muted)")}function tf(){const t=document.querySelectorAll("#d_listing_status .ls-badge-enhanced"),e={};return t.forEach(n=>{const s=n.getAttribute("data-plat"),o=n.getAttribute("data-status");s&&La.includes(o)&&(e[s]=o)}),e}async function Hg(){var y,v,h,m,f,E,$,I,M,N,W,L;const t=k.find(q=>q.id===Ce);if(!t)return;const e=document.getElementById("d_cost"),n=Lt(e.value,{});if(isNaN(n)&&e.value.trim()!==""){Ie(e,{fieldName:"Cost"});return}const s=document.getElementById("d_price"),o=Lt(s.value,{});if(isNaN(o)&&s.value.trim()!==""){Ie(s,{fieldName:"Price"});return}const a=document.getElementById("d_fees"),i=Lt(a.value,{allowZero:!0});if(isNaN(i)&&a.value.trim()!==""){Ie(a,{fieldName:"Fees"});return}const r=document.getElementById("d_ship"),l=Lt(r.value,{allowZero:!0});if(isNaN(l)&&r.value.trim()!==""){Ie(r,{fieldName:"Shipping"});return}const c=document.getElementById("d_alert"),d=Lt(c.value,{integer:!0,min:1}),u=t.price||0;t.name=document.getElementById("d_name").value.trim()||t.name,t.sku=document.getElementById("d_sku").value.trim(),t.upc=document.getElementById("d_upc").value.trim(),t.category=al(document.getElementById("d_cat").value.trim()),t.subcategory=(document.getElementById("d_subcat_txt").value||"").trim();const p=document.getElementById("d_subtype_txt");if(t.subtype=p?(p.value||"").trim():t.subtype||"",t.subcategory&&t.subtype&&Ku(t.subcategory,t.subtype),t.platforms=Er("d_plat_picker"),t.platform=t.platforms[0]||"",t.platformStatus=tf(),t.cost=isNaN(n)?0:n,t.price=isNaN(o)?0:o,t.fees=isNaN(i)?0:i,t.ship=isNaN(l)?0:l,t.lowAlert=isNaN(d)?2:d,t.bulk=((y=document.getElementById("d_bulk"))==null?void 0:y.checked)||!1,t.url=document.getElementById("d_url").value.trim(),t.source=document.getElementById("d_source").value.trim(),t.condition=document.getElementById("d_condition").value.trim(),t.notes=document.getElementById("d_notes").value.trim(),t.brand=(((v=document.getElementById("d_brand"))==null?void 0:v.value)||"").trim(),t.color=(((h=document.getElementById("d_color"))==null?void 0:h.value)||"").trim(),t.size=(((m=document.getElementById("d_size"))==null?void 0:m.value)||"").trim(),t.material=(((f=document.getElementById("d_material"))==null?void 0:f.value)||"").trim(),t.mpn=(((E=document.getElementById("d_mpn"))==null?void 0:E.value)||"").trim(),t.model=((($=document.getElementById("d_model"))==null?void 0:$.value)||"").trim(),t.style=(((I=document.getElementById("d_style"))==null?void 0:I.value)||"").trim(),t.pattern=(((M=document.getElementById("d_pattern"))==null?void 0:M.value)||"").trim(),t.sizeType=(((N=document.getElementById("d_sizeType"))==null?void 0:N.value)||"").trim(),t.department=(((W=document.getElementById("d_department"))==null?void 0:W.value)||"").trim(),t.ebayDesc=(((L=document.getElementById("d_ebay_desc"))==null?void 0:L.value)||"").trim(),Object.assign(t,yl("d")),An(t.category)&&(Object.assign(t,cl("d")),t.coverType=Fl("d")),t.smoke=Rl("d"),t.price!==u&&t.price>0&&(Ra(t.id,t.price,"manual"),t.etsyListingId))try{await jr(t.id)}catch(q){console.warn("Etsy price sync:",q.message),w("Etsy price sync failed — will retry next sync",!0)}if(t.ebayItemId&&ft())try{await Gd(t.id),w("eBay listing updated ✓")}catch(q){console.warn("[eBay] Auto-update failed:",q.message),w("eBay sync failed — will retry next sync",!0)}Sd(t.id,ya),ya=null,zl(t.source,t.brand).catch(()=>{}),j("inv",t.id),O(),hi(),V(),bo.edit(),w("Changes saved ✓")}async function Wg(){const t=k.find(n=>n.id===Ce);if(!confirm(`Delete "${t==null?void 0:t.name}"?`))return;const e=Ce;ai(e),O(),hi(),V(),w("Item deleted — tap Undo to restore",!1,4e3),await $s("ft_inventory",[e]),autoSync()}function Gg(t,e,n){const s=document.getElementById(t+"_condition"),o=document.getElementById(t+"_cond_picker");s.value===e?(s.value="",n.classList.remove("active")):(s.value=e,o.querySelectorAll(".cond-tag").forEach(a=>a.classList.remove("active")),n.classList.add("active"))}function Ul(t,e){const n=document.getElementById(t+"_condition"),s=document.getElementById(t+"_cond_picker");!n||!s||(n.value=e||"",s.querySelectorAll(".cond-tag").forEach(o=>{o.classList.toggle("active",o.textContent.trim()===e)}))}const ql="whatnot_shows";let tt=[];async function Vg(){try{const t=await gt(ql);Array.isArray(t)&&(tt=t)}catch(t){console.warn("FlipTrack: Whatnot shows init error:",t.message)}}async function oe(){try{await et(ql,tt)}catch(t){console.warn("FlipTrack: Whatnot shows save error:",t.message)}}function ef(){return tt}function jl(){return tt.filter(t=>t.status==="prep"||t.status==="live").sort((t,e)=>t.status==="live"&&e.status!=="live"?-1:e.status==="live"&&t.status!=="live"?1:(t.date||"").localeCompare(e.date||"")||(t.time||"").localeCompare(e.time||""))}function nf(){return tt.filter(t=>t.status==="ended").sort((t,e)=>(e.endedAt||0)-(t.endedAt||0))}function Hl(t){return tt.find(e=>e.id===t)||null}async function bi(t,e,n,s,o={}){const a={id:se(),name:(t||"").trim()||"Untitled Show",date:e||ot(),time:n||"",items:o.items?[...o.items]:[],status:o.status||"prep",notes:(s||"").trim(),createdAt:Date.now(),startedAt:null,endedAt:null,soldCount:0,totalRevenue:0,itemNotes:o.itemNotes?{...o.itemNotes}:{},soldItems:{},recurring:o.recurring||null,templateOf:o.templateOf||null,viewerPeak:null,showExpenses:0};return tt.push(a),await oe(),a.status!=="template"&&w(`Show "${a.name}" created`),a}async function sf(t){const e=tt.findIndex(s=>s.id===t);if(e===-1)return!1;const n=tt[e].name;return tt.splice(e,1),await oe(),w(`Show "${n}" deleted`),!0}async function of(t,e){const n=tt.find(s=>s.id===t);return!n||n.items.includes(e)?!1:(n.items.push(e),await oe(),!0)}async function af(t,e){const n=tt.find(o=>o.id===t);if(!n)return!1;const s=n.items.indexOf(e);return s===-1?!1:(n.items.splice(s,1),await oe(),!0)}async function rf(t,e,n){const s=tt.find(i=>i.id===t);if(!s)return!1;const o=s.items.indexOf(e);if(o===-1)return!1;const a=n==="up"?o-1:o+1;return a<0||a>=s.items.length?!1:([s.items[o],s.items[a]]=[s.items[a],s.items[o]],await oe(),!0)}async function lf(t){const e=tt.find(s=>s.id===t);if(!e||e.status==="live")return!1;e.status="live",e.startedAt=Date.now();const n=ot();for(const s of e.items){const o=F(s);o&&(o.qty||0)>0&&(Tt(s,"Whatnot","active"),qe(s,"Whatnot",n))}return O(),await oe(),w(`Show "${e.name}" is LIVE!`),!0}async function cf(t){var n;const e=tt.find(s=>s.id===t);if(!e||e.status!=="live")return!1;e.status="ended",e.endedAt=Date.now();for(const s of e.items){const o=F(s);o&&((n=o.platformStatus)==null?void 0:n.Whatnot)==="active"&&Tt(s,"Whatnot","delisted")}return O(),await oe(),w(`Show "${e.name}" ended — ${e.soldCount} sold, ${S(e.totalRevenue)} revenue`),!0}async function df(t,e,n){const s=tt.find(i=>i.id===t);if(!s)return!1;const o=F(e);if(!o)return!1;Tt(e,"Whatnot","sold"),o.qty!==void 0&&(o.qty=Math.max(0,(o.qty||1)-1)),j(e),O();const a=n||o.price||0;return s.soldCount=(s.soldCount||0)+1,s.totalRevenue=(s.totalRevenue||0)+a,s.soldItems||(s.soldItems={}),s.soldItems[e]={price:a,soldAt:Date.now()},await oe(),!0}function pf(t){const e=tt.find(s=>s.id===t);if(!e)return"";const n=[`--- ${e.name} ---`,`Date: ${e.date}${e.time?" @ "+e.time:""}`,""];return e.items.forEach((s,o)=>{var r;const a=F(s);if(!a)return;n.push(`${o+1}. ${a.name||"Untitled"}`),a.condition&&n.push(`   Condition: ${a.condition}`),a.price&&n.push(`   Price: ${S(a.price)}`);const i=(r=e.itemNotes)==null?void 0:r[s];i&&n.push(`   Talking Points: ${i}`),a.notes&&n.push(`   Notes: ${a.notes}`),n.push("")}),n.push(`Total items: ${e.items.length}`),n.join(`
`)}async function uf(t){const e=pf(t);if(!e){w("No show found",!0);return}try{await navigator.clipboard.writeText(e),w("Show prep list copied to clipboard")}catch{w("Copy failed",!0)}}async function ff(t,e,n){const s=tt.find(o=>o.id===t);return s?(s.itemNotes||(s.itemNotes={}),s.itemNotes[e]=(n||"").trim(),s.itemNotes[e]||delete s.itemNotes[e],await oe(),!0):!1}function Wl(t,e){var s;const n=tt.find(o=>o.id===t);return((s=n==null?void 0:n.itemNotes)==null?void 0:s[e])||""}async function mf(t,e,n){const s=tt.find(o=>o.id===t);return s?bi(s.name,e||ot(),s.time,s.notes,{items:s.items,itemNotes:s.itemNotes,templateOf:t}):(w("Show not found",!0),null)}async function gf(t,e){const n=tt.find(s=>s.id===t);return n?(n.viewerPeak=Math.max(0,parseInt(e)||0),await oe(),!0):!1}async function yf(t,e){const n=tt.find(s=>s.id===t);return n?(n.showExpenses=Math.max(0,parseFloat(e)||0),await oe(),!0):!1}function Gl(t){return tt.filter(e=>e.status==="ended"&&e.items.includes(t)).map(e=>{var n,s,o;return{show:e,wasSold:!!((n=e.soldItems)!=null&&n[t]),salePrice:((o=(s=e.soldItems)==null?void 0:s[t])==null?void 0:o.price)||0}}).sort((e,n)=>(n.show.endedAt||0)-(e.show.endedAt||0))}function vf(t){return tt.filter(e=>{var n;return e.status==="ended"&&e.items.includes(t)&&!((n=e.soldItems)!=null&&n[t])}).length}function hf(t){const e=tt.find(s=>s.id===t);if(!e)return"";const n=[];return n.push('<div class="wn-run-sheet">'),n.push(`<h2>${x(e.name)}</h2>`),n.push(`<p>${e.date}${e.time?" @ "+e.time:""} &middot; ${e.items.length} items</p>`),n.push("<table><thead><tr><th>#</th><th>Item</th><th>Condition</th><th>Price</th><th>Talking Points</th></tr></thead><tbody>"),e.items.forEach((s,o)=>{var r;const a=F(s);if(!a)return;const i=((r=e.itemNotes)==null?void 0:r[s])||"";n.push(`<tr><td>${o+1}</td><td>${x(a.name||"")}</td><td>${x(a.condition||"")}</td><td>${S(a.price||0)}</td><td>${x(i)}</td></tr>`)}),n.push("</tbody></table></div>"),n.join(`
`)}function bf(){return tt.find(t=>t.status==="live")||null}function he(t){const e=tt.filter(n=>n.status==="ended").sort((n,s)=>(s.endedAt||0)-(n.endedAt||0));return t?e.slice(0,t):e}function Yg(){const t=ot();return tt.filter(e=>e.date===t&&(e.status==="prep"||e.status==="live"))}function Es(t){var e;return(e=t==null?void 0:t.items)!=null&&e.length?(t.soldCount||0)/t.items.length:0}function wf(t){return(t==null?void 0:t.totalRevenue)||0}function wi(t){if(!t)return 0;const e=t.totalRevenue||0,n=t.soldItems?Object.keys(t.soldItems).length:0,s=e*.08+e*.029+n*.3,o=t.showExpenses||0;let a=0;if(t.soldItems)for(const i of Object.keys(t.soldItems)){const r=F(i);r&&(a+=r.cost||0)}return e-a-s-o}function xf(t){if(!(t!=null&&t.startedAt)||!(t!=null&&t.endedAt))return 0;const e=(t.endedAt-t.startedAt)/36e5;return e<=0?0:(t.totalRevenue||0)/e}function $f(t){return t!=null&&t.soldCount?(t.totalRevenue||0)/t.soldCount:0}function Vl(t){return!(t!=null&&t.startedAt)||!(t!=null&&t.endedAt)?0:Math.max(0,(t.endedAt-t.startedAt)/36e5)}function Yl(t){var e;return{sellThrough:Es(t),revenue:wf(t),profit:wi(t),revenuePerHour:xf(t),avgItemPrice:$f(t),duration:Vl(t),itemCount:((e=t==null?void 0:t.items)==null?void 0:e.length)||0,soldCount:(t==null?void 0:t.soldCount)||0,viewerPeak:(t==null?void 0:t.viewerPeak)||0}}function Sf(){const t=he(),e=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],n=Array.from({length:7},()=>({total:0,count:0}));for(const s of t){if(!s.date)continue;const o=new Date(s.date+"T12:00:00").getDay();n[o].total+=Es(s),n[o].count++}return n.map((s,o)=>({day:o,dayName:e[o],avgSellThrough:s.count?s.total/s.count:0,showCount:s.count})).sort((s,o)=>o.avgSellThrough-s.avgSellThrough)}function kf(){const t=he(),e={morning:{label:"Morning (6am-12pm)",total:0,count:0,rev:0},afternoon:{label:"Afternoon (12-5pm)",total:0,count:0,rev:0},evening:{label:"Evening (5-9pm)",total:0,count:0,rev:0},night:{label:"Night (9pm+)",total:0,count:0,rev:0}};for(const n of t){if(!n.time)continue;const s=parseInt(n.time.split(":")[0])||0,o=s<12?"morning":s<17?"afternoon":s<21?"evening":"night";e[o].total+=Es(n),e[o].rev+=n.totalRevenue||0,e[o].count++}return Object.entries(e).map(([n,s])=>({slot:n,label:s.label,avgSellThrough:s.count?s.total/s.count:0,avgRevenue:s.count?s.rev/s.count:0,showCount:s.count})).sort((n,s)=>s.avgSellThrough-n.avgSellThrough)}function xi(){var n;const t=he(),e={};for(const s of t)for(const o of s.items){const a=F(o);if(!a)continue;const i=a.category||"Uncategorized";e[i]||(e[i]={shown:0,sold:0,revenue:0}),e[i].shown++,(n=s.soldItems)!=null&&n[o]&&(e[i].sold++,e[i].revenue+=s.soldItems[o].price||0)}return Object.entries(e).map(([s,o])=>({category:s,shown:o.shown,sold:o.sold,sellThrough:o.shown?o.sold/o.shown:0,totalRevenue:o.revenue})).sort((s,o)=>o.sellThrough-s.sellThrough)}function Ef(t=10){return he(t).reverse().map(n=>{var s;return{name:n.name,date:n.date,sellThrough:Es(n),revenue:n.totalRevenue||0,profit:wi(n),soldCount:n.soldCount||0,itemCount:((s=n.items)==null?void 0:s.length)||0}})}function If(t=10){var s;const e=he(),n={};for(const o of e)for(const a of o.items)n[a]||(n[a]={shown:0,sold:0,revenue:0}),n[a].shown++,(s=o.soldItems)!=null&&s[a]&&(n[a].sold++,n[a].revenue+=o.soldItems[a].price||0);return Object.entries(n).filter(([,o])=>o.shown>=1).map(([o,a])=>({item:F(o),itemId:o,shown:a.shown,sold:a.sold,sellRate:a.shown?a.sold/a.shown:0,totalRevenue:a.revenue})).filter(o=>o.item).sort((o,a)=>a.sellRate-o.sellRate||a.sold-o.sold).slice(0,t)}function _f(t=2,e=10){var o;const n=he(),s={};for(const a of n)for(const i of a.items)s[i]||(s[i]={shown:0,sold:0}),s[i].shown++,(o=a.soldItems)!=null&&o[i]&&s[i].sold++;return Object.entries(s).filter(([,a])=>a.shown>=t&&a.sold===0).map(([a,i])=>({item:F(a),itemId:a,shown:i.shown})).filter(a=>a.item&&(a.item.qty||0)>0).sort((a,i)=>i.shown-a.shown).slice(0,e)}function Cf(){var i;const t=he();if(!t.length)return null;let e=0,n=0,s=0,o=0,a=0;for(const r of t)e+=r.totalRevenue||0,n+=wi(r),s+=r.soldCount||0,o+=((i=r.items)==null?void 0:i.length)||0,a+=Vl(r);return{showCount:t.length,totalRevenue:e,totalProfit:n,totalSold:s,totalItems:o,avgSellThrough:o?s/o:0,avgRevenuePerShow:e/t.length,avgProfitPerShow:n/t.length,totalHours:a,revenuePerHour:a?e/a:0}}function Kl(t=20){var a;const e=Date.now(),n=864e5;he();const s=[],o={};for(const i of xi())o[i.category]=i.sellThrough;for(const i of k){if((i.qty||0)<=0)continue;let r=0;const l=[],c=(i.price||0)-(i.cost||0);c>0&&(r+=Math.min(c/50,3),c>20&&l.push("High margin"));const d=Gl(i.id);d.length===0&&(r+=2,l.push("Never shown"));const u=d.filter(f=>f.wasSold);u.length>0&&(r+=u.length*1.5,l.push(`Sold in ${u.length} show${u.length>1?"s":""}`)),(o[i.category]||0)>.5&&(r+=2,l.push("Hot category")),(i.added?(e-new Date(i.added).getTime())/n:0)>30&&!((a=i.platformStatus)!=null&&a.Whatnot)&&(r+=1.5,l.push("Stale — needs exposure"));const v=i.platformListingDates||{};for(const[f,E]of Object.entries(v)){if(f==="Whatnot")continue;if((e-new Date(E).getTime())/n>50){r+=1,l.push(`${f} listing aging`);break}}ef().some(f=>(f.status==="prep"||f.status==="live")&&f.items.includes(i.id))&&(r-=5);const m=vf(i.id);m>=3&&(r-=2,l.push(`Unsold in ${m} shows`)),r>0&&l.length>0&&s.push({item:i,reason:l[0],reasons:l,score:r})}return s.sort((i,r)=>r.score-i.score).slice(0,t)}function Jl(){var a;const t=he();if(t.length<2)return{recommended:15,min:10,max:25,avgSellThrough:0};const e={};for(const i of t){const r=((a=i.items)==null?void 0:a.length)||0,l=Math.round(r/5)*5||5;e[l]||(e[l]={total:0,count:0}),e[l].total+=Es(i),e[l].count++}let n=15,s=0;for(const[i,r]of Object.entries(e)){const l=r.total/r.count;l>s&&(s=l,n=parseInt(i))}const o=t.reduce((i,r)=>{var l;return i+(((l=r.items)==null?void 0:l.length)||0)},0)/t.length;return{recommended:n||Math.round(o),min:Math.max(5,n-5),max:n+10,avgSellThrough:s}}function Bf(){const t=xi();if(!t.length)return[];const e=t.reduce((n,s)=>n+s.sellThrough*s.shown,0);return e?t.slice(0,8).map(n=>({category:n.category,percentage:n.sellThrough*n.shown/e,sellThrough:n.sellThrough,shown:n.shown,sold:n.sold})):t.slice(0,5).map(n=>({...n,percentage:1/t.length}))}function Is(t,e){if(!t)return;const{page:n,totalItems:s,pageSize:o,onPage:a,pageSizes:i,onPageSize:r}=e,l=Math.max(1,Math.ceil(s/o));if(s<=o){t.innerHTML="";return}const c=Math.max(0,Math.min(n,l-1)),d=c*o+1,u=Math.min((c+1)*o,s),p=document.createElement("div");p.className="ft-pagination",p.style.cssText="display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 0;font-size:12px;color:var(--muted)";const y=(h,m,f)=>{const E=document.createElement("button");return E.className="btn-secondary pg-btn",E.style.cssText='padding:5px 12px;font-size:11px;font-family:"DM Mono",monospace',E.textContent=h,E.disabled=f,f&&(E.style.opacity="0.3"),f||E.addEventListener("click",()=>a(m)),E};p.appendChild(y("«",0,c===0)),p.appendChild(y("‹ Prev",c-1,c===0));const v=document.createElement("span");if(v.style.cssText="font-family:'Syne',sans-serif;font-weight:600;padding:0 4px",v.textContent=`${d}–${u} of ${s}`,p.appendChild(v),p.appendChild(y("Next ›",c+1,c>=l-1)),p.appendChild(y("»",l-1,c>=l-1)),i&&i.length>1&&r){const h=document.createElement("select");h.style.cssText="background:var(--surface);border:1px solid var(--border);color:var(--muted);padding:4px 8px;font-family:'DM Mono',monospace;font-size:11px;margin-left:8px",i.forEach(m=>{const f=document.createElement("option");f.value=m,f.textContent=`${m}/page`,m===o&&(f.selected=!0),h.appendChild(f)}),h.addEventListener("change",()=>r(parseInt(h.value))),p.appendChild(h)}t.innerHTML="",t.appendChild(p)}let ts=null,It="all",ee="all",xn="all",tn="all",Tn="all",ut=0,Yn=50,pr=null,Hs={key:null,items:null};function _e(t){return t.added?Math.floor((Date.now()-new Date(t.added).getTime())/864e5):0}function Ql(){const t=document.getElementById("activeFiltersBadge"),e=document.getElementById("filterToggleBtn");if(!t)return;const n=Bt.size+xt.size+(It!=="all"?1:0)+(ee!=="all"?1:0)+(tn!=="all"?1:0)+(Tn!=="all"?1:0);n?(t.textContent=n+" active",t.style.display="inline",e.classList.add("active")):(t.style.display="none",e.classList.remove("active"))}function Kg(){const t=document.getElementById("filterPanel");t&&t.classList.toggle("open")}function Xl(){const t=document.getElementById("filterPanel");t&&t.classList.add("open")}function Tf(t){var v,h;const e=k.length+":"+(((v=k[0])==null?void 0:v.id)||"")+":"+(((h=k[k.length-1])==null?void 0:h.id)||"");if(!t&&pr===e){Pf();return}pr=e;const n=new Set(k.flatMap(m=>Z(m)).filter(Boolean));let s=`<span class="filter-chip ${Bt.size===0?"active":""}" role="button" tabindex="0" onclick="setPlatFilt('all',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">All</span>`;br.forEach(m=>{s+=`<span class="plat-group-divider">${m.label}</span>`,m.items.forEach(f=>{const E=n.has(f)?'<span class="plat-dot"></span>':"";s+=`<span class="filter-chip plat-chip ${Bt.has(f)?"active":""}" role="button" tabindex="0" onclick="setPlatFilt('${f}',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${E}${f}</span>`})}),document.getElementById("platChips").innerHTML=s;const o=new Map;k.forEach(m=>{const f=(m.category||"").trim();if(f){const E=f.toLowerCase();o.has(E)||o.set(E,f)}});const a=["all",...[...o.values()].sort()],i=document.getElementById("catChips");i.innerHTML=a.map(m=>{const f=x(m).replace(/'/g,"&#39;");return`<span class="filter-chip cat-chip ${(m==="all"?xt.size===0:[...xt].some($=>$.toLowerCase()===m.toLowerCase()))?"active":""}" role="button" tabindex="0" data-cat="${x(m)}" onclick="setCatFilt('${f}',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${m==="all"?"All Categories":x(m)}</span>`}).join(""),document.getElementById("catToolbar").style.display=a.length>1?"flex":"none";const r=document.getElementById("subcatToolbar"),l=xt.size===1?[...xt][0]:null;let c=null;if(l&&(c=Zt[l]||null,!c)){const m=l.toLowerCase(),f=Object.keys(Zt).find(E=>E.toLowerCase()===m);f&&(c=Zt[f])}if(c){const m=l.toLowerCase(),f=[...new Set(k.filter($=>($.category||"").toLowerCase()===m).map($=>$.subcategory||"").filter(Boolean))],E=[...new Set([...c,...f])];document.getElementById("subcatChips").innerHTML=["all",...E].map($=>{const I=x($).replace(/'/g,"&#39;");return`<span class="filter-chip subcat-chip ${It===$?"active":""}" role="button" tabindex="0" data-subcat="${x($)}" onclick="setSubcatFilt('${I}',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${$==="all"?"All":x($)}</span>`}).join(""),r.style.display="flex"}else r.style.display="none",It="all";const d=Ba[It],u=document.getElementById("subsubcatToolbar");if(d&&d.length&&It!=="all"){const m=[...new Set(k.filter(E=>E.subcategory===It).map(E=>E.subtype||"").filter(Boolean))],f=[...new Set([...d,...m])];document.getElementById("subsubcatLabel").textContent=["Men","Women","Children"].includes(It)?"↳↳ Clothing Type":`↳↳ ${It}`,document.getElementById("subsubcatChips").innerHTML=["all",...f].map(E=>{const $=ge(E);return`<span class="filter-chip subsubcat-chip ${ee===E?"active":""}" role="button" tabindex="0" onclick="setSubsubcatFilt('${$}',this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">${E==="all"?"All":x(E)}</span>`}).join(""),u.style.display="flex"}else u.style.display="none",ee="all";const p=document.getElementById("smokeToolbar");if(p){const m=["all","smoke-free","smoke-exposure","unset"],f={all:"All","smoke-free":"🟢 Smoke-Free","smoke-exposure":"🔴 Smoke Exp.",unset:"⚪ Unset"};document.getElementById("smokeChips").innerHTML=m.map(E=>`<span class="filter-chip ${tn===E?"active":""}" role="button" tabindex="0" onclick="setSmokeFilt('${E}')">${f[E]}</span>`).join(""),p.style.display="flex"}const y=document.getElementById("conditionToolbar");if(y){const m=[...new Set(k.map(f=>f.condition||"").filter(Boolean))].sort();m.length?(document.getElementById("conditionChips").innerHTML=["all",...m].map(f=>`<span class="filter-chip ${Tn===f?"active":""}" role="button" tabindex="0" onclick="setConditionFilt('${f==="all"?"all":ge(f)}')">${f==="all"?"All Conditions":x(f)}</span>`).join(""),y.style.display="flex"):y.style.display="none"}Ql()}function Pf(){document.querySelectorAll("#platChips .filter-chip").forEach(t=>{const e=t.textContent.trim();t.classList.toggle("active",e==="All"?Bt.size===0:Bt.has(e))}),document.querySelectorAll("#catChips .filter-chip").forEach(t=>{const e=t.textContent.trim();t.classList.toggle("active",e==="All Categories"?xt.size===0:[...xt].some(n=>n.toLowerCase()===e.toLowerCase()))}),document.querySelectorAll("#subcatChips .filter-chip").forEach(t=>{const e=t.textContent.trim();t.classList.toggle("active",e==="All"?It==="all":It===e)}),document.querySelectorAll("#subsubcatChips .filter-chip").forEach(t=>{const e=t.textContent.trim();t.classList.toggle("active",e==="All"?ee==="all":ee===e)}),Ql()}function Jg(t,e){ut=0,t==="all"?Bt.clear():Bt.has(t)?Bt.delete(t):Bt.add(t),it()}function uo(t,e){ut=0,t==="all"?xt.clear():xt.has(t)?xt.delete(t):xt.add(t),It="all",ee="all",it()}function Zl(t,e){ut=0,It=t,ee="all",document.querySelectorAll("#subcatChips .subcat-chip").forEach(n=>n.classList.remove("active")),e&&e.classList.add("active"),it()}function tc(t){ut=0,xn=t||"all",it()}function Qg(){xn="all",it()}function Xg(t){ut=0,tn=t||"all",it()}function Zg(t){ut=0,Tn=t||"all",it()}function ec(t,e){ut=0,ee=t,document.querySelectorAll("#subsubcatChips .subsubcat-chip").forEach(n=>n.classList.remove("active")),e&&e.classList.add("active"),it()}function ty(t){document.getElementById("sortSel").value=t,it()}function Mf(t){const e=document.getElementById("sortSel").value;return[...t].sort((n,s)=>e==="added-desc"?new Date(s.added)-new Date(n.added):e==="added-asc"?new Date(n.added)-new Date(s.added):e==="name-asc"?n.name.localeCompare(s.name):e==="margin-desc"?qt(s).m-qt(n).m:e==="qty-asc"?(n.qty||0)-(s.qty||0):e==="price-desc"?(s.price||0)-(n.price||0):e==="cost"?(n.cost||0)-(s.cost||0):e==="platform"?(Z(n)[0]||"").localeCompare(Z(s)[0]||""):e==="days-desc"?_e(s)-_e(n):e==="days-asc"?_e(n)-_e(s):e==="profit-desc"?qt(s).pu-qt(n).pu:e==="profit-asc"?qt(n).pu-qt(s).pu:0)}function it(){var y,v,h,m;Tf();const t=(document.getElementById("invSearch").value||"").toLowerCase();t&&ut!==0&&(ut=0);const e=`${k.length}:${t}:${[...Bt].join(",")}:${[...xt].join(",")}:${It}:${ee}:${xn}:${tn}:${Tn}:${((y=k[0])==null?void 0:y.id)||""}:${((v=k[k.length-1])==null?void 0:v.id)||""}`;let n;Hs.key===e&&Hs.items?n=Hs.items:(n=k.filter(f=>{const E=!t||f.name.toLowerCase().includes(t)||(f.sku||"").toLowerCase().includes(t)||(f.category||"").toLowerCase().includes(t)||(f.subcategory||"").toLowerCase().includes(t)||(f.subtype||"").toLowerCase().includes(t)||(f.upc||"").toLowerCase().includes(t),$=Bt.size===0||Z(f).some(_=>Bt.has(_)),I=(f.category||"").toLowerCase(),M=xt.size===0||[...xt].some(_=>_.toLowerCase()===I),N=It==="all"||(f.subcategory||"")===It,W=ee==="all"||(f.subtype||"")===ee,L=xn==="all"||xn==="low"&&f.bulk&&(f.qty===0||f.qty<=(f.lowAlert||2)),q=tn==="all"||(tn==="unset"?!f.smoke:f.smoke===tn),D=Tn==="all"||(f.condition||"")===Tn;return E&&$&&M&&N&&W&&L&&q&&D}),Hs={key:e,items:n});const s=document.getElementById("stockFilterBanner");if(xn!=="all"){const f=k.filter($=>$.bulk&&$.qty>0&&$.qty<=($.lowAlert||2)).length,E=k.filter($=>$.bulk&&$.qty===0).length;document.getElementById("stockFilterLabel").textContent=`Showing low stock (${f}) and out of stock (${E}) items only`,s.style.display="flex"}else s.style.display="none";const o=document.getElementById("invLimitBanner");o&&((((m=(h=window.__gateUtils)==null?void 0:h.getUserTier)==null?void 0:m.call(h))||"free")==="free"&&k.length>=50?o.style.display="flex":o.style.display="none"),n=Mf(n),document.getElementById("invCnt").textContent=`${n.length} of ${k.length} items`;const a=document.getElementById("invBody"),i=document.getElementById("invEmpty"),r=document.getElementById("invFilterEmpty");if(!n.length){a.innerHTML="";const f=k.length>0;i&&(i.style.display=f?"none":"block"),r&&(r.style.display=f?"block":"none"),fo();return}i&&(i.style.display="none"),r&&(r.style.display="none");const l=n.length,c=Math.max(1,Math.ceil(l/Yn));ut>=c&&(ut=c-1),ut<0&&(ut=0);const d=n.slice(ut*Yn,(ut+1)*Yn);let u=1;for(let f=0;f<k.length;f++){const E=k[f].qty||0;E>u&&(u=E)}a.innerHTML=d.map(f=>{const{cost:E,price:$,m:I}=qt(f),M=rl(f.qty,f.lowAlert,f.bulk),N=Math.min(100,(f.qty||0)/u*100),W=K.has(f.id),L=ge(f.id);return`<tr data-id="${L}" class="${W?"sel":""}">
      <td class="cb-col"><input type="checkbox" ${W?"checked":""} onchange="toggleSel('${L}',this)"></td>
      <td><span class="drag-handle" draggable="true" ondragstart="dStart(event,'${L}')" ondragover="dOver(event)" ondrop="dDrop(event,'${L}')">⠿</span></td>
      <td>${Vt(f)[0]?`<img class="item-thumb" loading="lazy" src="${Vt(f)[0]}" alt="${x(f.name)}" onclick="openLightbox('${L}')">`:`<div class="item-thumb-placeholder" title="Add photo" onclick="openDrawer('${L}')">＋</div>`}</td>
      <td>
        <div class="item-name" onclick="openDrawer('${L}')">${x(f.name)}</div>
        <div class="item-meta"><span class="item-sku">${x(f.sku||"—")}</span>${f.upc?`<span class="upc-tag">${x(f.upc)}</span>`:""}${f.category?`<span class="cat-tag">${x(f.category)}</span>`:""} ${f.subcategory?`<span class="cat-tag" style="background:rgba(87,200,255,0.1);color:var(--accent)">${x(f.subcategory)}</span>`:""} ${f.subtype?`<span class="cat-tag" style="background:rgba(123,97,255,0.15);color:var(--accent3)">${x(f.subtype)}</span>`:""} ${f.condition?`<span class="cat-tag" style="background:rgba(87,255,154,0.08);color:var(--good)">${x(f.condition)}</span>`:""} ${f.source?`<span class="cat-tag" style="background:rgba(255,107,53,0.1);color:var(--accent2)">📍${x(f.source)}</span>`:""}${f.author?`<span class="book-meta-tag">✍ ${x(f.author)}</span>`:""}${f.edition?`<span class="book-meta-tag">${x(f.edition)} ed.</span>`:""}${f.signed?'<span class="book-meta-tag" style="background:rgba(255,215,0,0.15);color:#d4a017;border-color:rgba(255,215,0,0.3)">✒ Signed</span>':""}</div>
      </td>
      <td>${gd(f)}</td>
      <td>
        <div class="stock-cell">
          <div class="stepper">
            <button class="stepper-btn" aria-label="Decrease quantity" onclick="adjStock('${L}',-1)">−</button>
            <span class="stepper-val sv-${M}" title="${M==="low"?"Low stock":M==="warn"?"Warning":"In stock"}">${f.qty||0}${M==="low"?" ⚠":M==="warn"?" ⚡":""}</span>
            <button class="stepper-btn" aria-label="Increase quantity" onclick="adjStock('${L}',+1)">+</button>
          </div>
          <div class="mini-bar"><div class="mb-fill mf-${M}" style="width:${N}%"></div></div>
        </div>
      </td>
      <td style="color:var(--muted)">${S(E)}</td>
      <td><span class="price-disp" title="Click to edit inline" onclick="startPriceEdit(this,'${L}')">${S($)}</span></td>
      <td><span class="margin-badge ${wn(I)}">${Y(I)}</span></td>
      <td class="days-col"><span class="days-badge${_e(f)>=60?" stale":_e(f)>=30?" aging":""}" title="Listed ${_e(f)} days">${_e(f)}d</span></td>
      <td class="photos-col">${(()=>{const D=Vt(f).length;return D?`<span class="photo-count-badge" title="${D} photo${D>1?"s":""}">${D} 📷</span>`:'<span class="photo-count-badge empty" title="No photos">0</span>'})()}</td>
      <td><div class="td-acts">
        ${f.qty>0?`<button class="act-btn" onclick="openSoldModal('${L}')">Sold ›</button>`:'<span class="out-badge">Out</span>'}
        <button class="act-btn" onclick="openDrawer('${L}')">Edit</button>
        <button class="act-btn red" onclick="delItem('${L}')">✕</button>
      </div></td>
    </tr>`}).join(""),fo();const p=document.getElementById("invPagination");p&&Is(p,{page:ut,totalItems:l,pageSize:Yn,onPage:f=>{ut=f,it()},pageSizes:[50,100,250],onPageSize:f=>{Yn=f,ut=0,it()}})}function ey(t,e){const n=k.find(i=>i.id===e);if(!n)return;const s=document.createElement("input");s.className="price-inp",s.type="number",s.step="0.01",s.value=n.price||0,t.replaceWith(s),s.focus(),s.select();let o=!1;const a=()=>{if(o)return;o=!0;const i=parseFloat(s.value);if(!isNaN(i)&&i>=0){const r=n.price||0;n.price=i,j("inv",n.id),s.style.background="var(--good)",s.style.color="#fff",s.style.transition="background 0.2s",O(),V(),setTimeout(()=>it(),200),w("Price updated ✓"),i!==r&&i>0&&(Ra(n.id,i,"manual"),n.ebayItemId&&ft()&&Vd(n.id).then(l=>{l.success&&w("eBay price synced ✓")}).catch(l=>console.warn("[eBay] Price push:",l.message)))}else it()};s.addEventListener("blur",a),s.addEventListener("keydown",i=>{i.key==="Enter"&&(i.preventDefault(),s.blur()),i.key==="Escape"&&(s.removeEventListener("blur",a),it())})}const Df=Xc(()=>{O(),V()},300);function ny(t,e){const n=k.find(s=>s.id===t);n&&(n.qty=Math.max(0,(n.qty||0)+e),j("inv",n.id),Df(),it(),n.bulk&&n.qty===0?w("⚠ Out of stock!",!0):n.bulk&&n.qty<=(n.lowAlert||2)&&w(`⚠ Low: ${n.qty} left`,!0))}function sy(t,e){ts=k.findIndex(n=>n.id===e),t.dataTransfer.effectAllowed="move"}function oy(t){var e;t.preventDefault(),t.dataTransfer.dropEffect="move",document.querySelectorAll("#invBody tr").forEach(n=>n.classList.remove("drag-over")),(e=t.currentTarget.closest("tr"))==null||e.classList.add("drag-over")}function ay(t,e){if(t.preventDefault(),document.querySelectorAll("#invBody tr").forEach(o=>o.classList.remove("drag-over")),ts===null)return;const n=k.findIndex(o=>o.id===e);if(ts===n)return;const[s]=k.splice(ts,1);k.splice(n,0,s),ts=null,O(),it()}function iy(t,e){e.checked?K.add(t):K.delete(t),e.closest("tr").classList.toggle("sel",e.checked),fo();const n=document.querySelectorAll("#invBody input[type=checkbox]"),s=document.getElementById("selAll");s&&(s.checked=n.length&&[...n].every(o=>o.checked))}function ry(t){document.querySelectorAll("#invBody tr[data-id]").forEach(e=>{const n=e.dataset.id,s=e.querySelector("input[type=checkbox]");t.checked?(K.add(n),s.checked=!0,e.classList.add("sel")):(K.delete(n),s.checked=!1,e.classList.remove("sel"))}),fo()}function ly(){K.clear();const t=document.getElementById("selAll");t&&(t.checked=!1),it()}function fo(){const t=document.getElementById("bulkBar");t&&t.classList.toggle("on",K.size>0);const e=document.getElementById("bulkCnt");e&&(e.textContent=K.size+" selected")}async function cy(){if(!K.size||!confirm(`Delete ${K.size} item(s)?`))return;const t=[...K];t.forEach(e=>ai(e)),K.clear(),O(),V(),w(t.length+" item(s) deleted — check 🗑️ to restore"),await $s("ft_inventory",t),Ss()}function dy(){if(!K.size)return;const t=[...K].filter(n=>{const s=F(n);return s&&s.qty>0});if(!t.length){w("No sellable items selected",!0);return}if(!confirm(`Record sale for ${t.length} item(s) at list price?`))return;const e=ot();for(const n of t){const s=F(n),o=se();B.push({id:o,itemId:n,price:s.price,listPrice:s.price||0,qty:1,fees:s.fees||0,ship:s.ship||0,date:e}),j("sales",o),s.qty=Math.max(0,(s.qty||0)-1),j("inv",n)}K.clear(),O(),V(),w(`${t.length} sale(s) recorded ✓`)}let Ke=null;function py(){const t=document.getElementById("bulkMenu");t&&(Ke&&(document.removeEventListener("click",Ke),Ke=null),t.classList.toggle("open"),t.classList.contains("open")&&(Ke=e=>{!t.contains(e.target)&&e.target.id!=="bulkMoreBtn"&&(t.classList.remove("open"),document.removeEventListener("click",Ke),Ke=null)},setTimeout(()=>document.addEventListener("click",Ke),0)))}function uy(){var e;if(!K.size)return;(e=document.getElementById("bulkMenu"))==null||e.classList.remove("open");const t=document.getElementById("bulkPriceOv");t&&(document.getElementById("bulkPriceType").value="percent",document.getElementById("bulkPriceVal").value="",document.getElementById("bulkPriceDir").value="decrease",document.getElementById("bulkPricePreview").textContent=`${K.size} item(s) will be adjusted`,t.classList.add("on"))}function Lf(){var t;(t=document.getElementById("bulkPriceOv"))==null||t.classList.remove("on")}function fy(){const t=document.getElementById("bulkPriceType").value,e=document.getElementById("bulkPriceDir").value,n=parseFloat(document.getElementById("bulkPriceVal").value);if(isNaN(n)||n<=0){w("Enter a valid amount",!0);return}const s=e==="decrease"?-Math.abs(n):Math.abs(n);let o=0;for(const a of K){const i=F(a);if(!i)continue;let r=i.price||0;r=t==="percent"?r*(1+s/100):r+s,r=Math.max(.01,Math.round(r*100)/100),r!==(i.price||0)&&o++}document.getElementById("bulkPricePreview").textContent=`${o} of ${K.size} item(s) will change price`}function my(){const t=document.getElementById("bulkPriceType").value,e=document.getElementById("bulkPriceDir").value,n=parseFloat(document.getElementById("bulkPriceVal").value);if(isNaN(n)||n<=0){w("Enter a valid amount",!0);return}const s=e==="decrease"?-Math.abs(n):Math.abs(n);let o=0;for(const a of K){const i=F(a);if(!i)continue;let r=i.price||0;r=t==="percent"?r*(1+s/100):r+s,r=Math.max(.01,Math.round(r*100)/100),r!==(i.price||0)&&(i.price=r,j("inv",i.id),o++)}o&&(O(),V()),Lf(),w(o?`${o} price(s) updated ✓`:"No changes needed"),it()}function gy(){var e;if(!K.size)return;(e=document.getElementById("bulkMenu"))==null||e.classList.remove("open");const t=document.getElementById("bulkCatOv");if(t){const n=new Set(k.map(o=>o.category).filter(Boolean));try{document.querySelectorAll("#catChips .cat-chip").forEach(o=>{const a=o.textContent.trim();a!=="All Categories"&&n.add(a)})}catch{}const s=document.getElementById("bulkCatSelect");s.innerHTML='<option value="">— Pick a category —</option>'+[...n].sort().map(o=>`<option value="${x(o)}">${x(o)}</option>`).join(""),document.getElementById("bulkCatCount").textContent=`${K.size} item(s)`,t.classList.add("on")}}function Af(){var t;(t=document.getElementById("bulkCatOv"))==null||t.classList.remove("on")}function yy(){const t=document.getElementById("bulkCatSelect").value;if(!t){w("Pick a category",!0);return}let e=0;for(const n of K){const s=F(n);s&&s.category!==t&&(s.category=t,j("inv",s.id),e++)}e&&(O(),V()),Af(),w(e?`${e} item(s) → ${t} ✓`:"No changes"),it()}function vy(){var e;if(!K.size)return;(e=document.getElementById("bulkMenu"))==null||e.classList.remove("open");const t=document.getElementById("bulkPlatOv");t&&(document.getElementById("bulkPlatAction").value="add",document.getElementById("bulkPlatCount").textContent=`${K.size} item(s)`,t.classList.add("on"))}function zf(){var t;(t=document.getElementById("bulkPlatOv"))==null||t.classList.remove("on")}function hy(){const t=document.getElementById("bulkPlatAction").value,e=document.getElementById("bulkPlatSelect").value;if(!e){w("Pick a platform",!0);return}let n=0;for(const s of K){const o=F(s);if(!o)continue;let a=Array.isArray(o.platforms)?[...o.platforms]:o.platform?[o.platform]:[];if(t==="add")a.includes(e)||(a.push(e),n++);else{const i=a.indexOf(e);i>=0&&(a.splice(i,1),n++)}a=Da(a,t==="add"?e:void 0),o.platforms=a,a.length===1?o.platform=a[0]:a.length===0&&(o.platform="",o.platforms=[]),j("inv",o.id)}n&&(O(),V()),zf(),w(n?`${n} item(s) ${t==="add"?"→":"✕"} ${e} ✓`:"No changes"),it()}function by(){var a;if(!K.size)return;(a=document.getElementById("bulkMenu"))==null||a.classList.remove("open");const e=[["Name","SKU","UPC","Category","Subcategory","Platform(s)","Cost","Price","Qty","Condition","Source","Date Added","Days Listed"].join(",")];for(const i of K){const r=F(i);if(!r)continue;const l=Z(r).join("; "),c=[`"${(r.name||"").replace(/"/g,'""')}"`,`"${(r.sku||"").replace(/"/g,'""')}"`,`"${(r.upc||"").replace(/"/g,'""')}"`,`"${(r.category||"").replace(/"/g,'""')}"`,`"${(r.subcategory||"").replace(/"/g,'""')}"`,`"${l.replace(/"/g,'""')}"`,(r.cost||0).toFixed(2),(r.price||0).toFixed(2),r.qty||0,`"${(r.condition||"").replace(/"/g,'""')}"`,`"${(r.source||"").replace(/"/g,'""')}"`,`"${r.added||""}"`,_e(r)];e.push(c.join(","))}const n=new Blob([e.join(`
`)],{type:"text/csv;charset=utf-8;"}),s=URL.createObjectURL(n),o=document.createElement("a");o.href=s,o.download=`fliptrack-export-${ot()}.csv`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(s),w(`Exported ${K.size} item(s) to CSV ✓`)}let zt=[],nc="",va="spent",$n=0;const ea=50;let ha=null;const ur=[{name:"New",minSpent:0,color:"var(--muted)",icon:"👤"},{name:"Regular",minSpent:50,color:"var(--accent)",icon:"⭐"},{name:"VIP",minSpent:200,color:"var(--accent2)",icon:"💎"},{name:"Elite",minSpent:500,color:"var(--good)",icon:"👑"}];function Rf(t){const e=B.filter(s=>s.buyerId===t).reduce((s,o)=>s+(o.price||0),0);let n=ur[0];for(const s of ur)e>=s.minSpent&&(n=s);return{...n,spent:e}}async function wy(){const t=await gt("buyers");try{zt=t?JSON.parse(t):[]}catch(e){console.warn("FlipTrack: corrupt buyers data:",e.message),zt=[]}}function Co(){et("buyers",JSON.stringify(zt)).catch(t=>console.warn("FlipTrack: buyers save failed:",t.message))}function sc(t){return zt.find(e=>e.id===t)}function xy(){const t=document.getElementById("buyer_name"),e=document.getElementById("buyer_email"),n=document.getElementById("buyer_phone"),s=document.getElementById("buyer_ebay"),o=document.getElementById("buyer_posh"),a=document.getElementById("buyer_merc"),i=document.getElementById("buyer_notes"),r=(t.value||"").trim();if(!r){w("Name required",!0);return}const l={id:se(),name:r,handles:{eBay:(s.value||"").trim(),Poshmark:(o.value||"").trim(),Mercari:(a.value||"").trim()},email:(e.value||"").trim(),phone:(n.value||"").trim(),notes:(i.value||"").trim(),createdAt:Date.now()};zt.push(l),Co(),w(`${x(r)} added`),t.value="",e.value="",n.value="",s.value="",o.value="",a.value="",i.value="",dn()}function $y(t){const e=sc(t);if(!e||!confirm(`Delete ${x(e.name)}?`))return;const n=zt.indexOf(e);zt.splice(n,1),Co(),w(`${x(e.name)} deleted`),dn()}function Sy(t){ha=ha===t?null:t,dn()}function ky(t){nc=(t||"").toLowerCase(),$n=0,dn()}function Ey(t){va=t,$n=0,dn()}function Iy(t,e){if(!t)return null;const n=t.toLowerCase().trim();let s=zt.find(o=>o.name.toLowerCase()===n||Object.values(o.handles||{}).some(a=>a&&a.toLowerCase()===n));return s||(s={id:se(),name:t.trim(),handles:{[e]:t.trim()},email:"",phone:"",notes:"",createdAt:Date.now()},zt.push(s),Co()),s}function _y(t,e){const n=B.find(s=>s.id===e);n&&(n.buyerId=t,O(),w("Sale linked to buyer"))}function Cy(t){const e=document.getElementById("comm_type_"+t),n=document.getElementById("comm_content_"+t),s=(e==null?void 0:e.value)||"note",o=((n==null?void 0:n.value)||"").trim();if(!o){w("Enter a message",!0);return}const a=sc(t);a&&(a.comms||(a.comms=[]),a.comms.push({type:s,content:o,date:Date.now()}),Co(),n&&(n.value=""),w("Note added"),dn())}function dn(){const t=document.getElementById("buyersContent");if(!t)return;const e=zt.length,n=zt.filter(c=>B.filter(u=>u.buyerId===c.id).length>1).length,s=zt.reduce((c,d)=>{const u=B.filter(p=>p.buyerId===d.id).reduce((p,y)=>p+(y.price||0),0);return c+u},0),o=B.length?s/B.length:0,a=zt.filter(c=>{const d=nc;return d?c.name.toLowerCase().includes(d)||c.email.toLowerCase().includes(d)||c.phone.includes(d)||c.handles&&Object.values(c.handles).some(u=>u.toLowerCase().includes(d)):!0});a.sort((c,d)=>{if(va==="name")return c.name.localeCompare(d.name);if(va==="recent")return d.createdAt-c.createdAt;const u=B.filter(y=>y.buyerId===c.id).reduce((y,v)=>y+(v.price||0),0);return B.filter(y=>y.buyerId===d.id).reduce((y,v)=>y+(v.price||0),0)-u});const i=a.slice($n*ea,($n+1)*ea);let r=`
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Buyer CRM</div>
      </div>

      <!-- Stats Strip -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;padding:12px;background:var(--surface2);border-bottom:1px solid var(--border)">
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Total Buyers</div>
          <div style="font-size:24px;font-weight:700;color:var(--accent);margin-top:4px">${e}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Repeat</div>
          <div style="font-size:24px;font-weight:700;color:var(--accent2);margin-top:4px">${n}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Total Spent</div>
          <div style="font-size:18px;font-weight:700;color:var(--good);margin-top:4px">${S(s)}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Avg Order</div>
          <div style="font-size:18px;font-weight:700;color:var(--accent3);margin-top:4px">${S(o)}</div>
        </div>
      </div>

      <!-- Add Buyer Form -->
      <div style="padding:12px;background:var(--surface);border-bottom:1px solid var(--border)">
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:8px">Add Buyer</div>
        <div class="form-grid">
          <input id="buyer_name" placeholder="Full Name" class="fgrp" style="grid-column:1/-1">
          <input id="buyer_email" type="email" placeholder="Email" class="fgrp">
          <input id="buyer_phone" placeholder="Phone" class="fgrp">
          <input id="buyer_ebay" placeholder="eBay Handle" class="fgrp" style="grid-column:1/-1">
          <input id="buyer_posh" placeholder="Poshmark Handle" class="fgrp" style="grid-column:1/-1">
          <input id="buyer_merc" placeholder="Mercari Handle" class="fgrp" style="grid-column:1/-1">
          <textarea id="buyer_notes" placeholder="Notes" class="fgrp" style="grid-column:1/-1;height:60px;resize:none"></textarea>
          <button onclick="buyerAdd()" class="btn-primary" style="grid-column:1/-1;height:36px">Add</button>
        </div>
      </div>

      <!-- Search & Sort -->
      <div style="padding:12px;display:flex;gap:8px;border-bottom:1px solid var(--border)">
        <input
          type="search"
          placeholder="Search buyers..."
          class="fgrp"
          style="flex:1"
          onchange="buyerSetSearch(this.value)"
          oninput="buyerSetSearch(this.value)"
        >
        <select class="fgrp" style="width:120px" onchange="buyerSetSort(this.value)">
          <option value="spent">By Spent</option>
          <option value="recent">By Recent</option>
          <option value="name">By Name</option>
        </select>
      </div>

      <!-- Buyers List -->
      <div style="padding:12px">
        ${i.length===0?'<div class="empty-state">No buyers yet</div>':i.map(c=>{const d=B.filter(m=>m.buyerId===c.id).reduce((m,f)=>m+(f.price||0),0),u=B.filter(m=>m.buyerId===c.id).length,p=B.filter(m=>m.buyerId===c.id).sort((m,f)=>(f.date||0)-(m.date||0))[0],y=ha===c.id,v=B.filter(m=>m.buyerId===c.id).sort((m,f)=>(f.date||0)-(m.date||0)),h=Rf(c.id);return`
                <div style="border:1px solid var(--border);border-radius:4px;margin-bottom:8px;overflow:hidden">
                  <!-- Header -->
                  <div
                    style="padding:12px;background:var(--surface2);cursor:pointer;display:flex;justify-content:space-between;align-items:center"
                    onclick="buyerExpand('${c.id}')"
                  >
                    <div>
                      <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-weight:600;color:var(--text)">${x(c.name)}</span>
                        <span style="font-size:9px;padding:2px 6px;background:${h.color}20;color:${h.color};border-radius:2px">${h.icon} ${h.name}</span>
                      </div>
                      <div style="font-size:11px;color:var(--muted);margin-top:2px">
                        ${c.email?x(c.email)+" · ":""}
                        ${Object.entries(c.handles).filter(([,m])=>m).map(([m,f])=>`${m}: ${x(f)}`).join(" · ")}
                      </div>
                    </div>
                    <div style="text-align:right">
                      <div style="font-size:14px;font-weight:700;color:var(--good)">${S(d)}</div>
                      <div style="font-size:11px;color:var(--muted)">${u} purchase${u!==1?"s":""}</div>
                    </div>
                  </div>

                  <!-- Expanded Content -->
                  ${y?`
                    <div style="border-top:1px solid var(--border);padding:12px;background:var(--surface)">
                      ${c.notes?`<div style="padding:8px;background:var(--surface2);border-radius:2px;margin-bottom:8px"><strong>Notes:</strong> ${x(c.notes)}</div>`:""}
                      <div style="font-size:11px;color:var(--muted);margin-bottom:8px;font-weight:600">Last Purchase: ${p?mt(p.date||Date.now()):"—"}</div>
                      ${u>=3?`<div style="font-size:10px;color:var(--accent2);margin-bottom:8px">💡 Repeat buyer — consider offering ${u>=5?"15%":"10%"} loyalty discount</div>`:""}

                      ${v.length>0?`
                        <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px">Purchase History:</div>
                        <div class="inv-table">
                          <div style="display:grid;grid-template-columns:1fr 80px 80px;gap:8px;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;padding-bottom:4px;border-bottom:1px solid var(--border)">
                            <div>Item</div>
                            <div style="text-align:right">Price</div>
                            <div style="text-align:right">Date</div>
                          </div>
                          ${v.map(m=>{const f=F(m.itemId);return`
                              <div style="display:grid;grid-template-columns:1fr 80px 80px;gap:8px;font-size:11px;padding:6px 0;border-bottom:1px solid var(--border);align-items:center">
                                <div style="color:var(--text)">${f?x(f.name):"Unknown Item"}</div>
                                <div style="text-align:right;color:var(--good);font-weight:600">${S(m.price||0)}</div>
                                <div style="text-align:right;color:var(--muted);font-size:10px">${mt(m.date||Date.now())}</div>
                              </div>
                            `}).join("")}
                        </div>
                      `:'<div style="font-size:11px;color:var(--muted)">No purchases linked</div>'}

                      <!-- Communication Log -->
                      <div style="margin-top:12px">
                        <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px">Communication Log</div>
                        <div style="display:flex;gap:6px;margin-bottom:8px">
                          <select id="comm_type_${c.id}" class="fgrp" style="width:100px">
                            <option value="note">📝 Note</option>
                            <option value="message">💬 Message</option>
                            <option value="email">📧 Email</option>
                            <option value="call">📞 Call</option>
                          </select>
                          <input id="comm_content_${c.id}" placeholder="Add note..." class="fgrp" style="flex:1">
                          <button onclick="buyerAddComm('${c.id}')" class="btn-primary" style="height:32px;font-size:11px;padding:0 12px">Add</button>
                        </div>
                        ${(c.comms||[]).slice().reverse().slice(0,10).map(m=>`
                          <div style="padding:6px 8px;background:var(--surface2);border-radius:2px;margin-bottom:4px;border-left:3px solid ${m.type==="message"?"var(--accent)":m.type==="email"?"var(--accent2)":m.type==="call"?"var(--good)":"var(--muted)"}">
                            <div style="font-size:10px;color:var(--muted)">${m.type==="note"?"📝":m.type==="message"?"💬":m.type==="email"?"📧":"📞"} ${mt(m.date)}</div>
                            <div style="font-size:11px;color:var(--text);margin-top:2px">${x(m.content)}</div>
                          </div>
                        `).join("")}
                      </div>

                      <button onclick="buyerDelete('${c.id}')" class="btn-danger" style="margin-top:8px;width:100%;height:32px;font-size:11px">Delete Buyer</button>
                    </div>
                  `:""}
                </div>
              `}).join("")}
      </div>

      <!-- Pagination -->
      <div id="buyersPagination"></div>
    </div>
  `;t.innerHTML=r;const l=document.getElementById("buyersPagination");Is(l,{page:$n,totalItems:a.length,pageSize:ea,onPage:c=>{$n=c,dn()}})}let na=null,fr=-1,mr=-1;function By(){var Ai,zi,Ri,Fi,Oi,Ni,Ui,qi,ji,Hi,Wi,Gi,Vi;const t=document.getElementById("insightsContent");if(!t)return;if(!(k.length!==fr||B.length!==mr)&&na){t.innerHTML=na;return}if(fr=k.length,mr=B.length,!B.length&&!k.length){t.innerHTML='<div class="panel" style="animation:none"><div class="empty-state"><div class="empty-icon">🔍</div><p>No data yet.<br>Add inventory and record some sales to see insights.</p></div></div>';return}const n=new Date,s=864e5,o=new Date(n-30*s),a=new Date(n-60*s),i=k.map(g=>{const b=B.filter(Yt=>Yt.itemId===g.id),C=b.reduce((Yt,re)=>Yt+(re.price||0)*(re.qty||0),0),H=b.reduce((Yt,re)=>Yt+(re.qty||0),0),Q=b.reduce((Yt,re)=>Yt+(re.price||0)*(re.qty||0)-(g.cost||0)*(re.qty||0)-(re.fees||0)-(re.ship||0),0),rt=b.length?new Date(Math.max(...b.map(Yt=>new Date(Yt.date)))):null,st=rt?Math.floor((n-rt)/s):null,ht=new Date(g.added||n),gn=Math.floor((n-ht)/s),Uo=C>0?Q/C:0,Hn=g.cost>0?Q/(g.cost*(H||1)):0,qo=b.filter(Yt=>new Date(Yt.date)>=o);return{item:g,itemSales:b,revenue:C,unitsSold:H,profit:Q,lastSale:rt,daysSinceSale:st,daysListed:gn,margin:Uo,roi:Hn,recentSales30:qo}}),r={},l={};for(const{item:g,revenue:b,profit:C,unitsSold:H}of i){const Q=g.category||"Uncategorized",rt=Q.toLowerCase();l[rt]||(l[rt]=Q);const st=l[rt];r[st]||(r[st]={revenue:0,profit:0,units:0,items:0}),r[st].revenue+=b,r[st].profit+=C,r[st].units+=H,r[st].items++}const c=Object.entries(r).sort((g,b)=>b[1].profit-g[1].profit).slice(0,5),d={};for(const g of B){const b=F(g.itemId),C=g.platform||b&&b.platform||"Other";d[C]||(d[C]={revenue:0,units:0,count:0}),d[C].revenue+=(g.price||0)*(g.qty||0),d[C].units+=g.qty||0,d[C].count++}const u=Object.entries(d).sort((g,b)=>b[1].revenue-g[1].revenue).slice(0,6),p=i.filter(g=>g.unitsSold>0).sort((g,b)=>b.unitsSold-g.unitsSold),y=i.filter(g=>g.unitsSold===0&&g.daysListed>=14).sort((g,b)=>b.daysListed-g.daysListed),v=[...i].filter(g=>g.profit>0).sort((g,b)=>b.profit-g.profit).slice(0,5),h=[...i].filter(g=>g.roi>0&&g.unitsSold>0).sort((g,b)=>b.roi-g.roi).slice(0,5),m=y.filter(g=>g.daysListed>=30).slice(0,5),f=i.filter(g=>g.recentSales30.length>0).sort((g,b)=>b.recentSales30.length-g.recentSales30.length).slice(0,5),E=J.reduce((g,b)=>g+(b.amount||0),0),$=B.reduce((g,b)=>g+(b.price||0)*(b.qty||0),0),I=p.reduce((g,b)=>g+b.profit,0)-E,M={};for(const g of J)M[g.category]=(M[g.category]||0)+(g.amount||0);const N=Object.entries(M).sort((g,b)=>b[1]-g[1]).slice(0,4),W=J.filter(g=>new Date(g.date)>=o).reduce((g,b)=>g+(b.amount||0),0),L=B.filter(g=>new Date(g.date)>=o).reduce((g,b)=>g+(b.price||0)*(b.qty||0),0),q=(g,b,C="var(--accent)")=>`<div style="height:6px;background:var(--surface3);border-radius:3px;margin-top:5px"><div style="height:6px;width:${b>0?Math.round(g/b*100):0}%;background:${C};border-radius:3px;transition:width 0.4s"></div></div>`,D=g=>g<=30?"var(--good)":g<=60?"var(--warn)":g<=90?"var(--accent2)":"var(--danger)",_=(g,b,C,H="var(--accent)")=>`
    <div style="background:var(--surface2);border:1px solid var(--border);padding:16px 18px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;border-bottom:1px solid var(--border);padding-bottom:8px">
        <span style="font-size:16px">${g}</span>
        <span style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:${H}">${b}</span>
      </div>
      ${C}
    </div>`,A=(g,b)=>{const C=g.item;return`<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      <div style="min-width:0;flex:1">
        <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer" onclick="openDrawer('${C.id}')">${C.name}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:1px">${C.category||"—"}${C.subcategory?" · "+C.subcategory:""}</div>
      </div>
      <div style="text-align:right;flex-shrink:0;margin-left:12px">${b(g)}</div>
    </div>`},T=B.reduce((g,b)=>g+(b.qty||0),0),P=p.length?p.reduce((g,b)=>g+b.margin,0)/p.length:0,R=k.reduce((g,b)=>{const H=B.filter(Q=>Q.itemId===b.id).reduce((Q,rt)=>Q+(rt.qty||0),0);return g+(b.qty||0)+H},0),G=B.reduce((g,b)=>g+(b.qty||0),0),nt=R>0?G/R:0,kt=g=>g>=.5?"var(--good)":g>=.25?"var(--warn)":"var(--danger)",be=`
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px">
      ${[["Total Revenue",S($),"var(--accent)"],["Net Profit",S(I),I>=0?"var(--good)":"var(--danger)"],["Units Sold",T,"var(--accent3)"],["Avg Margin",Y(P),P>=.2?"var(--good)":"var(--warn)"],["Sell-Through",R>0?(nt*100).toFixed(0)+"%":"—",kt(nt)]].map(([g,b,C])=>`
        <div style="background:var(--surface2);border:1px solid var(--border);padding:12px 14px">
          <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">${g}</div>
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:${C}">${b}</div>
        </div>`).join("")}
    </div>`,Ft={};for(const g of B){const b=new Date(g.date),C=`${b.getFullYear()}-${String(b.getMonth()+1).padStart(2,"0")}`;Ft[C]||(Ft[C]={revenue:0,profit:0,units:0}),Ft[C].revenue+=(g.price||0)*(g.qty||0);const H=F(g.itemId);Ft[C].profit+=(g.price||0)*(g.qty||0)-((H==null?void 0:H.cost)||0)*(g.qty||0)-(g.fees||0)-(g.ship||0),Ft[C].units+=g.qty||0}const Pe=Object.keys(Ft).sort().slice(-12),Po=Math.max(...Pe.map(g=>Ft[g].revenue),1),Mo=Pe.length>=2?`
    <div style="background:var(--surface2);border:1px solid var(--border);padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--accent)">📈 Monthly Revenue</div>
        <div style="font-size:10px;color:var(--muted)">Last ${Pe.length} months</div>
      </div>
      <div style="display:flex;align-items:flex-end;gap:4px;height:80px">
        ${Pe.map(g=>{const b=Ft[g],C=Math.max(4,b.revenue/Po*100),H=g.split("-")[1];return b.profit>=0,`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="font-size:8px;color:var(--muted);font-family:'DM Mono',monospace">${S(b.revenue)}</div>
            <div style="width:100%;height:${C}%;background:var(--accent);border-radius:2px 2px 0 0;min-height:4px" title="${g}: ${S(b.revenue)} rev, ${S(b.profit)} profit"></div>
            <div style="font-size:8px;color:var(--muted)">${H}</div>
          </div>`}).join("")}
      </div>
    </div>
  `:"",je=B.filter(g=>new Date(g.date)>=o),qn=B.filter(g=>new Date(g.date)>=a),we=je.length/30,He=qn.length/60,ae=we>He?"accelerating":we<He*.8?"slowing":"steady",jn=Math.round(we*30),Bs=je.length>0?Math.round(je.reduce((g,b)=>g+(b.price||0)*(b.qty||0),0)/je.length*jn):0,Ts=je.length>=3?_("🚀","Sales Velocity & Forecast",`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px">
      <div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--accent)">${we.toFixed(1)}</div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-top:2px">Sales/Day</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:${ae==="accelerating"?"var(--good)":ae==="slowing"?"var(--danger)":"var(--accent)"}">${ae==="accelerating"?"↑":ae==="slowing"?"↓":"→"} ${ae}</div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-top:2px">Trend</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--good)">${S(Bs)}</div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;margin-top:2px">30d Forecast</div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">
      💡 At current pace: ~${jn} sales/month · ${we>He?"Momentum is building — keep sourcing":we<He*.8?"Sales are slowing — consider repricing stale items":"Steady pace — maintain current strategy"}
    </div>`,ae==="accelerating"?"var(--good)":ae==="slowing"?"var(--warn)":"var(--accent)"):"",Ps=f.length?_("🔥","Hot Right Now — 30 days",f.map(g=>A(g,b=>`
      <div style="font-size:11px;font-family:'DM Mono',monospace;color:var(--accent);font-weight:700">${b.recentSales30.length} sale${b.recentSales30.length>1?"s":""}</div>
      <div style="font-size:10px;color:var(--muted)">${S(b.revenue)} rev</div>`)).join(""),"var(--accent)"):"",pn=[...i].filter(g=>g.unitsSold>0).sort((g,b)=>b.unitsSold-g.unitsSold).slice(0,8),Ms=((Ai=pn[0])==null?void 0:Ai.unitsSold)||1,Ds=pn.length?_("🏆","Best Sellers — All Time",pn.map((g,b)=>{const C=b===0?"🥇":b===1?"🥈":b===2?"🥉":`<span style="font-size:10px;color:var(--muted)">#${b+1}</span>`,H=g.daysListed>0?(g.unitsSold/g.daysListed*30).toFixed(1):"—";return`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
        <span style="width:22px;text-align:center;flex-shrink:0">${C}</span>
        <div style="min-width:0;flex:1">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer" onclick="openDrawer('${g.item.id}')">${g.item.name}</div>
          <div style="font-size:10px;color:var(--muted);margin-top:1px">${g.item.category||"—"} · ~${H}/mo velocity</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:13px;font-family:'Syne',sans-serif;font-weight:700;color:var(--accent)">${g.unitsSold} sold</div>
          <div style="font-size:10px;color:var(--muted)">${S(g.revenue)} rev</div>
        </div>
      </div>`+q(g.unitsSold,Ms)}).join(""),"var(--accent)"):"",Ls=v.length?_("💰","Top Profit Generators",v.map((g,b)=>A(g,C=>`
      <div style="font-size:12px;font-family:'DM Mono',monospace;color:var(--good);font-weight:700">${S(C.profit)}</div>
      <div style="font-size:10px;color:var(--muted)">${Y(C.margin)} margin</div>`)).join("")+(v[0]?q(v[0].profit,v[0].profit,"var(--good)"):""),"var(--good)"):"",As=h.length?_("📈","Best Return on Investment",h.map(g=>A(g,b=>`
      <div style="font-size:12px;font-family:'DM Mono',monospace;color:var(--accent3);font-weight:700">${Y(b.roi)} ROI</div>
      <div style="font-size:10px;color:var(--muted)">cost ${S(b.item.cost)}</div>`)).join(""),"var(--accent3)"):"",Ot={};for(const{item:g,revenue:b,profit:C,unitsSold:H}of i){const Q=g.source||"Unknown";Ot[Q]||(Ot[Q]={revenue:0,profit:0,units:0,items:0,cost:0}),Ot[Q].revenue+=b,Ot[Q].profit+=C,Ot[Q].units+=H,Ot[Q].items++,Ot[Q].cost+=(g.cost||0)*(g.qty||1)}const zs=Object.entries(r).map(([g,b])=>{const C=k.filter(Q=>(Q.category||"Uncategorized").toLowerCase()===g.toLowerCase()).reduce((Q,rt)=>Q+(rt.cost||0)*((rt.qty||0)+B.filter(st=>st.itemId===rt.id).reduce((st,ht)=>st+(ht.qty||0),0)),0),H=C>0?b.profit/C:0;return{name:g,profit:b.profit,cost:C,roi:H,units:b.units}}).filter(g=>g.units>0).sort((g,b)=>b.roi-g.roi).slice(0,5),pt=Object.entries(Ot).filter(([g])=>g!=="Unknown").map(([g,b])=>{const C=b.cost>0?b.profit/b.cost:0;return{name:g,profit:b.profit,cost:b.cost,roi:C,units:b.units}}).filter(g=>g.units>0).sort((g,b)=>b.roi-g.roi).slice(0,5),vt=Object.entries(d).map(([g,b])=>{const C=B.filter(rt=>{const st=k.find(ht=>ht.id===rt.itemId);return(rt.platform||st&&st.platform||"Other")===g}).reduce((rt,st)=>{const ht=k.find(gn=>gn.id===st.itemId);return rt+(ht?(ht.cost||0)*(st.qty||0):0)},0),H=b.revenue-C,Q=C>0?H/C:0;return{name:g,profit:H,cost:C,roi:Q,units:b.units}}).filter(g=>g.units>0).sort((g,b)=>b.roi-g.roi).slice(0,5),ie=(g,b)=>{if(!g.length)return"";const C=Math.max(...g.map(H=>Math.abs(H.roi)),.01);return`<div style="margin-bottom:14px">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">${b}</div>
      ${g.map(H=>`<div style="padding:4px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px">${x(H.name)}</span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;font-weight:700;color:${H.roi>=0?"var(--accent3)":"var(--danger)"}">${Y(H.roi)}</span>
        </div>
        <div style="font-size:9px;color:var(--muted);margin-top:1px">${S(H.profit)} profit on ${S(H.cost)} invested · ${H.units} unit${H.units!==1?"s":""}</div>
        ${q(Math.abs(H.roi),C,H.roi>=0?"var(--accent3)":"var(--danger)")}
      </div>`).join("")}
    </div>`},Rs=ie(zs,"By Category")+ie(pt,"By Source")+ie(vt,"By Platform"),bc=Rs.trim()?_("🔬","ROI Breakdown",Rs,"var(--accent3)"):"",wc=[30,60,90].map(g=>{const b=new Date(n-g*s),H=k.filter(st=>new Date(st.added||n)>=b).reduce((st,ht)=>{const Uo=B.filter(Hn=>Hn.itemId===ht.id).reduce((Hn,qo)=>Hn+(qo.qty||0),0);return st+(ht.qty||0)+Uo},0),Q=B.filter(st=>{const ht=k.find(gn=>gn.id===st.itemId);return ht&&new Date(ht.added||n)>=b}).reduce((st,ht)=>st+(ht.qty||0),0),rt=H>0?Q/H:0;return{days:g,rate:rt,sold:Q,added:H}}),xc=nt>=.5?"Excellent sell-through — your sourcing is well-calibrated":nt>=.3?"Solid rate — look for ways to move stale items faster":nt>=.15?"Below average — consider reducing new sourcing until existing stock moves":"Low sell-through — focus on clearing current inventory before buying more",$c=R>0?_("📊","Sell-Through Rate",`<div style="display:flex;gap:12px;margin-bottom:14px">
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:28px;color:${kt(nt)}">${(nt*100).toFixed(1)}%</div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px">All Time</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${G} of ${R} units</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
      ${wc.map(g=>`<div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:${kt(g.rate)}">${(g.rate*100).toFixed(0)}%</div>
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">${g.days}d cohort</div>
        <div style="font-size:9px;color:var(--muted)">${g.sold}/${g.added}</div>
      </div>`).join("")}
    </div>
    <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">💡 ${xc}</div>`,kt(nt)):"",Nt={fresh:0,moderate:0,stale:0,deadPile:0},un=[];for(const g of i)g.item.qty<=0||(g.daysListed<=30?Nt.fresh++:g.daysListed<=60?Nt.moderate++:g.daysListed<=90?Nt.stale++:Nt.deadPile++,g.daysListed>60&&g.item.qty>0&&g.recentSales30.length===0&&un.push(g));un.sort((g,b)=>b.daysListed-g.daysListed);const Sc=un.map(g=>{const b=(g.item.price||0)*.8,C=g.recentSales30.length===0?"Lower price by 20%":"Relist on new platform";return`<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
      <td style="padding:8px 10px"><div class="item-name" style="cursor:pointer;font-weight:600" onclick="openDrawer('${g.item.id}')">${x(g.item.name)}</div></td>
      <td style="padding:8px 10px;font-family:'DM Mono',monospace;font-weight:600;color:${D(g.daysListed)}">${g.daysListed}d</td>
      <td style="padding:8px 10px;text-align:right;font-family:'DM Mono',monospace">${S(g.item.price)}</td>
      <td style="padding:8px 10px;text-align:right;font-family:'DM Mono',monospace;color:var(--good)">${S(b)}</td>
      <td style="padding:8px 10px;font-size:10px;color:var(--muted)">${g.item.platform||"Other"}</td>
      <td style="padding:8px 10px;font-size:10px;color:var(--warn)">${C}</td>
    </tr>`}).join(""),kc=`
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
      <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Fresh (0–30d)</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--good)">${Nt.fresh}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Moderate (31–60d)</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--warn)">${Nt.moderate}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Stale (61–90d)</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--accent2)">${Nt.stale}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Dead (90+d)</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--danger)">${Nt.deadPile}</div>
      </div>
    </div>
    ${un.length?`
    <div style="margin-top:12px">
      <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:600">Death Pile Alert — ${un.length} item${un.length!==1?"s":""}</div>
      <div style="overflow-x:auto">
        <table style="width:100%;font-size:11px;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
              <th style="text-align:left;padding:8px 10px;color:var(--muted);font-weight:600">Item</th>
              <th style="text-align:left;padding:8px 10px;color:var(--muted);font-weight:600">Days</th>
              <th style="text-align:right;padding:8px 10px;color:var(--muted);font-weight:600">Current</th>
              <th style="text-align:right;padding:8px 10px;color:var(--muted);font-weight:600">Suggested</th>
              <th style="text-align:left;padding:8px 10px;color:var(--muted);font-weight:600">Platform</th>
              <th style="text-align:left;padding:8px 10px;color:var(--muted);font-weight:600">Action</th>
            </tr>
          </thead>
          <tbody>${Sc}</tbody>
        </table>
      </div>
    </div>
    `:'<div style="font-size:10px;color:var(--good);margin-top:10px">🎉 No items in death pile — great inventory health!</div>'}
  `,Ec=Nt.fresh||Nt.moderate||Nt.stale||Nt.deadPile?_("📅","Aging & Death Pile",kc,"var(--warn)"):"",Ic=m.length?_("🕸️","Not Moving — Consider Repricing",m.map(g=>A(g,b=>`
      <div style="font-size:11px;font-family:'DM Mono',monospace;color:var(--warn);font-weight:700">${b.daysListed}d listed</div>
      <div style="font-size:10px;color:var(--muted)">0 sold · ${S(b.item.price)} list</div>`)).join("")+`<div style="margin-top:10px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">💡 Try lowering the price by 10–20% or listing on an additional platform</div>`,"var(--warn)"):"",_c=((Ri=(zi=c[0])==null?void 0:zi[1])==null?void 0:Ri.profit)||1,Cc=c.length?_("🗂️","Top Categories by Profit",c.map(([g,b])=>`
      <div style="padding:6px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;font-weight:600">${g}</span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;color:var(--good);font-weight:700">${S(b.profit)}</span>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${b.units} unit${b.units!==1?"s":""} sold · ${S(b.revenue)} revenue · ${b.items} item${b.items!==1?"s":""}</div>
        ${q(b.profit,_c,"var(--good)")}
      </div>`).join("")):"",Bc=((Oi=(Fi=u[0])==null?void 0:Fi[1])==null?void 0:Oi.revenue)||1,Tc=u.length?_("🏪","Platform Performance",u.map(([g,b])=>`
      <div style="padding:5px 0">
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:12px;font-weight:600">${g}</span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;color:var(--accent)">${S(b.revenue)}</span>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:1px">${b.count} sale${b.count!==1?"s":""} · ${b.units} unit${b.units!==1?"s":""}</div>
        ${q(b.revenue,Bc)}
      </div>`).join("")):"",Do=Object.entries(Ot).filter(([g])=>g!=="Unknown").sort((g,b)=>b[1].profit-g[1].profit).slice(0,6),Pc=((Ui=(Ni=Do[0])==null?void 0:Ni[1])==null?void 0:Ui.profit)||1,Mc=Do.length?_("📍","Source Performance",Do.map(([g,b])=>{const C=b.cost>0?b.profit/b.cost:0;return`<div style="padding:6px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;font-weight:600">${x(g)}</span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;color:var(--good);font-weight:700">${S(b.profit)}</span>
        </div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${b.units} sold · ${b.items} item${b.items!==1?"s":""} · ${S(b.revenue)} rev · ${Y(C)} ROI</div>
        ${q(Math.max(b.profit,0),Pc,b.profit>=0?"var(--good)":"var(--danger)")}
      </div>`}).join(""),"var(--accent2)"):"",Lo=$>0?E/$:0,Ao=Lo<.1?["✅","Low","var(--good)"]:Lo<.25?["⚠️","Moderate","var(--warn)"]:["🔴","High","var(--danger)"],Dc=((qi=N[0])==null?void 0:qi[1])||1,Lc=J.length?_("🧾","Expense Health",`<div style="display:flex;gap:12px;margin-bottom:12px">
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);padding:10px">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Expense Ratio</div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:${Ao[2]}">${Y(Lo)}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">of revenue · ${Ao[0]} ${Ao[1]}</div>
      </div>
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);padding:10px">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Last 30 Days</div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:var(--danger)">${S(W)}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">vs ${S(L)} revenue</div>
      </div>
    </div>`+N.map(([g,b])=>`
      <div style="padding:5px 0">
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:12px">${g}</span>
          <span style="font-size:12px;font-family:'DM Mono',monospace;color:var(--danger)">${S(b)}</span>
        </div>
        ${q(b,Dc,"var(--danger)")}
      </div>`).join(""),"var(--danger)"):"",Ii=y.filter(g=>g.daysListed>=30).reduce((g,b)=>g+(b.item.cost||0)*(b.item.qty||1),0),zo=y.filter(g=>g.daysListed>=30).length,Ac=zo>0?_("🔒","Tied-Up Capital",`<div style="margin-bottom:10px">
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:var(--warn)">${S(Ii)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:2px">cost basis sitting in ${zo} item${zo>1?"s":""} with no sales after 30+ days</div>
    </div>
    <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">💡 Freeing this capital could fund ${Math.floor(Ii/Math.max(k.reduce((g,b)=>g+(b.cost||0),0)/k.length,1))} new average-cost items</div>`,"var(--warn)"):"",Fs=B.filter(g=>{var C;return(g.listPrice||((C=F(g.itemId))==null?void 0:C.price)||0)>0});let Os=0,_i=0,Ns=0,Ci=0;for(const g of Fs){const b=g.listPrice||((ji=F(g.itemId))==null?void 0:ji.price)||0,C=(g.price-b)/b;Ci+=C,C>.01?Os++:C<-.01?Ns++:_i++}const Us=Fs.length?Ci/Fs.length:0,Bi=Us>=0?"var(--good)":Us>-.1?"var(--warn)":"var(--danger)",zc=Fs.length>=3?_("🎯","Pricing Accuracy",`<div style="display:flex;gap:10px;margin-bottom:12px">
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:${Bi}">${Us>=0?"+":""}${Y(Us)}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">avg vs list price</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:10px">
      <div style="flex:1;text-align:center;padding:8px;background:rgba(87,255,154,0.06);border:1px solid rgba(87,255,154,0.15)">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--good)">${Os}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:2px">ABOVE LIST</div>
      </div>
      <div style="flex:1;text-align:center;padding:8px;background:rgba(87,200,255,0.06);border:1px solid rgba(87,200,255,0.15)">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--accent)">${_i}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:2px">AT LIST</div>
      </div>
      <div style="flex:1;text-align:center;padding:8px;background:rgba(255,71,87,0.06);border:1px solid rgba(255,71,87,0.15)">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--danger)">${Ns}</div>
        <div style="font-size:9px;color:var(--muted);margin-top:2px">BELOW LIST</div>
      </div>
    </div>
    <div style="font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">💡 ${Ns>Os?"You often sell below listing — try starting higher or negotiating less":Os>Ns?"Great job — you consistently meet or exceed your asking price":"Your pricing is well calibrated to market expectations"}</div>`,Bi):"",Ro={"< 7 days":0,"1-2 weeks":0,"2-4 weeks":0,"1-2 months":0,"2-3 months":0,"3+ months":0},Ti={"< 7 days":0,"1-2 weeks":0,"2-4 weeks":0,"1-2 months":0,"2-3 months":0,"3+ months":0};for(const g of k){const b=g.qty!=null?g.qty:1;if(b<=0)continue;const C=g.added?Math.floor((n-new Date(g.added))/s):0,H=C<7?"< 7 days":C<14?"1-2 weeks":C<30?"2-4 weeks":C<60?"1-2 months":C<90?"2-3 months":"3+ months";Ro[H]+=b||1,Ti[H]+=(g.cost||0)*(b||1)}const Rc=Math.max(...Object.values(Ro),1),Fc={"< 7 days":"var(--good)","1-2 weeks":"var(--good)","2-4 weeks":"var(--accent)","1-2 months":"var(--warn)","2-3 months":"var(--accent2)","3+ months":"var(--danger)"},fn=k.filter(g=>(g.qty!=null?g.qty:1)>0).length,Oc=fn>=1?_("📅","Inventory Age Distribution",`<div style="font-size:10px;color:var(--muted);margin-bottom:10px">${fn} items in stock</div>`+Object.entries(Ro).filter(([,g])=>g>0).map(([g,b])=>`<div style="padding:4px 0">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:11px">${g}</span>
        <span style="font-size:11px;font-family:'DM Mono',monospace"><span style="font-weight:700">${b}</span> units · ${S(Ti[g])}</span>
      </div>
      ${q(b,Rc,Fc[g])}
    </div>`).join(""),"var(--accent)"):"",We={};for(const g of k){const b=g.qty!=null?g.qty:1;if(b<=0)continue;const C=g.category||"Uncategorized";We[C]||(We[C]={cost:0,retail:0,units:0,items:0}),We[C].cost+=(g.cost||0)*(b||1),We[C].retail+=(g.price||0)*(b||1),We[C].units+=b||1,We[C].items++}const Fo=Object.entries(We).sort((g,b)=>b[1].cost-g[1].cost).slice(0,6),Nc=((Wi=(Hi=Fo[0])==null?void 0:Hi[1])==null?void 0:Wi.cost)||1,Pi=k.filter(g=>(g.qty!=null?g.qty:1)>0).reduce((g,b)=>{const C=b.qty!=null?b.qty:1;return g+(b.cost||0)*C},0),Mi=k.filter(g=>(g.qty!=null?g.qty:1)>0).reduce((g,b)=>{const C=b.qty!=null?b.qty:1;return g+(b.price||0)*C},0),Di=Mi-Pi,Uc=Fo.length>=1?_("💵","Capital Invested by Category",`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
      <div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Invested</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--warn)">${S(Pi)}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">List Value</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:var(--accent)">${S(Mi)}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);padding:10px;text-align:center">
        <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Potential</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:16px;color:${Di>=0?"var(--good)":"var(--danger)"}">${S(Di)}</div>
      </div>
    </div>`+Fo.map(([g,b])=>{const C=b.cost>0?(b.retail-b.cost)/b.cost:0;return`<div style="padding:5px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;font-weight:600">${x(g)}</span>
          <span style="font-size:11px;font-family:'DM Mono',monospace;color:var(--warn);font-weight:700">${S(b.cost)}</span>
        </div>
        <div style="font-size:9px;color:var(--muted);margin-top:1px">${b.items} item${b.items!==1?"s":""} · ${b.units} unit${b.units!==1?"s":""} · ${S(b.retail)} list · ${Y(C)} potential ROI</div>
        ${q(b.cost,Nc,"var(--warn)")}
      </div>`}).join(""),"var(--warn)"):"",Ge={noPhoto:k.filter(g=>(g.qty!=null?g.qty:1)>0&&(!g.images||!g.images.length)),noPrice:k.filter(g=>(g.qty!=null?g.qty:1)>0&&!g.price),noPlatform:k.filter(g=>{if((g.qty!=null?g.qty:1)<=0)return!1;const b=Z(g);return!b.length||b.length===1&&(b[0]==="Unlisted"||b[0]==="Other")}),noCost:k.filter(g=>(g.qty!=null?g.qty:1)>0&&!g.cost),noCategory:k.filter(g=>(g.qty!=null?g.qty:1)>0&&!g.category),noCondition:k.filter(g=>(g.qty!=null?g.qty:1)>0&&!g.condition)},Oo=Object.values(Ge).reduce((g,b)=>g+b.length,0),mn=(g,b,C,H)=>C.length?`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
    <span style="font-size:14px">${g}</span>
    <div style="flex:1">
      <div style="font-size:12px;font-weight:600;color:${H}">${C.length} item${C.length!==1?"s":""} ${b}</div>
      <div style="font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">${C.slice(0,3).map(Q=>x(Q.name)).join(", ")}${C.length>3?"...":""}</div>
    </div>
  </div>`:"",qc=mn("📷","missing photos",Ge.noPhoto,"var(--accent2)")+mn("💰","missing price",Ge.noPrice,"var(--danger)")+mn("🏪","not listed on any platform",Ge.noPlatform,"var(--warn)")+mn("🧾","missing cost (can't track profit)",Ge.noCost,"var(--warn)")+mn("🗂️","missing category",Ge.noCategory,"var(--muted)")+mn("🏷","missing condition",Ge.noCondition,"var(--muted)"),Li=fn>0&&!Oo,jc=fn>0?_("✅","Listing Readiness",Li?`<div style="text-align:center;padding:12px 0">
          <div style="font-size:28px;margin-bottom:6px">🎉</div>
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;color:var(--good)">All items fully set up!</div>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">Every item has photos, pricing, platforms, and more</div>
        </div>`:`<div style="font-size:10px;color:var(--muted);margin-bottom:8px">${Oo} thing${Oo!==1?"s":""} to fix across ${fn} in-stock items</div>`+qc+`<div style="margin-top:10px;font-size:11px;color:var(--muted);font-family:'DM Mono',monospace">💡 Complete items sell faster — fill in the gaps to boost your sell-through</div>`,Li?"var(--good)":"var(--accent2)"):"",Ve={};for(const g of k){const b=g.qty!=null?g.qty:1;if(b<=0)continue;const C=g.source||"";C&&(Ve[C]||(Ve[C]={cost:0,retail:0,items:0,units:0}),Ve[C].cost+=(g.cost||0)*(b||1),Ve[C].retail+=(g.price||0)*(b||1),Ve[C].items++,Ve[C].units+=b||1)}const No=Object.entries(Ve).sort((g,b)=>b[1].cost-g[1].cost).slice(0,5),Hc=((Vi=(Gi=No[0])==null?void 0:Gi[1])==null?void 0:Vi.cost)||1,Wc=No.length>=1?_("🗺️","Where Your Money Goes — by Source",No.map(([g,b])=>{const C=b.cost>0?(b.retail-b.cost)/b.cost:0;return`<div style="padding:5px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:11px;font-weight:600">📍 ${x(g)}</span>
          <span style="font-size:11px;font-family:'DM Mono',monospace;font-weight:700;color:var(--accent2)">${S(b.cost)}</span>
        </div>
        <div style="font-size:9px;color:var(--muted);margin-top:1px">${b.items} item${b.items!==1?"s":""} · ${b.units} unit${b.units!==1?"s":""} · ${S(b.retail)} list value · ${Y(C)} potential ROI</div>
        ${q(b.cost,Hc,"var(--accent2)")}
      </div>`}).join(""),"var(--accent2)"):"";t.innerHTML=`
    <div style="padding:0 0 24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div>
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px">Insights</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">Based on ${k.length} items · ${B.length} sales · ${J.length} expenses</div>
        </div>
        <div style="font-size:10px;color:var(--muted);font-family:'DM Mono',monospace">Updated ${new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div>
      </div>
      ${be}
      ${Mo}
      ${Ff(B)}
      ${Of(B,F)}
      ${Ec}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          ${jc}
          ${Ps}
          ${Ds}
          ${Ls}
          ${Ts}
          ${Ac}
          ${Ic}
          ${Oc}
        </div>
        <div>
          ${Uc}
          ${As}
          ${bc}
          ${$c}
          ${Cc}
          ${Tc}
          ${Mc}
          ${Wc}
          ${zc}
          ${Lc}
        </div>
      </div>
      ${!p.length&&!m.length&&!fn?`<div style="text-align:center;color:var(--muted);font-size:13px;padding:40px 0;font-family:'DM Mono',monospace">Add some inventory items to start seeing insights ↗</div>`:""}
    </div>`,na=t.innerHTML}function Ff(t,e){if(t.length<5)return"";const n=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],s=Array.from({length:24},(u,p)=>p),o=Array.from({length:7},()=>Array(24).fill(0));let a=0;for(const u of t){const p=new Date(u.date);isNaN(p)||(o[p.getDay()][p.getHours()]+=u.qty||1,o[p.getDay()][p.getHours()]>a&&(a=o[p.getDay()][p.getHours()]))}if(a===0)return"";const i=o.map(u=>u.reduce((p,y)=>p+y,0)),r=i.indexOf(Math.max(...i)),l=14,c=n.map((u,p)=>s.map(y=>{const v=o[p][y],h=v/a,m=v===0?"var(--border)":`rgba(87,255,154,${.15+h*.85})`;return`<div title="${u} ${y}:00 — ${v} sale${v!==1?"s":""}" style="width:${l}px;height:${l}px;background:${m};border-radius:2px"></div>`}).join("")).map((u,p)=>`<div style="display:flex;gap:1px;align-items:center"><span style="width:28px;font-size:9px;color:var(--muted);font-family:'DM Mono',monospace">${n[p]}</span>${u}<span style="margin-left:6px;font-size:9px;color:var(--muted);font-family:'DM Mono',monospace">${i[p]}</span></div>`).join(""),d=[0,6,12,18,23].map(u=>`<span style="position:absolute;left:${28+u*(l+1)}px;font-size:8px;color:var(--muted);font-family:'DM Mono',monospace">${u===0?"12a":u<12?u+"a":u===12?"12p":u-12+"p"}</span>`).join("");return`<div style="background:var(--surface2);border:1px solid var(--border);padding:16px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--accent)">📅 Sales by Day & Hour</div>
      <div style="font-size:10px;color:var(--muted)">Best day: <span style="color:var(--good);font-weight:600">${n[r]}</span></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:1px;overflow-x:auto">${c}</div>
    <div style="position:relative;height:14px;margin-top:4px;margin-left:0">${d}</div>
    <div style="display:flex;gap:6px;align-items:center;margin-top:8px">
      <span style="font-size:9px;color:var(--muted)">Less</span>
      ${[0,.25,.5,.75,1].map(u=>`<div style="width:${l}px;height:${l}px;background:${u===0?"var(--border)":`rgba(87,255,154,${.15+u*.85})`};border-radius:2px"></div>`).join("")}
      <span style="font-size:9px;color:var(--muted)">More</span>
    </div>
  </div>`}function Of(t,e){if(t.length<3)return"";const n=Date.now(),s=7*864e5,o=[];for(let d=11;d>=0;d--){const u=n-(d+1)*s,p=n-d*s,y=t.filter(E=>{const $=new Date(E.date).getTime();return $>=u&&$<p}),v=y.reduce((E,$)=>E+($.price||0)*($.qty||0),0),h=y.reduce((E,$)=>{const I=e($.itemId);return E+($.price||0)*($.qty||0)-(I?(I.cost||0)*($.qty||0):0)-($.fees||0)-($.ship||0)},0),m=y.reduce((E,$)=>E+($.qty||0),0),f=new Date(u).toLocaleDateString("en-US",{month:"short",day:"numeric"});o.push({label:f,revenue:v,profit:h,units:m,count:y.length})}const a=Math.max(...o.map(d=>d.revenue),1);Math.max(...o.map(d=>d.units),1);const i=o.slice(-4).reduce((d,u)=>d+u.revenue,0),r=o.slice(-8,-4).reduce((d,u)=>d+u.revenue,0),l=i>r*1.1?"↑":i<r*.9?"↓":"→";return`<div style="background:var(--surface2);border:1px solid var(--border);padding:16px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:var(--accent3)">📊 Weekly Sales Trend</div>
      <div style="font-size:10px;color:var(--muted)">12 weeks · Trend: <span style="color:${i>r*1.1?"var(--good)":i<r*.9?"var(--danger)":"var(--muted)"};font-weight:600">${l}</span></div>
    </div>
    <div style="display:flex;align-items:flex-end;gap:3px;height:90px">
      ${o.map(d=>{const u=Math.max(3,Math.round(d.revenue/a*100)),p=d.profit>=0?"var(--accent3)":"var(--danger)";return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:1px" title="${d.label}: ${d.count} sales, $${d.revenue.toFixed(0)} rev, $${d.profit.toFixed(0)} profit">
          <div style="font-size:7px;color:var(--muted);font-family:'DM Mono',monospace">${d.units}</div>
          <div style="width:100%;height:${u}%;background:${p};border-radius:2px 2px 0 0;min-height:3px;opacity:${d.revenue>0?1:.3}"></div>
          <div style="font-size:7px;color:var(--muted);writing-mode:vertical-rl;transform:rotate(180deg);height:32px;overflow:hidden">${d.label}</div>
        </div>`}).join("")}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:10px;font-family:'DM Mono',monospace">
      <span style="color:var(--muted)">Last 4 wk avg: ${(o.slice(-4).reduce((d,u)=>d+u.revenue,0)/4).toFixed(0)}/wk</span>
      <span style="color:var(--muted)">Total: ${o.reduce((d,u)=>d+u.units,0)} units · $${o.reduce((d,u)=>d+u.revenue,0).toFixed(0)} rev</span>
    </div>
  </div>`}let wt="profit",Kt=-1,mo="",go="",yo="",Sn="all";function oc(){const t=Date.now();return Sn==="7d"?t-7*864e5:Sn==="30d"?t-30*864e5:Sn==="90d"?t-90*864e5:Sn==="ytd"?new Date(new Date().getFullYear(),0,1).getTime():0}function Nf(){const t=oc();return B.filter(e=>new Date(e.date).getTime()>=t)}function Uf(t){let e=0,n=0,s=0,o=0,a=0;for(const h of t){const m=F(h.itemId),f=(h.price||0)*(h.qty||0);e+=f,n+=m?(m.cost||0)*(h.qty||0):0,s+=h.fees||0,o+=h.ship||0,a+=h.qty||0}const i=s+o,r=e-n-i,l=e>0?r/e:0,c=n>0?r/n:0,d=t.length>0?e/t.length:0,u=t.length>0?r/t.length:0,p=oc(),v=(J||[]).filter(h=>new Date(h.date).getTime()>=p).reduce((h,m)=>h+(m.amount||0),0);return{rev:e,cogs:n,fees:s,ship:o,totalExpenses:i,profit:r,margin:l,roi:c,avgOrderValue:d,avgProfit:u,totalQty:a,salesCount:t.length,totalBizExpenses:v}}function qf(t){const e={};for(const s of t){const o=F(s.itemId);if(!o)continue;if(!e[o.id]){const{m:l}=qt(o);e[o.id]={item:o,revenue:0,cost:0,fees:0,ship:0,profit:0,unitsSold:0,expectedMargin:l,platforms:new Set}}const a=e[o.id],i=(s.price||0)*(s.qty||0),r=(o.cost||0)*(s.qty||0);a.revenue+=i,a.cost+=r,a.fees+=s.fees||0,a.ship+=s.ship||0,a.profit+=i-r-(s.fees||0)-(s.ship||0),a.unitsSold+=s.qty||0,s.platform&&a.platforms.add(s.platform)}let n=Object.values(e);if(mo){const s=mo.toLowerCase();n=n.filter(o=>{var a,i;return((a=o.item.name)==null?void 0:a.toLowerCase().includes(s))||((i=o.item.sku)==null?void 0:i.toLowerCase().includes(s))})}return go&&(n=n.filter(s=>s.platforms.has(go))),yo&&(n=n.filter(s=>(s.item.category||"").toLowerCase()===yo.toLowerCase())),n.forEach(s=>{s.margin=s.revenue>0?s.profit/s.revenue:0,s.roi=s.cost>0?s.profit/s.cost:0}),n.sort((s,o)=>{let a,i;return wt==="name"?(a=s.item.name||"",i=o.item.name||"",Kt*a.localeCompare(i)):(wt==="profit"?(a=s.profit,i=o.profit):wt==="roi"?(a=s.roi,i=o.roi):wt==="margin"?(a=s.margin,i=o.margin):wt==="revenue"?(a=s.revenue,i=o.revenue):wt==="units"?(a=s.unitsSold,i=o.unitsSold):wt==="cost"?(a=s.cost,i=o.cost):(a=s.profit,i=o.profit),Kt*(a-i))}),n}function jf(t){const e={};for(const s of t){const o=F(s.itemId),a=s.platform||"Other";e[a]||(e[a]={platform:a,revenue:0,cost:0,fees:0,ship:0,profit:0,count:0,units:0});const i=e[a],r=(s.price||0)*(s.qty||0);i.revenue+=r,i.cost+=o?(o.cost||0)*(s.qty||0):0,i.fees+=s.fees||0,i.ship+=s.ship||0,i.profit+=r-(o?(o.cost||0)*(s.qty||0):0)-(s.fees||0)-(s.ship||0),i.count++,i.units+=s.qty||0}const n=Object.values(e);return n.forEach(s=>{s.margin=s.revenue>0?s.profit/s.revenue:0}),n.sort((s,o)=>o.profit-s.profit)}function Hf(t){const e={};for(const s of t){const o=F(s.itemId),a=(o==null?void 0:o.category)||"Uncategorized";e[a]||(e[a]={category:a,revenue:0,cost:0,fees:0,profit:0,count:0});const i=e[a],r=(s.price||0)*(s.qty||0);i.revenue+=r,i.cost+=o?(o.cost||0)*(s.qty||0):0,i.fees+=(s.fees||0)+(s.ship||0),i.profit+=r-(o?(o.cost||0)*(s.qty||0):0)-(s.fees||0)-(s.ship||0),i.count++}const n=Object.values(e);return n.forEach(s=>{s.margin=s.revenue>0?s.profit/s.revenue:0}),n.sort((s,o)=>o.profit-s.profit)}function Wf(){const t={};for(const e of B){const n=new Date(e.date),s=n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0");t[s]||(t[s]={month:s,revenue:0,cost:0,fees:0,profit:0,count:0});const o=t[s],a=F(e.itemId),i=(e.price||0)*(e.qty||0);o.revenue+=i,o.cost+=a?(a.cost||0)*(e.qty||0):0,o.fees+=(e.fees||0)+(e.ship||0),o.profit+=i-(a?(a.cost||0)*(e.qty||0):0)-(e.fees||0)-(e.ship||0),o.count++}return Object.values(t).sort((e,n)=>e.month.localeCompare(n.month)).slice(-12)}function Gf(t,e=5){const n=t.filter(a=>a.unitsSold>0),s=[...n].sort((a,i)=>i.profit-a.profit).slice(0,e),o=[...n].sort((a,i)=>a.profit-i.profit).slice(0,e);return{top:s,bottom:o}}function _s(){const t=document.getElementById("profitDashContent");if(!t)return;const e=Nf(),n=Uf(e),s=qf(e),o=jf(e),a=Hf(e),i=Wf(),{top:r,bottom:l}=Gf(s),c=[...new Set(B.map(p=>p.platform).filter(Boolean))].sort(),d=[...new Set(k.map(p=>p.category).filter(Boolean))].sort(),u=Math.max(...i.map(p=>Math.abs(p.profit)),1);t.innerHTML=`
    <!-- FILTER BAR -->
    <div class="pd-filters">
      <div class="pd-date-tabs">
        ${["7d","30d","90d","ytd","all"].map(p=>`<button class="pd-date-tab${Sn===p?" active":""}" onclick="setProfitDateRange('${p}')">${p==="all"?"All Time":p==="ytd"?"YTD":p.replace("d"," Days")}</button>`).join("")}
      </div>
      <input class="pd-search" type="text" placeholder="Search items…" value="${x(mo)}" oninput="setProfitSearch(this.value)">
      <select class="pd-select" onchange="setProfitPlatFilter(this.value)">
        <option value="">All Platforms</option>
        ${c.map(p=>`<option value="${x(p)}"${go===p?" selected":""}>${x(p)}</option>`).join("")}
      </select>
      <select class="pd-select" onchange="setProfitCatFilter(this.value)">
        <option value="">All Categories</option>
        ${d.map(p=>`<option value="${x(p)}"${yo===p?" selected":""}>${x(p)}</option>`).join("")}
      </select>
    </div>

    <!-- KPI CARDS -->
    <div class="pd-kpi-grid">
      <div class="pd-kpi c3">
        <div class="pd-kpi-label">Net Profit</div>
        <div class="pd-kpi-value" style="color:${n.profit>=0?"var(--good)":"var(--bad)"}">${S(n.profit)}</div>
        <div class="pd-kpi-sub">${Y(n.margin)} margin</div>
      </div>
      <div class="pd-kpi c2">
        <div class="pd-kpi-label">Revenue</div>
        <div class="pd-kpi-value">${S(n.rev)}</div>
        <div class="pd-kpi-sub">${n.salesCount} sales · ${n.totalQty} units</div>
      </div>
      <div class="pd-kpi c4">
        <div class="pd-kpi-label">ROI</div>
        <div class="pd-kpi-value">${n.roi>0?Y(n.roi):"—"}</div>
        <div class="pd-kpi-sub">${S(n.cogs)} invested</div>
      </div>
      <div class="pd-kpi c1">
        <div class="pd-kpi-label">Avg Profit / Sale</div>
        <div class="pd-kpi-value">${S(n.avgProfit)}</div>
        <div class="pd-kpi-sub">${S(n.avgOrderValue)} avg sale</div>
      </div>
      <div class="pd-kpi c5">
        <div class="pd-kpi-label">Total Fees + Shipping</div>
        <div class="pd-kpi-value" style="color:var(--bad)">${S(n.totalExpenses)}</div>
        <div class="pd-kpi-sub">${S(n.fees)} fees · ${S(n.ship)} shipping</div>
      </div>
      <div class="pd-kpi" style="border-left:3px solid var(--muted)">
        <div class="pd-kpi-label">Business Expenses</div>
        <div class="pd-kpi-value">${S(n.totalBizExpenses)}</div>
        <div class="pd-kpi-sub">True profit: ${S(n.profit-n.totalBizExpenses)}</div>
      </div>
    </div>

    <!-- MONTHLY TREND + TOP/BOTTOM split -->
    <div class="pd-row">
      <div class="panel pd-panel-wide">
        <div class="panel-header"><div class="panel-title">Monthly Profit Trend</div></div>
        ${i.length?`
        <div class="pd-chart">
          ${i.map(p=>{const y=Math.round(Math.abs(p.profit)/u*100),v=p.profit>=0?"var(--good)":"var(--bad)",h=p.month.split("-"),m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(h[1])-1];return`<div class="pd-bar-col">
              <div class="pd-bar-val" style="color:${v}">${S(p.profit)}</div>
              <div class="pd-bar-wrap"><div class="pd-bar" style="height:${y}%;background:${v}"></div></div>
              <div class="pd-bar-label">${m}</div>
              <div class="pd-bar-sub">${p.count} sales</div>
            </div>`}).join("")}
        </div>`:'<div class="pd-empty">No sales data yet</div>'}
      </div>

      <div class="pd-side-col">
        <!-- Top Performers -->
        <div class="panel">
          <div class="panel-header"><div class="panel-title">🏆 Top Earners</div></div>
          ${r.length?r.map((p,y)=>`
            <div class="pd-rank-item" onclick="openDrawer('${x(p.item.id)}')" style="cursor:pointer">
              <span class="pd-rank">${y+1}</span>
              <div class="pd-rank-info">
                <div class="pd-rank-name">${x(p.item.name)}</div>
                <div class="pd-rank-meta">${p.unitsSold} sold · ${Y(p.margin)} margin</div>
              </div>
              <span class="pd-rank-profit" style="color:var(--good)">${S(p.profit)}</span>
            </div>
          `).join(""):'<div class="pd-empty">No sales yet</div>'}
        </div>
        <!-- Bottom Performers -->
        <div class="panel">
          <div class="panel-header"><div class="panel-title">📉 Lowest Margin</div></div>
          ${l.length?l.map((p,y)=>`
            <div class="pd-rank-item" onclick="openDrawer('${x(p.item.id)}')" style="cursor:pointer">
              <span class="pd-rank">${y+1}</span>
              <div class="pd-rank-info">
                <div class="pd-rank-name">${x(p.item.name)}</div>
                <div class="pd-rank-meta">${p.unitsSold} sold · ${Y(p.margin)} margin</div>
              </div>
              <span class="pd-rank-profit" style="color:${p.profit<0?"var(--bad)":"var(--muted)"}">${S(p.profit)}</span>
            </div>
          `).join(""):'<div class="pd-empty">No sales yet</div>'}
        </div>
      </div>
    </div>

    <!-- PLATFORM & CATEGORY PROFIT side by side -->
    <div class="pd-row">
      <div class="panel">
        <div class="panel-header"><div class="panel-title">Profit by Platform</div></div>
        ${o.length?`<table class="pd-table">
          <thead><tr><th>Platform</th><th>Revenue</th><th>Fees</th><th>Profit</th><th>Margin</th><th>Sales</th></tr></thead>
          <tbody>${o.map(p=>`<tr>
            <td style="font-weight:600">${x(p.platform)}</td>
            <td>${S(p.revenue)}</td>
            <td style="color:var(--bad)">${S(p.fees+p.ship)}</td>
            <td style="color:${p.profit>=0?"var(--good)":"var(--bad)"}; font-weight:700">${S(p.profit)}</td>
            <td>${Y(p.margin)}</td>
            <td>${p.count}</td>
          </tr>`).join("")}</tbody>
        </table>`:'<div class="pd-empty">No sales yet</div>'}
      </div>
      <div class="panel">
        <div class="panel-header"><div class="panel-title">Profit by Category</div></div>
        ${a.length?`<table class="pd-table">
          <thead><tr><th>Category</th><th>Revenue</th><th>Profit</th><th>Margin</th><th>Items</th></tr></thead>
          <tbody>${a.map(p=>`<tr>
            <td style="font-weight:600">${x(p.category)}</td>
            <td>${S(p.revenue)}</td>
            <td style="color:${p.profit>=0?"var(--good)":"var(--bad)"}; font-weight:700">${S(p.profit)}</td>
            <td>${Y(p.margin)}</td>
            <td>${p.count}</td>
          </tr>`).join("")}</tbody>
        </table>`:'<div class="pd-empty">No sales yet</div>'}
      </div>
    </div>

    <!-- PER-ITEM PROFIT TABLE -->
    <div class="panel">
      <div class="panel-header">
        <div class="panel-title">Per-Item Profitability</div>
        <span style="font-size:10px;color:var(--muted)">${s.length} items</span>
      </div>
      ${s.length?`<div style="overflow-x:auto"><table class="pd-table">
        <thead><tr>
          <th class="pd-sortable" onclick="setProfitSort('name')">Item ${wt==="name"?Kt>0?"↑":"↓":""}</th>
          <th class="pd-sortable" onclick="setProfitSort('cost')">Cost ${wt==="cost"?Kt>0?"↑":"↓":""}</th>
          <th class="pd-sortable" onclick="setProfitSort('revenue')">Revenue ${wt==="revenue"?Kt>0?"↑":"↓":""}</th>
          <th class="pd-sortable" onclick="setProfitSort('units')">Units ${wt==="units"?Kt>0?"↑":"↓":""}</th>
          <th class="pd-sortable" onclick="setProfitSort('profit')">Profit ${wt==="profit"?Kt>0?"↑":"↓":""}</th>
          <th class="pd-sortable" onclick="setProfitSort('margin')">Margin ${wt==="margin"?Kt>0?"↑":"↓":""}</th>
          <th class="pd-sortable" onclick="setProfitSort('roi')">ROI ${wt==="roi"?Kt>0?"↑":"↓":""}</th>
        </tr></thead>
        <tbody>${s.slice(0,100).map(p=>`<tr onclick="openDrawer('${x(p.item.id)}')" style="cursor:pointer">
          <td>
            <div style="font-weight:600;font-size:12px">${x(p.item.name)}</div>
            <div style="font-size:10px;color:var(--muted)">${x(p.item.category||"")}${p.platforms.size?" · "+[...p.platforms].map(y=>x(y)).join(", "):""}</div>
          </td>
          <td>${S(p.cost)}</td>
          <td>${S(p.revenue)}</td>
          <td>${p.unitsSold}</td>
          <td style="color:${p.profit>=0?"var(--good)":"var(--bad)"};font-weight:700">${S(p.profit)}</td>
          <td><span class="margin-badge ${p.margin>=.5?"high":p.margin>=.2?"mid":"low"}">${Y(p.margin)}</span></td>
          <td>${p.roi>0?Y(p.roi):"—"}</td>
        </tr>`).join("")}</tbody>
      </table></div>`:'<div class="pd-empty">No sold items match your filters</div>'}
      ${s.length>100?`<div style="padding:8px;font-size:10px;color:var(--muted);text-align:center">Showing top 100 of ${s.length} items</div>`:""}
    </div>
  `}function Ty(t){Sn=t,_s()}function Py(t){mo=(t||"").trim(),_s()}function My(t){go=t||"",_s()}function Dy(t){yo=t||"",_s()}function Ly(t){wt===t?Kt*=-1:(wt=t,Kt=t==="name"?1:-1),_s()}let Qe="",kn="",En="";function Ay(t){Qe=(t||"").toLowerCase(),Nn()}function zy(t){kn=t||"",Nn()}function Ry(t){En=t||"",Nn()}function Fy(){Qe="",kn="",En="",Nn()}const Vf={"Shipping Supplies":"exp-shipping","Packaging Materials":"exp-packaging","Platform Fees":"exp-fees",Sourcing:"exp-sourcing",Storage:"exp-storage",Printing:"exp-printing",Software:"exp-software",Marketing:"exp-marketing",Returns:"exp-returns","Office Supplies":"exp-office",Other:"exp-other"};function Yf(){const t=document.getElementById("exp_date");t&&!t.value&&(t.value=ot())}function Oy(){const t=document.getElementById("exp_date").value,e=document.getElementById("exp_cat").value,n=document.getElementById("exp_desc").value.trim(),s=document.getElementById("exp_amt"),o=Lt(s.value,{allowZero:!1});if(isNaN(o)&&s.value.trim()!==""){Ie(s,{fieldName:"Amount"});return}if(!t){w("Please enter a date",!0);return}if(!n){w("Please enter a description",!0);return}if(!o||o<=0){w("Please enter a valid amount",!0);return}J.push({id:se(),date:t,category:e,description:n,amount:o}),O(),Nn(),document.getElementById("exp_desc").value="",document.getElementById("exp_amt").value="",bo.expense(),w("Expense added ✓")}async function Ny(t){if(!confirm("Delete this expense?"))return;const e=J.findIndex(n=>n.id===t);e>=0&&J.splice(e,1),O(),Nn(),w("Expense deleted"),await $s("ft_expenses",[t]),Ss()}function Nn(){var r;const t=((r=document.getElementById("expCatFilt"))==null?void 0:r.value)||"all",e=document.getElementById("expBody"),n=document.getElementById("expEmpty"),s=document.getElementById("expTotalLbl"),o=[...J].filter(l=>t==="all"||l.category===t).filter(l=>!Qe||(l.description||"").toLowerCase().includes(Qe)||(l.category||"").toLowerCase().includes(Qe)).filter(l=>!kn||l.date>=kn).filter(l=>!En||l.date<=En).sort((l,c)=>new Date(c.date)-new Date(l.date)),a=o.reduce((l,c)=>l+(c.amount||0),0);s&&(s.textContent=`${o.length} expense${o.length!==1?"s":""} · ${S(a)}`);const i=document.getElementById("expFilterBar");if(i&&(i.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 0">
      <input type="text" placeholder="Search expenses..." value="${x(Qe)}"
             oninput="setExpSearch(this.value)"
             style="flex:1;min-width:150px;padding:6px 10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;font-family:'DM Mono',monospace">
      <input type="date" value="${kn}" onchange="setExpDateFrom(this.value)" title="From date"
             style="padding:5px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:'DM Mono',monospace">
      <span style="color:var(--muted);font-size:11px">to</span>
      <input type="date" value="${En}" onchange="setExpDateTo(this.value)" title="To date"
             style="padding:5px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:'DM Mono',monospace">
      ${Qe||kn||En?`<button onclick="clearExpFilters()" style="padding:5px 10px;background:var(--surface);border:1px solid var(--border);color:var(--danger);font-size:11px;cursor:pointer;font-family:'DM Mono',monospace">Clear</button>`:""}
    </div>`),!o.length){e&&(e.innerHTML=""),n&&(n.style.display="block");return}n&&(n.style.display="none"),e.innerHTML=o.map(l=>{const c=Vf[l.category]||"exp-other",d=x(l.description),u=ge(l.description),p=ge(l.id);return`<tr>
      <td style="color:var(--muted);font-size:11px">${mt(l.date)}</td>
      <td title="${u}"><span class="exp-cat-badge ${c}">${x(l.category)}</span><span class="exp-desc-mobile"> · ${d}</span></td>
      <td title="${u}">${d}</td>
      <td style="text-align:right;font-family:'DM Mono',monospace;font-weight:600;color:var(--danger)">
        ${S(l.amount)}&nbsp;<button class="act-btn red exp-del-mobile" onclick="delExpense('${p}')" style="margin-left:4px;vertical-align:middle">✕</button>
      </td>
      <td style="text-align:right"><button class="act-btn red exp-del-desktop" onclick="delExpense('${p}')">✕</button></td>
    </tr>`}).join("")}let Le="monthly",ms=0;const gr={"Shipping Supplies":"exp-shipping","Packaging Materials":"exp-packaging","Platform Fees":"exp-fees",Sourcing:"exp-sourcing",Storage:"exp-storage",Printing:"exp-printing",Software:"exp-software",Marketing:"exp-marketing",Returns:"exp-returns","Office Supplies":"exp-office",Other:"exp-other"};function ac(){const t=document.getElementById("reportsContent");if(!t)return;const{start:e,end:n,label:s}=Jf(Le,ms),o=B.filter(D=>{const _=new Date(D.date);return _>=e&&_<=n}),a=J.filter(D=>{const _=new Date(D.date);return _>=e&&_<=n});let i=0,r=0,l=0;for(const D of o){const _=k.find(A=>A.id===D.itemId);i+=(D.price||0)*(D.qty||0),r+=_?(_.cost||0)*(D.qty||0):0,l+=(D.fees||0)+(D.ship||0)}const c=i-r-l,d=a.reduce((D,_)=>D+(_.amount||0),0),u=c-d,p=i?u/i:0,y={};for(const D of a)y[D.category]=(y[D.category]||0)+D.amount;const v=Qf(Le,e,n),h=`
    <div class="period-summary-grid">
      <div class="period-card">
        <div class="period-card-lbl">Revenue</div>
        <div class="period-card-val" style="color:var(--accent)">${S(i)}</div>
        <div class="period-card-sub">${o.length} sale${o.length!==1?"s":""}</div>
      </div>
      <div class="period-card">
        <div class="period-card-lbl">COGS + Fees</div>
        <div class="period-card-val" style="color:var(--warn)">${S(r+l)}</div>
        <div class="period-card-sub">cost of goods + platform fees</div>
      </div>
      <div class="period-card">
        <div class="period-card-lbl">Gross Profit</div>
        <div class="period-card-val" style="color:${c>=0?"var(--good)":"var(--danger)"}">${S(c)}</div>
        <div class="period-card-sub">before overhead expenses</div>
      </div>
      <div class="period-card">
        <div class="period-card-lbl">Expenses</div>
        <div class="period-card-val" style="color:var(--danger)">${S(d)}</div>
        <div class="period-card-sub">${a.length} expense${a.length!==1?"s":""}</div>
      </div>
      <div class="period-card" style="border-color:${u>=0?"var(--good)":"var(--danger)"}">
        <div class="period-card-lbl">Net Profit</div>
        <div class="period-card-val" style="color:${u>=0?"var(--good)":"var(--danger)"},font-size:22px">${S(u)}</div>
        <div class="period-card-sub">margin: ${(p*100).toFixed(1)}%</div>
      </div>
    </div>`,m={};for(const D of o){const _=k.find(G=>G.id===D.itemId),A=_?_.category||"Uncategorized":"Unknown";m[A]||(m[A]={revenue:0,cogs:0,fees:0,profit:0,count:0});const T=(D.price||0)*(D.qty||0),P=_?(_.cost||0)*(D.qty||0):0,R=(D.fees||0)+(D.ship||0);m[A].revenue+=T,m[A].cogs+=P,m[A].fees+=R,m[A].profit+=T-P-R,m[A].count++}const f=Object.entries(m).sort((D,_)=>_[1].profit-D[1].profit).map(([D,_])=>{const A=_.revenue>0?_.profit/_.revenue*100:0,T=A>=20?"var(--good)":A>=10?"var(--warn)":"var(--danger)",P=_.profit>=0?"var(--good)":"var(--danger)";return`<tr>
      <td style="font-weight:600">${x(D)}</td>
      <td style="text-align:center">${_.count}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--accent)">${S(_.revenue)}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--muted)">${S(_.cogs)}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--danger)">${S(_.fees)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:700;color:${P}">${S(_.profit)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:600;color:${T}">${A.toFixed(1)}%</td>
    </tr>`}).join(""),E=Object.entries(m).length?`
    <div class="period-section-ttl">Profit by Category</div>
    <div style="overflow-x:auto;margin-bottom:16px">
      <table class="inv-table">
        <thead><tr>
          <th>Category</th><th>Sales</th><th>Revenue</th><th>COGS</th><th>Fees</th><th>Profit</th><th>Margin</th>
        </tr></thead>
        <tbody>${f}</tbody>
      </table>
    </div>`:"",$={};for(const D of o){const _=D.platform||"Unknown";$[_]||($[_]={revenue:0,cogs:0,fees:0,profit:0,count:0});const A=k.find(G=>G.id===D.itemId),T=(D.price||0)*(D.qty||0),P=A?(A.cost||0)*(D.qty||0):0,R=(D.fees||0)+(D.ship||0);$[_].revenue+=T,$[_].cogs+=P,$[_].fees+=R,$[_].profit+=T-P-R,$[_].count++}const I=Object.entries($).sort((D,_)=>_[1].profit-D[1].profit).map(([D,_])=>{const A=_.revenue>0?_.profit/_.revenue*100:0,T=A>=20?"var(--good)":A>=10?"var(--warn)":"var(--danger)",P=_.profit>=0?"var(--good)":"var(--danger)";return`<tr>
      <td style="font-weight:600">${x(D)}</td>
      <td style="text-align:center">${_.count}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--accent)">${S(_.revenue)}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--muted)">${S(_.cogs)}</td>
      <td style="font-family:'DM Mono',monospace;color:var(--danger)">${S(_.fees)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:700;color:${P}">${S(_.profit)}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:600;color:${T}">${A.toFixed(1)}%</td>
    </tr>`}).join(""),M=Object.entries($).length?`
    <div class="period-section-ttl">Profit by Platform</div>
    <div style="overflow-x:auto;margin-bottom:16px">
      <table class="inv-table">
        <thead><tr>
          <th>Platform</th><th>Sales</th><th>Revenue</th><th>COGS</th><th>Fees</th><th>Profit</th><th>Margin</th>
        </tr></thead>
        <tbody>${I}</tbody>
      </table>
    </div>`:"",N=Object.entries(y).length?`
    <div class="period-section-ttl">Expense Breakdown</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-bottom:16px">
      ${Object.entries(y).sort((D,_)=>_[1]-D[1]).map(([D,_])=>{const A=gr[D]||"exp-other",T=d?(_/d*100).toFixed(0):0;return`<div class="period-card" style="flex-direction:row;display:flex;align-items:center;gap:10px;padding:10px 12px">
          <span class="exp-cat-badge ${A}" style="font-size:8px">${D}</span>
          <span style="font-family:'DM Mono',monospace;font-weight:700;font-size:13px;margin-left:auto">${S(_)}</span>
          <span style="font-size:9px;color:var(--muted)">${T}%</span>
        </div>`}).join("")}
    </div>`:"",W=v.length?`
    <div class="period-section-ttl">${Le==="monthly"?"Week by Week":"Day by Day"}</div>
    <div style="overflow-x:auto;margin-bottom:16px">
      <table class="inv-table">
        <thead><tr>
          <th>${Le==="monthly"?"Week":"Day"}</th>
          <th>Sales</th><th>Revenue</th><th>COGS+Fees</th>
          <th>Expenses</th><th>Gross</th><th>Net</th>
        </tr></thead>
        <tbody>${v}</tbody>
      </table>
    </div>`:"",L=o.length?`
    <div class="period-section-ttl">Sales This Period (${o.length})</div>
    <div style="overflow-x:auto">
      <table class="inv-table">
        <thead><tr><th>Item</th><th>Date</th><th>Qty</th><th>Price</th><th>Net Profit</th></tr></thead>
        <tbody>${[...o].sort((D,_)=>new Date(_.date)-new Date(D.date)).map(D=>{const _=F(D.itemId),A=(D.price||0)*(D.qty||0)-(_?(_.cost||0)*(D.qty||0):0)-(D.fees||0)-(D.ship||0);return`<tr>
            <td><div class="item-name" style="cursor:${_?"pointer":"default"}" ${_?`onclick="openDrawer('${x(_.id)}')"`:""}>${_?x(_.name):"Deleted Item"}</div></td>
            <td style="color:var(--muted);font-size:11px">${mt(D.date)}</td>
            <td>${D.qty}</td>
            <td>${S(D.price)}</td>
            <td style="font-weight:700;color:${A>=0?"var(--good)":"var(--danger)"}">${S(A)}</td>
          </tr>`}).join("")}</tbody>
      </table>
    </div>`:'<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px">No sales in this period.</div>',q=a.length?`
    <div class="period-section-ttl" style="margin-top:20px">Expenses This Period (${a.length})</div>
    <div style="overflow-x:auto">
      <table class="inv-table">
        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${[...a].sort((D,_)=>new Date(_.date)-new Date(D.date)).map(D=>{const _=gr[D.category]||"exp-other";return`<tr>
            <td style="color:var(--muted);font-size:11px">${mt(D.date)}</td>
            <td><span class="exp-cat-badge ${_}">${D.category}</span></td>
            <td>${x(D.description)}</td>
            <td style="text-align:right;font-family:'DM Mono',monospace;font-weight:600;color:var(--danger)">${S(D.amount)}</td>
          </tr>`}).join("")}</tbody>
      </table>
    </div>`:"";t.innerHTML=`
    <div class="panel" style="animation:none">
      <div class="panel-header" style="margin-bottom:0">
        <div class="panel-title">Reports</div>
        <button class="btn-secondary" style="font-size:11px" onclick="goToAddExpense()">+ Add Expense</button>
      </div>

      <!-- Mode tabs -->
      <div class="report-tabs" style="margin-top:14px">
        <button class="report-tab ${Le==="weekly"?"active":""}"  onclick="setReportMode('weekly')">Weekly</button>
        <button class="report-tab ${Le==="monthly"?"active":""}" onclick="setReportMode('monthly')">Monthly</button>
        <button class="report-tab" id="plTabBtn" onclick="showPLReport()">P&amp;L Statement</button>
      </div>

      <!-- Period nav -->
      <div class="period-nav">
        <button class="period-nav-btn" onclick="shiftPeriod(-1)">← Prev</button>
        <div class="period-label">${s}</div>
        <button class="period-nav-btn" onclick="shiftPeriod(1)" ${ms>=0?'disabled style="opacity:0.3;cursor:default"':""}>Next →</button>
      </div>

      ${h}
      ${E}
      ${M}
      ${N}
      ${W}
      ${L}
      ${q}
    </div>
    <div id="plReportContent" style="display:none"></div>`}function Uy(){const t=document.getElementById("reportsContent").querySelector(".panel");if(!t)return;t.querySelectorAll(".period-summary-grid, .period-section-ttl, .period-nav, .report-tabs + *");const e=document.getElementById("plTabBtn");if(e.classList.contains("active")){e.classList.remove("active"),document.getElementById("plReportContent").style.display="none",Xf(Le);return}document.querySelectorAll(".report-tab").forEach(s=>s.classList.remove("active")),e.classList.add("active"),Kf()}function Kf(){const t=document.getElementById("plReportContent");if(!t)return;const e=new Date;let n=0,s=0,o=0,a=0;for(const f of B){const E=k.find($=>$.id===f.itemId);n+=(f.price||0)*(f.qty||0),s+=E?(E.cost||0)*(f.qty||0):0,o+=f.fees||0,a+=f.ship||0}const i=n-s,r=J.reduce((f,E)=>f+(E.amount||0),0),l={};for(const f of J)l[f.category||"Other"]=(l[f.category||"Other"]||0)+(f.amount||0);const c=i-o-a-r,d=n>0?c/n:0,u=k.reduce((f,E)=>f+(E.cost||0)*(E.qty||0),0),p=k.reduce((f,E)=>f+(E.price||0)*(E.qty||0),0),y=[];for(let f=5;f>=0;f--){const E=new Date(e.getFullYear(),e.getMonth()-f,1),$=new Date(E.getFullYear(),E.getMonth(),1),I=new Date(E.getFullYear(),E.getMonth()+1,0,23,59,59),M=B.filter(_=>{const A=new Date(_.date);return A>=$&&A<=I}),N=M.reduce((_,A)=>_+(A.price||0)*(A.qty||0),0),W=M.reduce((_,A)=>{const T=k.find(P=>P.id===A.itemId);return _+(T?(T.cost||0)*(A.qty||0):0)},0),L=M.reduce((_,A)=>_+(A.fees||0)+(A.ship||0),0),q=J.filter(_=>{const A=new Date(_.date);return A>=$&&A<=I}).reduce((_,A)=>_+(A.amount||0),0),D=N-W-L-q;y.push({label:$.toLocaleString("default",{month:"short",year:"2-digit"}),revenue:N,cogs:W,fees:L,expenses:q,net:D,units:M.reduce((_,A)=>_+(A.qty||0),0)})}const v=(f,E,$=0,I=!1,M="")=>{const N=`padding:${I?"10px":"6px"} 0;${$?"padding-left:"+$*20+"px;":""}${I?"font-weight:700;border-top:1px solid var(--border);":""}`,W=`font-family:'DM Mono',monospace;font-weight:${I?"700":"600"};font-size:${I?"14px":"12px"};${M?"color:"+M:""}`;return`<div style="display:flex;justify-content:space-between;align-items:center;${N}">
      <span style="font-size:${I?"13px":"12px"}">${f}</span>
      <span style="${W}">${S(E)}</span>
    </div>`},h=Math.max(...y.map(f=>f.revenue),1);t.style.display="",t.innerHTML=`
    <div style="margin-top:16px">
      <!-- P&L Statement -->
      <div style="background:var(--surface2);border:1px solid var(--border);padding:20px 24px;margin-bottom:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:16px">Profit & Loss Statement</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px">All time · ${B.length} sales · ${k.length} items</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:22px;color:${c>=0?"var(--good)":"var(--danger)"}">${S(c)}</div>
            <div style="font-size:10px;color:var(--muted)">net profit · ${(d*100).toFixed(1)}% margin</div>
          </div>
        </div>

        <div style="font-size:10px;color:var(--accent);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600">Revenue</div>
        ${v("Sales Revenue",n,1)}
        ${v("Total Revenue",n,0,!0,"var(--accent)")}

        <div style="font-size:10px;color:var(--warn);text-transform:uppercase;letter-spacing:1.5px;margin:14px 0 8px;font-weight:600">Cost of Goods Sold</div>
        ${v("Product Cost (COGS)",s,1)}
        ${v("Total COGS",s,0,!0,"var(--warn)")}

        <div style="margin:14px 0;padding:12px 0;border-top:2px solid var(--border);border-bottom:1px solid var(--border)">
          ${v("Gross Profit",i,0,!0,i>=0?"var(--good)":"var(--danger)")}
          <div style="font-size:10px;color:var(--muted);margin-top:2px">Gross margin: ${n>0?(i/n*100).toFixed(1):"0.0"}%</div>
        </div>

        <div style="font-size:10px;color:var(--danger);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;font-weight:600">Operating Expenses</div>
        ${v("Platform Fees",o,1)}
        ${v("Shipping Costs",a,1)}
        ${Object.entries(l).sort((f,E)=>E[1]-f[1]).map(([f,E])=>v(f,E,1)).join("")}
        ${v("Total Expenses",o+a+r,0,!0,"var(--danger)")}

        <div style="margin-top:16px;padding-top:14px;border-top:2px solid var(--border)">
          ${v("Net Profit / (Loss)",c,0,!0,c>=0?"var(--good)":"var(--danger)")}
          <div style="font-size:10px;color:var(--muted);margin-top:2px">Net margin: ${(d*100).toFixed(1)}% · ROI: ${s>0?(c/s*100).toFixed(1):"—"}%</div>
        </div>
      </div>

      <!-- Inventory Position -->
      <div style="background:var(--surface2);border:1px solid var(--border);padding:18px 24px;margin-bottom:16px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:12px">Inventory Position</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Units In Stock</div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--accent)">${k.reduce((f,E)=>f+(E.qty||0),0)}</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Cost Basis</div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--warn)">${S(u)}</div>
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);padding:12px;text-align:center">
            <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Potential Revenue</div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--good)">${S(p)}</div>
          </div>
        </div>
      </div>

      <!-- Monthly Trend -->
      <div style="background:var(--surface2);border:1px solid var(--border);padding:18px 24px">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:12px">6-Month Trend</div>
        <div style="overflow-x:auto">
          <table class="inv-table" style="font-size:11px">
            <thead><tr>
              <th>Month</th><th>Units</th><th>Revenue</th><th>COGS</th><th>Fees+Ship</th><th>Expenses</th><th>Net</th>
            </tr></thead>
            <tbody>${y.map(f=>`<tr>
              <td style="font-weight:600">${f.label}</td>
              <td>${f.units}</td>
              <td style="color:var(--accent)">${S(f.revenue)}</td>
              <td style="color:var(--muted)">${S(f.cogs)}</td>
              <td style="color:var(--muted)">${S(f.fees)}</td>
              <td style="color:var(--danger)">${S(f.expenses)}</td>
              <td style="font-weight:700;color:${f.net>=0?"var(--good)":"var(--danger)"}">${S(f.net)}</td>
            </tr>`).join("")}</tbody>
          </table>
        </div>
        <!-- Mini bar chart -->
        <div style="display:flex;align-items:flex-end;gap:8px;height:60px;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
          ${y.map(f=>{const E=h>0?Math.max(f.revenue/h*56,2):2;return`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
              <div style="width:100%;background:${f.net>=0?"var(--accent)":"var(--danger)"};height:${E}px;opacity:0.7;transition:height 0.3s"></div>
              <div style="font-size:8px;color:var(--muted)">${f.label}</div>
            </div>`}).join("")}
        </div>
      </div>
    </div>`;const m=t.closest(".panel");if(m){m.querySelectorAll(".period-summary-grid, .period-nav, .period-section-ttl").forEach(E=>E.style.display="none");const f=m.querySelector(".period-nav");if(f){let E=f.nextElementSibling;for(;E&&E.id!=="plReportContent";)E.style.display="none",E=E.nextElementSibling}}}function Jf(t,e){const n=new Date;let s,o,a;if(t==="monthly"){const i=n.getFullYear(),r=n.getMonth()+e,l=new Date(i,r,1);s=new Date(l.getFullYear(),l.getMonth(),1),o=new Date(l.getFullYear(),l.getMonth()+1,0,23,59,59),a=s.toLocaleString("default",{month:"long",year:"numeric"})}else{const i=n.getDay(),r=new Date(n);r.setDate(n.getDate()-(i+6)%7+e*7),r.setHours(0,0,0,0);const l=new Date(r);l.setDate(r.getDate()+6),l.setHours(23,59,59,999),s=r,o=l,a=`${r.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${l.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`}return{start:s,end:o,label:a}}function Qf(t,e,n){if(t==="monthly"){const s=[];let o=new Date(e);for(o.setHours(0,0,0,0);o<=n;){let a=new Date(o);a.setDate(o.getDate()+6),a.setHours(23,59,59,999);const i=a>n?new Date(n):a,r=B.filter(m=>{const f=new Date(m.date);return f>=o&&f<=i}),l=J.filter(m=>{const f=new Date(m.date);return f>=o&&f<=i});let c=0,d=0,u=0;for(const m of r){const f=F(m.itemId);c+=(m.price||0)*(m.qty||0),d+=f?(f.cost||0)*(m.qty||0):0,u+=(m.fees||0)+(m.ship||0)}const p=c-d-u,y=l.reduce((m,f)=>m+(f.amount||0),0),v=p-y,h=`${o.toLocaleDateString("en-US",{month:"short",day:"numeric"})}–${i.toLocaleDateString("en-US",{day:"numeric"})}`;if(s.push(`<tr>
        <td style="font-size:11px;color:var(--muted)">${h}</td>
        <td>${r.length}</td>
        <td>${S(c)}</td>
        <td style="color:var(--muted)">${S(d+u)}</td>
        <td style="color:var(--danger)">${y>0?S(y):"—"}</td>
        <td style="color:${p>=0?"var(--good)":"var(--danger)"}">${S(p)}</td>
        <td style="font-weight:700;color:${v>=0?"var(--good)":"var(--danger)"}">${S(v)}</td>
      </tr>`),o=new Date(a),o.setDate(a.getDate()+1),o.setHours(0,0,0,0),s.length>8)break}return s.join("")}else{const s=[];for(let o=0;o<7;o++){const a=new Date(e);a.setDate(e.getDate()+o);const i=new Date(a);i.setHours(23,59,59,999);const r=B.filter(m=>{const f=new Date(m.date);return f>=a&&f<=i}),l=J.filter(m=>{const f=new Date(m.date);return f>=a&&f<=i});let c=0,d=0,u=0;for(const m of r){const f=F(m.itemId);c+=(m.price||0)*(m.qty||0),d+=f?(f.cost||0)*(m.qty||0):0,u+=(m.fees||0)+(m.ship||0)}const p=c-d-u,y=l.reduce((m,f)=>m+(f.amount||0),0),v=p-y,h=a.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});s.push(`<tr>
        <td style="font-size:11px;color:var(--muted)">${h}</td>
        <td>${r.length}</td>
        <td>${c>0?S(c):"—"}</td>
        <td style="color:var(--muted)">${d+u>0?S(d+u):"—"}</td>
        <td style="color:var(--danger)">${y>0?S(y):"—"}</td>
        <td style="color:${p>0?"var(--good)":p<0?"var(--danger)":"var(--muted)"}">${c>0?S(p):"—"}</td>
        <td style="font-weight:700;color:${v>0?"var(--good)":v<0?"var(--danger)":"var(--muted)"}">${c>0||y>0?S(v):"—"}</td>
      </tr>`)}return s.join("")}}function Xf(t){Le=t,ms=0;const e=document.getElementById("plTabBtn");e&&e.classList.remove("active"),ac()}function qy(t){ms=Math.min(0,ms+t),ac()}function jy(){switchView("expenses",null),Yf()}let xe=null,ba=null;async function Hy(t){if(!confirm("Remove this sale? Stock will be restored."))return;const e=B.find(o=>o.id===t);if(!e)return;xe={...e};const n=F(e.itemId);n&&(n.qty+=e.qty||0,j("inv",n.id));const s=B.findIndex(o=>o.id===t);s!==-1&&B.splice(s,1),O(),V(),it(),renderSalesView(),Zf(),clearTimeout(ba),ba=setTimeout(()=>em(),8e3)}function Zf(){const t=document.getElementById("toast");if(!t)return;t.textContent="";const e=document.createElement("span");e.textContent="Sale removed, stock restored ";const n=document.createElement("button");n.textContent="Undo",n.style.cssText="margin-left:10px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:3px 12px;border-radius:4px;cursor:pointer;font-family:Syne,sans-serif;font-weight:700;font-size:11px",n.onclick=()=>tm(),t.appendChild(e),t.appendChild(n),t.classList.add("on"),t.classList.remove("err")}function tm(){if(!xe)return;clearTimeout(ba),B.push(xe);const t=F(xe.itemId);t&&(t.qty-=xe.qty||0,t.qty<0&&(t.qty=0),j("inv",t.id)),xe=null,O(),V(),it(),renderSalesView(),w("Sale restored ✓")}async function em(){if(!xe)return;const t=xe.id;xe=null,await $s("ft_sales",[t]);try{await Xr()}catch(e){console.warn("FlipTrack: inv push after sale delete failed:",e.message),w("⚠ Cloud sync failed — will retry",!0)}}async function Wy(t){const e=k.find(n=>n.id===t);confirm(`Delete "${e==null?void 0:e.name}"?`)&&(ai(t),K.delete(t),O(),V(),it(),w("Item deleted — check 🗑️ to restore"),await $s("ft_inventory",[t]),Ss())}function Gy(){const t=document.getElementById("breakdownContent");if(!k.length){t.innerHTML='<div class="bd-empty">📦 No inventory yet. Add items to see your breakdown.</div>';return}const e=k.reduce((h,m)=>h+(m.price||0)*(m.qty||0),0),n=k.reduce((h,m)=>h+(m.qty||0),0),s=k.length,o=k.reduce((h,m)=>h+(m.cost||0)*(m.qty||0),0),a=k.reduce((h,m)=>{const{pu:f}=qt(m);return h+f*(m.qty||0)},0),i=e?a/e:0,r=new Map;k.forEach(h=>{const m=(h.category||"").trim();if(m){const f=m.toLowerCase();r.has(f)||r.set(f,m)}});const l=h=>r.get((h||"").toLowerCase())||h||d,c={},d="(Uncategorized)";for(const h of k){const m=h.category?l(h.category):d,f=h.subcategory||"",{pu:E}=qt(h),$=(h.price||0)*(h.qty||0),I=(h.cost||0)*(h.qty||0),M=E*(h.qty||0);c[m]||(c[m]={value:0,units:0,items:0,cost:0,profit:0,subs:{}}),c[m].value+=$,c[m].units+=h.qty||0,c[m].items+=1,c[m].cost+=I,c[m].profit+=M,f&&(c[m].subs[f]||(c[m].subs[f]={value:0,units:0,items:0,cost:0,profit:0}),c[m].subs[f].value+=$,c[m].subs[f].units+=h.qty||0,c[m].subs[f].items+=1,c[m].subs[f].cost+=I,c[m].subs[f].profit+=M)}const u=Object.entries(c).sort((h,m)=>m[1].value-h[1].value),p=`<div class="bd-col-headers">
    <div></div>
    <div class="bd-col-hdr" style="text-align:left">Category</div>
    <div class="bd-col-hdr">Value</div>
    <div class="bd-col-hdr">Cost Basis</div>
    <div class="bd-col-hdr">Units</div>
    <div class="bd-col-hdr">Items</div>
    <div class="bd-col-hdr">Avg Margin</div>
  </div>`,y=["#57c8ff","#ff6b35","#7b61ff","#57ff9a","#ffb800","#00bcff","#ff4757","#3cb371"],v=u.map(([h,m],f)=>{const E=e?(m.value/e*100).toFixed(1):0,$=m.value?m.profit/m.value:0,I=y[f%y.length],M=Object.keys(m.subs).length>0,N=M?Object.entries(m.subs).sort((W,L)=>L[1].value-W[1].value).map(([W,L])=>{const q=L.value?L.profit/L.value:0;return`<div class="bd-sub-row" onclick="filterToSubcat('${h.replace(/'/g,"\\'")}','${W.replace(/'/g,"\\'")}')">
              <div></div>
              <div>
                <div class="bd-sub-name clickable">↳ ${x(W)}</div>
                <div style="font-size:9px;color:var(--muted);margin-top:2px">${L.items} item${L.items!==1?"s":""}</div>
                <div class="bd-mobile-stats">
                  <span>${S(L.cost)} cost</span>
                  <span>${L.units} units</span>
                  <span class="margin-badge ${wn(q)}">${Y(q)}</span>
                </div>
              </div>
              <div class="bd-col-val">${S(L.value)}</div>
              <div class="bd-col-val" style="color:var(--muted)">${S(L.cost)}</div>
              <div class="bd-col-units">${L.units}</div>
              <div class="bd-col-units">${L.items}</div>
              <div class="bd-col-m"><span class="margin-badge ${wn(q)}">${Y(q)}</span></div>
            </div>`}).join(""):"";return`<div class="bd-cat-block">
      <div class="bd-cat-row ${M?"has-subs":""}" onclick="${M?`toggleBdSubs('bdsub-${f}')`:`filterToCat('${h.replace(/'/g,"\\'")}')`}">
        <div class="bd-cat-chevron${M?" open-ready":""}">
          ${M?"›":""}
        </div>
        <div>
          <div class="bd-cat-name">${x(h)}</div>
          <div class="bd-cat-bar-wrap" style="width:120px">
            <div class="bd-cat-bar-fill" style="width:${E}%;background:${I}"></div>
          </div>
          <div style="font-size:9px;color:var(--muted);margin-top:2px">${E}% of total value · ${m.items} item${m.items!==1?"s":""}</div>
          <div class="bd-mobile-stats">
            <span>${S(m.cost)} cost</span>
            <span>${m.units} units</span>
            <span class="margin-badge ${wn($)}">${Y($)}</span>
          </div>
        </div>
        <div class="bd-col-val" style="color:${I}">${S(m.value)}</div>
        <div class="bd-col-val" style="color:var(--muted)">${S(m.cost)}</div>
        <div class="bd-col-units">${m.units}</div>
        <div class="bd-col-units">${m.items}</div>
        <div class="bd-col-m"><span class="margin-badge ${wn($)}">${Y($)}</span></div>
      </div>
      ${M?`<div class="bd-sub-table" id="bdsub-${f}">${N}</div>`:""}
    </div>`}).join("");t.innerHTML=`
    <div class="panel" style="animation:none;margin-bottom:16px">
      <div class="breakdown-header">
        <div>
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:6px">Total Inventory Value</div>
          <div class="breakdown-total">${S(e)}</div>
          <div class="breakdown-sub">${s} items · ${n} units in stock · avg ${Y(i)} margin</div>
        </div>
        <button class="btn-secondary" onclick="goToBreakdown()" style="font-size:11px">↺ Refresh</button>
      </div>
      <div class="bd-summary-grid">
        <div class="bd-sum-card">
          <div class="bd-sum-lbl">Total Value</div>
          <div class="bd-sum-val" style="color:var(--accent)">${S(e)}</div>
          <div class="bd-sum-sub">${n} units @ list price</div>
        </div>
        <div class="bd-sum-card">
          <div class="bd-sum-lbl">Cost Basis</div>
          <div class="bd-sum-val" style="color:var(--warn)">${S(o)}</div>
          <div class="bd-sum-sub">Total invested</div>
        </div>
        <div class="bd-sum-card">
          <div class="bd-sum-lbl">Potential Profit</div>
          <div class="bd-sum-val" style="color:var(--good)">${S(a)}</div>
          <div class="bd-sum-sub">If all sold at list price</div>
        </div>
        <div class="bd-sum-card">
          <div class="bd-sum-lbl">Categories</div>
          <div class="bd-sum-val">${u.length}</div>
          <div class="bd-sum-sub">across ${s} items</div>
        </div>
      </div>
    </div>
    <div class="panel" style="animation:none">
      <div class="panel-header">
        <div class="panel-title">By Category</div>
        <span style="font-size:10px;color:var(--muted)">Click a category to filter inventory · click ↳ subcategory to drill down</span>
      </div>
      ${p}
      ${v}
    </div>`,t.innerHTML}function Vy(t){var s;const e=document.getElementById(t);if(!e)return;e.classList.toggle("open");const n=e.previousElementSibling;(s=n==null?void 0:n.querySelector(".bd-cat-chevron"))==null||s.classList.toggle("open")}function Yy(t){uo("all"),uo(t),Zl("all",null),ec("all",null),tc("all"),window.switchView&&window.switchView("inventory",null),window.bnav&&window.bnav("bn-inventory"),Xl()}function Ky(t,e){uo("all"),uo(t),Zl(e,null),ec("all",null),tc("all"),window.switchView&&window.switchView("inventory",null),window.bnav&&window.bnav("bn-inventory"),Xl()}let Ne=[];async function Jy(){try{const t=await gt("listing_templates");Array.isArray(t)?Ne=t:Ne=[...yr]}catch{Ne=[...yr]}}async function ic(){try{await et("listing_templates",Ne)}catch(t){console.warn("FlipTrack: template save failed:",t.message)}}function nm(t){return Ne}function sm(t){const e={id:se(),name:t.name||"Untitled Template",category:t.category||"All",titleFormula:t.titleFormula||"{name}",descriptionTemplate:t.descriptionTemplate||"",platforms:t.platforms||[],tags:t.tags||[],createdAt:Date.now(),isDefault:!1};return Ne.push(e),ic(),e}function om(t){const e=Ne.findIndex(n=>n.id===t);return e===-1?!1:(Ne.splice(e,1),ic(),!0)}const yr=[{id:"tpl-clothing",name:"Clothing — Standard",category:"Clothing",titleFormula:"{name} - {condition} - {subcategory}",descriptionTemplate:`{name}

Condition: {condition}
Category: {category} > {subcategory}
{notes}

Ships fast! Bundle and save. Check out my other listings!`,platforms:[],tags:["clothing","apparel"],isDefault:!0},{id:"tpl-books",name:"Books — Standard",category:"Books",titleFormula:"{name} by {author} - {condition}",descriptionTemplate:`{name}
Author: {author}
ISBN: {isbn}
Condition: {condition}

{notes}

Ships in 1-2 business days. Check my store for more titles!`,platforms:[],tags:["books","reading"],isDefault:!0},{id:"tpl-electronics",name:"Electronics — Standard",category:"Electronics",titleFormula:"{name} - {condition} - Tested & Working",descriptionTemplate:`{name}

Condition: {condition}
UPC: {upc}

{notes}

Tested and verified working. Ships securely padded.
Dimensions: {dimensions}
Weight: {weight}`,platforms:[],tags:["electronics","tech"],isDefault:!0},{id:"tpl-general",name:"General — All Categories",category:"All",titleFormula:"{name} - {condition}",descriptionTemplate:`{name}

Condition: {condition}
{notes}

Fast shipping! Bundle discounts available.`,platforms:[],tags:["general"],isDefault:!0},{id:"tpl-ebay-seo",name:"eBay SEO Optimized",category:"All",titleFormula:"{name} {condition} {category} {subcategory} Ships Free",descriptionTemplate:`{name}

▸ Condition: {condition}
▸ Category: {category}
▸ UPC: {upc}

{notes}

★ FAST & FREE SHIPPING ★
★ 30-DAY RETURNS ★
★ CHECK MY OTHER LISTINGS ★`,platforms:["eBay"],tags:["ebay","seo"],isDefault:!0},{id:"tpl-posh",name:"Poshmark Style",category:"Clothing",titleFormula:"{name} {subcategory} {condition}",descriptionTemplate:`{name}

{condition} condition
{notes}

❤ Bundle for discount!
❤ Offers welcome!
❤ Ships next business day!`,platforms:["Poshmark"],tags:["poshmark","fashion"],isDefault:!0},{id:"tpl-whatnot-auction",name:"Whatnot — Auction",category:"All",titleFormula:"{name} - {condition}",descriptionTemplate:`{name}
{condition} condition
{notes}`,platforms:["Whatnot"],tags:["whatnot","auction","live"],isDefault:!0},{id:"tpl-whatnot-fixed",name:"Whatnot — Fixed Price",category:"All",titleFormula:"{name} - {condition} - {subcategory}",descriptionTemplate:`{name}

Condition: {condition}
Category: {category} > {subcategory}
{notes}

Ships fast! Check my store for more.`,platforms:["Whatnot"],tags:["whatnot","fixed","store"],isDefault:!0}];let ue=0;const Qs=25;let vo="",gs="all",le="none",wa=null,Xs=null,Xe=null,Me=null,ys="all",ve=null,Bo=!1,Ut="shows",xa="",$a="",Sa="",ka="",ne=new Set,De="overview";function U(){const t=document.getElementById("crosslistContent");if(!t)return;yd();const e=k.filter(i=>(i.qty||0)>0),n=vd(e),s=Cr(e,7),o=Fn(e);let a="";if(a+=hm(),a+=lm(),a+=fm(),a+=`<div class="cl-stats-strip">
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--good)">${n.totalActive}</div><div class="cl-stat-lbl">Active</div></div>
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--warn)">${n.totalExpiringSoon}</div><div class="cl-stat-lbl">Expiring Soon</div></div>
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--danger)">${n.totalExpired}</div><div class="cl-stat-lbl">Expired</div></div>
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--accent2)">${n.totalSoldElsewhere}</div><div class="cl-stat-lbl">Sold Elsewhere</div></div>
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--muted)">${n.itemsNotListed}</div><div class="cl-stat-lbl">Not Listed</div></div>
    <div class="cl-stat"><div class="cl-stat-val" style="color:var(--accent3)">${n.itemsSinglePlatform}</div><div class="cl-stat-lbl">Single Platform</div></div>
  </div>`,a+=`<div class="cl-tabs">
    <button class="cl-tab ${De==="overview"?"active":""}" onclick="clSwitchTab('overview')">Overview</button>
    <button class="cl-tab ${De==="matrix"?"active":""}" onclick="clSwitchTab('matrix')">Listing Matrix</button>
    <button class="cl-tab ${De==="templates"?"active":""}" onclick="clSwitchTab('templates')">Templates</button>
  </div>`,De==="overview"?a+=am(e,s,o,n):De==="matrix"?a+=im(e):De==="templates"&&(a+=rm()),t.innerHTML=a,De==="matrix"){const i=document.getElementById("clPagination"),r=rc(e);i&&Is(i,{page:ue,totalItems:r.length,pageSize:Qs,onPage:l=>{ue=l,U()}})}}function am(t,e,n,s){let o="";if(e.length){o+=`<div class="cl-section">
      <h3 class="cl-section-title" style="color:var(--warn)">⏰ Expiring Soon (${e.length})</h3>
      <div class="cl-cards">`;for(const{item:a,platform:i,daysLeft:r,expiryDate:l}of e.slice(0,10))o+=`<div class="cl-card cl-card-warn">
        <div class="cl-card-header">
          <span class="cl-card-name" onclick="openDrawer('${a.id}')">${x(a.name)}</span>
          <span class="cl-card-days">${r}d left</span>
        </div>
        <div class="cl-card-plat">${x(i)}</div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="clRelistItem('${a.id}','${x(i)}')">Relist</button>
          <button class="btn-sm btn-muted" onclick="clOpenLink('${x(i)}','${a.id}')">Open →</button>
        </div>
      </div>`;o+="</div></div>"}if(n.length){o+=`<div class="cl-section">
      <h3 class="cl-section-title" style="color:var(--danger)">🚫 Expired Listings (${n.length})</h3>
      <button class="btn-sm btn-accent" style="margin-bottom:8px" onclick="clBulkRelistExpired()">Relist All Expired</button>
      <div class="cl-cards">`;for(const{item:a,platform:i,expiryDate:r}of n.slice(0,12)){const l=Math.ceil((Date.now()-new Date(r).getTime())/864e5);o+=`<div class="cl-card cl-card-danger">
        <div class="cl-card-header">
          <span class="cl-card-name" onclick="openDrawer('${a.id}')">${x(a.name)}</span>
          <span class="cl-card-days">${l}d ago</span>
        </div>
        <div class="cl-card-plat">${x(i)}</div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="clRelistItem('${a.id}','${x(i)}')">Relist</button>
          <button class="btn-sm btn-danger" onclick="clDelistItem('${a.id}','${x(i)}')">Delist</button>
        </div>
      </div>`}o+="</div></div>"}if(o+=`<div style="padding:12px;background:var(--surface);border-bottom:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <div style="font-size:12px;font-weight:600;color:var(--text)">Auto-Relist</div>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
        <input type="checkbox" ${Ji()?"checked":""} onchange="clToggleAutoRelist(this.checked)" style="cursor:pointer">
        <span style="font-size:11px;color:var(--muted)">${Ji()?"Enabled":"Disabled"}</span>
      </label>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Automatically relist expired listings on renewable platforms (eBay, Etsy, Facebook, etc.)</div>
    <button onclick="clRunAutoRelist()" class="btn-secondary" style="width:100%;height:32px;font-size:11px">Run Auto-Relist Now (${wd().length} candidates)</button>
  </div>`,o+=`<div style="padding:12px;background:var(--surface);border-bottom:1px solid var(--border)">
    <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:8px">Bulk Price Adjustment</div>
    <div class="form-grid" style="gap:6px">
      <select id="clBulkCat" class="fgrp" style="grid-column:1/-1">
        <option value="">All Categories</option>
        ${[...new Set(k.filter(a=>a.category).map(a=>a.category))].sort().map(a=>`<option value="${x(a)}">${x(a)}</option>`).join("")}
      </select>
      <select id="clBulkPlat" class="fgrp" style="grid-column:1/-1">
        <option value="">All Platforms</option>
        ${Object.keys(wo).slice(0,15).map(a=>`<option value="${x(a)}">${x(a)}</option>`).join("")}
      </select>
      <select id="clBulkType" class="fgrp">
        <option value="percent">% Change</option>
        <option value="fixed">$ Change</option>
      </select>
      <input id="clBulkVal" type="number" placeholder="-10" step="1" class="fgrp">
      <input id="clBulkMinDays" type="number" placeholder="Min days listed" class="fgrp" style="grid-column:1/-1">
      <button onclick="clBulkPrice()" class="btn-primary" style="grid-column:1/-1;height:32px;font-size:11px">Apply Bulk Pricing</button>
    </div>
  </div>`,s.itemsNotListed>0){const a=t.filter(i=>Z(i).length===0).slice(0,8);o+=`<div class="cl-section">
      <h3 class="cl-section-title" style="color:var(--muted)">📦 Not Listed Anywhere (${s.itemsNotListed})</h3>
      <div class="cl-cards">`;for(const i of a)o+=`<div class="cl-card">
        <div class="cl-card-header">
          <span class="cl-card-name" onclick="openDrawer('${i.id}')">${x(i.name)}</span>
          <span class="cl-card-days">${S(i.price||0)}</span>
        </div>
        <div class="cl-card-plat" style="color:var(--muted)">No platforms assigned</div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="openDrawer('${i.id}')">Edit & List</button>
        </div>
      </div>`;o+="</div></div>"}if(s.itemsSinglePlatform>0){const a=t.filter(i=>Z(i).length===1).slice(0,6);o+=`<div class="cl-section">
      <h3 class="cl-section-title" style="color:var(--accent3)">☝ Single Platform (${s.itemsSinglePlatform})</h3>
      <p style="color:var(--muted);font-size:12px;margin-bottom:8px">These items could reach more buyers if crosslisted</p>
      <div class="cl-cards">`;for(const i of a){const r=Z(i)[0];o+=`<div class="cl-card">
        <div class="cl-card-header">
          <span class="cl-card-name" onclick="openDrawer('${i.id}')">${x(i.name)}</span>
          <span class="cl-card-days">${x(r)}</span>
        </div>
        <div class="cl-card-actions">
          <button class="btn-sm btn-accent" onclick="openDrawer('${i.id}')">Add Platforms</button>
        </div>
      </div>`}o+="</div></div>"}return!e.length&&!n.length&&s.itemsNotListed===0&&(o+=`<div class="cl-section" style="text-align:center;padding:32px">
      <div style="font-size:24px;margin-bottom:8px">✨</div>
      <div style="color:var(--good);font-weight:600;font-size:14px;margin-bottom:4px">All Listings Healthy</div>
      <div style="color:var(--muted);font-size:12px">No expired or expiring listings. Check the Matrix tab for a full status overview.</div>
    </div>`),o}function rc(t){let e=t;if(vo){const n=vo.toLowerCase();e=e.filter(s=>s.name.toLowerCase().includes(n)||(s.sku||"").toLowerCase().includes(n))}return gs!=="all"&&(e=e.filter(n=>Z(n).includes(gs))),ys!=="all"&&(e=e.filter(n=>{const s=n.platformStatus||{};return Object.values(s).includes(ys)})),e}function im(t){var r;const e=new Set;for(const l of t)for(const c of Z(l))e.add(c);const n=[...e].sort();let s="";s+=`<div class="cl-filters">
    <input type="text" placeholder="Search items..." value="${x(vo)}"
           oninput="clSetSearch(this.value)"
           class="cl-filter-input">
    <select onchange="clSetPlatFilter(this.value)" class="cl-filter-select">
      <option value="all" ${gs==="all"?"selected":""}>All Platforms</option>
      ${n.map(l=>`<option value="${x(l)}" ${gs===l?"selected":""}>${x(l)}</option>`).join("")}
    </select>
    <select onchange="clSetStatusFilter(this.value)" class="cl-filter-select">
      <option value="all" ${ys==="all"?"selected":""}>All Statuses</option>
      ${La.map(l=>`<option value="${l}" ${ys===l?"selected":""}>${oo[l]}</option>`).join("")}
    </select>
  </div>`;const o=rc(t),a=Math.ceil(o.length/Qs);ue>=a&&(ue=Math.max(0,a-1));const i=o.slice(ue*Qs,(ue+1)*Qs);if(!i.length)return s+='<div style="text-align:center;padding:24px;color:var(--muted)">No items match filters</div>',s;s+='<div class="cl-matrix-list">';for(const l of i){const c=Z(l),d=l.platformStatus||{},u=l.platformListingDates||{};Br(l),s+=`<div class="cl-matrix-item">
      <div class="cl-matrix-header" onclick="openDrawer('${l.id}')">
        <span class="cl-matrix-name">${x(l.name)}</span>
        <span class="cl-matrix-meta">${S(l.price||0)} · Qty: ${l.qty||0}</span>
      </div>
      <div class="cl-matrix-platforms">`;for(const p of c){let y=d[p]||"active";p==="eBay"&&(l.ebayItemId?l.ebayListingId||(y="draft"):y="unlisted");const v=Ir(p,u[p]),h=v!==null?v<0?`<span style="color:var(--danger)">${Math.abs(v)}d expired</span>`:v<=7?`<span style="color:var(--warn)">${v}d left</span>`:`<span style="color:var(--muted)">${v}d</span>`:"",m=p==="eBay"&&!l.ebayItemId&&ft(),f=p==="eBay"&&l.ebayItemId&&!l.ebayListingId&&ft(),E=m?"Not on eBay yet":f?"Draft — not published":oo[y]||y,I=["Poshmark","Mercari","Depop","Grailed","Facebook Marketplace","StockX","GOAT","Vinted"].includes(p),M=(r=l.crosslistCache)==null?void 0:r[p];s+=`<div class="cl-plat-row">
          <div class="cl-plat-info">
            <span class="cl-plat-dot" style="background:${m||f?"var(--warn)":ao[y]||"var(--muted)"}"></span>
            <span class="cl-plat-name">${x(p)}</span>
            <span class="cl-plat-status">${x(E)}</span>
            ${h}
          </div>
          <div class="cl-plat-actions">
            ${m?`<button class="btn-xs btn-accent" onclick="clPushToEBay('${l.id}')">List on eBay</button>`:""}
            ${f?`<button class="btn-xs btn-accent" onclick="clPublishOnEBay('${l.id}')">Publish</button>`:""}
            ${I?`<button class="btn-xs btn-accent" onclick="clAICopy('${l.id}','${x(p)}')" title="Generate AI listing optimized for ${x(p)} and copy to clipboard">✨ ${M?"Copy":"AI Copy"}</button>`:""}
            <button class="btn-xs" onclick="clCycleStatus('${l.id}','${x(p)}')" title="Change status">⟳</button>
            <button class="btn-xs" onclick="clCopyListing('${l.id}')" title="Copy listing text">📋</button>
            <button class="btn-xs" onclick="clOpenLink('${x(p)}','${l.id}')" title="Open platform">↗</button>
            ${y==="expired"?`<button class="btn-xs btn-accent" onclick="clRelistItem('${l.id}','${x(p)}')">Relist</button>`:""}
          </div>
        </div>`}ft()&&!l.ebayItemId&&!c.includes("eBay")&&(s+=`<div class="cl-plat-row" style="border-top:1px dashed var(--border)">
        <div class="cl-plat-info" style="color:var(--accent)">
          <span class="cl-plat-name">eBay</span>
          <span class="cl-plat-status" style="color:var(--muted)">Not listed</span>
        </div>
        <div class="cl-plat-actions">
          <button class="btn-xs btn-accent" onclick="clPushToEBay('${l.id}')">List on eBay</button>
        </div>
      </div>`),ct()&&!c.includes("Etsy")&&(s+=`<div class="cl-plat-row" style="border-top:1px dashed var(--border)">
        <div class="cl-plat-info" style="color:#f56400">
          <span class="cl-plat-name">Etsy</span>
          <span class="cl-plat-status" style="color:var(--muted)">Not listed</span>
        </div>
        <div class="cl-plat-actions">
          <button class="btn-xs btn-etsy" onclick="clPushToEtsy('${l.id}')">List on Etsy</button>
        </div>
      </div>`),!c.length&&!ft()&&!ct()&&(s+=`<div class="cl-plat-row" style="color:var(--muted);font-style:italic">No platforms — <span onclick="openDrawer('${l.id}')" style="color:var(--accent);cursor:pointer">add some</span></div>`),s+="</div></div>"}return s+="</div>",s+='<div id="clPagination"></div>',s}function rm(){const t=nm();let e=`<div class="cl-section">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h3 class="cl-section-title" style="margin:0">Listing Templates</h3>
      <button class="btn-sm btn-accent" onclick="clAddTemplate()">+ New Template</button>
    </div>
    <p style="color:var(--muted);font-size:12px;margin-bottom:12px">Templates auto-fill title & description when listing. Use placeholders: {name}, {condition}, {category}, {price}, {notes}, {upc}, {author}, {isbn}</p>`;if(!t.length)e+='<div style="text-align:center;padding:24px;color:var(--muted)">No templates yet. Click "+ New Template" to create one.</div>';else{e+='<div class="cl-template-grid">';for(const n of t)e+=`<div class="cl-template-card">
        <div class="cl-template-header">
          <span class="cl-template-name">${x(n.name)}</span>
          ${n.isDefault?'<span class="cl-template-badge">Default</span>':`<button class="btn-xs btn-danger" onclick="clDeleteTemplate('${n.id}')">✕</button>`}
        </div>
        <div class="cl-template-category">${x(n.category||"All Categories")}</div>
        <div class="cl-template-preview">
          <div style="font-weight:600;font-size:11px;color:var(--accent);margin-bottom:2px">Title:</div>
          <div style="font-size:11px;color:var(--text)">${x(n.titleFormula)}</div>
          <div style="font-weight:600;font-size:11px;color:var(--accent);margin-top:6px;margin-bottom:2px">Description:</div>
          <div style="font-size:10px;color:var(--muted);white-space:pre-line;max-height:60px;overflow:hidden">${x((n.descriptionTemplate||"").slice(0,150))}</div>
        </div>
      </div>`;e+="</div>"}return e+="</div>",e}function Qy(t){De=t,ue=0,U()}function Xy(t){vo=t||"",ue=0,U()}function Zy(t){gs=t||"all",ue=0,U()}function tv(t){ys=t||"all",ue=0,U()}function ev(t,e){xo(t,e),O(),V(),w(`Relisted on ${e} ✓`),U()}function nv(t,e){Tt(t,e,"delisted"),O(),V(),w(`Delisted from ${e}`),U()}function sv(t,e){const n=k.find(r=>r.id===t);if(!n)return;const o=(n.platformStatus||{})[e]||"active",a=["active","sold","delisted","expired","draft"],i=a[(a.indexOf(o)+1)%a.length];Tt(t,e,i),i==="active"&&qe(t,e,ot()),O(),V(),U()}function ov(t,e){const n=k.find(o=>o.id===e);if(!n)return;const s=ul(t,n);window.open(s,"_blank")}function av(t){const e=k.find(n=>n.id===t);e&&gu(e)}function iv(){const t=k.filter(n=>(n.qty||0)>0),e=Fn(t);if(!e.length){w("No expired listings to relist");return}if(confirm(`Relist ${e.length} expired listing(s)?`)){for(const{item:n,platform:s}of e)xo(n.id,s);O(),V(),w(`${e.length} listing(s) relisted ✓`),U()}}function rv(){const t="clTemplateModal-"+Date.now(),e=`<div id="${t}" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:var(--z-modal)" onclick="if(event.target.id==='${t}') document.getElementById('${t}').remove()">
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:20px;max-width:500px;width:90%;max-height:80vh;overflow-y:auto" onclick="event.stopPropagation()">
      <h3 style="margin:0 0 16px 0;font-size:16px;color:var(--text)">New Listing Template</h3>
      <div class="form-grid" style="gap:12px">
        <input id="clTplName" type="text" placeholder="Template name (e.g., 'Vintage Clothing')" class="fgrp" style="grid-column:1/-1">
        <select id="clTplCat" class="fgrp" style="grid-column:1/-1">
          <option value="">All Categories</option>
          ${[...new Set(k.filter(n=>n.category).map(n=>n.category))].sort().map(n=>`<option value="${x(n)}">${x(n)}</option>`).join("")}
        </select>
        <textarea id="clTplTitle" placeholder="Title formula (use {name}, {condition}, {category}, etc.)" class="fgrp" style="grid-column:1/-1;min-height:60px;font-family:monospace;font-size:12px">{name} - {condition}</textarea>
        <textarea id="clTplDesc" placeholder="Description template" class="fgrp" style="grid-column:1/-1;min-height:120px;font-family:monospace;font-size:12px">{name}
Condition: {condition}
Category: {category}
{notes}</textarea>
        <div style="grid-column:1/-1;display:flex;gap:8px">
          <button class="btn-secondary" style="flex:1;height:32px" onclick="document.getElementById('${t}').remove()">Cancel</button>
          <button class="btn-primary" style="flex:1;height:32px" onclick="clSaveTemplate('${t}')">Create Template</button>
        </div>
      </div>
    </div>
  </div>`;document.body.insertAdjacentHTML("beforeend",e),document.getElementById("clTplName").focus()}async function lv(t){var a,i,r,l,c,d,u,p,y;const e=(i=(a=document.getElementById("clTplName"))==null?void 0:a.value)==null?void 0:i.trim(),n=((l=(r=document.getElementById("clTplCat"))==null?void 0:r.value)==null?void 0:l.trim())||"",s=(d=(c=document.getElementById("clTplTitle"))==null?void 0:c.value)==null?void 0:d.trim(),o=((p=(u=document.getElementById("clTplDesc"))==null?void 0:u.value)==null?void 0:p.trim())||"";if(!e){w("Enter a template name",!0);return}if(!s){w("Enter a title formula",!0);return}(y=document.getElementById(t))==null||y.remove(),sm({name:e,category:n,titleFormula:s,descriptionTemplate:o}),w("Template created ✓"),U()}function cv(t){confirm("Delete this template?")&&(om(t),w("Template deleted"),U())}function lm(){const t=ct(),e=Or(),n=yp(),s=vp(),o=s?new Date(s).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"Never";if(t){let a=`<div class="etsy-panel etsy-connected">
      <div class="etsy-panel-left">
        <div class="etsy-panel-status">
          <span class="etsy-dot etsy-dot-on"></span>
          <strong>Etsy Connected</strong>
          ${e?`<span class="etsy-shop">(${x(e)})</span>`:""}
        </div>
        <div class="etsy-panel-meta">Last sync: ${x(o)}</div>
      </div>
      <div class="etsy-panel-actions">
        <button class="btn-sm btn-etsy" onclick="clEtsySync()" ${n?"disabled":""}>
          ${n?"⟳ Syncing…":"⟳ Sync Now"}
        </button>
        <button class="btn-sm btn-muted" onclick="clEtsyDisconnect()">Disconnect</button>
      </div>
    </div>`;return a+=`<div class="etsy-subtabs">
      <button class="etsy-subtab ${le==="stats"?"active":""}" onclick="clEtsySubTab('stats')">Stats</button>
      <button class="etsy-subtab ${le==="reviews"?"active":""}" onclick="clEtsySubTab('reviews')">Reviews</button>
      <button class="etsy-subtab ${le==="shipments"?"active":""}" onclick="clEtsySubTab('shipments')">Shipments</button>
      <button class="etsy-subtab ${le==="tags"?"active":""}" onclick="clEtsySubTab('tags')">Tags</button>
    </div>`,le==="stats"?a+=cm():le==="reviews"?a+=dm():le==="shipments"?a+=pm():le==="tags"&&(a+=um()),a}return`<div class="etsy-panel">
    <div class="etsy-panel-left">
      <div class="etsy-panel-status">
        <span class="etsy-dot"></span>
        <strong>Etsy</strong>
        <span class="etsy-shop" style="color:var(--muted)">Not connected</span>
      </div>
      <div class="etsy-panel-meta">Connect your shop to sync listings, track sales, and manage inventory</div>
    </div>
    <div class="etsy-panel-actions">
      <button class="btn-sm btn-etsy" onclick="clEtsyConnect()">Connect Etsy Shop</button>
    </div>
  </div>`}function cm(){if(!wa)return`<div class="etsy-stats-panel"><div style="text-align:center;padding:20px;color:var(--muted)">
      <button class="btn-sm btn-etsy" onclick="clEtsyLoadStats()">Load Shop Stats</button>
    </div></div>`;const t=wa,e=Sp();return`<div class="etsy-stats-panel">
    <div class="etsy-stats-grid">
      <div class="etsy-stat"><div class="etsy-stat-val">${t.numFavorers}</div><div class="etsy-stat-lbl">Favorites</div></div>
      <div class="etsy-stat"><div class="etsy-stat-val">${t.totalSold}</div><div class="etsy-stat-lbl">Total Sold</div></div>
      <div class="etsy-stat"><div class="etsy-stat-val">${t.activeListings}</div><div class="etsy-stat-lbl">Active</div></div>
      <div class="etsy-stat"><div class="etsy-stat-val">${t.reviewCount}</div><div class="etsy-stat-lbl">Reviews</div></div>
      <div class="etsy-stat"><div class="etsy-stat-val">${t.reviewAvg?t.reviewAvg.toFixed(1)+"★":"—"}</div><div class="etsy-stat-lbl">Rating</div></div>
      <div class="etsy-stat"><div class="etsy-stat-val">${S(e.totalRevenue)}</div><div class="etsy-stat-lbl">Revenue</div></div>
    </div>
    ${e.topItems.length?`<div style="margin-top:12px">
      <strong style="font-size:12px;color:var(--muted)">Top Sellers</strong>
      ${e.topItems.map(n=>`<div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px;border-bottom:1px solid var(--border)">
        <span>${x(n.name)}</span><span style="color:var(--accent)">${n.count} sold</span>
      </div>`).join("")}
    </div>`:""}
    <div style="margin-top:8px;text-align:right">
      <button class="btn-sm btn-muted" onclick="clEtsyLoadStats()">Refresh</button>
      <button class="btn-sm btn-muted" onclick="clEtsySyncQty()">Sync All Quantities</button>
      <button class="btn-sm btn-muted" onclick="clEtsySyncExpenses()">Sync Expenses</button>
    </div>
  </div>`}function dm(){if(!Xs)return`<div class="etsy-stats-panel"><div style="text-align:center;padding:20px;color:var(--muted)">
      <button class="btn-sm btn-etsy" onclick="clEtsyLoadReviews()">Load Reviews</button>
    </div></div>`;const t=Ep(Xs),e="★".repeat(Math.round(t.avg))+"☆".repeat(5-Math.round(t.avg));return`<div class="etsy-stats-panel">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <span style="font-size:24px;font-weight:700">${t.avg.toFixed(1)}</span>
      <span style="font-size:18px;color:var(--warn)">${e}</span>
      <span style="color:var(--muted);font-size:13px">(${t.count} reviews)</span>
    </div>
    <div class="etsy-rating-bars">
      ${[5,4,3,2,1].map(n=>{const s=t.count?Math.round(t.distribution[n]/t.count*100):0;return`<div class="etsy-rating-row">
          <span>${n}★</span>
          <div class="etsy-rating-bar"><div class="etsy-rating-fill" style="width:${s}%"></div></div>
          <span>${t.distribution[n]}</span>
        </div>`}).join("")}
    </div>
    <div style="margin-top:12px">
      ${Xs.slice(0,10).map(n=>`<div class="etsy-review-card">
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--warn)">${"★".repeat(n.rating)}${"☆".repeat(5-n.rating)}</span>
          <span style="font-size:11px;color:var(--muted)">${n.createdAt?new Date(n.createdAt).toLocaleDateString():""}</span>
        </div>
        ${n.message?`<div style="font-size:13px;margin-top:4px">${x(n.message.slice(0,200))}${n.message.length>200?"…":""}</div>`:'<div style="font-size:12px;color:var(--muted);margin-top:4px">No comment</div>'}
      </div>`).join("")}
    </div>
    <div style="margin-top:8px;text-align:right">
      <button class="btn-sm btn-muted" onclick="clEtsyLoadReviews()">Refresh</button>
    </div>
  </div>`}function pm(){if(!Xe)return`<div class="etsy-stats-panel"><div style="text-align:center;padding:20px;color:var(--muted)">
      <button class="btn-sm btn-etsy" onclick="clEtsyLoadShipments()">Load Pending Shipments</button>
    </div></div>`;if(!Xe.length)return'<div class="etsy-stats-panel"><div style="text-align:center;padding:20px;color:var(--muted)">No pending shipments</div></div>';const t=_p();return`<div class="etsy-stats-panel">
    <strong style="font-size:13px">${Xe.length} Pending Shipment${Xe.length>1?"s":""}</strong>
    ${Xe.map(e=>`<div class="etsy-pending-ship">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <strong style="font-size:13px">${x(e.buyerName)}</strong>
        <span style="font-size:12px;color:var(--muted)">${e.createdAt?new Date(e.createdAt).toLocaleDateString():""}</span>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:6px">
        ${e.items.map(n=>`${x(n.title)} ×${n.quantity}`).join(", ")}
        — ${S(e.totalPrice)}
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        <input type="text" class="etsy-tracking-input" id="etsyTrack_${e.receiptId}" placeholder="Tracking #" style="flex:1">
        <select id="etsyCarrier_${e.receiptId}" class="etsy-tracking-input" style="width:100px">
          ${t.map(n=>`<option value="${n}">${n.toUpperCase()}</option>`).join("")}
        </select>
        <button class="btn-sm btn-etsy" onclick="clEtsyPushTracking('${e.receiptId}')">Ship</button>
      </div>
    </div>`).join("")}
    <div style="margin-top:8px;text-align:right">
      <button class="btn-sm btn-muted" onclick="clEtsyLoadShipments()">Refresh</button>
    </div>
  </div>`}function um(){const t=k.filter(n=>n.etsyListingId);if(!t.length)return'<div class="etsy-stats-panel"><div style="text-align:center;padding:20px;color:var(--muted)">No Etsy-linked items</div></div>';let e=`<div class="etsy-stats-panel">
    <strong style="font-size:13px">Tag Optimizer</strong>
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Select an item to edit its Etsy tags (max 13 per listing)</div>
    <select id="etsyTagItemPick" onchange="clEtsyTagSelect(this.value)" style="width:100%;padding:6px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--text);margin-bottom:10px">
      <option value="">— Select item —</option>
      ${t.map(n=>`<option value="${n.id}" ${Me===n.id?"selected":""}>${x(n.name||"Untitled")} (${(n.tags||[]).length}/13 tags)</option>`).join("")}
    </select>`;if(Me){const n=k.find(s=>s.id===Me);if(n){const s=n.tags||[],o=Hr(n.id);e+=`<div style="margin-bottom:8px">
        <strong style="font-size:12px">Current Tags (${s.length}/13)</strong>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
          ${s.map((a,i)=>`<span class="etsy-tag-chip" onclick="clEtsyRemoveTag('${Me}',${i})">${x(a)} ×</span>`).join("")}
          ${s.length?"":'<span style="font-size:12px;color:var(--muted)">No tags</span>'}
        </div>
      </div>`,o.length&&s.length<13&&(e+=`<div style="margin-bottom:8px">
          <strong style="font-size:12px">Suggestions</strong>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
            ${o.slice(0,13-s.length).map(a=>`<span class="etsy-tag-suggest" onclick="clEtsyAddTag('${Me}','${x(a)}')">${x(a)} +</span>`).join("")}
          </div>
        </div>`),e+=`<div style="display:flex;gap:6px;margin-top:8px">
        <button class="btn-sm btn-etsy" onclick="clEtsySaveTags('${Me}')">Save to Etsy</button>
        <button class="btn-sm btn-muted" onclick="clEtsySuggestTags('${Me}')">Suggest More</button>
      </div>`}}return e+="</div>",e}function dv(){Rr()}function pv(){confirm("Disconnect your Etsy shop? You can reconnect anytime.")&&Fr()}async function uv(){w("Syncing Etsy listings…"),U();try{const t=await Nr();w(`Etsy sync complete — ${t.matched} matched, ${t.updated} updated`)}catch(t){w(`Etsy sync error: ${t.message}`,!0)}U()}async function fv(t){(await Ur(t)).success&&U()}async function mv(t){if(!confirm("Deactivate this Etsy listing?"))return;(await mp(t)).success&&(V(),U())}async function gv(t){if(!confirm("Renew this Etsy listing? ($0.20 fee applies)"))return;(await gp(t)).success&&(V(),U())}function yv(t){le=le===t?"none":t,U()}async function vv(){w("Loading Etsy stats…");try{wa=await $p(),U()}catch(t){w(`Stats error: ${t.message}`,!0)}}async function hv(){w("Loading Etsy reviews…");try{Xs=await kp(),U()}catch(t){w(`Reviews error: ${t.message}`,!0)}}async function bv(){w("Loading pending shipments…");try{Xe=await qr(),U()}catch(t){w(`Shipments error: ${t.message}`,!0)}}async function wv(t){var i;const e=document.getElementById(`etsyTrack_${t}`),n=document.getElementById(`etsyCarrier_${t}`),s=(i=e==null?void 0:e.value)==null?void 0:i.trim(),o=(n==null?void 0:n.value)||"usps";if(!s){w("Enter a tracking number",!0);return}(await Ip(t,s,o)).success&&(Xe=await qr(),U())}async function xv(){w("Syncing quantities…");try{const t=await wp();w(`Qty sync: ${t.pulled} pulled, ${t.pushed} pushed`),U()}catch(t){w(`Qty sync error: ${t.message}`,!0)}}async function $v(t){w("Uploading photos…");try{await xp(t)}catch(e){w(`Photo error: ${e.message}`,!0)}}async function Sv(t){await hp(t)}async function kv(t){w("Pushing price to Etsy…");try{(await jr(t)).success?w("Price synced to Etsy"):w("Price sync failed",!0)}catch(e){w(`Price sync error: ${e.message}`,!0)}}function Ev(t){Me=t||null,U()}function Iv(t,e){const n=k.find(s=>s.id===t);!n||!n.tags||(n.tags.splice(e,1),j("inv",t),O(),U())}function _v(t,e){const n=k.find(s=>s.id===t);if(n){if(n.tags||(n.tags=[]),n.tags.length>=13){w("Max 13 tags",!0);return}n.tags.includes(e)||(n.tags.push(e.slice(0,20)),j("inv",t),O(),U())}}async function Cv(t){Hr(t).length||w("No more suggestions"),U()}async function Bv(t){w("Saving tags to Etsy…");try{const e=k.find(n=>n.id===t);if(!e)return;await Bp(t,e.tags||[])}catch(e){w(`Tag save error: ${e.message}`,!0)}}async function Tv(){w("Syncing Etsy expenses…");try{const t=await Pp();w(`${t.synced} expense${t.synced!==1?"s":""} synced`)}catch(t){w(`Expense sync error: ${t.message}`,!0)}}function Pv(t){t?hd():bd(),U()}function Mv(){ia()===0&&w("No expired renewable listings to relist"),U()}function Dv(){var i,r,l,c,d;const t=((i=document.getElementById("clBulkCat"))==null?void 0:i.value)||"",e=((r=document.getElementById("clBulkPlat"))==null?void 0:r.value)||"",n=((l=document.getElementById("clBulkType"))==null?void 0:l.value)||"percent",s=parseFloat((c=document.getElementById("clBulkVal"))==null?void 0:c.value)||0,o=parseInt((d=document.getElementById("clBulkMinDays"))==null?void 0:d.value)||0;if(!s){w("Enter a price adjustment value",!0);return}const a=n==="percent"?`${s>0?"+":""}${s}%`:`${s>0?"+":""}$${s}`;confirm(`Apply ${a} to matching items?`)&&(xd({category:t,platform:e,adjustType:n,adjustValue:s,minDaysListed:o}),U())}function fm(){const t=bf(),n=jl().length;let s=`<div class="wn-panel">
    <div class="wn-panel-header">
      <div class="wn-panel-left">
        <div class="wn-panel-status">
          <span class="wn-dot${t?" wn-dot-live":""}"></span>
          <strong>Whatnot Shows</strong>
          ${t?'<span class="wn-live-badge">LIVE</span>':`<span style="color:var(--muted)">${n} upcoming</span>`}
        </div>
        <div class="wn-panel-meta">${t?`"${x(t.name)}" is live — ${t.soldCount||0} sold`:"Organize items into shows for live selling"}</div>
      </div>
      <div class="wn-panel-actions">
        <button class="btn-sm btn-accent" onclick="wnNewShow()">+ New Show</button>
      </div>
    </div>
    <div class="wn-tabs">
      <button class="wn-tab${Ut==="shows"?" active":""}" onclick="wnSwitchTab('shows')">Shows</button>
      <button class="wn-tab${Ut==="analytics"?" active":""}" onclick="wnSwitchTab('analytics')">Analytics</button>
      <button class="wn-tab${Ut==="builder"?" active":""}" onclick="wnSwitchTab('builder')">Smart Builder</button>
      <button class="wn-tab${Ut==="calculator"?" active":""}" onclick="wnSwitchTab('calculator')">Sale Calculator</button>
    </div>`;return Ut==="shows"?s+=mm():Ut==="analytics"?s+=gm():Ut==="builder"?s+=ym():Ut==="calculator"&&(s+=vm()),s+="</div>",s}function mm(){var s;const t=jl(),e=nf();let n="";if(t.length>0){n+='<div class="wn-shows-list">';for(const o of t){const a=ve===o.id,i=o.status==="live",r=o.date?mt(o.date+"T12:00:00"):"No date",l=o.time||"";if(n+=`<div class="wn-show-card${i?" wn-show-live":""}${a?" wn-show-expanded":""}">
        <div class="wn-show-header" onclick="wnToggleShow('${o.id}')">
          <div class="wn-show-info">
            <span class="wn-show-name">${x(o.name)}</span>
            ${o.recurring?'<span class="wn-recurring-badge">↻</span>':""}
            <span class="wn-show-date">${x(r)}${l?" @ "+x(l):""}</span>
            <span class="wn-show-count">${o.items.length} item${o.items.length!==1?"s":""}</span>
          </div>
          <div class="wn-show-actions" onclick="event.stopPropagation()">
            ${i?`<button class="btn-xs btn-danger" onclick="wnEndShow('${o.id}')">End Show</button>`:`<button class="btn-xs btn-accent" onclick="wnStartShow('${o.id}')"${o.items.length===0?' disabled title="Add items first"':""}>Go Live</button>`}
            <button class="btn-xs" onclick="wnCopyPrep('${o.id}')" title="Copy prep list">📋</button>
            <button class="btn-xs" onclick="wnPrintRunSheet('${o.id}')" title="Print run sheet">🖨</button>
            ${i?"":`<button class="btn-xs btn-muted" onclick="wnDeleteShow('${o.id}')" title="Delete show">✕</button>`}
          </div>
        </div>`,a){if(n+='<div class="wn-show-items">',i&&(n+=`<div class="wn-live-controls">
            <label class="wn-viewer-input">Viewers: <input type="number" min="0" value="${o.viewerPeak||""}" placeholder="Peak" onchange="wnSetViewerPeak('${o.id}',this.value)" style="width:60px"></label>
          </div>`),o.items.length===0&&(n+='<div class="wn-show-empty">No items yet — add items to start your show prep</div>'),o.items.forEach((c,d)=>{var h;const u=k.find(m=>m.id===c);if(!u)return;const p=u.images&&u.images[0]||"",y=Wl(o.id,c),v=(h=o.soldItems)==null?void 0:h[c];n+=`<div class="wn-show-item${v?" wn-item-sold":""}">
            <span class="wn-item-num">${d+1}</span>
            ${p?`<img class="wn-item-thumb" src="${x(p)}" alt="">`:'<span class="wn-item-thumb wn-item-nophoto">📦</span>'}
            <div class="wn-item-info">
              <span class="wn-item-name">${x(u.name||"Untitled")}${v?' <span class="wn-sold-tag">SOLD</span>':""}</span>
              <span class="wn-item-detail">${x(u.condition||"")} ${u.price?S(u.price):""}</span>
              ${y?`<span class="wn-item-note-preview" title="${x(y)}">💬 ${x(y.slice(0,40))}${y.length>40?"…":""}</span>`:""}
            </div>
            <div class="wn-item-actions">
              ${i&&!v?`<button class="btn-xs btn-accent" onclick="wnMarkSold('${o.id}','${c}')">Sold</button>`:""}
              <button class="btn-xs" onclick="wnEditItemNote('${o.id}','${c}')" title="Talking points">💬</button>
              <button class="btn-xs" onclick="wnMoveItem('${o.id}','${c}','up')" title="Move up"${d===0?" disabled":""}>▲</button>
              <button class="btn-xs" onclick="wnMoveItem('${o.id}','${c}','down')" title="Move down"${d===o.items.length-1?" disabled":""}>▼</button>
              <button class="btn-xs btn-muted" onclick="wnRemoveItem('${o.id}','${c}')" title="Remove">✕</button>
            </div>
          </div>`}),n+=`<div class="wn-show-add-row">
          <button class="btn-sm btn-accent" onclick="wnOpenItemPicker('${o.id}')">+ Add Items</button>
          <label class="wn-expense-input">Expenses: $<input type="number" min="0" step="0.01" value="${o.showExpenses||""}" placeholder="0" onchange="wnSetExpenses('${o.id}',this.value)" style="width:60px"></label>
        </div>`,Bo){const c=k.filter(d=>(d.qty||0)>0&&!o.items.includes(d.id)).slice(0,50);n+=`<div class="wn-item-picker">
            <div class="wn-picker-header">
              <strong>Select items to add</strong>
              <button class="btn-xs btn-muted" onclick="wnCloseItemPicker()">Done</button>
            </div>
            <div class="wn-picker-list">`,c.length===0&&(n+='<div class="wn-picker-empty">All in-stock items are already in this show</div>');for(const d of c){const u=Gl(d.id),p=u.length?` (${u.filter(y=>y.wasSold).length}/${u.length} shows sold)`:"";n+=`<div class="wn-picker-item" onclick="wnPickItem('${o.id}','${d.id}')">
              <span class="wn-picker-name">${x(d.name||"Untitled")}${p}</span>
              <span class="wn-picker-price">${d.price?S(d.price):""}</span>
            </div>`}n+="</div></div>"}n+="</div>"}n+="</div>"}n+="</div>"}if(e.length>0){n+=`<div class="wn-past-shows">
      <div class="wn-past-label">Past Shows</div>`;for(const o of e.slice(0,5)){const a=Yl(o);n+=`<div class="wn-past-card">
        <div class="wn-past-info">
          <strong>${x(o.name.slice(0,25))}</strong>
          <span>${o.date?mt(o.date+"T12:00:00"):""}</span>
        </div>
        <div class="wn-past-stats">
          <span>${o.soldCount||0}/${((s=o.items)==null?void 0:s.length)||0} sold</span>
          <span>${S(o.totalRevenue||0)}</span>
          <span style="color:${a.profit>=0?"var(--good)":"var(--danger)"}">${S(a.profit)}</span>
        </div>
        <div class="wn-past-actions">
          <button class="btn-xs" onclick="wnCloneShow('${o.id}')" title="Clone as new show">↻ Clone</button>
          <button class="btn-xs" onclick="wnExportShowCSV('${o.id}')" title="Export results CSV">📊</button>
        </div>
      </div>`}n+="</div>"}return n}function gm(){var c,d,u;const t=Cf();if(!t)return`<div class="wn-analytics-empty">
      <p style="color:var(--muted);text-align:center;padding:30px">No completed shows yet. Analytics will appear after your first show ends.</p>
    </div>`;let e='<div class="wn-analytics">';e+=`<div class="wn-stats-grid">
    <div class="wn-stat"><div class="wn-stat-val">${t.showCount}</div><div class="wn-stat-label">Shows</div></div>
    <div class="wn-stat"><div class="wn-stat-val">${(t.avgSellThrough*100).toFixed(0)}%</div><div class="wn-stat-label">Avg Sell-Through</div></div>
    <div class="wn-stat"><div class="wn-stat-val">${S(t.totalRevenue)}</div><div class="wn-stat-label">Total Revenue</div></div>
    <div class="wn-stat"><div class="wn-stat-val">${S(t.totalProfit)}</div><div class="wn-stat-label">Total Profit</div></div>
    <div class="wn-stat"><div class="wn-stat-val">${S(t.revenuePerHour)}/hr</div><div class="wn-stat-label">Rev/Hour</div></div>
    <div class="wn-stat"><div class="wn-stat-val">${t.totalSold}</div><div class="wn-stat-label">Items Sold</div></div>
  </div>`;const n=Sf().find(p=>p.showCount>0),s=kf().find(p=>p.showCount>0);(n||s)&&(e+='<div class="wn-best-badges">',n&&(e+=`<span class="wn-badge">Best Day: <strong>${n.dayName}</strong> (${(n.avgSellThrough*100).toFixed(0)}% sell-through)</span>`),s&&(e+=`<span class="wn-badge">Best Time: <strong>${s.label}</strong> (${(s.avgSellThrough*100).toFixed(0)}% sell-through)</span>`),e+="</div>");const o=Ef(10);if(o.length>=2){const p=Math.max(...o.map(f=>f.sellThrough),.01),y=300,v=60,h=4,m=o.map((f,E)=>{const $=h+E/(o.length-1)*(y-h*2),I=v-h-f.sellThrough/p*(v-h*2);return`${$},${I}`}).join(" ");e+=`<div class="wn-trend-section">
      <div class="wn-section-title">Sell-Through Trend (last ${o.length} shows)</div>
      <svg class="wn-sparkline" viewBox="0 0 ${y} ${v}" width="${y}" height="${v}">
        <polyline points="${m}" fill="none" stroke="var(--accent)" stroke-width="2"/>
        ${o.map((f,E)=>{const $=h+E/(o.length-1)*(y-h*2),I=v-h-f.sellThrough/p*(v-h*2);return`<circle cx="${$}" cy="${I}" r="3" fill="var(--accent)"><title>${f.name}: ${(f.sellThrough*100).toFixed(0)}%</title></circle>`}).join("")}
      </svg>
    </div>`}const a=xi().slice(0,6);if(a.length>0){const p=Math.max(...a.map(y=>y.shown),1);e+=`<div class="wn-section-title">Category Performance</div>
    <div class="wn-cat-bars">`;for(const y of a){const v=(y.sellThrough*100).toFixed(0),h=Math.max(4,y.shown/p*100);e+=`<div class="wn-cat-row">
        <span class="wn-cat-name">${x(y.category)}</span>
        <div class="wn-cat-bar-wrap"><div class="wn-cat-bar" style="width:${h}%"></div></div>
        <span class="wn-cat-pct">${v}% (${y.sold}/${y.shown})</span>
      </div>`}e+="</div>"}const i=he(10);if(i.length>0){e+=`<div class="wn-section-title">Recent Shows</div>
    <div class="wn-perf-table"><table>
      <thead><tr><th>Show</th><th>Date</th><th>Items</th><th>Sold</th><th>ST%</th><th>Revenue</th><th>Profit</th></tr></thead><tbody>`;for(const p of i){const y=Yl(p);e+=`<tr>
        <td>${x(p.name.slice(0,20))}</td>
        <td>${p.date||""}</td>
        <td>${y.itemCount}</td>
        <td>${y.soldCount}</td>
        <td>${(y.sellThrough*100).toFixed(0)}%</td>
        <td>${S(y.revenue)}</td>
        <td style="color:${y.profit>=0?"var(--good)":"var(--danger)"}">${S(y.profit)}</td>
      </tr>`}e+="</tbody></table></div>"}const r=If(5),l=_f(2,5);if(r.length>0){e+='<div class="wn-section-title">Top Sellers on Whatnot</div><div class="wn-performer-list">';for(const p of r)e+=`<div class="wn-performer-row"><span>${x(((c=p.item.name)==null?void 0:c.slice(0,30))||"")}</span><span class="wn-performer-stat">${p.sold}/${p.shown} sold · ${S(p.totalRevenue)}</span></div>`;e+="</div>"}if(l.length>0){e+=`<div class="wn-section-title" style="color:var(--warn)">Struggling Items (shown ${((d=l[0])==null?void 0:d.shown)||2}+ times, 0 sales)</div><div class="wn-performer-list">`;for(const p of l)e+=`<div class="wn-performer-row"><span>${x(((u=p.item.name)==null?void 0:u.slice(0,30))||"")}</span><span class="wn-performer-stat" style="color:var(--warn)">Shown ${p.shown}× — no sales</span></div>`;e+="</div>"}return e+="</div>",e}function ym(){const t=Kl(30),e=Jl(),n=Bf();let s='<div class="wn-builder">';s+=`<div class="wn-builder-rec">
    <strong>Recommended show size:</strong> ~${e.recommended} items
    (${e.min}-${e.max} range)
    ${e.avgSellThrough?` · Best sell-through at this size: ${(e.avgSellThrough*100).toFixed(0)}%`:""}
  </div>`,n.length>0&&(s+='<div class="wn-builder-mix"><strong>Suggested mix:</strong> ',s+=n.slice(0,5).map(a=>`${x(a.category)} (${(a.percentage*100).toFixed(0)}%)`).join(", "),s+="</div>");const o=ne.size;if(s+=`<div class="wn-builder-actions">
    <button class="btn-sm btn-accent" onclick="wnBuilderCreateShow()" ${o===0?"disabled":""}>${o>0?`Create Show with ${o} Items`:"Select Items Below"}</button>
    <button class="btn-sm" onclick="wnBuilderSelectAll()">Select All (${Math.min(t.length,e.recommended)})</button>
    <button class="btn-sm btn-muted" onclick="wnBuilderClearSelection()">Clear</button>
  </div>`,t.length===0)s+='<div style="text-align:center;padding:20px;color:var(--muted)">No suggestions — add more inventory or complete more shows</div>';else{s+='<div class="wn-builder-list">';for(const a of t){const i=ne.has(a.item.id);s+=`<div class="wn-builder-item${i?" selected":""}" onclick="wnBuilderToggle('${a.item.id}')">
        <div class="wn-builder-check">${i?"☑":"☐"}</div>
        <div class="wn-builder-item-info">
          <span class="wn-builder-item-name">${x(a.item.name||"Untitled")}</span>
          <span class="wn-builder-item-detail">${x(a.item.condition||"")} · ${a.item.price?S(a.item.price):"—"} · ${a.item.category||""}</span>
          <span class="wn-builder-item-reason">${x(a.reason)}</span>
        </div>
        <div class="wn-builder-item-score">${a.score.toFixed(1)}</div>
      </div>`}s+="</div>"}return s+="</div>",s}function vm(){const t=parseFloat(xa)||0,e=parseFloat($a)||0,n=parseFloat(Sa)||0,s=parseFloat(ka)||0,o=t*.08,a=t+e+s,i=a*.029+.3,r=o+i,l=t+e-r,c=l-n,d=t>0?c/t*100:0,u=t>0;let p=`<div class="wn-calc">
    <div class="wn-calc-form">
      <div class="wn-calc-row">
        <label>Sale Price</label>
        <div class="wn-calc-input-wrap">
          <span class="wn-calc-dollar">$</span>
          <input type="number" min="0" step="0.01" placeholder="0.00" value="${xa}"
            oninput="wnCalcUpdate('price',this.value)" class="wn-calc-input">
        </div>
      </div>
      <div class="wn-calc-row">
        <label>Shipping Charged</label>
        <div class="wn-calc-input-wrap">
          <span class="wn-calc-dollar">$</span>
          <input type="number" min="0" step="0.01" placeholder="0.00" value="${$a}"
            oninput="wnCalcUpdate('shipping',this.value)" class="wn-calc-input">
        </div>
      </div>
      <div class="wn-calc-row">
        <label>Item Cost (COGS)</label>
        <div class="wn-calc-input-wrap">
          <span class="wn-calc-dollar">$</span>
          <input type="number" min="0" step="0.01" placeholder="0.00" value="${Sa}"
            oninput="wnCalcUpdate('cost',this.value)" class="wn-calc-input">
        </div>
      </div>
      <div class="wn-calc-row">
        <label>Tax Collected</label>
        <div class="wn-calc-input-wrap">
          <span class="wn-calc-dollar">$</span>
          <input type="number" min="0" step="0.01" placeholder="0.00" value="${ka}"
            oninput="wnCalcUpdate('tax',this.value)" class="wn-calc-input">
        </div>
      </div>
    </div>`;return u?p+=`<div class="wn-calc-breakdown">
      <div class="wn-calc-section-label">Fee Breakdown</div>
      <div class="wn-calc-line">
        <span>Commission (8% on $${t.toFixed(2)})</span>
        <span class="wn-calc-neg">-$${o.toFixed(2)}</span>
      </div>
      <div class="wn-calc-line">
        <span>Processing (2.9% + $0.30 on $${a.toFixed(2)})</span>
        <span class="wn-calc-neg">-$${i.toFixed(2)}</span>
      </div>
      <div class="wn-calc-line wn-calc-total-line">
        <span>Total Fees</span>
        <span class="wn-calc-neg">-$${r.toFixed(2)}</span>
      </div>

      <div class="wn-calc-divider"></div>

      <div class="wn-calc-section-label">Your Numbers</div>
      <div class="wn-calc-line">
        <span>Payout (sale + shipping − fees)</span>
        <span>$${l.toFixed(2)}</span>
      </div>
      ${n>0?`<div class="wn-calc-line">
        <span>Item Cost</span>
        <span class="wn-calc-neg">-$${n.toFixed(2)}</span>
      </div>`:""}
      <div class="wn-calc-line wn-calc-profit-line">
        <span>Profit${n>0?"":" (before COGS)"}</span>
        <span class="${c>=0?"wn-calc-pos":"wn-calc-neg"}">$${c.toFixed(2)}</span>
      </div>
      ${n>0?`<div class="wn-calc-line">
        <span>Margin</span>
        <span class="${d>=0?"wn-calc-pos":"wn-calc-neg"}">${d.toFixed(1)}%</span>
      </div>`:""}
    </div>`:p+='<div class="wn-calc-placeholder">Enter a sale price to see your fee breakdown and estimated profit.</div>',p+='<div class="wn-calc-note">Commission = 8% of sale price only. Processing = 2.9% + $0.30 on total order (price + shipping + tax).</div>',p+="</div>",p}function Lv(t,e){t==="price"?xa=e:t==="shipping"?$a=e:t==="cost"?Sa=e:t==="tax"&&(ka=e),U()}function Av(t){Ut=t,U()}function zv(t){ve=ve===t?null:t,Bo=!1,U()}async function Rv(){const t=prompt("Show name:");if(!t)return;const e=prompt("Date (YYYY-MM-DD):",ot());if(!e)return;const n=prompt("Time (HH:MM, optional):","19:00")||"",s=await bi(t,e,n);Ut="shows",ve=s.id,U()}async function Fv(t){const e=Hl(t);e&&confirm(`Delete show "${e.name}"?`)&&(await sf(t),ve===t&&(ve=null),U())}async function Ov(t){const e=Hl(t);e&&confirm(`Go live with "${e.name}" (${e.items.length} items)?`)&&(await lf(t),ve=t,U())}async function Nv(t){confirm("End this live show?")&&(await cf(t),U())}async function Uv(t,e){const n=k.find(o=>o.id===e),s=(n==null?void 0:n.price)||0;await df(t,e,s),V(),U()}async function qv(t,e,n){await rf(t,e,n),U()}async function jv(t,e){await af(t,e),U()}function Hv(t){ve=t,Bo=!0,U()}function Wv(){Bo=!1,U()}async function Gv(t,e){await of(t,e),U()}async function Vv(t){await uf(t)}async function Yv(t,e){const n=Wl(t,e),s=prompt("Talking points for this item:",n);s!==null&&(await ff(t,e,s),U())}async function Kv(t){const e=prompt("Date for cloned show (YYYY-MM-DD):",ot());if(!e)return;const n=await mf(t,e);n&&(Ut="shows",ve=n.id,U())}async function Jv(t,e){await gf(t,e)}async function Qv(t,e){await yf(t,e)}function Xv(t){const e=hf(t);if(!e)return;const n=window.open("","_blank","width=800,height=600");n.document.write(`<!DOCTYPE html><html><head><title>Show Run Sheet</title>
    <style>body{font-family:system-ui,sans-serif;padding:20px;font-size:14px}
    h2{margin:0 0 4px}p{color:#666;margin:0 0 16px}
    table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
    th{background:#f5f5f5;font-size:12px}td{font-size:13px}
    @media print{body{padding:0}}</style>
  </head><body>${e}</body></html>`),n.document.close(),n.print()}function Zv(t){window.exportShowResultsCSV?window.exportShowResultsCSV(t):w("CSV export loading…")}function th(t){ne.has(t)?ne.delete(t):ne.add(t),U()}function eh(){const t=Kl(30),e=Jl();ne.clear(),t.slice(0,e.recommended).forEach(n=>ne.add(n.item.id)),U()}function nh(){ne.clear(),U()}async function sh(){if(ne.size===0){w("No items selected",!0);return}const t=prompt("Show name:",`Smart Show - ${new Date().toLocaleDateString()}`);if(!t)return;const e=prompt("Date (YYYY-MM-DD):",ot());if(!e)return;const n=prompt("Time (HH:MM):","19:00")||"",s=await bi(t,e,n,"",{items:[...ne]});ne.clear(),Ut="shows",ve=s.id,U(),w(`Show created with ${s.items.length} items`)}function hm(){const t=ft(),e=fd(),n=Xd(),s=Zd(),o=s?new Date(s).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"Never";return!t&&!ud()?(aa(),`<div class="ebay-panel">
      <div class="ebay-panel-left">
        <div class="ebay-panel-status">
          <span class="ebay-dot"></span>
          <strong>eBay</strong>
          <span class="ebay-user" style="color:var(--muted)">Checking connection…</span>
        </div>
        <div class="ebay-panel-meta">Verifying eBay account status</div>
      </div>
    </div>`):t?`<div class="ebay-panel ebay-connected">
      <div class="ebay-panel-left">
        <div class="ebay-panel-status">
          <span class="ebay-dot ebay-dot-on"></span>
          <strong>eBay Connected</strong>
          ${e?`<span class="ebay-user">(${x(e)})</span>`:""}
        </div>
        <div class="ebay-panel-meta">Last sync: ${x(o)}</div>
      </div>
      <div class="ebay-panel-actions">
        <button class="btn-sm btn-accent" onclick="clEBaySync()" ${n?"disabled":""}>
          ${n?"⟳ Syncing…":"⟳ Sync Now"}
        </button>
        <button class="btn-sm btn-muted" onclick="clEBayDisconnect()">Disconnect</button>
      </div>
    </div>`:`<div class="ebay-panel">
    <div class="ebay-panel-left">
      <div class="ebay-panel-status">
        <span class="ebay-dot"></span>
        <strong>eBay</strong>
        <span class="ebay-user" style="color:var(--muted)">Not connected</span>
      </div>
      <div class="ebay-panel-meta">Connect to list items, sync status, and track sales directly</div>
    </div>
    <div class="ebay-panel-actions">
      <button class="btn-sm btn-accent" onclick="clEBayConnect()">Connect eBay Account</button>
    </div>
  </div>`}function oh(){cd(!1)}function ah(){confirm("Disconnect your eBay account? You can reconnect anytime.")&&pd()}async function ih(){w("Syncing eBay listings…"),U();try{const t=await Lr();w(`eBay sync complete — ${t.matched} matched, ${t.updated} updated`)}catch(t){w(`eBay sync error: ${t.message}`,!0)}U()}async function rh(t){w("Pushing item to eBay…");try{if((await Ga(t)).success){w("Publishing eBay listing…");try{if((await So(t)).success){U();return}}catch(n){w(`Pushed to eBay inventory (draft). ${n.message}`,!0)}U()}}catch(e){w(`eBay push error: ${e.message}`,!0)}}async function lh(t){w("Publishing eBay listing…");try{(await So(t)).success&&(V(),U())}catch(e){w(`eBay publish error: ${e.message}`,!0)}}async function ch(t){if(confirm("End this eBay listing?"))try{(await Qd(t)).success&&(V(),U())}catch(e){w(`eBay end listing error: ${e.message}`,!0)}}const Ae={firstClass:{basePrice:1.01,incrementalPrice:.24},priorityMail:{zones:{1:[4.3,4.71,5.2,5.85,6.5,7.15,7.8],2:[4.3,4.71,5.2,5.85,6.5,7.15,7.8],3:[4.33,4.75,5.32,6.12,6.92,7.72,8.52],4:[4.4,4.88,5.57,6.56,7.55,8.54,9.53],5:[4.57,5.12,5.98,7.2,8.42,9.64,10.86],6:[4.77,5.43,6.48,8,9.52,11.04,12.56],7:[5.02,5.82,7.1,8.92,10.74,12.56,14.38],8:[5.3,6.25,7.78,9.92,12.06,14.2,16.34]},weightBreaks:[1,2,3,5,10,20,70]}};function bm(t){if(!t)return null;const e=parseFloat(t.weight)||0,n=t.dimUnit||"oz",o=n==="g"||n==="kg"?e*.035274:e;if(o>0&&o<=13){const a=Ae.firstClass.basePrice+Math.max(0,o-1)*Ae.firstClass.incrementalPrice;return{carrier:"USPS",service:"First Class Mail",estimatedCost:Math.round(a*100)/100,range:`${o}oz`}}if(o>0){const i=Ae.priorityMail.weightBreaks;let r=i.findIndex(d=>o<=d);return r===-1&&(r=i.length-1),{carrier:"USPS",service:"Priority Mail",estimatedCost:Ae.priorityMail.zones[5][r],range:`${o.toFixed(1)}oz`}}return{carrier:"USPS",service:"First Class Mail",estimatedCost:1.01,range:"light"}}function lc(t){if(!t)return null;const e=parseFloat(t.dimL)||0,n=parseFloat(t.dimW)||0,s=parseFloat(t.dimH)||0;if(parseFloat(t.weight),t.dimUnit,e<=8.625&&n<=5.375&&s<=1.625)return{name:"Small Flat Rate",type:"USPS Flat Rate",dimensions:`${e}" x ${n}" x ${s}"`,estimatedCost:7.65,carrier:"USPS"};if(e<=11&&n<=8.5&&s<=5.5)return{name:"Medium Flat Rate",type:"USPS Flat Rate",dimensions:`${e}" x ${n}" x ${s}"`,estimatedCost:14.75,carrier:"USPS"};if(e<=12&&n<=12&&s<=8)return{name:"Large Flat Rate",type:"USPS Flat Rate",dimensions:`${e}" x ${n}" x ${s}"`,estimatedCost:20.85,carrier:"USPS"};const o=bm(t);return{name:"Priority Mail Box",type:"Priority Mail",dimensions:`${e}" x ${n}" x ${s}"`,estimatedCost:o?o.estimatedCost:7.5,carrier:"USPS"}}function dh(t){if(!t)return[];const e=parseFloat(t.weight)||0;parseFloat(t.price);const n=t.dimUnit||"oz",o=n==="g"||n==="kg"?e*.035274:e,a=[];if(o>0&&o<=13){const r=Ae.firstClass.basePrice+Math.max(0,o-1)*Ae.firstClass.incrementalPrice;a.push({carrier:"USPS",service:"First Class Mail",estimatedCost:Math.round(r*100)/100,notes:"Fast & cheap for light items"})}if(o>0){const l=Ae.priorityMail.weightBreaks;let c=l.findIndex(u=>o<=u);c===-1&&(c=l.length-1);const d=Ae.priorityMail.zones[5][c];a.push({carrier:"USPS",service:"Priority Mail",estimatedCost:d,notes:"2-3 day delivery"})}t.category&&(t.category.toLowerCase().includes("book")||t.category.toLowerCase().includes("dvd"))&&a.push({carrier:"USPS",service:"Media Mail",estimatedCost:2.96,notes:"Cheapest for media"});const i=lc(t);if(i&&i.type==="USPS Flat Rate"&&a.push({carrier:"USPS",service:i.name,estimatedCost:i.estimatedCost,notes:"Fixed price, any weight up to limit"}),o>16){const r=12.5+Math.max(0,o/16-1)*2.5;a.push({carrier:"UPS",service:"Ground",estimatedCost:Math.round(r*100)/100,notes:"Good for heavy packages"})}if(o>8){const r=11.75+Math.max(0,o/16-1)*2.25;a.push({carrier:"FedEx",service:"Ground",estimatedCost:Math.round(r*100)/100,notes:"Alternative carrier option"})}return a}const cc="ft_seller_info";function $i(){const t=localStorage.getItem(cc);if(t)try{return JSON.parse(t)}catch{return Ea()}return Ea()}function wm(t){const n={...Ea(),...t};localStorage.setItem(cc,JSON.stringify(n))}function Ea(){return{businessName:"FlipTrack Reseller",name:localStorage.getItem("ft_seller_name")||"Your Name",address:localStorage.getItem("ft_seller_address")||"123 Main St",city:localStorage.getItem("ft_seller_city")||"City",state:localStorage.getItem("ft_seller_state")||"ST",zip:localStorage.getItem("ft_seller_zip")||"12345",phone:localStorage.getItem("ft_seller_phone")||"",email:localStorage.getItem("ft_seller_email")||"",website:localStorage.getItem("ft_seller_website")||""}}const dc="ft_thank_you_message";function Si(){return localStorage.getItem(dc)||$m()}function xm(t){localStorage.setItem(dc,t)}function $m(){return"Thank you for your purchase! Please leave feedback if you are satisfied with your order."}function Sm(t,e){if(!e)return;const n=F(e.itemId),s=$i(),o=Si(),a=pc({sale:e,item:n,seller:s,thankYou:o,pageNumber:1,totalPages:1});uc(a,`slip-${t}`)}function km(t,e){if(!e||e.length===0)return;const n=$i(),s=Si(),a=e.map((i,r)=>{const l=F(i.itemId);return pc({sale:i,item:l,seller:n,thankYou:s,pageNumber:r+1,totalPages:e.length,pageBreak:r<e.length-1})}).join("");uc(a,`batch-slip-${Date.now()}`)}function pc(t){const{sale:e,item:n,seller:s,thankYou:o,pageNumber:a,totalPages:i,pageBreak:r}=t,l=n?x(n.name):"Unknown Item",c=n?x(n.sku||n.id||""):"",d=x(e.buyerName||"Buyer"),u=x(e.buyerAddress||""),p=x(e.buyerCity||""),y=x(e.buyerState||""),v=x(e.buyerZip||""),h=`${x(s.businessName)}<br>${x(s.name)}<br>${x(s.address)}<br>${x(s.city)}, ${x(s.state)} ${x(s.zip)}`;return`
    <div style="page-break-after:${r?"always":"avoid"};padding:40px;font-family:'Syne','DM Mono',monospace;max-width:600px;margin:0 auto;color:#000;background:#fff">
      <!-- Header -->
      <div style="border-bottom:2px solid #333;padding-bottom:20px;margin-bottom:20px">
        <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:-1px">PACKING SLIP</h1>
        <p style="margin:4px 0 0 0;font-size:11px;color:#666">#${x(e.id.slice(0,8).toUpperCase())}</p>
      </div>

      <!-- Two-column header: Seller | Date/Order -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px;font-size:11px">
        <div>
          <p style="margin:0 0 10px 0;font-weight:700;color:#666">FROM:</p>
          <div style="line-height:1.6;font-size:10px">${h}</div>
        </div>
        <div>
          <p style="margin:0 0 6px 0;font-weight:700">Order Date</p>
          <p style="margin:0 0 12px 0;font-size:13px;font-weight:600">${mt(e.date)}</p>

          <p style="margin:0 0 6px 0;font-weight:700">Qty</p>
          <p style="margin:0;font-size:13px;font-weight:600">${e.qty||1}</p>
        </div>
      </div>

      <!-- Shipping To -->
      <div style="background:#f5f5f5;padding:16px;margin-bottom:24px;border-left:3px solid #007bff">
        <p style="margin:0 0 8px 0;font-weight:700;font-size:12px">SHIP TO:</p>
        <p style="margin:0;font-weight:600;font-size:13px">${d}</p>
        <p style="margin:4px 0 0 0;font-size:11px;line-height:1.5">
          ${u}
          ${p?"<br>"+p:""}
          ${y?(p?", ":"<br>")+y:""}
          ${v?" "+v:""}
        </p>
      </div>

      <!-- Item Details -->
      <div style="margin-bottom:24px">
        <p style="margin:0 0 10px 0;font-weight:700;font-size:12px">ITEMS INCLUDED:</p>
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="border-bottom:1px solid #ccc">
              <th style="text-align:left;padding:8px 0;font-weight:700">Description</th>
              <th style="text-align:center;padding:8px 0;font-weight:700;width:60px">Qty</th>
              <th style="text-align:left;padding:8px 0;font-weight:700;width:80px">SKU</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:10px 0;word-break:break-word">${l}</td>
              <td style="text-align:center;padding:10px 0">${e.qty||1}</td>
              <td style="padding:10px 0;font-family:'DM Mono',monospace;font-size:10px">${c}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary -->
      <div style="background:#f9f9f9;padding:12px;border-left:3px solid #7b61ff;margin-bottom:24px;font-size:11px">
        <div style="display:grid;grid-template-columns:1fr auto;gap:16px;margin-bottom:8px">
          <span>Sale Price:</span>
          <span style="font-weight:600">${S(e.price||0)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:16px;margin-bottom:8px">
          <span>Fees:</span>
          <span style="font-weight:600">${S(e.fees||0)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:16px;border-top:1px solid #ddd;padding-top:8px">
          <span>Net (before ship):</span>
          <span style="font-weight:700;font-size:12px">${S((e.price||0)-(e.fees||0))}</span>
        </div>
      </div>

      <!-- Thank You Message -->
      <div style="background:#fffacd;padding:14px;border-left:3px solid #ffc107;margin-bottom:24px;font-size:11px;line-height:1.6;color:#333">
        <p style="margin:0;font-weight:600;margin-bottom:6px">Thank You!</p>
        <p style="margin:0">${x(o)}</p>
      </div>

      <!-- Platform & Tracking info (if shipped) -->
      ${e.shipped?`
        <div style="font-size:10px;color:#666;border-top:1px solid #eee;padding-top:12px">
          <p style="margin:0"><strong>Shipped via:</strong> ${x(e.carrier||"—")} ${e.platform?"("+x(e.platform)+")":""}</p>
          ${e.trackingNumber?`<p style="margin:4px 0 0 0"><strong>Tracking:</strong> ${x(e.trackingNumber)}</p>`:""}
        </div>
      `:""}

      <!-- Footer -->
      <div style="border-top:1px solid #ccc;margin-top:24px;padding-top:12px;font-size:9px;color:#999;text-align:center">
        <p style="margin:0">Generated by FlipTrack • Page ${a} of ${i}</p>
        <p style="margin:4px 0 0 0">${new Date().toLocaleString()}</p>
      </div>
    </div>
  `}function uc(t,e){const n=window.open("",e,"height=800,width=600");if(!n){console.warn("Unable to open print window — popup may be blocked");return}n.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Packing Slip</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Syne', monospace;
          background: #f5f5f5;
          padding: 20px;
        }
        @media print {
          body { background: white; padding: 0; }
          @page { margin: 0.5in; }
        }
      </style>
    </head>
    <body>
      ${t}
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => window.print(), 500);
        });
      <\/script>
    </body>
    </html>
  `),n.document.close()}function ph(){const t=document.getElementById("modals-root");if(!t||document.getElementById("packingSlipSettingsModal"))return;const e=$i();t.insertAdjacentHTML("beforeend",`
    <div id="packingSlipSettingsModal" class="overlay">
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3>Packing Slip Settings</h3>
          <button onclick="closePackingSlipSettings()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px">✕</button>
        </div>
        <div class="modal-body" style="padding:14px;max-height:70vh;overflow-y:auto;display:grid;gap:12px">

          <div style="border-bottom:1px solid var(--border);padding-bottom:12px">
            <h4 style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--text)">Business Info</h4>

            <div class="fgrp" style="margin-bottom:10px">
              <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Business Name</label>
              <input id="ps_businessName" type="text" value="${x(e.businessName)}" placeholder="Your Shop Name" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
            </div>

            <div class="fgrp" style="margin-bottom:10px">
              <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Your Name</label>
              <input id="ps_name" type="text" value="${x(e.name)}" placeholder="Your Name" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
            </div>

            <div class="fgrp" style="margin-bottom:10px">
              <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Address</label>
              <input id="ps_address" type="text" value="${x(e.address)}" placeholder="123 Main St" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
            </div>

            <div style="display:grid;grid-template-columns:2fr 1fr 1.5fr;gap:8px">
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">City</label>
                <input id="ps_city" type="text" value="${x(e.city)}" placeholder="City" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">State</label>
                <input id="ps_state" type="text" value="${x(e.state)}" placeholder="ST" maxlength="2" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">ZIP</label>
                <input id="ps_zip" type="text" value="${x(e.zip)}" placeholder="12345" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Phone</label>
                <input id="ps_phone" type="text" value="${x(e.phone)}" placeholder="(555) 555-5555" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Email</label>
                <input id="ps_email" type="email" value="${x(e.email)}" placeholder="you@example.com" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
            </div>
          </div>

          <div>
            <h4 style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--text)">Thank You Message</h4>
            <textarea id="ps_thankYouMsg" placeholder="Thank you for your purchase!..." style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%;min-height:80px;resize:vertical">${x(Si())}</textarea>
            <p style="font-size:9px;color:var(--muted);margin-top:4px">This message appears on all packing slips</p>
          </div>

        </div>
        <div class="modal-footer" style="padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">
          <button onclick="closePackingSlipSettings()" class="btn-secondary">Cancel</button>
          <button onclick="savePackingSlipSettings()" class="btn-primary">Save</button>
        </div>
      </div>
    </div>
  `)}function uh(){const t=document.getElementById("packingSlipSettingsModal");t&&t.classList.add("on")}function Em(){const t=document.getElementById("packingSlipSettingsModal");t&&t.classList.remove("on")}function fh(){const t={businessName:document.getElementById("ps_businessName").value.trim(),name:document.getElementById("ps_name").value.trim(),address:document.getElementById("ps_address").value.trim(),city:document.getElementById("ps_city").value.trim(),state:document.getElementById("ps_state").value.trim().toUpperCase(),zip:document.getElementById("ps_zip").value.trim(),phone:document.getElementById("ps_phone").value.trim(),email:document.getElementById("ps_email").value.trim()},e=document.getElementById("ps_thankYouMsg").value.trim();wm(t),xm(e);const n=document.getElementById("toast");n&&(n.textContent="Packing slip settings saved",n.classList.remove("err"),n.classList.add("on"),setTimeout(()=>n.classList.remove("on"),2300)),Em()}let Pn="",ho="",nn="unshipped",vs="",hs="",Xt=0;const Ws=50;let $t=new Set,sn=[],os=!1;async function Im(){try{const t=await gt("returns");sn=t?JSON.parse(t):[]}catch{sn=[]}}function _m(){et("returns",JSON.stringify(sn)).catch(t=>console.warn("FlipTrack: returns save failed:",t.message))}function mh(t){Pn=(t||"").toLowerCase(),Xt=0,Mt()}function gh(t){ho=t||"",Xt=0,Mt()}function yh(t){nn=t||"unshipped",Xt=0,Mt()}function vh(t){vs=t||"",Xt=0,Mt()}function hh(t){hs=t||"",Xt=0,Mt()}function bh(){Pn="",ho="",nn="unshipped",vs="",hs="",Xt=0,Mt()}function wh(t){$t.has(t)?$t.delete(t):$t.add(t),Mt()}function xh(t){const e=ki();t.checked?e.forEach(n=>$t.add(n.id)):e.forEach(n=>$t.delete(n.id)),Mt()}function $h(){$t.clear(),Mt()}function ki(){return B.filter(t=>{if(nn==="unshipped"&&t.shipped||nn==="shipped"&&!t.shipped||ho&&t.platform!==ho)return!1;if(vs){const e=new Date(t.date).getTime(),n=new Date(vs).getTime();if(e<n)return!1}if(hs){const e=new Date(t.date).getTime(),n=new Date(hs).getTime();if(e>n)return!1}if(Pn){const e=F(t.itemId),n=e?(e.name||"").toLowerCase():"",s=(t.buyerName||"").toLowerCase();if(!n.includes(Pn)&&!s.includes(Pn))return!1}return!0})}function fc(t,e){if(!e)return!0;const n=e.trim();return!(t==="USPS"&&!/^[0-9]{20,22}$|^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(n)||t==="UPS"&&!/^1Z[A-Z0-9]{16}$/.test(n.toUpperCase())||t==="FedEx"&&!/^[0-9]{12,22}$/.test(n))}function Sh(){var o,a;const t=((o=document.getElementById("shipCarrier"))==null?void 0:o.value)||"",e=((a=document.getElementById("shipTracking"))==null?void 0:a.value)||"",n=document.getElementById("shipTrackingIndicator");if(!n)return;if(!e.trim()){n.style.display="none";return}const s=fc(t,e);n.style.display="block",n.style.color=s?"var(--good)":"var(--danger)",n.textContent=s?"✓ Valid":"✗ Invalid format"}async function kh(){var l,c,d,u;const t=(l=document.getElementById("return_sale"))==null?void 0:l.value,e=((c=document.getElementById("return_reason"))==null?void 0:c.value)||"",n=parseFloat((d=document.getElementById("return_refund"))==null?void 0:d.value)||0,s=(((u=document.getElementById("return_notes"))==null?void 0:u.value)||"").trim();if(!t){w("Select a sale",!0);return}sn.push({id:se(),saleId:t,reason:e,refundAmount:n,notes:s,date:Date.now()}),_m(),w("Return logged");const o=document.getElementById("return_sale"),a=document.getElementById("return_reason"),i=document.getElementById("return_refund"),r=document.getElementById("return_notes");o&&(o.value=""),a&&(a.value=""),i&&(i.value=""),r&&(r.value=""),Mt()}function Eh(){os=!os,Mt()}function Ih(t){const e=B.find(s=>s.id===t);if(!e){w("Sale not found",!0);return}const n=document.getElementById("shipModal");n&&(n.dataset.activeSaleId=t,document.getElementById("shipCarrier").value=e.carrier||"USPS",document.getElementById("shipTracking").value=e.trackingNumber||"",document.getElementById("shipCost").value=e.actualShipCost||"",n.classList.add("on"))}function _h(t){var i,r,l;const e=B.find(c=>c.id===t);if(!e){w("Sale not found",!0);return}const n=(((i=document.getElementById("shipCarrier"))==null?void 0:i.value)||"").trim(),s=(((r=document.getElementById("shipTracking"))==null?void 0:r.value)||"").trim(),o=(((l=document.getElementById("shipCost"))==null?void 0:l.value)||"").trim();if(!n){w("Select carrier",!0);return}if(!s){w("Enter tracking number",!0);return}if(!fc(n,s)){w("Invalid tracking number format",!0);return}const a=parseFloat(o)||0;e.shipped=!0,e.shippedDate=new Date().toISOString(),e.carrier=n,e.trackingNumber=s,e.actualShipCost=a,j("sales",t),O(),w(`Marked shipped: ${s}`),document.getElementById("shipModal").classList.remove("on"),Mt()}function Ch(){document.getElementById("shipModal").classList.remove("on")}function Bh(){if($t.size===0){w("Select items first",!0);return}const t=document.getElementById("shipBatchModal");t&&t.classList.add("on")}function Th(){var n;const t=(((n=document.getElementById("shipBatchCarrier"))==null?void 0:n.value)||"").trim();if(!t){w("Select carrier",!0);return}let e=0;$t.forEach(s=>{const o=B.find(a=>a.id===s);o&&!o.shipped&&(o.shipped=!0,o.shippedDate=new Date().toISOString(),o.carrier=t,o.trackingNumber="",o.actualShipCost=0,j("sales",s),e++)}),O(),w(`Marked ${e} orders shipped`),document.getElementById("shipBatchModal").classList.remove("on"),$t.clear(),Mt()}function Ph(){document.getElementById("shipBatchModal").classList.remove("on")}function Mh(t){const e=B.find(n=>n.id===t);if(!e){w("Sale not found",!0);return}Sm(t,e)}function Dh(){if($t.size===0){w("Select orders first",!0);return}const t=[...$t].map(e=>B.find(n=>n.id===e)).filter(Boolean);km([...$t],t)}function Lh(){const t=ki(),e=["Sale ID","Item","Buyer","Platform","Date Sold","Qty","Price","Carrier","Tracking","Ship Cost","Status"],n=t.map(r=>{const l=F(r.itemId);return[r.id,l?x(l.name):"—",x(r.buyerName||""),r.platform||"",mt(r.date),r.qty||1,S(r.price||0),r.carrier||"",r.trackingNumber||"",S(r.actualShipCost||0),r.shipped?"Shipped":"Pending"]}),s=[e,...n].map(r=>r.map(l=>`"${String(l).replace(/"/g,'""')}"`).join(",")).join(`
`),o=new Blob([s],{type:"text/csv"}),a=URL.createObjectURL(o),i=document.createElement("a");i.href=a,i.download=`ship-log-${ot()}.csv`,i.click(),URL.revokeObjectURL(a),w("Exported ship log")}async function Mt(){await Im();const t=document.getElementById("view-shipping");if(!t)return;const e=ki(),n=Math.max(1,Math.ceil(e.length/Ws));Xt=Math.max(0,Math.min(Xt,n-1));const s=Xt*Ws,o=s+Ws,a=e.slice(s,o),i=B.filter(u=>!u.shipped).length,r=B.filter(u=>{if(!u.shippedDate)return!1;const p=new Date(u.shippedDate).getTime();return Date.now()-p<864e5}).length,l=(()=>{const u=B.filter(y=>y.shippedDate&&y.date);if(u.length===0)return 0;const p=u.reduce((y,v)=>{const h=new Date(v.date).getTime(),m=new Date(v.shippedDate).getTime();return y+(m-h)},0);return Math.round(p/u.length/864e5)})(),c=B.filter(u=>u.shipped).reduce((u,p)=>u+(p.actualShipCost||0),0),d=a.length>0&&a.every(u=>$t.has(u.id));t.innerHTML=`
    <div class="panel">
      <div class="panel-header">
        <h2 class="panel-title">Shipping & Fulfillment</h2>
      </div>

      <!-- Stats strip -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;padding:14px;border-bottom:1px solid var(--border)">
        <div class="stat-card c1">
          <div class="stat-label">Pending</div>
          <div class="stat-value">${i}</div>
        </div>
        <div class="stat-card c2">
          <div class="stat-label">Shipped Today</div>
          <div class="stat-value">${r}</div>
        </div>
        <div class="stat-card c3">
          <div class="stat-label">Avg Ship Time</div>
          <div class="stat-value">${l} days</div>
        </div>
        <div class="stat-card c4">
          <div class="stat-label">Total Cost</div>
          <div class="stat-value">${S(c)}</div>
        </div>
      </div>

      <!-- Filters -->
      <div style="padding:14px;border-bottom:1px solid var(--border);background:var(--surface2)">
        <div class="form-grid" style="margin-bottom:12px">
          <input type="text" placeholder="Search item or buyer..." value="${x(Pn)}"
            oninput="shipSetSearch(this.value)" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px" />

          <select onchange="shipSetStatusFilter(this.value)" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px">
            <option value="unshipped" ${nn==="unshipped"?"selected":""}>Unshipped</option>
            <option value="shipped" ${nn==="shipped"?"selected":""}>Shipped</option>
            <option value="all" ${nn==="all"?"selected":""}>All</option>
          </select>
        </div>

        <div class="form-grid" style="gap:8px;align-items:end">
          <div style="min-width:100px">
            <label style="display:block;font-size:10px;color:var(--muted);margin-bottom:4px">From Date</label>
            <input type="date" value="${vs}" onchange="shipSetDateFrom(this.value)" style="padding:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
          </div>
          <div style="min-width:100px">
            <label style="display:block;font-size:10px;color:var(--muted);margin-bottom:4px">To Date</label>
            <input type="date" value="${hs}" onchange="shipSetDateTo(this.value)" style="padding:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
          </div>
          <button onclick="shipClearFilters()" class="btn-secondary" style="padding:6px 12px;font-size:10px">Clear</button>
        </div>
      </div>

      <!-- Batch actions -->
      ${$t.size>0?`
        <div style="padding:10px 14px;background:rgba(87,200,255,0.05);border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center;font-size:11px;color:var(--muted)">
          <span>${$t.size} selected</span>
          <button onclick="shipBatchMark()" class="btn-primary" style="padding:5px 10px;font-size:10px">Mark Shipped</button>
          <button onclick="shipPrintBatchSlips()" class="btn-secondary" style="padding:5px 10px;font-size:10px">Print Slips</button>
          <button onclick="shipClearSel()" class="btn-danger" style="padding:5px 10px;font-size:10px">Clear</button>
        </div>
      `:""}

      <!-- Actions bar -->
      <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="shipExportLog()" class="btn-secondary" style="padding:6px 12px;font-size:10px">Export Log</button>
      </div>

      <!-- Table/cards -->
      ${a.length===0?`
        <div class="empty-state">
          <p style="font-size:12px;color:var(--muted)">No orders to ship</p>
        </div>
      `:`
        <div style="overflow-x:auto">
          <table class="inv-table">
            <thead>
              <tr style="border-bottom:1px solid var(--border)">
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">
                  <input type="checkbox" ${d?"checked":""} onchange="shipToggleAll(this)" />
                </th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Item</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Buyer</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Platform</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Date Sold</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Weight</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Package</th>
                <th style="padding:10px;text-align:left;font-size:10px;color:var(--muted);font-weight:600">Status</th>
                <th style="padding:10px;text-align:center;font-size:10px;color:var(--muted);font-weight:600">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${a.map(u=>{const p=F(u.itemId),y=p?lc(p):null,v=$t.has(u.id);return`
                  <tr style="border-bottom:1px solid var(--border);background:${v?"rgba(87,200,255,0.05)":"transparent"}">
                    <td style="padding:10px"><input type="checkbox" ${v?"checked":""} onchange="shipToggleSel('${u.id}')" /></td>
                    <td style="padding:10px;font-size:11px;color:var(--text)">${x(p?p.name:"—")}</td>
                    <td style="padding:10px;font-size:11px;color:var(--text)">${x(u.buyerName||"—")}</td>
                    <td style="padding:10px;font-size:10px;color:var(--muted)">${x(u.platform||"—")}</td>
                    <td style="padding:10px;font-size:10px;color:var(--muted)">${mt(u.date)}</td>
                    <td style="padding:10px;font-size:10px;color:var(--muted)">${p&&p.weight?p.weight+(p.dimUnit||"oz"):"—"}</td>
                    <td style="padding:10px;font-size:10px;color:var(--accent)">${y?x(y.name):"—"}</td>
                    <td style="padding:10px;font-size:10px">
                      <span style="color:${u.shipped?"var(--good)":"var(--warn)"}">
                        ${u.shipped?`✓ ${mt(u.shippedDate)}`:"Pending"}
                      </span>
                    </td>
                    <td style="padding:10px;text-align:center;font-size:10px;display:flex;gap:6px;justify-content:center">
                      ${u.shipped?"":`<button onclick="shipMarkShipped('${u.id}')" class="act-btn" style="padding:4px 8px">Mark</button>`}
                      <button onclick="shipPrintSlip('${u.id}')" class="act-btn" style="padding:4px 8px">Slip</button>
                      ${u.trackingNumber?`<a href="https://tools.usps.com/go/TrackConfirmAction_input?tLabels=${encodeURIComponent(u.trackingNumber)}" target="_blank" class="act-btn" style="padding:4px 8px;text-decoration:none">Track</a>`:""}
                    </td>
                  </tr>
                `}).join("")}
            </tbody>
          </table>
        </div>
      `}

      <!-- Pagination -->
      <div id="shipPagination" style="padding:14px"></div>

      <!-- RETURNS MANAGEMENT -->
      <div style="margin-top:20px;border-top:2px solid var(--border);padding-top:20px">
        <div style="padding:12px;background:var(--surface);border-radius:6px;border:1px solid var(--border);margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${os?"12px":"0"}">
            <h3 class="panel-title" style="margin:0">Returns Management</h3>
            <button onclick="shipToggleReturnForm()" class="btn-secondary" style="padding:6px 12px;font-size:10px">${os?"Hide":"Log Return"}</button>
          </div>

          ${os?`
            <div style="display:grid;gap:10px;padding:12px;background:rgba(var(--surface-rgb),0.5);border-radius:4px;border:1px solid var(--border)">
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Sale ID</label>
                <select id="return_sale" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%">
                  <option value="">— Select Sale —</option>
                  ${B.slice().reverse().slice(0,20).map(u=>{const p=F(u.itemId);return`<option value="${u.id}">${(p==null?void 0:p.name)||"Item"} - ${u.buyerName||"Buyer"}</option>`}).join("")}
                </select>
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Reason</label>
                <select id="return_reason" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%">
                  <option value="">— Select Reason —</option>
                  <option>Defective</option>
                  <option>Wrong Item</option>
                  <option>Buyer Remorse</option>
                  <option>Damaged in Shipping</option>
                  <option>Other</option>
                </select>
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Refund Amount ($)</label>
                <input id="return_refund" type="number" placeholder="0.00" step="0.01" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
              </div>
              <div class="fgrp">
                <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Notes</label>
                <textarea id="return_notes" placeholder="Return notes..." style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%;resize:vertical" rows="2"></textarea>
              </div>
              <button onclick="shipLogReturn()" class="btn-primary" style="padding:8px 12px;font-weight:600;font-family:'Syne',sans-serif;font-size:11px">Log Return</button>
            </div>
          `:""}
        </div>

        ${(()=>{const u=sn.length,p=sn.reduce((v,h)=>v+(h.refundAmount||0),0),y=sn.slice().reverse().slice(0,5);return`
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px">
              <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Total Returns</div>
                <div style="font-size:18px;font-weight:700;color:var(--warn);font-family:'Syne',sans-serif">${u}</div>
              </div>
              <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Total Refunded</div>
                <div style="font-size:18px;font-weight:700;color:var(--danger);font-family:'Syne',sans-serif">${S(p)}</div>
              </div>
            </div>

            ${y.length?`
              <div style="padding:12px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                <div style="font-size:11px;font-weight:700;color:var(--text);margin-bottom:8px">Recent Returns</div>
                <div style="display:flex;flex-direction:column;gap:6px">
                  ${y.map(v=>{const h=B.find(f=>f.id===v.saleId),m=h?F(h.itemId):null;return`
                      <div style="padding:8px;background:rgba(var(--surface-rgb),0.5);border-radius:3px;border-left:3px solid var(--danger);font-size:10px;font-family:'DM Mono',monospace">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                          <span style="color:var(--text);font-weight:600">${(m==null?void 0:m.name)||"Unknown Item"}</span>
                          <span style="color:var(--danger)">${S(v.refundAmount)}</span>
                        </div>
                        <div style="color:var(--muted);font-size:9px">${v.reason} • ${mt(v.date)}</div>
                        ${v.notes?`<div style="color:var(--muted);font-size:9px;margin-top:4px">${x(v.notes)}</div>`:""}
                      </div>
                    `}).join("")}
                </div>
              </div>
            `:""}
          `})()}
      </div>
    </div>
  `,Is(document.getElementById("shipPagination"),{page:Xt,totalItems:e.length,pageSize:Ws,onPage:u=>{Xt=u,Mt()}})}function Ah(){const t=document.getElementById("modals-root");!t||document.getElementById("shipModal")||t.insertAdjacentHTML("beforeend",`
    <!-- Mark Shipped Modal -->
    <div id="shipModal" class="overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Mark Order Shipped</h3>
          <button onclick="shipCancelMark()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px">✕</button>
        </div>
        <div class="modal-body" style="padding:14px;display:grid;gap:10px">
          <div class="fgrp">
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Carrier</label>
            <select id="shipCarrier" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%">
              <option>USPS</option>
              <option>UPS</option>
              <option>FedEx</option>
              <option>DHL</option>
              <option>Other</option>
            </select>
          </div>
          <div class="fgrp">
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Tracking Number</label>
            <div style="display:flex;gap:6px;align-items:flex-start">
              <input id="shipTracking" type="text" placeholder="e.g., 9400111899223456789012" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;flex:1" oninput="shipCheckTracking()" />
              <div id="shipTrackingIndicator" style="display:none;padding:8px;border-radius:4px;font-size:10px;font-weight:600;min-width:60px;text-align:center;white-space:nowrap"></div>
            </div>
          </div>
          <div class="fgrp">
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Actual Shipping Cost ($)</label>
            <input id="shipCost" type="number" placeholder="0.00" step="0.01" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%" />
          </div>
        </div>
        <div class="modal-footer" style="padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">
          <button onclick="shipCancelMark()" class="btn-secondary">Cancel</button>
          <button onclick="shipConfirmShipped(document.getElementById('shipModal').dataset.activeSaleId)" class="btn-primary">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Batch Mark Shipped Modal -->
    <div id="shipBatchModal" class="overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Mark Selected as Shipped</h3>
          <button onclick="shipCancelBatchMark()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px">✕</button>
        </div>
        <div class="modal-body" style="padding:14px;display:grid;gap:10px">
          <div class="fgrp">
            <label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px">Carrier</label>
            <select id="shipBatchCarrier" style="padding:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:4px;font-family:'DM Mono',monospace;font-size:11px;width:100%">
              <option value="">— Select —</option>
              <option>USPS</option>
              <option>UPS</option>
              <option>FedEx</option>
              <option>DHL</option>
              <option>Other</option>
            </select>
          </div>
          <p style="font-size:11px;color:var(--muted)">Tracking numbers can be added individually after batch mark.</p>
        </div>
        <div class="modal-footer" style="padding:10px 14px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end">
          <button onclick="shipCancelBatchMark()" class="btn-secondary">Cancel</button>
          <button onclick="shipConfirmBatchMark()" class="btn-primary">Mark All</button>
        </div>
      </div>
    </div>
  `)}function Zs(t,e,n){if(!t||!t.itemIds||!t.itemIds.length)return{totalRevenue:0,totalCost:0,profit:0,roi:0,margin:0};let s=0,o=t.totalSpent||0;t.itemIds.forEach(l=>{if(!e.find(p=>p.id===l))return;const u=n.filter(p=>p.itemId===l).reduce((p,y)=>p+(y.amount||0),0);s+=u});const a=s-o,i=o?a/o:0,r=s?a/s:0;return{totalRevenue:s,totalCost:o,profit:a,roi:i,margin:r}}function mc(t,e){return!t||!t.itemIds?[]:t.itemIds.map(n=>e.find(s=>s.id===n)).filter(Boolean)}function Cm(t,e){const n=mc(t,e);if(!n.length)return{};const s=(t.totalSpent||0)/n.length,o={};return n.forEach(a=>{o[a.id]=s}),o}function Bm(t,e,n){const s={};return t.forEach(o=>{const a=o.location||"Unknown";s[a]||(s[a]={location:a,count:0,totalSpent:0,totalRevenue:0,itemCount:0,roi:0,margin:0});const i=Zs(o,e,n);s[a].count+=1,s[a].totalSpent+=o.totalSpent||0,s[a].totalRevenue+=i.totalRevenue,s[a].itemCount+=o.itemIds?o.itemIds.length:0}),Object.values(s).forEach(o=>{o.totalSpent&&(o.roi=(o.totalRevenue-o.totalSpent)/o.totalSpent,o.margin=o.totalRevenue?(o.totalRevenue-o.totalSpent)/o.totalRevenue:0)}),s}function Tm(t,e,n,s=5){const o=Bm(t,e,n);return Object.values(o).filter(a=>a.count>0).sort((a,i)=>i.roi-a.roi).slice(0,s)}function Pm(t){const e=t.length,n=t.reduce((o,a)=>o+(a.totalSpent||0),0),s=t.reduce((o,a)=>o+(a.itemIds?a.itemIds.length:0),0);return{totalHauls:e,totalInvested:n,avgPerHaul:e?n/e:0,totalItems:s,avgItemsPerHaul:e?s/e:0}}let at=[],es="",Dt="date-desc",Ia=null,Ze=0,Kn=25;async function zh(){try{const t=dt(),e=St();if(t&&e){const{data:n,error:s}=await t.from("ft_hauls").select("id, data").eq("account_id",e.id);if(!s&&n&&n.length>0){at=n.map(o=>({id:o.id,...o.data})),await et("hauls",at),localStorage.setItem("ft_hauls",JSON.stringify(at));return}}}catch(t){console.warn("FlipTrack: Hauls cloud pull failed, using local:",t.message)}try{at=await gt("hauls"),at||(at=[])}catch(t){console.warn("FlipTrack: Hauls IDB load failed, using localStorage:",t.message);try{at=JSON.parse(localStorage.getItem("ft_hauls")||"[]")}catch{at=[]}}at.length>0&&gc().catch(t=>console.warn("FlipTrack: Hauls initial push error:",t.message))}async function To(){await et("hauls",at),localStorage.setItem("ft_hauls",JSON.stringify(at)),gc().catch(t=>console.warn("FlipTrack: Hauls cloud save error:",t.message))}async function gc(){const t=dt(),e=St();if(!t||!e||!navigator.onLine)return;const n=e.id,s=at.map(i=>{const{id:r,...l}=i;return{id:r,account_id:n,data:l,updated_at:new Date().toISOString()}});if(s.length>0){const{error:i}=await t.from("ft_hauls").upsert(s,{onConflict:"id"});if(i)throw new Error(i.message)}const o=at.map(i=>i.id),{data:a}=await t.from("ft_hauls").select("id").eq("account_id",n);if(a){const i=a.filter(r=>!o.includes(r.id)).map(r=>r.id);i.length>0&&await t.from("ft_hauls").delete().in("id",i)}}function Be(){const t=document.getElementById("sourcingContent");if(!t)return;const e=at.filter(o=>!es||(o.location||"").toLowerCase().includes(es)||(o.notes||"").toLowerCase().includes(es)).sort((o,a)=>{if(Dt==="date-desc")return new Date(a.date)-new Date(o.date);if(Dt==="date-asc")return new Date(o.date)-new Date(a.date);if(Dt==="spent-high")return(a.totalSpent||0)-(o.totalSpent||0);if(Dt==="spent-low")return(o.totalSpent||0)-(a.totalSpent||0);if(Dt==="roi-high"){const i=Zs(o,k,B).roi;return Zs(a,k,B).roi-i}return Dt==="location"?(o.location||"").localeCompare(a.location||""):new Date(a.date)-new Date(o.date)}),n=Pm(at),s=Tm(at,k,B,3);t.innerHTML=`
    <div class="sourcing-container" style="display:flex;flex-direction:column;gap:16px;padding:12px">

      <!-- STATS STRIP -->
      <div class="stats-strip" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px">
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-family:'Syne',sans-serif;font-weight:700">Total Hauls</div>
          <div style="font-size:20px;font-weight:700;font-family:'Syne',sans-serif;color:var(--accent)">${n.totalHauls}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-family:'Syne',sans-serif;font-weight:700">Total Invested</div>
          <div style="font-size:18px;font-weight:700;font-family:'Syne',sans-serif;color:var(--accent2)">${S(n.totalInvested)}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-family:'Syne',sans-serif;font-weight:700">Avg Per Haul</div>
          <div style="font-size:18px;font-weight:700;font-family:'Syne',sans-serif;color:var(--accent3)">${S(n.avgPerHaul)}</div>
        </div>
        <div class="stat-card">
          <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px;font-family:'Syne',sans-serif;font-weight:700">Avg Items/Haul</div>
          <div style="font-size:20px;font-weight:700;font-family:'Syne',sans-serif;color:var(--good)">${n.avgItemsPerHaul.toFixed(1)}</div>
        </div>
      </div>

      <!-- TOP SOURCES LEADERBOARD -->
      ${s.length?`
        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">Top Sourcing Locations</h3>
          </div>
          <div style="padding:12px">
            ${s.map((o,a)=>{const i=["🥇","🥈","🥉"][a]||"•",r=o.roi>=.3?"var(--good)":o.roi>=.1?"var(--accent)":"var(--warn)";return`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;font-family:'DM Mono',monospace">
                <div>
                  <span style="margin-right:8px">${i}</span>
                  <strong>${x(o.location)}</strong>
                  <span style="color:var(--muted);font-size:11px"> (${o.count} haul${o.count!==1?"s":""})</span>
                </div>
                <div style="text-align:right">
                  <div style="color:${r};font-weight:700">${Y(o.roi)}</div>
                  <div style="color:var(--muted);font-size:11px">${S(o.totalSpent)} invested</div>
                </div>
              </div>`}).join("")}
          </div>
        </div>
      `:""}

      <!-- LOG NEW HAUL FORM -->
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Log New Haul</h3>
        </div>
        <div style="padding:12px;display:grid;gap:10px">
          <div class="form-grid">
            <div class="fgrp">
              <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Date</label>
              <input type="date" id="haul_date" value="${ot()}"
                     style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px">
            </div>
            <div class="fgrp">
              <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Location</label>
              <input type="text" id="haul_loc" placeholder="e.g. Goodwill, Estate Sale, Thrift"
                     style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px">
            </div>
            <div class="fgrp">
              <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Total Spent</label>
              <input type="number" id="haul_spent" placeholder="0.00" step="0.01" min="0"
                     style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px">
            </div>
            <div class="fgrp">
              <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Mileage (mi)</label>
              <input type="number" id="haul_mileage" placeholder="0" step="0.1" min="0"
                     style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px">
            </div>
          </div>
          <div class="fgrp">
            <label style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px">Notes</label>
            <textarea id="haul_notes" placeholder="Add notes..." rows="2"
                      style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px;resize:vertical"></textarea>
          </div>
          <input id="haul_receipt" type="file" accept="image/*" capture="environment" class="fgrp" style="grid-column:1/-1;padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:13px">
          <div style="font-size:10px;color:var(--muted);grid-column:1/-1">Snap or upload receipt photo</div>
          <button class="btn-primary" onclick="addHaul()" style="padding:10px;font-weight:700;font-family:'Syne',sans-serif;grid-column:1/-1">Log Haul</button>
        </div>
      </div>

      <!-- SEARCH & SORT -->
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:0 0 8px 0">
        <input type="text" placeholder="Search location, notes..." value="${x(es)}"
               oninput="srcSetSearch(this.value)"
               style="flex:1;min-width:150px;padding:6px 10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;font-family:'DM Mono',monospace">
        <select onchange="srcSetSort(this.value)" style="padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:11px;font-family:'DM Mono',monospace">
          <option value="date-desc" ${Dt==="date-desc"?"selected":""}>Recent first</option>
          <option value="date-asc" ${Dt==="date-asc"?"selected":""}>Oldest first</option>
          <option value="spent-high" ${Dt==="spent-high"?"selected":""}>Spent (high)</option>
          <option value="spent-low" ${Dt==="spent-low"?"selected":""}>Spent (low)</option>
          <option value="roi-high" ${Dt==="roi-high"?"selected":""}>ROI (high)</option>
          <option value="location" ${Dt==="location"?"selected":""}>Location A-Z</option>
        </select>
      </div>

      <!-- HAUL LIST -->
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">Haul History (${e.length})</h3>
        </div>
        <div style="padding:12px">
          ${e.length?`
            <div style="display:flex;flex-direction:column;gap:8px">
              ${e.slice(Ze*Kn,(Ze+1)*Kn).map(o=>{const a=Zs(o,k,B),i=mc(o,k),r=Ia===o.id,l=a.roi>=.3?"var(--good)":a.roi>=.1?"var(--accent)":a.roi<0?"var(--danger)":"var(--muted)",c=ge(o.id);return`<div class="haul-card" style="border:1px solid var(--border);border-radius:6px;padding:10px;background:rgba(var(--surface-rgb),0.5);cursor:pointer" onclick="expandHaul('${c}')">
                  <div style="display:grid;grid-template-columns:1fr auto;gap:8px;font-size:12px;font-family:'DM Mono',monospace">
                    <div>
                      <div style="font-weight:700;color:var(--text)">${x(o.location)}</div>
                      <div style="color:var(--muted);font-size:11px">${mt(o.date)} · ${i.length} item${i.length!==1?"s":""}</div>
                    </div>
                    <div style="text-align:right;display:flex;align-items:center;gap:8px">
                      ${o.receiptImage?`<img src="${o.receiptImage}" style="width:40px;height:40px;object-fit:cover;border-radius:2px;cursor:pointer" onclick="event.stopPropagation();window.open(this.src)" alt="Receipt">`:""}
                      <div>
                        <div style="font-weight:700;color:var(--accent2)">${S(o.totalSpent)}</div>
                        <div style="color:${l};font-size:11px;font-weight:700">${Y(a.roi)}</div>
                      </div>
                    </div>
                  </div>
                  ${r?`
                    <div style="border-top:1px solid var(--border);margin-top:10px;padding-top:10px">
                      <div style="font-size:11px;color:var(--muted);margin-bottom:8px">
                        <strong>Linked Items (${i.length}):</strong>
                      </div>
                      ${i.length?`
                        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
                          ${i.map(d=>{const u=Cm(o,k)[d.id]||0,y=B.filter(v=>v.itemId===d.id).reduce((v,h)=>v+(h.amount||0),0);return`<div style="padding:6px;background:var(--surface);border-radius:4px;font-size:11px;display:flex;justify-content:space-between">
                              <span>${x(d.name||"Untitled")}</span>
                              <span style="color:var(--muted)">${S(u)} cost · ${S(y)} revenue</span>
                            </div>`}).join("")}
                        </div>
                      `:'<div style="color:var(--muted);font-size:11px;padding:8px">No items linked yet</div>'}
                      <button class="btn-secondary" onclick="linkItemsToHaul('${c}')" style="padding:6px 10px;margin-right:6px;font-size:11px;font-family:'Syne',sans-serif">Link Items</button>
                      <button class="btn-danger" onclick="deleteHaul('${c}')" style="padding:6px 10px;font-size:11px;font-family:'Syne',sans-serif">Delete</button>
                    </div>
                  `:""}
                </div>`}).join("")}
            </div>
            <div id="srcPagination" style="margin-top:12px"></div>
          `:`<div class="empty-state" style="text-align:center;padding:24px;color:var(--muted)">
            <div style="font-size:14px;font-family:'Syne',sans-serif;margin-bottom:8px">No hauls yet</div>
            <div style="font-size:12px">Log your first haul to get started!</div>
          </div>`}
        </div>
      </div>

      <!-- HAUL ANALYTICS -->
      ${at.length>0?(()=>{const o=e.length,a=e.reduce((d,u)=>d+(u.totalSpent||0),0),i=o>0?a/o:0,r=e.reduce((d,u)=>d+(u.mileage||0),0),l={};for(const d of at){const u=d.location||"Unknown";l[u]||(l[u]={spent:0,revenue:0,trips:0}),l[u].spent+=d.totalSpent||0,l[u].trips++;for(const p of d.itemIds||[]){const y=B.filter(v=>v.itemId===p);l[u].revenue+=y.reduce((v,h)=>v+(h.price||0),0)}}const c=Object.entries(l).map(([d,u])=>({loc:d,...u,roi:u.spent>0?(u.revenue-u.spent)/u.spent:0})).filter(d=>d.trips>=1).sort((d,u)=>u.roi-d.roi).slice(0,5);return`
          <div class="panel">
            <div class="panel-header">
              <h3 class="panel-title">Haul Performance Analytics</h3>
            </div>
            <div style="padding:12px;display:grid;gap:12px">
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px">
                <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                  <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Total Trips</div>
                  <div style="font-size:18px;font-weight:700;color:var(--accent);font-family:'Syne',sans-serif">${o}</div>
                </div>
                <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                  <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Total Invested</div>
                  <div style="font-size:18px;font-weight:700;color:var(--accent2);font-family:'Syne',sans-serif">${S(a)}</div>
                </div>
                <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                  <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Avg Per Trip</div>
                  <div style="font-size:18px;font-weight:700;color:var(--accent3);font-family:'Syne',sans-serif">${S(i)}</div>
                </div>
                <div style="padding:10px;background:var(--surface);border-radius:4px;border:1px solid var(--border)">
                  <div style="font-size:10px;color:var(--muted);margin-bottom:4px">Total Mileage</div>
                  <div style="font-size:18px;font-weight:700;color:var(--good);font-family:'Syne',sans-serif">${r.toFixed(1)} mi</div>
                </div>
              </div>
              ${c.length?`
                <div style="border-top:1px solid var(--border);padding-top:12px">
                  <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px">Best Sources by ROI</div>
                  <div style="display:flex;flex-direction:column;gap:6px">
                    ${c.map((d,u)=>{const p=d.roi>=.3?"var(--good)":d.roi>=.1?"var(--accent)":"var(--warn)";return`
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:rgba(var(--surface-rgb),0.5);border-radius:3px;font-size:11px;font-family:'DM Mono',monospace">
                          <div>
                            <span style="margin-right:6px">${["🥇","🥈","🥉","4️⃣","5️⃣"][u]}</span>
                            <strong>${x(d.loc)}</strong>
                            <span style="color:var(--muted);font-size:10px"> (${d.trips} trip${d.trips!==1?"s":""})</span>
                          </div>
                          <div style="text-align:right">
                            <div style="color:${p};font-weight:700">${Y(d.roi)}</div>
                            <div style="color:var(--muted);font-size:10px">${S(d.spent)} invested</div>
                          </div>
                        </div>
                      `}).join("")}
                  </div>
                </div>
              `:""}
            </div>
          </div>
        `})():""}
    </div>
  `,e.length>Kn&&Is(document.getElementById("srcPagination"),{page:Ze,totalItems:e.length,pageSize:Kn,onPage:o=>{Ze=o,Be()},pageSizes:[25,50,100],onPageSize:o=>{Kn=o,Ze=0,Be()}})}async function Rh(){var h,m,f,E,$,I,M,N,W,L,q;const t=(h=document.getElementById("haul_date"))==null?void 0:h.value,e=(f=(m=document.getElementById("haul_loc"))==null?void 0:m.value)==null?void 0:f.trim(),n=($=(E=document.getElementById("haul_spent"))==null?void 0:E.value)==null?void 0:$.trim(),s=(M=(I=document.getElementById("haul_mileage"))==null?void 0:I.value)==null?void 0:M.trim(),o=(W=(N=document.getElementById("haul_notes"))==null?void 0:N.value)==null?void 0:W.trim();if(!t){w("Please enter a date",!0);return}if(!e){w("Please enter a location",!0);return}if(!n||isNaN(parseFloat(n))){w("Please enter a valid amount spent",!0);return}const a=parseFloat(n),i=s?parseFloat(s):0,r=(q=(L=document.getElementById("haul_receipt"))==null?void 0:L.files)==null?void 0:q[0];let l=null;r&&(l=await new Promise(D=>{const _=new FileReader;_.onload=()=>D(_.result),_.readAsDataURL(r)}));const c={id:se(),date:t,location:e,totalSpent:a,itemIds:[],notes:o||"",mileage:i||0,receiptImage:l};at.push(c),await To(),w("Haul logged ✓");const d=document.getElementById("haul_loc"),u=document.getElementById("haul_spent"),p=document.getElementById("haul_mileage"),y=document.getElementById("haul_notes"),v=document.getElementById("haul_receipt");d&&(d.value=""),u&&(u.value=""),p&&(p.value=""),y&&(y.value=""),v&&(v.value=""),Be()}async function Fh(t){if(!confirm("Delete this haul?"))return;const e=at.findIndex(n=>n.id===t);e>=0&&(at.splice(e,1),await To(),w("Haul deleted"),Be())}function Oh(t){Ia=Ia===t?null:t,Be()}async function Nh(t){const e=at.find(a=>a.id===t);if(!e)return;const n=document.createElement("div");n.style.cssText=`
    position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;z-index:var(--z-modal);padding:16px
  `;const s=document.createElement("div");s.style.cssText=`
    background:var(--surface);border:1px solid var(--border);border-radius:8px;
    padding:20px;max-width:600px;width:100%;max-height:80vh;overflow-y:auto;
    font-family:'DM Mono',monospace;font-size:12px
  `;const o=k.filter(a=>!e.itemIds.includes(a.id));s.innerHTML=`
    <div style="margin-bottom:16px">
      <h3 style="font-family:'Syne',sans-serif;font-size:16px;margin:0 0 12px 0">Link Items to Haul</h3>
      <div style="color:var(--muted);font-size:11px;margin-bottom:12px">Select items to assign to this haul</div>

      ${o.length?`
        <div style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto">
          ${o.map(a=>`
            <label style="display:flex;align-items:center;padding:8px;background:rgba(255,255,255,0.05);border-radius:4px;cursor:pointer">
              <input type="checkbox" value="${a.id}" style="margin-right:8px">
              <span style="flex:1">${x(a.name||"Untitled")}</span>
              <span style="color:var(--muted);font-size:10px">${S(a.cost||0)}</span>
            </label>
          `).join("")}
        </div>
      `:'<div style="color:var(--muted);padding:12px;text-align:center">All items already linked to hauls</div>'}
    </div>

    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn-primary" onclick="confirmLinkItems('${ge(t)}')" style="flex:1;padding:10px;font-family:'Syne',sans-serif">Link Selected</button>
      <button class="btn-secondary" onclick="closeItemLinkModal()" style="flex:1;padding:10px;font-family:'Syne',sans-serif">Cancel</button>
    </div>
  `,n.appendChild(s),document.body.appendChild(n),window._itemLinkModal=n}async function Uh(t){const e=window._itemLinkModal;if(!e)return;const n=e.querySelectorAll('input[type="checkbox"]:checked'),s=Array.from(n).map(a=>a.value),o=at.find(a=>a.id===t);o&&(o.itemIds.push(...s),await To(),w(`Linked ${s.length} item${s.length!==1?"s":""}`)),Mm(),Be()}function Mm(){const t=window._itemLinkModal;t&&(t.remove(),window._itemLinkModal=null)}async function qh(t,e){const n=at.find(s=>s.id===t);if(n){const s=n.itemIds.indexOf(e);s>=0&&(n.itemIds.splice(s,1),await To(),Be())}}function jh(t){es=(t||"").toLowerCase(),Ze=0,Be()}function Hh(t){Dt=t||"date-desc",Ze=0,Be()}const Dm={2024:.67,2025:.7,2026:.7};let fe=[];async function Wh(){try{fe=await gt("mileage_log")||[]}catch(t){console.warn("Failed to load mileage log:",t.message),fe=[]}}async function Lm(t){if(!t.date||!t.miles||!t.purpose)return w("Please fill in date, miles, and purpose",!0),!1;const e=Number(t.miles)||0;if(e<=0)return w("Miles must be greater than 0",!0),!1;const n={id:se(),date:t.date,miles:e,purpose:t.purpose.trim(),startLocation:(t.startLocation||"").trim(),endLocation:(t.endLocation||"").trim(),linkedHaulId:t.linkedHaulId||null};fe.push(n),fe.sort((s,o)=>new Date(o.date)-new Date(s.date));try{return await et("mileage_log",fe),!0}catch(s){return console.error("Failed to save mileage entry:",s.message),w("Failed to save mileage entry",!0),fe.pop(),!1}}async function Am(t){const e=fe.findIndex(n=>n.id===t);if(e===-1)return!1;fe.splice(e,1);try{return await et("mileage_log",fe),!0}catch(n){return console.error("Failed to delete mileage entry:",n.message),w("Failed to delete mileage entry",!0),!1}}function zm(t){const e=Dm[t]||.7,n=fe.filter(a=>new Date(a.date).getFullYear()===t),s=n.reduce((a,i)=>a+(i.miles||0),0),o=s*e;return{totalMiles:s,totalDeduction:o,rate:e,entries:n}}function Gh(){const t=new Date().getFullYear(),e=zm(t),n=e.entries.sort((s,o)=>new Date(o.date)-new Date(s.date)).map((s,o)=>`
      <tr>
        <td style="padding:8px;font-size:12px;color:var(--text)">${mt(s.date)}</td>
        <td style="padding:8px;font-size:12px;font-family:'DM Mono',monospace;color:var(--accent);text-align:right">${s.miles}</td>
        <td style="padding:8px;font-size:12px;color:var(--text)">${x(s.purpose)}</td>
        <td style="padding:8px;font-size:12px;color:var(--muted)">${s.startLocation?x(s.startLocation):"—"}</td>
        <td style="padding:8px;font-size:11px;text-align:center">
          <button onclick="mileDeleteEntry('${s.id}')" style="padding:4px 8px;background:var(--danger);color:white;border:none;border-radius:3px;cursor:pointer;font-size:10px;font-family:Syne,sans-serif">Delete</button>
        </td>
      </tr>
    `).join("");return`
    <div style="margin-bottom:24px">
      <div class="panel-title" style="margin-bottom:12px">Mileage Deduction Log</div>

      <!-- Add Entry Form -->
      <div class="panel" style="margin-bottom:16px;padding:12px">
        <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:8px">ADD ENTRY</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr 2fr;gap:8px;margin-bottom:8px">
          <div class="fgrp">
            <input type="date" id="mileDate" style="width:100%;padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px" />
          </div>
          <div class="fgrp">
            <input type="number" id="mileMiles" placeholder="Miles" step="0.1" min="0" style="width:100%;padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px" />
          </div>
          <div class="fgrp">
            <input type="text" id="milePurpose" placeholder="Purpose (e.g., sourcing trip)" style="width:100%;padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px" />
          </div>
        </div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div class="fgrp">
            <input type="text" id="mileStart" placeholder="Start location (optional)" style="width:100%;padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px" />
          </div>
          <div class="fgrp">
            <input type="text" id="mileEnd" placeholder="End location (optional)" style="width:100%;padding:6px 8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:12px;border-radius:4px" />
          </div>
        </div>
        <button onclick="mileAddEntry()" class="btn-primary" style="width:100%;padding:8px;background:var(--accent);color:white;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-family:Syne,sans-serif;font-size:13px">Add Entry</button>
      </div>

      <!-- Log Table -->
      ${e.entries.length>0?`
        <div style="overflow-x:auto;margin-bottom:16px">
          <table class="inv-table" style="font-size:12px;width:100%">
            <thead>
              <tr style="background:var(--surface);border-bottom:1px solid var(--border)">
                <th style="padding:8px;text-align:left;font-weight:600">Date</th>
                <th style="padding:8px;text-align:right;font-weight:600">Miles</th>
                <th style="padding:8px;text-align:left;font-weight:600">Purpose</th>
                <th style="padding:8px;text-align:left;font-weight:600">From</th>
                <th style="padding:8px;text-align:center;font-weight:600">Action</th>
              </tr>
            </thead>
            <tbody>
              ${n}
            </tbody>
          </table>
        </div>
      `:`
        <div class="empty-state" style="padding:16px;text-align:center;color:var(--muted);font-size:12px">
          No mileage entries yet
        </div>
      `}

      <!-- Summary Stats -->
      <div class="stat-card" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="padding:12px;background:var(--surface);border-radius:6px;border:1px solid var(--border)">
          <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Total Miles (${t})</div>
          <div style="font-size:18px;font-weight:700;color:var(--accent);font-family:'DM Mono',monospace">${e.totalMiles.toFixed(1)}</div>
        </div>
        <div style="padding:12px;background:var(--surface);border-radius:6px;border:1px solid var(--border)">
          <div style="font-size:10px;font-weight:600;color:var(--muted);margin-bottom:4px">Deduction @ ${(e.rate*100).toFixed(0)}¢/mi</div>
          <div style="font-size:18px;font-weight:700;color:var(--good);font-family:'DM Mono',monospace">${S(e.totalDeduction)}</div>
        </div>
      </div>
    </div>
  `}async function Vh(){const t=document.getElementById("mileDate"),e=document.getElementById("mileMiles"),n=document.getElementById("milePurpose"),s=document.getElementById("mileStart"),o=document.getElementById("mileEnd");if(!t||!e||!n){console.warn("Mileage form elements not found");return}await Lm({date:t.value,miles:e.value,purpose:n.value,startLocation:(s==null?void 0:s.value)||"",endLocation:(o==null?void 0:o.value)||""})&&(w("Mileage entry added ✓"),t.value="",e.value="",n.value="",s.value="",o.value="",window.renderTaxCenter&&window.renderTaxCenter())}async function Yh(t){if(!confirm("Delete this mileage entry?"))return;await Am(t)&&(w("Entry deleted ✓"),window.renderTaxCenter&&window.renderTaxCenter())}const Rm=36e5;let yn={};const Fm="/buy/browse/v1";async function yc(t,e={}){if(!t||t.trim().length<2)return Ei();const n=`${t.toLowerCase()}|${e.condition||""}`;if(yn[n]&&Date.now()-yn[n].ts<Rm)return yn[n].results;if(ft())try{const o=await Om(t,e);return yn[n]={results:o,ts:Date.now()},o}catch(o){console.warn("eBay comps error:",o.message)}const s=Nm(t,e);return yn[n]={results:s,ts:Date.now()},s}async function Om(t,e){const n=e.limit||20,s=new URLSearchParams({q:t,limit:String(n),sort:"-price",filter:"buyingOptions:{FIXED_PRICE|AUCTION},conditions:{NEW|USED|VERY_GOOD|GOOD|ACCEPTABLE}"}),i=((await X("GET",`${Fm}/item_summary/search?${s}`)).itemSummaries||[]).map(r=>{var l,c,d,u;return{title:r.title||"",price:parseFloat(((l=r.price)==null?void 0:l.value)||"0"),currency:((c=r.price)==null?void 0:c.currency)||"USD",condition:r.condition||"Unknown",imageUrl:((d=r.image)==null?void 0:d.imageUrl)||"",itemUrl:r.itemWebUrl||"",sold:(u=r.buyingOptions)!=null&&u.includes("FIXED_PRICE")?"Buy It Now":"Auction",date:r.itemEndDate||null}}).filter(r=>r.price>0);return vc(i,"eBay")}function Nm(t,e){const n=t.toLowerCase(),s=[];for(const o of B){const a=F(o.itemId);if(!a)continue;const i=(a.name||"").toLowerCase(),r=(a.category||"").toLowerCase();!i.includes(n)&&!r.includes(n)||e.condition&&(a.condition||"").toLowerCase()!==e.condition.toLowerCase()||s.push({title:a.name||"Item",price:o.price||0,condition:a.condition||"Unknown",imageUrl:a.image||"",itemUrl:"",sold:"FlipTrack Sale",date:o.date})}return vc(s,"Local Sales")}function vc(t,e){if(!t.length)return Ei();const n=t.map(i=>i.price).sort((i,r)=>i-r),o=n.reduce((i,r)=>i+r,0)/n.length,a=n.length%2===0?(n[n.length/2-1]+n[n.length/2])/2:n[Math.floor(n.length/2)];return{comps:t,source:e,avgPrice:o,medianPrice:a,lowPrice:n[0],highPrice:n[n.length-1],count:t.length}}function Ei(){return{comps:[],source:"None",avgPrice:0,medianPrice:0,lowPrice:0,highPrice:0,count:0}}async function Kh(t,e){const n=await yc(t,{condition:e});if(!n.count)return{suggested:0,range:"N/A",confidence:"low"};const s=Math.round(n.medianPrice*.95*100)/100,o=`${S(n.lowPrice)} – ${S(n.highPrice)}`,a=n.count>=10?"high":n.count>=5?"medium":"low";return{suggested:s,range:o,confidence:a}}function Jh(t){if(!t||!t.count)return'<div class="comps-empty">No comparable sales found. Try a different search term.</div>';const e=`
    <div class="comps-stats">
      <div class="comps-stat"><span class="comps-stat-val">${S(t.avgPrice)}</span><span class="comps-stat-lbl">Avg</span></div>
      <div class="comps-stat"><span class="comps-stat-val">${S(t.medianPrice)}</span><span class="comps-stat-lbl">Median</span></div>
      <div class="comps-stat"><span class="comps-stat-val">${S(t.lowPrice)}</span><span class="comps-stat-lbl">Low</span></div>
      <div class="comps-stat"><span class="comps-stat-val">${S(t.highPrice)}</span><span class="comps-stat-lbl">High</span></div>
      <div class="comps-stat"><span class="comps-stat-val">${t.count}</span><span class="comps-stat-lbl">Comps</span></div>
    </div>
  `,n=t.comps.slice(0,8).map(s=>`
    <div class="comps-item">
      ${s.imageUrl?`<img src="${x(s.imageUrl)}" class="comps-thumb" alt="" loading="lazy">`:'<div class="comps-thumb comps-thumb-empty">📦</div>'}
      <div class="comps-item-info">
        <div class="comps-item-title">${x(s.title.slice(0,60))}</div>
        <div class="comps-item-meta">${x(s.condition)} · ${s.sold}${s.date?` · ${mt(s.date)}`:""}</div>
      </div>
      <div class="comps-item-price">${S(s.price)}</div>
    </div>
  `).join("");return`
    <div class="comps-panel">
      <div class="comps-source">Source: ${x(t.source)}</div>
      ${e}
      <div class="comps-list">${n}</div>
    </div>
  `}async function Qh(t){const e=F(t);return!e||!e.name?Ei():yc(e.name,{condition:e.condition})}function Xh(){yn={}}let as="FlipTrack",is=.3,rs="bottom-right",ls=10,Ue=.85;async function Zh(){const t=await gt("photo_settings");t&&(as=t.watermarkText||"FlipTrack",is=t.watermarkOpacity??.3,rs=t.watermarkPosition||"bottom-right",ls=t.autoCropPadding??10,Ue=t.jpegQuality??.85)}async function t0(t){as=t.watermarkText||as,is=t.watermarkOpacity??is,rs=t.watermarkPosition||rs,ls=t.autoCropPadding??ls,Ue=t.jpegQuality??Ue,await et("photo_settings",{watermarkText:as,watermarkOpacity:is,watermarkPosition:rs,autoCropPadding:ls,jpegQuality:Ue})}async function e0(t,e={}){const n=e.threshold??240,s=e.feather??2,o=await Cs(t),a=document.createElement("canvas");a.width=o.width,a.height=o.height;const i=a.getContext("2d");i.drawImage(o,0,0);const r=i.getImageData(0,0,a.width,a.height),l=r.data,c=a.width,d=a.height,u=new Uint8Array(c*d),p=new Uint8Array(c*d),y=[];for(let v=0;v<c;v++)y.push(v),y.push(v+(d-1)*c);for(let v=0;v<d;v++)y.push(v*c),y.push(c-1+v*c);for(;y.length;){const v=y.pop();if(v<0||v>=c*d||u[v])continue;u[v]=1;const h=v*4,m=l[h],f=l[h+1],E=l[h+2];if(.299*m+.587*f+.114*E>=n){p[v]=1;const I=v%c,M=Math.floor(v/c);I>0&&y.push(v-1),I<c-1&&y.push(v+1),M>0&&y.push(v-c),M<d-1&&y.push(v+c)}}for(let v=0;v<c*d;v++)if(p[v])l[v*4+3]=0;else if(s>0){const h=v%c,m=Math.floor(v/c);let f=s+1;for(let E=-s;E<=s;E++)for(let $=-s;$<=s;$++){const I=h+$,M=m+E;if(I>=0&&I<c&&M>=0&&M<d&&p[M*c+I]){const N=Math.sqrt($*$+E*E);f=Math.min(f,N)}}f<=s&&(l[v*4+3]=Math.round(255*(f/s)))}return i.putImageData(r,0,0),a.toDataURL("image/png")}async function n0(t,e={}){const n=e.padding??ls,s=e.threshold??250,o=await Cs(t),a=document.createElement("canvas");a.width=o.width,a.height=o.height;const i=a.getContext("2d");i.drawImage(o,0,0);const l=i.getImageData(0,0,a.width,a.height).data,c=a.width,d=a.height;let u=d,p=c,y=0,v=0;for(let $=0;$<d;$++)for(let I=0;I<c;I++){const M=($*c+I)*4,N=l[M],W=l[M+1],L=l[M+2];l[M+3]>10&&(N<s||W<s||L<s)&&($<u&&(u=$),$>y&&(y=$),I<p&&(p=I),I>v&&(v=I))}if(y<=u||v<=p)return t;u=Math.max(0,u-n),p=Math.max(0,p-n),y=Math.min(d-1,y+n),v=Math.min(c-1,v+n);const h=v-p+1,m=y-u+1,f=document.createElement("canvas");return f.width=h,f.height=m,f.getContext("2d").drawImage(a,p,u,h,m,0,0,h,m),f.toDataURL("image/jpeg",Ue)}async function s0(t,e={}){const n=e.text||as,s=e.opacity??is,o=e.position||rs,a=await Cs(t),i=document.createElement("canvas");i.width=a.width,i.height=a.height;const r=i.getContext("2d");r.drawImage(a,0,0);const l=Math.max(14,Math.round(a.width/20));r.font=`bold ${l}px sans-serif`,r.globalAlpha=s,r.fillStyle="rgba(255,255,255,0.9)",r.strokeStyle="rgba(0,0,0,0.5)",r.lineWidth=2;const d=r.measureText(n).width,u=l;let p,y;switch(o){case"top-left":p=u,y=u+l;break;case"top-right":p=a.width-d-u,y=u+l;break;case"bottom-left":p=u,y=a.height-u;break;case"center":p=(a.width-d)/2,y=a.height/2;break;default:p=a.width-d-u,y=a.height-u}return r.strokeText(n,p,y),r.fillText(n,p,y),r.globalAlpha=1,i.toDataURL("image/jpeg",Ue)}async function o0(t,e={}){const n=(e.brightness||0)/100,s=(e.contrast||0)/100,o=(e.saturation||0)/100,a=await Cs(t),i=document.createElement("canvas");i.width=a.width,i.height=a.height;const r=i.getContext("2d"),l=[];return n&&l.push(`brightness(${1+n})`),s&&l.push(`contrast(${1+s})`),o&&l.push(`saturate(${1+o})`),l.length&&(r.filter=l.join(" ")),r.drawImage(a,0,0),r.filter="none",i.toDataURL("image/jpeg",Ue)}async function a0(t,e={}){const n=e.bgColor||"#ffffff",s=e.size||1200,o=await Cs(t),a=document.createElement("canvas");a.width=s,a.height=s;const i=a.getContext("2d");i.fillStyle=n,i.fillRect(0,0,s,s);const r=Math.min(s/o.width,s/o.height)*.9,l=o.width*r,c=o.height*r,d=(s-l)/2,u=(s-c)/2;return i.drawImage(o,d,u,l,c),a.toDataURL("image/jpeg",Ue)}function i0(t,e){return t?`
    <div class="pt-panel" data-item="${x(e)}">
      <div class="pt-preview">
        <img src="${x(t)}" id="ptPreview" class="pt-img" alt="Preview">
      </div>
      <div class="pt-tools">
        <button class="pt-btn" onclick="ptRemoveBg('${x(e)}')" title="Remove background">
          🪄 Remove BG
        </button>
        <button class="pt-btn" onclick="ptAutoCrop('${x(e)}')" title="Auto-crop whitespace">
          ✂️ Auto-Crop
        </button>
        <button class="pt-btn" onclick="ptWatermark('${x(e)}')" title="Add watermark">
          💧 Watermark
        </button>
        <button class="pt-btn" onclick="ptSquare('${x(e)}')" title="Square pad for marketplace">
          ⬜ Square Pad
        </button>
      </div>
      <div class="pt-sliders">
        <label class="pt-slider-row">
          <span>Brightness</span>
          <input type="range" min="-50" max="50" value="0" id="ptBrightness"
            oninput="ptAdjustPreview('${x(e)}')">
        </label>
        <label class="pt-slider-row">
          <span>Contrast</span>
          <input type="range" min="-50" max="50" value="0" id="ptContrast"
            oninput="ptAdjustPreview('${x(e)}')">
        </label>
      </div>
    </div>
  `:'<div class="pt-empty">No image to edit. Add a photo first.</div>'}function Cs(t){return new Promise((e,n)=>{const s=new Image;s.crossOrigin="anonymous",s.onload=()=>e(s),s.onerror=()=>n(new Error("Failed to load image")),s.src=t})}let Un=[],on=new Set,zn=null,en={current:0,total:0,status:"idle"};function r0(t){Un=t.filter(e=>{const n=F(e);return n&&(n.qty||0)>0}),on.clear(),zn=null,en={current:0,total:0,status:"idle"}}function l0(t){on.has(t)?on.delete(t):on.add(t)}function Um(){return{items:Un.map(t=>F(t)).filter(Boolean),platforms:[...on],template:zn,progress:{...en}}}async function c0(t={}){var l;const e=t.delayMs||2e3,n=[...on],s=Un.map(c=>F(c)).filter(Boolean);if(!s.length||!n.length)return w("Select items and platforms first",!0),{success:0,failed:0,skipped:0};en={current:0,total:s.length*n.length,status:"running"};let a=0,i=0,r=0;for(const c of s)for(const d of n){if(en.current++,t.onProgress&&t.onProgress(en),((l=c.platformStatus)==null?void 0:l[d])==="active"){r++;continue}try{if(d==="eBay"&&ft())(await Ga(c.id)).success&&c.price>0&&await So(c.id),a++;else{const u=zn?{titleFormula:zn}:null,{title:p,description:y}=ii(c,u);await navigator.clipboard.writeText(`${p}

${y}`);const v=ul(d,c);window.open(v,"_blank"),Tt(c.id,d,"draft"),qe(c.id,d,ot()),j("inv",c.id),a++,e>0&&await new Promise(h=>setTimeout(h,e))}}catch(u){console.warn(`Batch list error for ${c.name} on ${d}:`,u.message),i++}}return O(),V(),en.status="done",w(`Batch listing complete: ${a} listed, ${r} skipped, ${i} failed`),{success:a,failed:i,skipped:r}}function qm(){return Un.map(n=>F(n)).filter(Boolean).map(n=>{const{title:s,description:o}=ii(n,zn);return`=== ${s} ===
${o}
`}).join(`
---

`)}async function d0(){const t=qm();try{await navigator.clipboard.writeText(t),w(`Copied listing text for ${Un.length} items ✓`)}catch{w("Copy failed",!0)}}function p0(){const t=Um();if(!t.items.length)return`<div class="bl-empty">
      <p>No items selected for batch listing.</p>
      <p style="color:var(--muted)">Select items from inventory using checkboxes, then click "Batch List".</p>
    </div>`;let e=`<div class="bl-panel">
    <div class="bl-header">
      <span class="bl-count">${t.items.length} items selected</span>
      <button class="btn-sm" onclick="blClearSelection()">Clear</button>
    </div>
  `;e+='<div class="bl-section"><div class="bl-section-title">Platforms to list on:</div><div class="bl-plat-grid">';const n=["eBay","Poshmark","Mercari","Depop","Etsy","Facebook Marketplace","Amazon","Grailed","Vinted","Whatnot"];for(const s of n){const o=t.platforms.includes(s),a=s==="eBay"&&ft()?" (API)":"";e+=`<button class="bl-plat-chip ${o?"active":""}" onclick="blTogglePlatform('${x(s)}')">${x(s)}${a}</button>`}e+="</div></div>",e+='<div class="bl-section"><div class="bl-section-title">Items:</div><div class="bl-items">';for(const s of t.items.slice(0,10))e+=`
      <div class="bl-item-row">
        <span class="bl-item-name">${x((s.name||"Item").slice(0,40))}</span>
        <span class="bl-item-price">${S(s.price||0)}</span>
        <span class="bl-item-plats">${Z(s).join(", ")||"None"}</span>
      </div>
    `;if(t.items.length>10&&(e+=`<div class="bl-more">+ ${t.items.length-10} more</div>`),e+="</div></div>",e+=`
    <div class="bl-actions">
      <button class="btn-primary" onclick="blExecute()" ${t.platforms.length?"":"disabled"}>
        🚀 Start Batch Listing
      </button>
      <button class="btn-secondary" onclick="blCopyAll()">
        📋 Copy All Listing Text
      </button>
    </div>
  `,t.progress.status==="running"){const s=t.progress.total>0?Math.round(t.progress.current/t.progress.total*100):0;e+=`
      <div class="bl-progress">
        <div class="bl-progress-bar"><div class="bl-progress-fill" style="width:${s}%"></div></div>
        <div class="bl-progress-text">${t.progress.current} / ${t.progress.total}</div>
      </div>
    `}return e+="</div>",e}function u0(){Un=[],on.clear(),zn=null,en={current:0,total:0,status:"idle"}}function jm(){const t=Date.now(),e=864e5,n=k.filter($=>($.qty||0)>0),s=n.reduce(($,I)=>$+(I.price||0)*(I.qty||1),0),o=n.reduce(($,I)=>$+(I.cost||0)*(I.qty||1),0),a=n.reduce(($,I)=>$+(I.qty||1),0),i=s-o,r=s>0?i/s:0,l=[{label:"0-7 days",min:0,max:7,items:[],value:0,cost:0},{label:"8-30 days",min:8,max:30,items:[],value:0,cost:0},{label:"31-60 days",min:31,max:60,items:[],value:0,cost:0},{label:"61-90 days",min:61,max:90,items:[],value:0,cost:0},{label:"90+ days",min:91,max:1/0,items:[],value:0,cost:0}];for(const $ of n){const I=$.added?new Date($.added).getTime():t,M=Math.floor((t-I)/e),N=($.price||0)*($.qty||1),W=($.cost||0)*($.qty||1);for(const L of l)if(M>=L.min&&M<=L.max){L.items.push($),L.value+=N,L.cost+=W;break}}const c={};for(const $ of n){const I=$.category||"Uncategorized";c[I]||(c[I]={count:0,units:0,value:0,cost:0,items:[]}),c[I].count++,c[I].units+=$.qty||1,c[I].value+=($.price||0)*($.qty||1),c[I].cost+=($.cost||0)*($.qty||1),c[I].items.push($)}const d=Object.entries(c).map(([$,I])=>({name:$,...I,profit:I.value-I.cost,margin:I.value>0?(I.value-I.cost)/I.value:0})).sort(($,I)=>I.value-$.value),u=t-30*e,p=B.filter($=>new Date($.date).getTime()>=u),y=p.reduce(($,I)=>$+(I.price||0)*(I.qty||0),0),v=p.reduce(($,I)=>$+(I.qty||0),0),h=v>0?Math.round(a/v*30):null,m=y,f=[...n].sort(($,I)=>(I.price||0)*(I.qty||1)-($.price||0)*($.qty||1)).slice(0,10),E=n.filter($=>{const I=$.added?new Date($.added).getTime():t;return t-I>30*e}).filter($=>!p.some(I=>I.itemId===$.id)).sort(($,I)=>(I.price||0)*(I.qty||1)-($.price||0)*($.qty||1)).slice(0,10);return{totalRetailValue:s,totalCostBasis:o,totalUnits:a,potentialProfit:i,avgMargin:r,itemCount:n.length,agingBuckets:l,categories:d,monthlySalesRevenue:y,monthlySalesUnits:v,daysToSellAll:h,projectedRevenue30d:m,topItems:f,slowMovers:E}}function f0(){const t=jm();let e='<div class="iv-dashboard">';e+=`<div class="iv-cards">
    <div class="iv-card">
      <div class="iv-card-label">Total Retail Value</div>
      <div class="iv-card-value">${S(t.totalRetailValue)}</div>
      <div class="iv-card-sub">${t.totalUnits} units · ${t.itemCount} unique items</div>
    </div>
    <div class="iv-card">
      <div class="iv-card-label">Cost Basis</div>
      <div class="iv-card-value">${S(t.totalCostBasis)}</div>
      <div class="iv-card-sub">Invested in current inventory</div>
    </div>
    <div class="iv-card">
      <div class="iv-card-label">Potential Profit</div>
      <div class="iv-card-value" style="color:${t.potentialProfit>=0?"var(--good)":"var(--danger)"}">${S(t.potentialProfit)}</div>
      <div class="iv-card-sub">${Y(t.avgMargin)} avg margin</div>
    </div>
    <div class="iv-card">
      <div class="iv-card-label">Sell-Through Projection</div>
      <div class="iv-card-value">${t.daysToSellAll?t.daysToSellAll+"d":"—"}</div>
      <div class="iv-card-sub">${t.daysToSellAll?"to sell all at current rate":"No recent sales"}</div>
    </div>
  </div>`,e+=`<div class="iv-section">
    <h4 class="iv-section-title">📊 Inventory Aging</h4>
    <div class="iv-aging">
  `;const n=Math.max(...t.agingBuckets.map(s=>s.value),1);for(const s of t.agingBuckets){const o=s.value/n*100,a=s.min>=61?" iv-aging-danger":s.min>=31?" iv-aging-warn":"";e+=`
      <div class="iv-aging-row${a}">
        <span class="iv-aging-label">${s.label}</span>
        <div class="iv-aging-bar-wrap">
          <div class="iv-aging-bar" style="width:${o}%"></div>
        </div>
        <span class="iv-aging-val">${S(s.value)} (${s.items.length})</span>
      </div>
    `}e+="</div></div>",e+=`<div class="iv-section">
    <h4 class="iv-section-title">📁 Value by Category</h4>
    <div class="iv-categories">
  `;for(const s of t.categories.slice(0,8)){const o=t.totalRetailValue>0?s.value/t.totalRetailValue*100:0;e+=`
      <div class="iv-cat-row">
        <span class="iv-cat-name">${x(s.name)}</span>
        <div class="iv-cat-bar-wrap">
          <div class="iv-cat-bar" style="width:${o}%"></div>
        </div>
        <span class="iv-cat-val">${S(s.value)}</span>
        <span class="iv-cat-margin" style="color:${s.margin>=.3?"var(--good)":"var(--warn)"}">${Y(s.margin)}</span>
      </div>
    `}e+="</div></div>",e+=`<div class="iv-section">
    <h4 class="iv-section-title">💎 Top Value Items</h4>
    <div class="iv-top-items">
  `;for(const s of t.topItems){const o=(s.price||0)*(s.qty||1);e+=`
      <div class="iv-item-row" onclick="openDrawer('${s.id}')">
        <span class="iv-item-name">${x((s.name||"Item").slice(0,40))}</span>
        <span class="iv-item-qty">×${s.qty||1}</span>
        <span class="iv-item-val">${S(o)}</span>
      </div>
    `}if(e+="</div></div>",t.slowMovers.length){e+=`<div class="iv-section">
      <h4 class="iv-section-title">🐌 Slow Movers (30+ days, no recent sales)</h4>
      <div class="iv-top-items">
    `;for(const s of t.slowMovers){const o=Math.floor((Date.now()-new Date(s.added||Date.now()).getTime())/864e5);e+=`
        <div class="iv-item-row iv-slow" onclick="openDrawer('${s.id}')">
          <span class="iv-item-name">${x((s.name||"Item").slice(0,40))}</span>
          <span class="iv-item-days">${o}d old</span>
          <span class="iv-item-val">${S((s.price||0)*(s.qty||1))}</span>
        </div>
      `}e+="</div></div>"}return e+="</div>",e}const Hm={"First Class":[{maxOz:4,price:4.63},{maxOz:8,price:5.13},{maxOz:12,price:5.63},{maxOz:15.99,price:6.13}],"Priority Mail":[{maxOz:16,price:8.7},{maxOz:32,price:10.2},{maxOz:48,price:12.45},{maxOz:80,price:14.8},{maxOz:160,price:19.3},{maxOz:1120,price:28.5}],"Priority Mail Flat Rate":[{name:"Small Flat Rate Box",price:10.2,maxOz:1120},{name:"Medium Flat Rate Box",price:16.45,maxOz:1120},{name:"Large Flat Rate Box",price:22.95,maxOz:1120},{name:"Padded Flat Rate Envelope",price:9.85,maxOz:1120}],"Media Mail":[{maxOz:16,price:4.13},{maxOz:32,price:4.78},{maxOz:48,price:5.43},{maxOz:80,price:6.73},{maxOz:160,price:9.33},{maxOz:1120,price:14.53}],"Ground Advantage":[{maxOz:16,price:5.5},{maxOz:32,price:7},{maxOz:48,price:9.5},{maxOz:80,price:12},{maxOz:160,price:15.5},{maxOz:1120,price:20}]},Wm={"UPS Ground":[{maxOz:16,price:10.5},{maxOz:48,price:14},{maxOz:160,price:22},{maxOz:1120,price:35}]};let to="",eo="poly_mailer",no="USPS";async function m0(){const t=await gt("ship_label_settings");t&&(to=t.sellerZip||"",eo=t.defaultPackage||"poly_mailer",no=t.preferredCarrier||"USPS")}async function g0(t){to=t.sellerZip||to,eo=t.defaultPackage||eo,no=t.preferredCarrier||no,await et("ship_label_settings",{sellerZip:to,defaultPackage:eo,preferredCarrier:no})}function hc(t){const{weightOz:e,length:n,width:s,height:o,isMedia:a}=t,i=[];for(const[r,l]of Object.entries(Hm))if(!(r==="Media Mail"&&!a)){for(const c of l)if(e<=c.maxOz){i.push({carrier:"USPS",service:c.name||r,price:c.price,estimatedDays:r.includes("Priority")?"1-3":r==="Media Mail"?"2-8":"2-5"});break}}for(const[r,l]of Object.entries(Wm))for(const c of l)if(e<=c.maxOz){i.push({carrier:"UPS",service:r,price:c.price,estimatedDays:"1-5"});break}return i.forEach(r=>{r.pirateShipPrice=Math.round(r.price*.85*100)/100}),i.sort((r,l)=>r.price-l.price)}function y0(t,e=!1){return hc({weightOz:t,isMedia:e})[0]||null}function Gm(t={}){return"https://app.pirateship.com/ship"}function Vm(){return"https://www.paypal.com/shiplabel/create"}function Ym(t){return"https://www.ebay.com/sh/ord"}function v0(t,e){const n=B.find(s=>s.id===t);n&&(n.labelCost=e.cost,n.labelCarrier=e.carrier,n.labelService=e.service,e.tracking&&(n.trackingNumber=e.tracking),n.actualShipCost=e.cost,j("sales",t),O())}function h0(t=30){const e=Date.now()-t*864e5,n=B.filter(r=>new Date(r.date).getTime()>=e&&r.labelCost),s=n.reduce((r,l)=>r+(l.labelCost||0),0),o=n.reduce((r,l)=>r+(l.ship||0),0),a=o-s,i={};for(const r of n){const l=r.labelCarrier||"Unknown";i[l]||(i[l]={count:0,cost:0}),i[l].count++,i[l].cost+=r.labelCost||0}return{totalLabels:n.length,totalCost:s,totalCharged:o,shippingProfit:a,avgCost:n.length>0?s/n.length:0,byCarrier:i}}function b0(t){const e=hc(t);if(!e.length)return'<div class="sl-empty">Enter weight to see rate estimates</div>';let n=`<div class="sl-rates">
    <div class="sl-rates-header">Estimated Shipping Rates (${t.weightOz}oz)</div>
  `;for(const s of e){const o=s===e[0];n+=`
      <div class="sl-rate-row ${o?"sl-cheapest":""}">
        <span class="sl-carrier">${x(s.carrier)}</span>
        <span class="sl-service">${x(s.service)}</span>
        <span class="sl-price">${S(s.price)}</span>
        <span class="sl-pirate" title="Pirate Ship price">${S(s.pirateShipPrice)}</span>
        <span class="sl-days">${s.estimatedDays}d</span>
        ${o?'<span class="sl-badge">Cheapest</span>':""}
      </div>
    `}return n+=`
    <div class="sl-links">
      <a href="${Gm()}" target="_blank" class="sl-link">🏴‍☠️ Buy on Pirate Ship (Cheapest)</a>
      <a href="${Vm()}" target="_blank" class="sl-link">💳 PayPal Shipping</a>
      <a href="${Ym()}" target="_blank" class="sl-link">🛒 eBay Labels</a>
    </div>
  </div>`,n}export{vr as $,wn as A,mt as B,ye as C,se as D,dt as E,St as F,ge as G,Kc as H,Is as I,Lt as J,Ie as K,Pr as L,Iy as M,_r as N,Cg as O,sa as P,Jc as Q,Jm as R,eu as S,Wt as T,il as U,Ra as V,gt as W,jr as X,et as Y,si as Z,bo as _,F as a,Gu as a$,Ce as a0,jy as a1,qy as a2,Xf as a3,Kf as a4,Uy as a5,ac as a6,Ky as a7,Yy as a8,Vy as a9,gy as aA,my as aB,fy as aC,Lf as aD,uy as aE,py as aF,dy as aG,cy as aH,ly as aI,ry as aJ,iy as aK,ay as aL,oy as aM,sy as aN,ny as aO,ey as aP,ty as aQ,ec as aR,Zl as aS,uo as aT,Jg as aU,Tf as aV,it as aW,Xc as aX,Ku as aY,Zm as aZ,jg as a_,Gy as aa,Ly as ab,Dy as ac,My as ad,Py as ae,Ty as af,_s as ag,Sg as ah,tl as ai,Ja as aj,Rp as ak,zp as al,Ap as am,Lp as an,lo as ao,_e as ap,Zg as aq,Xg as ar,Bg as as,Kg as at,by as au,hy as av,zf as aw,vy as ax,yy as ay,Af as az,x as b,tv as b$,Gg as b0,Ng as b1,Qu as b2,Og as b3,Fg as b4,Wy as b5,Wg as b6,Hg as b7,qg as b8,hi as b9,Eo as bA,ru as bB,Pg as bC,Tg as bD,lu as bE,nl as bF,eg as bG,xd as bH,ia as bI,Ji as bJ,bd as bK,hd as bL,Dv as bM,Mv as bN,Pv as bO,gu as bP,xo as bQ,Tt as bR,lv as bS,cv as bT,rv as bU,iv as bV,av as bW,ov as bX,sv as bY,nv as bZ,ev as b_,Ug as ba,ju as bb,qu as bc,zg as bd,Vu as be,Wu as bf,Hu as bg,Lg as bh,Rg as bi,cr as bj,Ag as bk,tm as bl,Hy as bm,Fy as bn,Ry as bo,zy as bp,Ay as bq,Yf as br,Nn as bs,Ny as bt,Oy as bu,nu as bv,_g as bw,gl as bx,ml as by,fl as bz,k as c,uh as c$,Zy as c0,Xy as c1,Qy as c2,U as c3,Xm as c4,ch as c5,lh as c6,rh as c7,ih as c8,ah as c9,nh as cA,eh as cB,th as cC,Zv as cD,Xv as cE,Qv as cF,Jv as cG,Kv as cH,Yv as cI,Av as cJ,Vv as cK,Gv as cL,Wv as cM,Hv as cN,jv as cO,qv as cP,Uv as cQ,Nv as cR,Ov as cS,Fv as cT,Rv as cU,zv as cV,dh as cW,lc as cX,bm as cY,fh as cZ,Em as c_,oh as ca,Tv as cb,Bv as cc,Cv as cd,_v as ce,Iv as cf,Ev as cg,kv as ch,Sv as ci,$v as cj,xv as ck,wv as cl,bv as cm,hv as cn,vv as co,yv as cp,ap as cq,gv as cr,mv as cs,fv as ct,uv as cu,pv as cv,dv as cw,gg as cx,Lv as cy,sh as cz,Z as d,d0 as d$,Sm as d0,Eh as d1,kh as d2,Sh as d3,Lh as d4,Dh as d5,Mh as d6,Ph as d7,Th as d8,Bh as d9,sg as dA,ng as dB,Cy as dC,_y as dD,Ey as dE,ky as dF,Sy as dG,$y as dH,xy as dI,dn as dJ,ug as dK,ce as dL,dg as dM,cg as dN,Rd as dO,pg as dP,g0 as dQ,h0 as dR,v0 as dS,b0 as dT,y0 as dU,hc as dV,f0 as dW,rg as dX,ig as dY,ag as dZ,u0 as d_,Ch as da,_h as db,Ih as dc,$h as dd,xh as de,wh as df,bh as dg,hh as dh,vh as di,yh as dj,gh as dk,mh as dl,Mt as dm,Hh as dn,jh as dp,qh as dq,Mm as dr,Uh as ds,Nh as dt,Oh as du,Fh as dv,Rh as dw,Be as dx,Yh as dy,Vh as dz,J as e,c0 as e0,l0 as e1,p0 as e2,r0 as e3,t0 as e4,i0 as e5,o0 as e6,a0 as e7,s0 as e8,n0 as e9,tg as eA,yd as eB,yg as eC,bg as eD,fg as eE,mg as eF,Yg as eG,$g as eH,Qm as eI,ft as eJ,vg as eK,ep as eL,ct as eM,wg as eN,Pp as eO,og as eP,_a as eQ,Ca as eR,Ss as eS,xu as eT,me as eU,hg as eV,xg as eW,Mg as eX,Dg as eY,e0 as ea,Xh as eb,Qh as ec,Jh as ed,Kh as ee,yc as ef,Oa as eg,lg as eh,Zu as ei,By as ej,tc as ek,Qg as el,Eg as em,Ig as en,Ma as eo,md as ep,Fp as eq,zh as er,wy as es,ph as et,Vg as eu,Zh as ev,m0 as ew,Ah as ex,kg as ey,Jy as ez,S as f,zm as g,vf as h,Wh as i,Gl as j,he as k,ot as l,Yl as m,Hl as n,Wl as o,Y as p,j as q,Gh as r,B as s,w as t,O as u,V as v,qt as w,rl as x,gd as y,ou as z};
