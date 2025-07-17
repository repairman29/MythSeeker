import{w as e,c as t,t as n,e as i,b as s,u as r,_ as o,C as a,r as l,x as h,y as c,z as u,A as d,B as _,D as p,G as f,H as m,m as g,I as y,J as v,L as C,K as w,M as T,N as I,O as b,s as k,i as S,a as N,q as E,P as R,Q as P,S as x,R as D}from"./firebase-core-a7cb50f5.js";const M="@firebase/database",F="1.0.8";
/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let L="";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class O{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){null==t?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),h(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return null==t?null:c(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class A{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){null==t?delete this.cache_[e]:this.cache_[e]=t}get(e){return u(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const q=function(e){try{if("undefined"!=typeof window&&void 0!==window[e]){const t=window[e];return t.setItem("firebase:sentinel","cache"),t.removeItem("firebase:sentinel"),new O(t)}}catch(t){}return new A},W=q("localStorage"),U=q("sessionStorage"),H=new g("@firebase/database"),j=function(){let e=1;return function(){return e++}}(),z=function(e){const t=d(e),n=new _;n.update(t);const i=n.digest();return p.encodeByteArray(i)},V=function(...e){let t="";for(let n=0;n<e.length;n++){const i=e[n];Array.isArray(i)||i&&"object"==typeof i&&"number"==typeof i.length?t+=V.apply(null,i):t+="object"==typeof i?h(i):i,t+=" "}return t};let K=null,B=!0;const Y=function(...t){if(!0===B&&(B=!1,null===K&&!0===U.get("logging_enabled")&&(e(!0,"Can't turn on custom loggers persistently."),H.logLevel=C.VERBOSE,K=H.log.bind(H))),K){const e=V.apply(null,t);K(e)}},G=function(e){return function(...t){Y(e,...t)}},Q=function(...e){const t="FIREBASE INTERNAL ERROR: "+V(...e);H.error(t)},$=function(...e){const t=`FIREBASE FATAL ERROR: ${V(...e)}`;throw H.error(t),new Error(t)},J=function(...e){const t="FIREBASE WARNING: "+V(...e);H.warn(t)},X=function(e){return"number"==typeof e&&(e!=e||e===Number.POSITIVE_INFINITY||e===Number.NEGATIVE_INFINITY)},Z="[MIN_NAME]",ee="[MAX_NAME]",te=function(e,t){if(e===t)return 0;if(e===Z||t===ee)return-1;if(t===Z||e===ee)return 1;{const n=he(e),i=he(t);return null!==n?null!==i?n-i===0?e.length-t.length:n-i:-1:null!==i?1:e<t?-1:1}},ne=function(e,t){return e===t?0:e<t?-1:1},ie=function(e,t){if(t&&e in t)return t[e];throw new Error("Missing required key ("+e+") in object: "+h(t))},se=function(e){if("object"!=typeof e||null===e)return h(e);const t=[];for(const i in e)t.push(i);t.sort();let n="{";for(let i=0;i<t.length;i++)0!==i&&(n+=","),n+=h(t[i]),n+=":",n+=se(e[t[i]]);return n+="}",n},re=function(e,t){const n=e.length;if(n<=t)return[e];const i=[];for(let s=0;s<n;s+=t)s+t>n?i.push(e.substring(s,n)):i.push(e.substring(s,s+t));return i};function oe(e,t){for(const n in e)e.hasOwnProperty(n)&&t(n,e[n])}const ae=function(t){e(!X(t),"Invalid JSON number");let n,i,s,r,o;0===t?(i=0,s=0,n=1/t==-1/0?1:0):(n=t<0,(t=Math.abs(t))>=Math.pow(2,-1022)?(r=Math.min(Math.floor(Math.log(t)/Math.LN2),1023),i=r+1023,s=Math.round(t*Math.pow(2,52-r)-Math.pow(2,52))):(i=0,s=Math.round(t/Math.pow(2,-1074))));const a=[];for(o=52;o;o-=1)a.push(s%2?1:0),s=Math.floor(s/2);for(o=11;o;o-=1)a.push(i%2?1:0),i=Math.floor(i/2);a.push(n?1:0),a.reverse();const l=a.join("");let h="";for(o=0;o<64;o+=8){let e=parseInt(l.substr(o,8),2).toString(16);1===e.length&&(e="0"+e),h+=e}return h.toLowerCase()},le=new RegExp("^-?(0*)\\d{1,10}$"),he=function(e){if(le.test(e)){const t=Number(e);if(t>=-2147483648&&t<=2147483647)return t}return null},ce=function(e){try{e()}catch(t){setTimeout(()=>{const e=t.stack||"";throw J("Exception was thrown by user callback.",e),t},Math.floor(0))}},ue=function(e,t){const n=setTimeout(e,t);return"number"==typeof n&&"undefined"!=typeof Deno&&Deno.unrefTimer?Deno.unrefTimer(n):"object"==typeof n&&n.unref&&n.unref(),n};
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class de{constructor(e,t){this.appName_=e,this.appCheckProvider=t,this.appCheck=null==t?void 0:t.getImmediate({optional:!0}),this.appCheck||null==t||t.get().then(e=>this.appCheck=e)}getToken(e){return this.appCheck?this.appCheck.getToken(e):new Promise((t,n)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,n):t(null)},0)})}addTokenChangeListener(e){var t;null===(t=this.appCheckProvider)||void 0===t||t.get().then(t=>t.addTokenListener(e))}notifyForInvalidToken(){J(`Provided AppCheck credentials for the app named "${this.appName_}" are invalid. This usually indicates your app was not initialized correctly.`)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _e{constructor(e,t,n){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=n,this.auth_=null,this.auth_=n.getImmediate({optional:!0}),this.auth_||n.onInit(e=>this.auth_=e)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(e=>e&&"auth/token-not-initialized"===e.code?(Y("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(e)):new Promise((t,n)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,n):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',J(e)}}class pe{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}pe.OWNER="owner";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const fe=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,me="ac",ge="websocket",ye="long_polling";
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ve{constructor(e,t,n,i,s=!1,r="",o=!1,a=!1){this.secure=t,this.namespace=n,this.webSocketOnly=i,this.nodeAdmin=s,this.persistenceKey=r,this.includeNamespaceInQueryParams=o,this.isUsingEmulator=a,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=W.get("host:"+e)||this._host}isCacheableHost(){return"s-"===this.internalHost.substr(0,2)}isCustomHost(){return"firebaseio.com"!==this._domain&&"firebaseio-demo.com"!==this._domain}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&W.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function Ce(t,n,i){let s;if(e("string"==typeof n,"typeof type must == string"),e("object"==typeof i,"typeof params must == object"),n===ge)s=(t.secure?"wss://":"ws://")+t.internalHost+"/.ws?";else{if(n!==ye)throw new Error("Unknown connection type: "+n);s=(t.secure?"https://":"http://")+t.internalHost+"/.lp?"}(function(e){return e.host!==e.internalHost||e.isCustomHost()||e.includeNamespaceInQueryParams})(t)&&(i.ns=t.namespace);const r=[];return oe(i,(e,t)=>{r.push(e+"="+t)}),s+r.join("&")}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class we{constructor(){this.counters_={}}incrementCounter(e,t=1){u(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return P(this.counters_)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Te={},Ie={};function be(e){const t=e.toString();return Te[t]||(Te[t]=new we),Te[t]}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ke{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const e=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let t=0;t<e.length;++t)e[t]&&ce(()=>{this.onMessage_(e[t])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Se="start";class Ne{constructor(e,t,n,i,s,r,o){this.connId=e,this.repoInfo=t,this.applicationId=n,this.appCheckToken=i,this.authToken=s,this.transportSessionId=r,this.lastSessionId=o,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=G(e),this.stats_=be(t),this.urlFn=e=>(this.appCheckToken&&(e[me]=this.appCheckToken),Ce(t,ye,e))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new ke(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(3e4)),function(e){if("complete"===document.readyState)e();else{let t=!1;const n=function(){document.body?t||(t=!0,e()):setTimeout(n,Math.floor(10))};document.addEventListener?(document.addEventListener("DOMContentLoaded",n,!1),window.addEventListener("load",n,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{"complete"===document.readyState&&n()}),window.attachEvent("onload",n))}}(()=>{if(this.isClosed_)return;this.scriptTagHolder=new Ee((...e)=>{const[t,n,i,s,r]=e;if(this.incrementIncomingBytes_(e),this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,t===Se)this.id=n,this.password=i;else{if("close"!==t)throw new Error("Unrecognized command received: "+t);n?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(n,()=>{this.onClosed_()})):this.onClosed_()}},(...e)=>{const[t,n]=e;this.incrementIncomingBytes_(e),this.myPacketOrderer.handleResponse(t,n)},()=>{this.onClosed_()},this.urlFn);const e={};e[Se]="t",e.ser=Math.floor(1e8*Math.random()),this.scriptTagHolder.uniqueCallbackIdentifier&&(e.cb=this.scriptTagHolder.uniqueCallbackIdentifier),e.v="5",this.transportSessionId&&(e.s=this.transportSessionId),this.lastSessionId&&(e.ls=this.lastSessionId),this.applicationId&&(e.p=this.applicationId),this.appCheckToken&&(e[me]=this.appCheckToken),"undefined"!=typeof location&&location.hostname&&fe.test(location.hostname)&&(e.r="f");const t=this.urlFn(e);this.log_("Connecting via long-poll to "+t),this.scriptTagHolder.addTag(t,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){Ne.forceAllow_=!0}static forceDisallow(){Ne.forceDisallow_=!0}static isAvailable(){return!!Ne.forceAllow_||!(Ne.forceDisallow_||"undefined"==typeof document||null==document.createElement||"object"==typeof window&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href)||"object"==typeof Windows&&"object"==typeof Windows.UI)}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=h(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const n=D(t),i=re(n,1840);for(let s=0;s<i.length;s++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,i.length,i[s]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const n={dframe:"t"};n.id=e,n.pw=t,this.myDisconnFrame.src=this.urlFn(n),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=h(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class Ee{constructor(e,t,n,i){this.onDisconnect=n,this.urlFn=i,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(1e8*Math.random()),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=j(),window["pLPCommand"+this.uniqueCallbackIdentifier]=e,window["pRTLPCB"+this.uniqueCallbackIdentifier]=t,this.myIFrame=Ee.createIFrame_();let n="";this.myIFrame.src&&"javascript:"===this.myIFrame.src.substr(0,11)&&(n='<script>document.domain="'+document.domain+'";<\/script>');const i="<html><body>"+n+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(i),this.myIFrame.doc.close()}catch(s){Y("frame writing exception"),s.stack&&Y(s.stack),Y(s)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",!document.body)throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";document.body.appendChild(e);try{e.contentWindow.document||Y("No IE domain setting required")}catch(t){const n=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+n+"';document.close();})())"}return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{null!==this.myIFrame&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e.id=this.myID,e.pw=this.myPW,e.ser=this.currentSerial;let t=this.urlFn(e),n="",i=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+30+n.length<=1870;){const e=this.pendingSegs.shift();n=n+"&seg"+i+"="+e.seg+"&ts"+i+"="+e.ts+"&d"+i+"="+e.d,i++}return t+=n,this.addLongPollTag_(t,this.currentSerial),!0}return!1}enqueueSegment(e,t,n){this.pendingSegs.push({seg:e,ts:t,d:n}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const n=()=>{this.outstandingRequests.delete(t),this.newRequest_()},i=setTimeout(n,Math.floor(25e3));this.addTag(e,()=>{clearTimeout(i),n()})}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const n=this.myIFrame.doc.createElement("script");n.type="text/javascript",n.async=!0,n.src=e,n.onload=n.onreadystatechange=function(){const e=n.readyState;e&&"loaded"!==e&&"complete"!==e||(n.onload=n.onreadystatechange=null,n.parentNode&&n.parentNode.removeChild(n),t())},n.onerror=()=>{Y("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(n)}catch(n){}},Math.floor(1))}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Re=null;"undefined"!=typeof MozWebSocket?Re=MozWebSocket:"undefined"!=typeof WebSocket&&(Re=WebSocket);class Pe{constructor(e,t,n,i,s,r,o){this.connId=e,this.applicationId=n,this.appCheckToken=i,this.authToken=s,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=G(this.connId),this.stats_=be(t),this.connURL=Pe.connectionURL_(t,r,o,i,n),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,n,i,s){const r={v:"5"};return"undefined"!=typeof location&&location.hostname&&fe.test(location.hostname)&&(r.r="f"),t&&(r.s=t),n&&(r.ls=n),i&&(r[me]=i),s&&(r.p=s),Ce(e,ge,r)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,W.set("previous_websocket_failure",!0);try{let e;w(),this.mySock=new Re(this.connURL,[],e)}catch(n){this.log_("Error instantiating WebSocket.");const e=n.message||n.data;return e&&this.log_(e),void this.onClosed_()}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=e=>{this.handleIncomingFrame(e)},this.mySock.onerror=e=>{this.log_("WebSocket error.  Closing connection.");const t=e.message||e.data;t&&this.log_(t),this.onClosed_()}}start(){}static forceDisallow(){Pe.forceDisallow_=!0}static isAvailable(){let e=!1;if("undefined"!=typeof navigator&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,n=navigator.userAgent.match(t);n&&n.length>1&&parseFloat(n[1])<4.4&&(e=!0)}return!e&&null!==Re&&!Pe.forceDisallow_}static previouslyFailed(){return W.isInMemoryStorage||!0===W.get("previous_websocket_failure")}markConnectionHealthy(){W.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const e=this.frames.join("");this.frames=null;const t=c(e);this.onMessage(t)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(t){if(e(null===this.frames,"We already have a frame buffer"),t.length<=6){const e=Number(t);if(!isNaN(e))return this.handleNewFrameCount_(e),null}return this.handleNewFrameCount_(1),t}handleIncomingFrame(e){if(null===this.mySock)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),null!==this.frames)this.appendFrame_(t);else{const e=this.extractFrameCount_(t);null!==e&&this.appendFrame_(e)}}send(e){this.resetKeepAlive();const t=h(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const n=re(t,16384);n.length>1&&this.sendString_(String(n.length));for(let i=0;i<n.length;i++)this.sendString_(n[i])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(45e3))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}Pe.responsesRequiredToBeHealthy=2,Pe.healthyTimeout=3e4;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class xe{constructor(e){this.initTransports_(e)}static get ALL_TRANSPORTS(){return[Ne,Pe]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}initTransports_(e){const t=Pe&&Pe.isAvailable();let n=t&&!Pe.previouslyFailed();if(e.webSocketOnly&&(t||J("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),n=!0),n)this.transports_=[Pe];else{const e=this.transports_=[];for(const t of xe.ALL_TRANSPORTS)t&&t.isAvailable()&&e.push(t);xe.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}xe.globalTransportInitialized_=!1;class De{constructor(e,t,n,i,s,r,o,a,l,h){this.id=e,this.repoInfo_=t,this.applicationId_=n,this.appCheckToken_=i,this.authToken_=s,this.onMessage_=r,this.onReady_=o,this.onDisconnect_=a,this.onKill_=l,this.lastSessionId=h,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=G("c:"+this.id+":"),this.transportManager_=new xe(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),n=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,n)},Math.floor(0));const i=e.healthyTimeout||0;i>0&&(this.healthyTimeout_=ue(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>102400?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>10240?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(i)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{2!==this.state_&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if("t"in e){const t=e.t;"a"===t?this.upgradeIfSecondaryHealthy_():"r"===t?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),this.tx_!==this.secondaryConn_&&this.rx_!==this.secondaryConn_||this.close()):"o"===t&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=ie("t",e),n=ie("d",e);if("c"===t)this.onSecondaryControl_(n);else{if("d"!==t)throw new Error("Unknown protocol layer: "+t);this.pendingDataMessages.push(n)}}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:"p",d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:"a",d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:"n",d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=ie("t",e),n=ie("d",e);"c"===t?this.onControl_(n):"d"===t&&this.onDataMessage_(n)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=ie("t",e);if("d"in e){const n=e.d;if("h"===t){const e=Object.assign({},n);this.repoInfo_.isUsingEmulator&&(e.h=this.repoInfo_.host),this.onHandshake_(e)}else if("n"===t){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let e=0;e<this.pendingDataMessages.length;++e)this.onDataMessage_(this.pendingDataMessages[e]);this.pendingDataMessages=[],this.tryCleanupConnection()}else"s"===t?this.onConnectionShutdown_(n):"r"===t?this.onReset_(n):"e"===t?Q("Server Error: "+n):"o"===t?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):Q("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,n=e.v,i=e.h;this.sessionId=e.s,this.repoInfo_.host=i,0===this.state_&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),"5"!==n&&J("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),n=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,n),ue(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(6e4))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,1===this.state_?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),0===this.primaryResponsesRequired_?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):ue(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(5e3))}sendPingOnPrimaryIfNecessary_(){this.isHealthy_||1!==this.state_||(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:"p",d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,this.tx_!==e&&this.rx_!==e||this.close()}onConnectionLost_(e){this.conn_=null,e||0!==this.state_?1===this.state_&&this.log_("Realtime connection lost."):(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(W.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(1!==this.state_)throw"Connection is not connected";this.tx_.send(e)}close(){2!==this.state_&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Me{put(e,t,n,i){}merge(e,t,n,i){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,n){}onDisconnectMerge(e,t,n){}onDisconnectCancel(e,t){}reportStats(e){}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fe{constructor(t){this.allowedEvents_=t,this.listeners_={},e(Array.isArray(t)&&t.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const n=[...this.listeners_[e]];for(let e=0;e<n.length;e++)n[e].callback.apply(n[e].context,t)}}on(e,t,n){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:n});const i=this.getInitialEvent(e);i&&t.apply(n,i)}off(e,t,n){this.validateEventType_(e);const i=this.listeners_[e]||[];for(let s=0;s<i.length;s++)if(i[s].callback===t&&(!n||n===i[s].context))return void i.splice(s,1)}validateEventType_(t){e(this.allowedEvents_.find(e=>e===t),"Unknown event: "+t)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Le extends Fe{constructor(){super(["online"]),this.online_=!0,"undefined"==typeof window||void 0===window.addEventListener||S()||(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}static getInstance(){return new Le}getInitialEvent(t){return e("online"===t,"Unknown event type: "+t),[this.online_]}currentlyOnline(){return this.online_}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Oe{constructor(e,t){if(void 0===t){this.pieces_=e.split("/");let t=0;for(let e=0;e<this.pieces_.length;e++)this.pieces_[e].length>0&&(this.pieces_[t]=this.pieces_[e],t++);this.pieces_.length=t,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)""!==this.pieces_[t]&&(e+="/"+this.pieces_[t]);return e||"/"}}function Ae(){return new Oe("")}function qe(e){return e.pieceNum_>=e.pieces_.length?null:e.pieces_[e.pieceNum_]}function We(e){return e.pieces_.length-e.pieceNum_}function Ue(e){let t=e.pieceNum_;return t<e.pieces_.length&&t++,new Oe(e.pieces_,t)}function He(e){return e.pieceNum_<e.pieces_.length?e.pieces_[e.pieces_.length-1]:null}function je(e,t=0){return e.pieces_.slice(e.pieceNum_+t)}function ze(e){if(e.pieceNum_>=e.pieces_.length)return null;const t=[];for(let n=e.pieceNum_;n<e.pieces_.length-1;n++)t.push(e.pieces_[n]);return new Oe(t,0)}function Ve(e,t){const n=[];for(let i=e.pieceNum_;i<e.pieces_.length;i++)n.push(e.pieces_[i]);if(t instanceof Oe)for(let i=t.pieceNum_;i<t.pieces_.length;i++)n.push(t.pieces_[i]);else{const e=t.split("/");for(let t=0;t<e.length;t++)e[t].length>0&&n.push(e[t])}return new Oe(n,0)}function Ke(e){return e.pieceNum_>=e.pieces_.length}function Be(e,t){const n=qe(e),i=qe(t);if(null===n)return t;if(n===i)return Be(Ue(e),Ue(t));throw new Error("INTERNAL ERROR: innerPath ("+t+") is not within outerPath ("+e+")")}function Ye(e,t){if(We(e)!==We(t))return!1;for(let n=e.pieceNum_,i=t.pieceNum_;n<=e.pieces_.length;n++,i++)if(e.pieces_[n]!==t.pieces_[i])return!1;return!0}function Ge(e,t){let n=e.pieceNum_,i=t.pieceNum_;if(We(e)>We(t))return!1;for(;n<e.pieces_.length;){if(e.pieces_[n]!==t.pieces_[i])return!1;++n,++i}return!0}class Qe{constructor(e,t){this.errorPrefix_=t,this.parts_=je(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let n=0;n<this.parts_.length;n++)this.byteLength_+=R(this.parts_[n]);$e(this)}}function $e(e){if(e.byteLength_>768)throw new Error(e.errorPrefix_+"has a key path longer than 768 bytes ("+e.byteLength_+").");if(e.parts_.length>32)throw new Error(e.errorPrefix_+"path specified exceeds the maximum depth that can be written (32) or object contains a cycle "+Je(e))}function Je(e){return 0===e.parts_.length?"":"in property '"+e.parts_.join(".")+"'"}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xe extends Fe{constructor(){let e,t;super(["visible"]),"undefined"!=typeof document&&void 0!==document.addEventListener&&(void 0!==document.hidden?(t="visibilitychange",e="hidden"):void 0!==document.mozHidden?(t="mozvisibilitychange",e="mozHidden"):void 0!==document.msHidden?(t="msvisibilitychange",e="msHidden"):void 0!==document.webkitHidden&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const t=!document[e];t!==this.visible_&&(this.visible_=t,this.trigger("visible",t))},!1)}static getInstance(){return new Xe}getInitialEvent(t){return e("visible"===t,"Unknown event type: "+t),[this.visible_]}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ze=1e3;class et extends Me{constructor(e,t,n,i,s,r,o,a){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=n,this.onConnectStatus_=i,this.onServerInfoUpdate_=s,this.authTokenProvider_=r,this.appCheckTokenProvider_=o,this.authOverride_=a,this.id=et.nextPersistentConnectionId_++,this.log_=G("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Ze,this.maxReconnectDelay_=3e5,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,a&&!w())throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Xe.getInstance().on("visible",this.onVisible_,this),-1===e.host.indexOf("fblocal")&&Le.getInstance().on("online",this.onOnline_,this)}sendRequest(t,n,i){const s=++this.requestNumber_,r={r:s,a:t,b:n};this.log_(h(r)),e(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(r),i&&(this.requestCBHash_[s]=i)}get(e){this.initConnection_();const t=new T,n={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:e=>{const n=e.d;"ok"===e.s?t.resolve(n):t.reject(n)}};this.outstandingGets_.push(n),this.outstandingGetCount_++;const i=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(i),t.promise}listen(t,n,i,s){this.initConnection_();const r=t._queryIdentifier,o=t._path.toString();this.log_("Listen called for "+o+" "+r),this.listens.has(o)||this.listens.set(o,new Map),e(t._queryParams.isDefault()||!t._queryParams.loadsAllData(),"listen() called for non-default but complete query"),e(!this.listens.get(o).has(r),"listen() called twice for same path/queryId.");const a={onComplete:s,hashFn:n,query:t,tag:i};this.listens.get(o).set(r,a),this.connected_&&this.sendListen_(a)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,n=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,0===this.outstandingGetCount_&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(n)})}sendListen_(e){const t=e.query,n=t._path.toString(),i=t._queryIdentifier;this.log_("Listen on "+n+" for "+i);const s={p:n};e.tag&&(s.q=t._queryObject,s.t=e.tag),s.h=e.hashFn(),this.sendRequest("q",s,s=>{const r=s.d,o=s.s;et.warnOnListenWarnings_(r,t),(this.listens.get(n)&&this.listens.get(n).get(i))===e&&(this.log_("listen response",s),"ok"!==o&&this.removeListen_(n,i),e.onComplete&&e.onComplete(o,r))})}static warnOnListenWarnings_(e,t){if(e&&"object"==typeof e&&u(e,"w")){const n=f(e,"w");if(Array.isArray(n)&&~n.indexOf("no_index")){const e='".indexOn": "'+t._queryParams.getIndex().toString()+'"',n=t._path.toString();J(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${e} at ${n} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&40===e.length||I(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=3e4)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=b(e)?"auth":"gauth",n={cred:e};null===this.authOverride_?n.noauth=!0:"object"==typeof this.authOverride_&&(n.authvar=this.authOverride_),this.sendRequest(t,n,t=>{const n=t.s,i=t.d||"error";this.authToken_===e&&("ok"===n?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(n,i))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,n=e.d||"error";"ok"===t?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,n)})}unlisten(t,n){const i=t._path.toString(),s=t._queryIdentifier;this.log_("Unlisten called for "+i+" "+s),e(t._queryParams.isDefault()||!t._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(i,s)&&this.connected_&&this.sendUnlisten_(i,s,t._queryObject,n)}sendUnlisten_(e,t,n,i){this.log_("Unlisten on "+e+" for "+t);const s={p:e};i&&(s.q=n,s.t=i),this.sendRequest("n",s)}onDisconnectPut(e,t,n){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,n):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:n})}onDisconnectMerge(e,t,n){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,n):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:n})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,n,i){const s={p:t,d:n};this.log_("onDisconnect "+e,s),this.sendRequest(e,s,e=>{i&&setTimeout(()=>{i(e.s,e.d)},Math.floor(0))})}put(e,t,n,i){this.putInternal("p",e,t,n,i)}merge(e,t,n,i){this.putInternal("m",e,t,n,i)}putInternal(e,t,n,i,s){this.initConnection_();const r={p:t,d:n};void 0!==s&&(r.h=s),this.outstandingPuts_.push({action:e,request:r,onComplete:i}),this.outstandingPutCount_++;const o=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(o):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,n=this.outstandingPuts_[e].request,i=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,n,n=>{this.log_(t+" response",n),delete this.outstandingPuts_[e],this.outstandingPutCount_--,0===this.outstandingPutCount_&&(this.outstandingPuts_=[]),i&&i(n.s,n.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,e=>{if("ok"!==e.s){const t=e.d;this.log_("reportStats","Error sending stats: "+t)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+h(e));const t=e.r,n=this.requestCBHash_[t];n&&(delete this.requestCBHash_[t],n(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),"d"===e?this.onDataUpdate_(t.p,t.d,!1,t.t):"m"===e?this.onDataUpdate_(t.p,t.d,!0,t.t):"c"===e?this.onListenRevoked_(t.p,t.q):"ac"===e?this.onAuthRevoked_(t.s,t.d):"apc"===e?this.onAppCheckRevoked_(t.s,t.d):"sd"===e?this.onSecurityDebugPacket_(t):Q("Unrecognized action received from server: "+h(e)+"\nAre you using the latest client?")}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=(new Date).getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(t){e(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(t))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Ze,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Ze,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&((new Date).getTime()-this.lastConnectionEstablishedTime_>3e4&&(this.reconnectDelay_=Ze),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=(new Date).getTime());const e=(new Date).getTime()-this.lastConnectionAttemptTime_;let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,1.3*this.reconnectDelay_)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=(new Date).getTime(),this.lastConnectionEstablishedTime_=null;const n=this.onDataMessage_.bind(this),i=this.onReady_.bind(this),s=this.onRealtimeDisconnect_.bind(this),r=this.id+":"+et.nextConnectionId_++,o=this.lastSessionId;let a=!1,l=null;const h=function(){l?l.close():(a=!0,s())},c=function(t){e(l,"sendRequest call when we're not connected not allowed."),l.sendRequest(t)};this.realtime_={close:h,sendRequest:c};const u=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[e,t]=await Promise.all([this.authTokenProvider_.getToken(u),this.appCheckTokenProvider_.getToken(u)]);a?Y("getToken() completed but was canceled"):(Y("getToken() completed. Creating connection."),this.authToken_=e&&e.accessToken,this.appCheckToken_=t&&t.token,l=new De(r,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,n,i,s,e=>{J(e+" ("+this.repoInfo_.toString()+")"),this.interrupt("server_kill")},o))}catch(t){this.log_("Failed to get token: "+t),a||(this.repoInfo_.nodeAdmin&&J(t),h())}}}interrupt(e){Y("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){Y("Resuming connection for reason: "+e),delete this.interruptReasons_[e],k(this.interruptReasons_)&&(this.reconnectDelay_=Ze,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-(new Date).getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}0===this.outstandingPutCount_&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let n;n=t?t.map(e=>se(e)).join("$"):"default";const i=this.removeListen_(e,n);i&&i.onComplete&&i.onComplete("permission_denied")}removeListen_(e,t){const n=new Oe(e).toString();let i;if(this.listens.has(n)){const e=this.listens.get(n);i=e.get(t),e.delete(t),0===e.size&&this.listens.delete(n)}else i=void 0;return i}onAuthRevoked_(e,t){Y("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),"invalid_token"!==e&&"permission_denied"!==e||(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=3&&(this.reconnectDelay_=3e4,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){Y("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,"invalid_token"!==e&&"permission_denied"!==e||(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=3&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_&&this.securityDebugCallback_(e)}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};e["sdk.js."+L.replace(/\./g,"-")]=1,S()?e["framework.cordova"]=1:N()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=Le.getInstance().currentlyOnline();return k(this.interruptReasons_)&&e}}et.nextPersistentConnectionId_=0,et.nextConnectionId_=0;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class tt{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new tt(e,t)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nt{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const n=new tt(Z,e),i=new tt(Z,t);return 0!==this.compare(n,i)}minPost(){return tt.MIN}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let it;class st extends nt{static get __EMPTY_NODE(){return it}static set __EMPTY_NODE(e){it=e}compare(e,t){return te(e.name,t.name)}isDefinedOn(e){throw y("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return tt.MIN}maxPost(){return new tt(ee,it)}makePost(t,n){return e("string"==typeof t,"KeyIndex indexValue must always be a string."),new tt(t,it)}toString(){return".key"}}const rt=new st;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ot{constructor(e,t,n,i,s=null){this.isReverse_=i,this.resultGenerator_=s,this.nodeStack_=[];let r=1;for(;!e.isEmpty();)if(r=t?n(e.key,t):1,i&&(r*=-1),r<0)e=this.isReverse_?e.left:e.right;else{if(0===r){this.nodeStack_.push(e);break}this.nodeStack_.push(e),e=this.isReverse_?e.right:e.left}}getNext(){if(0===this.nodeStack_.length)return null;let e,t=this.nodeStack_.pop();if(e=this.resultGenerator_?this.resultGenerator_(t.key,t.value):{key:t.key,value:t.value},this.isReverse_)for(t=t.left;!t.isEmpty();)this.nodeStack_.push(t),t=t.right;else for(t=t.right;!t.isEmpty();)this.nodeStack_.push(t),t=t.left;return e}hasNext(){return this.nodeStack_.length>0}peek(){if(0===this.nodeStack_.length)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class at{constructor(e,t,n,i,s){this.key=e,this.value=t,this.color=null!=n?n:at.RED,this.left=null!=i?i:lt.EMPTY_NODE,this.right=null!=s?s:lt.EMPTY_NODE}copy(e,t,n,i,s){return new at(null!=e?e:this.key,null!=t?t:this.value,null!=n?n:this.color,null!=i?i:this.left,null!=s?s:this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,n){let i=this;const s=n(e,i.key);return i=s<0?i.copy(null,null,null,i.left.insert(e,t,n),null):0===s?i.copy(null,t,null,null,null):i.copy(null,null,null,null,i.right.insert(e,t,n)),i.fixUp_()}removeMin_(){if(this.left.isEmpty())return lt.EMPTY_NODE;let e=this;return e.left.isRed_()||e.left.left.isRed_()||(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let n,i;if(n=this,t(e,n.key)<0)n.left.isEmpty()||n.left.isRed_()||n.left.left.isRed_()||(n=n.moveRedLeft_()),n=n.copy(null,null,null,n.left.remove(e,t),null);else{if(n.left.isRed_()&&(n=n.rotateRight_()),n.right.isEmpty()||n.right.isRed_()||n.right.left.isRed_()||(n=n.moveRedRight_()),0===t(e,n.key)){if(n.right.isEmpty())return lt.EMPTY_NODE;i=n.right.min_(),n=n.copy(i.key,i.value,null,null,n.right.removeMin_())}n=n.copy(null,null,null,null,n.right.remove(e,t))}return n.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,at.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,at.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}at.RED=!0,at.BLACK=!1;class lt{constructor(e,t=lt.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new lt(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,at.BLACK,null,null))}remove(e){return new lt(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,at.BLACK,null,null))}get(e){let t,n=this.root_;for(;!n.isEmpty();){if(t=this.comparator_(e,n.key),0===t)return n.value;t<0?n=n.left:t>0&&(n=n.right)}return null}getPredecessorKey(e){let t,n=this.root_,i=null;for(;!n.isEmpty();){if(t=this.comparator_(e,n.key),0===t){if(n.left.isEmpty())return i?i.key:null;for(n=n.left;!n.right.isEmpty();)n=n.right;return n.key}t<0?n=n.left:t>0&&(i=n,n=n.right)}throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new ot(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new ot(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new ot(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new ot(this.root_,null,this.comparator_,!0,e)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function ht(e,t){return te(e.name,t.name)}function ct(e,t){return te(e,t)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ut;lt.EMPTY_NODE=new class{copy(e,t,n,i,s){return this}insert(e,t,n){return new at(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}};const dt=function(e){return"number"==typeof e?"number:"+ae(e):"string:"+e},_t=function(t){if(t.isLeafNode()){const n=t.val();e("string"==typeof n||"number"==typeof n||"object"==typeof n&&u(n,".sv"),"Priority must be a string or number.")}else e(t===ut||t.isEmpty(),"priority of unexpected type.");e(t===ut||t.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let pt,ft,mt;class gt{constructor(t,n=gt.__childrenNodeConstructor.EMPTY_NODE){this.value_=t,this.priorityNode_=n,this.lazyHash_=null,e(void 0!==this.value_&&null!==this.value_,"LeafNode shouldn't be created with null/undefined value."),_t(this.priorityNode_)}static set __childrenNodeConstructor(e){pt=e}static get __childrenNodeConstructor(){return pt}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new gt(this.value_,e)}getImmediateChild(e){return".priority"===e?this.priorityNode_:gt.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return Ke(e)?this:".priority"===qe(e)?this.priorityNode_:gt.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return".priority"===e?this.updatePriority(t):t.isEmpty()&&".priority"!==e?this:gt.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(t,n){const i=qe(t);return null===i?n:n.isEmpty()&&".priority"!==i?this:(e(".priority"!==i||1===We(t),".priority must be the last token in a path"),this.updateImmediateChild(i,gt.__childrenNodeConstructor.EMPTY_NODE.updateChild(Ue(t),n)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(null===this.lazyHash_){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+dt(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",e+="number"===t?ae(this.value_):this.value_,this.lazyHash_=z(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(t){return t===gt.__childrenNodeConstructor.EMPTY_NODE?1:t instanceof gt.__childrenNodeConstructor?-1:(e(t.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(t))}compareToLeafNode_(t){const n=typeof t.value_,i=typeof this.value_,s=gt.VALUE_TYPE_ORDER.indexOf(n),r=gt.VALUE_TYPE_ORDER.indexOf(i);return e(s>=0,"Unknown leaf type: "+n),e(r>=0,"Unknown leaf type: "+i),s===r?"object"===i?0:this.value_<t.value_?-1:this.value_===t.value_?0:1:r-s}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}return!1}}gt.VALUE_TYPE_ORDER=["object","boolean","number","string"];const yt=new class extends nt{compare(e,t){const n=e.node.getPriority(),i=t.node.getPriority(),s=n.compareTo(i);return 0===s?te(e.name,t.name):s}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return tt.MIN}maxPost(){return new tt(ee,new gt("[PRIORITY-POST]",mt))}makePost(e,t){const n=ft(e);return new tt(t,new gt("[PRIORITY-POST]",n))}toString(){return".priority"}},vt=Math.log(2);
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ct{constructor(e){var t;this.count=(t=e+1,parseInt(Math.log(t)/vt,10)),this.current_=this.count-1;const n=(i=this.count,parseInt(Array(i+1).join("1"),2));var i;this.bits_=e+1&n}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const wt=function(e,t,n,i){e.sort(t);const s=function(t,i){const r=i-t;let o,a;if(0===r)return null;if(1===r)return o=e[t],a=n?n(o):o,new at(a,o.node,at.BLACK,null,null);{const l=parseInt(r/2,10)+t,h=s(t,l),c=s(l+1,i);return o=e[l],a=n?n(o):o,new at(a,o.node,at.BLACK,h,c)}},r=function(t){let i=null,r=null,o=e.length;const a=function(t,i){const r=o-t,a=o;o-=t;const h=s(r+1,a),c=e[r],u=n?n(c):c;l(new at(u,c.node,i,null,h))},l=function(e){i?(i.left=e,i=e):(r=e,i=e)};for(let e=0;e<t.count;++e){const n=t.nextBitIsOne(),i=Math.pow(2,t.count-(e+1));n?a(i,at.BLACK):(a(i,at.BLACK),a(i,at.RED))}return r}(new Ct(e.length));return new lt(i||t,r)};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Tt;const It={};class bt{constructor(e,t){this.indexes_=e,this.indexSet_=t}static get Default(){return e(It&&yt,"ChildrenNode.ts has not been loaded"),Tt=Tt||new bt({".priority":It},{".priority":yt}),Tt}get(e){const t=f(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof lt?t:null}hasIndex(e){return u(this.indexSet_,e.toString())}addIndex(t,n){e(t!==rt,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const i=[];let s=!1;const r=n.getIterator(tt.Wrap);let o,a=r.getNext();for(;a;)s=s||t.isDefinedOn(a.node),i.push(a),a=r.getNext();o=s?wt(i,t.getCompare()):It;const l=t.toString(),h=Object.assign({},this.indexSet_);h[l]=t;const c=Object.assign({},this.indexes_);return c[l]=o,new bt(c,h)}addToIndexes(t,n){const i=m(this.indexes_,(i,s)=>{const r=f(this.indexSet_,s);if(e(r,"Missing index implementation for "+s),i===It){if(r.isDefinedOn(t.node)){const e=[],i=n.getIterator(tt.Wrap);let s=i.getNext();for(;s;)s.name!==t.name&&e.push(s),s=i.getNext();return e.push(t),wt(e,r.getCompare())}return It}{const e=n.get(t.name);let s=i;return e&&(s=s.remove(new tt(t.name,e))),s.insert(t,t.node)}});return new bt(i,this.indexSet_)}removeFromIndexes(e,t){const n=m(this.indexes_,n=>{if(n===It)return n;{const i=t.get(e.name);return i?n.remove(new tt(e.name,i)):n}});return new bt(n,this.indexSet_)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let kt;class St{constructor(t,n,i){this.children_=t,this.priorityNode_=n,this.indexMap_=i,this.lazyHash_=null,this.priorityNode_&&_t(this.priorityNode_),this.children_.isEmpty()&&e(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}static get EMPTY_NODE(){return kt||(kt=new St(new lt(ct),null,bt.Default))}isLeafNode(){return!1}getPriority(){return this.priorityNode_||kt}updatePriority(e){return this.children_.isEmpty()?this:new St(this.children_,e,this.indexMap_)}getImmediateChild(e){if(".priority"===e)return this.getPriority();{const t=this.children_.get(e);return null===t?kt:t}}getChild(e){const t=qe(e);return null===t?this:this.getImmediateChild(t).getChild(Ue(e))}hasChild(e){return null!==this.children_.get(e)}updateImmediateChild(t,n){if(e(n,"We should always be passing snapshot nodes"),".priority"===t)return this.updatePriority(n);{const e=new tt(t,n);let i,s;n.isEmpty()?(i=this.children_.remove(t),s=this.indexMap_.removeFromIndexes(e,this.children_)):(i=this.children_.insert(t,n),s=this.indexMap_.addToIndexes(e,this.children_));const r=i.isEmpty()?kt:this.priorityNode_;return new St(i,r,s)}}updateChild(t,n){const i=qe(t);if(null===i)return n;{e(".priority"!==qe(t)||1===We(t),".priority must be the last token in a path");const s=this.getImmediateChild(i).updateChild(Ue(t),n);return this.updateImmediateChild(i,s)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let n=0,i=0,s=!0;if(this.forEachChild(yt,(r,o)=>{t[r]=o.val(e),n++,s&&St.INTEGER_REGEXP_.test(r)?i=Math.max(i,Number(r)):s=!1}),!e&&s&&i<2*n){const e=[];for(const n in t)e[n]=t[n];return e}return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(null===this.lazyHash_){let e="";this.getPriority().isEmpty()||(e+="priority:"+dt(this.getPriority().val())+":"),this.forEachChild(yt,(t,n)=>{const i=n.hash();""!==i&&(e+=":"+t+":"+i)}),this.lazyHash_=""===e?"":z(e)}return this.lazyHash_}getPredecessorChildName(e,t,n){const i=this.resolveIndex_(n);if(i){const n=i.getPredecessorKey(new tt(e,t));return n?n.name:null}return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const e=t.minKey();return e&&e.name}return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new tt(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const e=t.maxKey();return e&&e.name}return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new tt(t,this.children_.get(t)):null}forEachChild(e,t){const n=this.resolveIndex_(e);return n?n.inorderTraversal(e=>t(e.name,e.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const n=this.resolveIndex_(t);if(n)return n.getIteratorFrom(e,e=>e);{const n=this.children_.getIteratorFrom(e.name,tt.Wrap);let i=n.peek();for(;null!=i&&t.compare(i,e)<0;)n.getNext(),i=n.peek();return n}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const n=this.resolveIndex_(t);if(n)return n.getReverseIteratorFrom(e,e=>e);{const n=this.children_.getReverseIteratorFrom(e.name,tt.Wrap);let i=n.peek();for(;null!=i&&t.compare(i,e)>0;)n.getNext(),i=n.peek();return n}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===Nt?-1:0}withIndex(e){if(e===rt||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new St(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===rt||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority())){if(this.children_.count()===t.children_.count()){const e=this.getIterator(yt),n=t.getIterator(yt);let i=e.getNext(),s=n.getNext();for(;i&&s;){if(i.name!==s.name||!i.node.equals(s.node))return!1;i=e.getNext(),s=n.getNext()}return null===i&&null===s}return!1}return!1}}resolveIndex_(e){return e===rt?null:this.indexMap_.get(e.toString())}}St.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;const Nt=new class extends St{constructor(){super(new lt(ct),St.EMPTY_NODE,bt.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return St.EMPTY_NODE}isEmpty(){return!1}};function Et(t,n=null){if(null===t)return St.EMPTY_NODE;if("object"==typeof t&&".priority"in t&&(n=t[".priority"]),e(null===n||"string"==typeof n||"number"==typeof n||"object"==typeof n&&".sv"in n,"Invalid priority type found: "+typeof n),"object"==typeof t&&".value"in t&&null!==t[".value"]&&(t=t[".value"]),"object"!=typeof t||".sv"in t)return new gt(t,Et(n));if(t instanceof Array){let e=St.EMPTY_NODE;return oe(t,(n,i)=>{if(u(t,n)&&"."!==n.substring(0,1)){const t=Et(i);!t.isLeafNode()&&t.isEmpty()||(e=e.updateImmediateChild(n,t))}}),e.updatePriority(Et(n))}{const e=[];let i=!1;if(oe(t,(t,n)=>{if("."!==t.substring(0,1)){const s=Et(n);s.isEmpty()||(i=i||!s.getPriority().isEmpty(),e.push(new tt(t,s)))}}),0===e.length)return St.EMPTY_NODE;const s=wt(e,ht,e=>e.name,ct);if(i){const t=wt(e,yt.getCompare());return new St(s,Et(n),new bt({".priority":t},{".priority":yt}))}return new St(s,Et(n),bt.Default)}}Object.defineProperties(tt,{MIN:{value:new tt(Z,St.EMPTY_NODE)},MAX:{value:new tt(ee,Nt)}}),st.__EMPTY_NODE=St.EMPTY_NODE,gt.__childrenNodeConstructor=St,ut=Nt,mt=Nt,ft=Et;
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Rt extends nt{constructor(t){super(),this.indexPath_=t,e(!Ke(t)&&".priority"!==qe(t),"Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const n=this.extractChild(e.node),i=this.extractChild(t.node),s=n.compareTo(i);return 0===s?te(e.name,t.name):s}makePost(e,t){const n=Et(e),i=St.EMPTY_NODE.updateChild(this.indexPath_,n);return new tt(t,i)}maxPost(){const e=St.EMPTY_NODE.updateChild(this.indexPath_,Nt);return new tt(ee,e)}toString(){return je(this.indexPath_,0).join("/")}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pt=new class extends nt{compare(e,t){const n=e.node.compareTo(t.node);return 0===n?te(e.name,t.name):n}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return tt.MIN}maxPost(){return tt.MAX}makePost(e,t){const n=Et(e);return new tt(t,n)}toString(){return".value"}};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function xt(e,t,n){return{type:"child_changed",snapshotNode:t,childName:e,oldSnap:n}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Dt{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=yt}hasStart(){return this.startSet_}isViewFromLeft(){return""===this.viewFrom_?this.startSet_:"l"===this.viewFrom_}getIndexStartValue(){return e(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return e(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:Z}hasEnd(){return this.endSet_}getIndexEndValue(){return e(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return e(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:ee}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&""!==this.viewFrom_}getLimit(){return e(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===yt}copy(){const e=new Dt;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function Mt(t){const n={};if(t.isDefault())return n;let i;if(t.index_===yt?i="$priority":t.index_===Pt?i="$value":t.index_===rt?i="$key":(e(t.index_ instanceof Rt,"Unrecognized index type!"),i=t.index_.toString()),n.orderBy=h(i),t.startSet_){const e=t.startAfterSet_?"startAfter":"startAt";n[e]=h(t.indexStartValue_),t.startNameSet_&&(n[e]+=","+h(t.indexStartName_))}if(t.endSet_){const e=t.endBeforeSet_?"endBefore":"endAt";n[e]=h(t.indexEndValue_),t.endNameSet_&&(n[e]+=","+h(t.indexEndName_))}return t.limitSet_&&(t.isViewFromLeft()?n.limitToFirst=t.limit_:n.limitToLast=t.limit_),n}function Ft(e){const t={};if(e.startSet_&&(t.sp=e.indexStartValue_,e.startNameSet_&&(t.sn=e.indexStartName_),t.sin=!e.startAfterSet_),e.endSet_&&(t.ep=e.indexEndValue_,e.endNameSet_&&(t.en=e.indexEndName_),t.ein=!e.endBeforeSet_),e.limitSet_){t.l=e.limit_;let n=e.viewFrom_;""===n&&(n=e.isViewFromLeft()?"l":"r"),t.vf=n}return e.index_!==yt&&(t.i=e.index_.toString()),t}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lt extends Me{constructor(e,t,n,i){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=n,this.appCheckTokenProvider_=i,this.log_=G("p:rest:"),this.listens_={}}reportStats(e){throw new Error("Method not implemented.")}static getListenId_(t,n){return void 0!==n?"tag$"+n:(e(t._queryParams.isDefault(),"should have a tag if it's not a default query."),t._path.toString())}listen(e,t,n,i){const s=e._path.toString();this.log_("Listen called for "+s+" "+e._queryIdentifier);const r=Lt.getListenId_(e,n),o={};this.listens_[r]=o;const a=Mt(e._queryParams);this.restRequest_(s+".json",a,(e,t)=>{let a=t;if(404===e&&(a=null,e=null),null===e&&this.onDataUpdate_(s,a,!1,n),f(this.listens_,r)===o){let t;t=e?401===e?"permission_denied":"rest_error:"+e:"ok",i(t,null)}})}unlisten(e,t){const n=Lt.getListenId_(e,t);delete this.listens_[n]}get(e){const t=Mt(e._queryParams),n=e._path.toString(),i=new T;return this.restRequest_(n+".json",t,(e,t)=>{let s=t;404===e&&(s=null,e=null),null===e?(this.onDataUpdate_(n,s,!1,null),i.resolve(s)):i.reject(new Error(s))}),i.promise}refreshAuthToken(e){}restRequest_(e,t={},n){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([i,s])=>{i&&i.accessToken&&(t.auth=i.accessToken),s&&s.token&&(t.ac=s.token);const r=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+E(t);this.log_("Sending REST request for "+r);const o=new XMLHttpRequest;o.onreadystatechange=()=>{if(n&&4===o.readyState){this.log_("REST Response for "+r+" received. status:",o.status,"response:",o.responseText);let t=null;if(o.status>=200&&o.status<300){try{t=c(o.responseText)}catch(e){J("Failed to parse JSON response for "+r+": "+o.responseText)}n(null,t)}else 401!==o.status&&404!==o.status&&J("Got unsuccessful REST response for "+r+" Status: "+o.status),n(o.status);n=null}},o.open("GET",r,!0),o.send()})}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ot{constructor(){this.rootNode_=St.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function At(){return{value:null,children:new Map}}function qt(e,t,n){if(Ke(t))e.value=n,e.children.clear();else if(null!==e.value)e.value=e.value.updateChild(t,n);else{const i=qe(t);e.children.has(i)||e.children.set(i,At()),qt(e.children.get(i),t=Ue(t),n)}}function Wt(e,t,n){null!==e.value?n(t,e.value):function(e,t){e.children.forEach((e,n)=>{t(n,e)})}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(e,(e,i)=>{Wt(i,new Oe(t.toString()+"/"+e),n)})}class Ut{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t=Object.assign({},e);return this.last_&&oe(this.last_,(e,n)=>{t[e]=t[e]-n}),this.last_=e,t}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ht{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new Ut(e);const n=1e4+2e4*Math.random();ue(this.reportStats_.bind(this),Math.floor(n))}reportStats_(){const e=this.statsListener_.get(),t={};let n=!1;oe(e,(e,i)=>{i>0&&u(this.statsToReport_,e)&&(t[e]=i,n=!0)}),n&&this.server_.reportStats(t),ue(this.reportStats_.bind(this),Math.floor(2*Math.random()*3e5))}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var jt,zt;function Vt(e){return{fromUser:!1,fromServer:!0,queryId:e,tagged:!0}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(zt=jt||(jt={}))[zt.OVERWRITE=0]="OVERWRITE",zt[zt.MERGE=1]="MERGE",zt[zt.ACK_USER_WRITE=2]="ACK_USER_WRITE",zt[zt.LISTEN_COMPLETE=3]="LISTEN_COMPLETE";class Kt{constructor(e,t,n){this.path=e,this.affectedTree=t,this.revert=n,this.type=jt.ACK_USER_WRITE,this.source={fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}operationForChild(t){if(Ke(this.path)){if(null!=this.affectedTree.value)return e(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const e=this.affectedTree.subtree(new Oe(t));return new Kt(Ae(),e,this.revert)}}return e(qe(this.path)===t,"operationForChild called for unrelated child."),new Kt(Ue(this.path),this.affectedTree,this.revert)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bt{constructor(e,t,n){this.source=e,this.path=t,this.snap=n,this.type=jt.OVERWRITE}operationForChild(e){return Ke(this.path)?new Bt(this.source,Ae(),this.snap.getImmediateChild(e)):new Bt(this.source,Ue(this.path),this.snap)}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yt{constructor(e,t,n){this.source=e,this.path=t,this.children=n,this.type=jt.MERGE}operationForChild(t){if(Ke(this.path)){const e=this.children.subtree(new Oe(t));return e.isEmpty()?null:e.value?new Bt(this.source,Ae(),e.value):new Yt(this.source,Ae(),e)}return e(qe(this.path)===t,"Can't get a merge for a child not on the path of the operation"),new Yt(this.source,Ue(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gt{constructor(e,t,n){this.node_=e,this.fullyInitialized_=t,this.filtered_=n}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(Ke(e))return this.isFullyInitialized()&&!this.filtered_;const t=qe(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}function Qt(e,t,n,i,s,r){const o=i.filter(e=>e.type===n);o.sort((t,n)=>function(e,t,n){if(null==t.childName||null==n.childName)throw y("Should only compare child_ events.");const i=new tt(t.childName,t.snapshotNode),s=new tt(n.childName,n.snapshotNode);return e.index_.compare(i,s)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(e,t,n)),o.forEach(n=>{const i=function(e,t,n){return"value"===t.type||"child_removed"===t.type||(t.prevName=n.getPredecessorChildName(t.childName,t.snapshotNode,e.index_)),t}(e,n,r);s.forEach(s=>{s.respondsTo(n.type)&&t.push(s.createEvent(i,e.query_))})})}function $t(e,t){return{eventCache:e,serverCache:t}}function Jt(e,t,n,i){return $t(new Gt(t,n,i),e.serverCache)}function Xt(e,t,n,i){return $t(e.eventCache,new Gt(t,n,i))}function Zt(e){return e.eventCache.isFullyInitialized()?e.eventCache.getNode():null}function en(e){return e.serverCache.isFullyInitialized()?e.serverCache.getNode():null}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let tn;class nn{constructor(e,t=(()=>(tn||(tn=new lt(ne)),tn))()){this.value=e,this.children=t}static fromObject(e){let t=new nn(null);return oe(e,(e,n)=>{t=t.set(new Oe(e),n)}),t}isEmpty(){return null===this.value&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(null!=this.value&&t(this.value))return{path:Ae(),value:this.value};if(Ke(e))return null;{const n=qe(e),i=this.children.get(n);if(null!==i){const s=i.findRootMostMatchingPathAndValue(Ue(e),t);return null!=s?{path:Ve(new Oe(n),s.path),value:s.value}:null}return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(Ke(e))return this;{const t=qe(e),n=this.children.get(t);return null!==n?n.subtree(Ue(e)):new nn(null)}}set(e,t){if(Ke(e))return new nn(t,this.children);{const n=qe(e),i=(this.children.get(n)||new nn(null)).set(Ue(e),t),s=this.children.insert(n,i);return new nn(this.value,s)}}remove(e){if(Ke(e))return this.children.isEmpty()?new nn(null):new nn(null,this.children);{const t=qe(e),n=this.children.get(t);if(n){const i=n.remove(Ue(e));let s;return s=i.isEmpty()?this.children.remove(t):this.children.insert(t,i),null===this.value&&s.isEmpty()?new nn(null):new nn(this.value,s)}return this}}get(e){if(Ke(e))return this.value;{const t=qe(e),n=this.children.get(t);return n?n.get(Ue(e)):null}}setTree(e,t){if(Ke(e))return t;{const n=qe(e),i=(this.children.get(n)||new nn(null)).setTree(Ue(e),t);let s;return s=i.isEmpty()?this.children.remove(n):this.children.insert(n,i),new nn(this.value,s)}}fold(e){return this.fold_(Ae(),e)}fold_(e,t){const n={};return this.children.inorderTraversal((i,s)=>{n[i]=s.fold_(Ve(e,i),t)}),t(e,this.value,n)}findOnPath(e,t){return this.findOnPath_(e,Ae(),t)}findOnPath_(e,t,n){const i=!!this.value&&n(t,this.value);if(i)return i;if(Ke(e))return null;{const i=qe(e),s=this.children.get(i);return s?s.findOnPath_(Ue(e),Ve(t,i),n):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,Ae(),t)}foreachOnPath_(e,t,n){if(Ke(e))return this;{this.value&&n(t,this.value);const i=qe(e),s=this.children.get(i);return s?s.foreachOnPath_(Ue(e),Ve(t,i),n):new nn(null)}}foreach(e){this.foreach_(Ae(),e)}foreach_(e,t){this.children.inorderTraversal((n,i)=>{i.foreach_(Ve(e,n),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,n)=>{n.value&&e(t,n.value)})}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sn{constructor(e){this.writeTree_=e}static empty(){return new sn(new nn(null))}}function rn(e,t,n){if(Ke(t))return new sn(new nn(n));{const i=e.writeTree_.findRootMostValueAndPath(t);if(null!=i){const s=i.path;let r=i.value;const o=Be(s,t);return r=r.updateChild(o,n),new sn(e.writeTree_.set(s,r))}{const i=new nn(n),s=e.writeTree_.setTree(t,i);return new sn(s)}}}function on(e,t,n){let i=e;return oe(n,(e,n)=>{i=rn(i,Ve(t,e),n)}),i}function an(e,t){if(Ke(t))return sn.empty();{const n=e.writeTree_.setTree(t,new nn(null));return new sn(n)}}function ln(e,t){return null!=hn(e,t)}function hn(e,t){const n=e.writeTree_.findRootMostValueAndPath(t);return null!=n?e.writeTree_.get(n.path).getChild(Be(n.path,t)):null}function cn(e){const t=[],n=e.writeTree_.value;return null!=n?n.isLeafNode()||n.forEachChild(yt,(e,n)=>{t.push(new tt(e,n))}):e.writeTree_.children.inorderTraversal((e,n)=>{null!=n.value&&t.push(new tt(e,n.value))}),t}function un(e,t){if(Ke(t))return e;{const n=hn(e,t);return new sn(null!=n?new nn(n):e.writeTree_.subtree(t))}}function dn(e){return e.writeTree_.isEmpty()}function _n(e,t){return pn(Ae(),e.writeTree_,t)}function pn(t,n,i){if(null!=n.value)return i.updateChild(t,n.value);{let s=null;return n.children.inorderTraversal((n,r)=>{".priority"===n?(e(null!==r.value,"Priority writes must always be leaf nodes"),s=r.value):i=pn(Ve(t,n),r,i)}),i.getChild(t).isEmpty()||null===s||(i=i.updateChild(Ve(t,".priority"),s)),i}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fn(e,t){return Sn(t,e)}function mn(e,t){if(e.snap)return Ge(e.path,t);for(const n in e.children)if(e.children.hasOwnProperty(n)&&Ge(Ve(e.path,n),t))return!0;return!1}function gn(e){return e.visible}function yn(e,t,n){let i=sn.empty();for(let s=0;s<e.length;++s){const r=e[s];if(t(r)){const e=r.path;let t;if(r.snap)Ge(n,e)?(t=Be(n,e),i=rn(i,t,r.snap)):Ge(e,n)&&(t=Be(e,n),i=rn(i,Ae(),r.snap.getChild(t)));else{if(!r.children)throw y("WriteRecord should have .snap or .children");if(Ge(n,e))t=Be(n,e),i=on(i,t,r.children);else if(Ge(e,n))if(t=Be(e,n),Ke(t))i=on(i,Ae(),r.children);else{const e=f(r.children,qe(t));if(e){const n=e.getChild(Ue(t));i=rn(i,Ae(),n)}}}}}return i}function vn(e,t,n,i,s){if(i||s){const r=un(e.visibleWrites,t);if(!s&&dn(r))return n;if(s||null!=n||ln(r,Ae())){const r=function(e){return(e.visible||s)&&(!i||!~i.indexOf(e.writeId))&&(Ge(e.path,t)||Ge(t,e.path))};return _n(yn(e.allWrites,r,t),n||St.EMPTY_NODE)}return null}{const i=hn(e.visibleWrites,t);if(null!=i)return i;{const i=un(e.visibleWrites,t);return dn(i)?n:null!=n||ln(i,Ae())?_n(i,n||St.EMPTY_NODE):null}}}function Cn(e,t,n,i){return vn(e.writeTree,e.treePath,t,n,i)}function wn(e,t){return function(e,t,n){let i=St.EMPTY_NODE;const s=hn(e.visibleWrites,t);if(s)return s.isLeafNode()||s.forEachChild(yt,(e,t)=>{i=i.updateImmediateChild(e,t)}),i;if(n){const s=un(e.visibleWrites,t);return n.forEachChild(yt,(e,t)=>{const n=_n(un(s,new Oe(e)),t);i=i.updateImmediateChild(e,n)}),cn(s).forEach(e=>{i=i.updateImmediateChild(e.name,e.node)}),i}return cn(un(e.visibleWrites,t)).forEach(e=>{i=i.updateImmediateChild(e.name,e.node)}),i}(e.writeTree,e.treePath,t)}function Tn(t,n,i,s){return function(t,n,i,s,r){e(s||r,"Either existingEventSnap or existingServerSnap must exist");const o=Ve(n,i);if(ln(t.visibleWrites,o))return null;{const e=un(t.visibleWrites,o);return dn(e)?r.getChild(i):_n(e,r.getChild(i))}}(t.writeTree,t.treePath,n,i,s)}function In(e,t){return function(e,t){return hn(e.visibleWrites,t)}(e.writeTree,Ve(e.treePath,t))}function bn(e,t,n){return function(e,t,n,i){const s=Ve(t,n),r=hn(e.visibleWrites,s);return null!=r?r:i.isCompleteForChild(n)?_n(un(e.visibleWrites,s),i.getNode().getImmediateChild(n)):null}(e.writeTree,e.treePath,t,n)}function kn(e,t){return Sn(Ve(e.treePath,t),e.writeTree)}function Sn(e,t){return{treePath:e,writeTree:t}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nn{constructor(){this.changeMap=new Map}trackChildChange(t){const n=t.type,i=t.childName;e("child_added"===n||"child_changed"===n||"child_removed"===n,"Only child changes supported for tracking"),e(".priority"!==i,"Only non-priority child changes can be tracked.");const s=this.changeMap.get(i);if(s){const e=s.type;if("child_added"===n&&"child_removed"===e)this.changeMap.set(i,xt(i,t.snapshotNode,s.snapshotNode));else if("child_removed"===n&&"child_added"===e)this.changeMap.delete(i);else if("child_removed"===n&&"child_changed"===e)this.changeMap.set(i,(r=i,{type:"child_removed",snapshotNode:s.oldSnap,childName:r}));else if("child_changed"===n&&"child_added"===e)this.changeMap.set(i,function(e,t){return{type:"child_added",snapshotNode:t,childName:e}}(i,t.snapshotNode));else{if("child_changed"!==n||"child_changed"!==e)throw y("Illegal combination of changes: "+t+" occurred after "+s);this.changeMap.set(i,xt(i,t.snapshotNode,s.oldSnap))}}else this.changeMap.set(i,t);var r}getChanges(){return Array.from(this.changeMap.values())}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const En=new class{getCompleteChild(e){return null}getChildAfterChild(e,t,n){return null}};class Rn{constructor(e,t,n=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=n}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const t=null!=this.optCompleteServerCache_?new Gt(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return bn(this.writes_,e,t)}}getChildAfterChild(e,t,n){const i=null!=this.optCompleteServerCache_?this.optCompleteServerCache_:en(this.viewCache_),s=function(e,t,n,i,s,r){return function(e,t,n,i,s,r,o){let a;const l=un(e.visibleWrites,t),h=hn(l,Ae());if(null!=h)a=h;else{if(null==n)return[];a=_n(l,n)}if(a=a.withIndex(o),a.isEmpty()||a.isLeafNode())return[];{const e=[],t=o.getCompare(),n=r?a.getReverseIteratorFrom(i,o):a.getIteratorFrom(i,o);let l=n.getNext();for(;l&&e.length<s;)0!==t(l,i)&&e.push(l),l=n.getNext();return e}}(e.writeTree,e.treePath,t,n,i,s,r)}(this.writes_,i,t,1,n,e);return 0===s.length?null:s[0]}}function Pn(t,n,i,s,r,o){const a=n.eventCache;if(null!=In(s,i))return n;{let l,h;if(Ke(i))if(e(n.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),n.serverCache.isFiltered()){const e=en(n),i=wn(s,e instanceof St?e:St.EMPTY_NODE);l=t.filter.updateFullNode(n.eventCache.getNode(),i,o)}else{const e=Cn(s,en(n));l=t.filter.updateFullNode(n.eventCache.getNode(),e,o)}else{const c=qe(i);if(".priority"===c){e(1===We(i),"Can't have a priority with additional path components");const r=a.getNode();h=n.serverCache.getNode();const o=Tn(s,i,r,h);l=null!=o?t.filter.updatePriority(r,o):a.getNode()}else{const e=Ue(i);let u;if(a.isCompleteForChild(c)){h=n.serverCache.getNode();const t=Tn(s,i,a.getNode(),h);u=null!=t?a.getNode().getImmediateChild(c).updateChild(e,t):a.getNode().getImmediateChild(c)}else u=bn(s,c,n.serverCache);l=null!=u?t.filter.updateChild(a.getNode(),c,u,e,r,o):a.getNode()}}return Jt(n,l,a.isFullyInitialized()||Ke(i),t.filter.filtersNodes())}}function xn(e,t,n,i,s,r,o,a){const l=t.serverCache;let h;const c=o?e.filter:e.filter.getIndexedFilter();if(Ke(n))h=c.updateFullNode(l.getNode(),i,null);else if(c.filtersNodes()&&!l.isFiltered()){const e=l.getNode().updateChild(n,i);h=c.updateFullNode(l.getNode(),e,null)}else{const e=qe(n);if(!l.isCompleteForPath(n)&&We(n)>1)return t;const s=Ue(n),r=l.getNode().getImmediateChild(e).updateChild(s,i);h=".priority"===e?c.updatePriority(l.getNode(),r):c.updateChild(l.getNode(),e,r,s,En,null)}const u=Xt(t,h,l.isFullyInitialized()||Ke(n),c.filtersNodes());return Pn(e,u,n,s,new Rn(s,u,r),a)}function Dn(e,t,n,i,s,r,o){const a=t.eventCache;let l,h;const c=new Rn(s,t,r);if(Ke(n))h=e.filter.updateFullNode(t.eventCache.getNode(),i,o),l=Jt(t,h,!0,e.filter.filtersNodes());else{const s=qe(n);if(".priority"===s)h=e.filter.updatePriority(t.eventCache.getNode(),i),l=Jt(t,h,a.isFullyInitialized(),a.isFiltered());else{const r=Ue(n),h=a.getNode().getImmediateChild(s);let u;if(Ke(r))u=i;else{const e=c.getCompleteChild(s);u=null!=e?".priority"===He(r)&&e.getChild(ze(r)).isEmpty()?e:e.updateChild(r,i):St.EMPTY_NODE}l=h.equals(u)?t:Jt(t,e.filter.updateChild(a.getNode(),s,u,r,c,o),a.isFullyInitialized(),e.filter.filtersNodes())}}return l}function Mn(e,t){return e.eventCache.isCompleteForChild(t)}function Fn(e,t,n){return n.foreach((e,n)=>{t=t.updateChild(e,n)}),t}function Ln(e,t,n,i,s,r,o,a){if(t.serverCache.getNode().isEmpty()&&!t.serverCache.isFullyInitialized())return t;let l,h=t;l=Ke(n)?i:new nn(null).setTree(n,i);const c=t.serverCache.getNode();return l.children.inorderTraversal((n,i)=>{if(c.hasChild(n)){const l=Fn(0,t.serverCache.getNode().getImmediateChild(n),i);h=xn(e,h,new Oe(n),l,s,r,o,a)}}),l.children.inorderTraversal((n,i)=>{const l=!t.serverCache.isCompleteForChild(n)&&null===i.value;if(!c.hasChild(n)&&!l){const l=Fn(0,t.serverCache.getNode().getImmediateChild(n),i);h=xn(e,h,new Oe(n),l,s,r,o,a)}}),h}function On(e,t){const n=en(e.viewCache_);return n&&(e.query._queryParams.loadsAllData()||!Ke(t)&&!n.getImmediateChild(qe(t)).isEmpty())?n.getChild(t):null}function An(t,n,i,s){n.type===jt.MERGE&&null!==n.source.queryId&&(e(en(t.viewCache_),"We should always have a full cache before handling merges"),e(Zt(t.viewCache_),"Missing event cache, even though we have a server cache"));const r=t.viewCache_,o=function(t,n,i,s,r){const o=new Nn;let a,l;if(i.type===jt.OVERWRITE){const h=i;h.source.fromUser?a=Dn(t,n,h.path,h.snap,s,r,o):(e(h.source.fromServer,"Unknown source."),l=h.source.tagged||n.serverCache.isFiltered()&&!Ke(h.path),a=xn(t,n,h.path,h.snap,s,r,l,o))}else if(i.type===jt.MERGE){const h=i;h.source.fromUser?a=function(e,t,n,i,s,r,o){let a=t;return i.foreach((i,l)=>{const h=Ve(n,i);Mn(t,qe(h))&&(a=Dn(e,a,h,l,s,r,o))}),i.foreach((i,l)=>{const h=Ve(n,i);Mn(t,qe(h))||(a=Dn(e,a,h,l,s,r,o))}),a}(t,n,h.path,h.children,s,r,o):(e(h.source.fromServer,"Unknown source."),l=h.source.tagged||n.serverCache.isFiltered(),a=Ln(t,n,h.path,h.children,s,r,l,o))}else if(i.type===jt.ACK_USER_WRITE){const l=i;a=l.revert?function(t,n,i,s,r,o){let a;if(null!=In(s,i))return n;{const l=new Rn(s,n,r),h=n.eventCache.getNode();let c;if(Ke(i)||".priority"===qe(i)){let i;if(n.serverCache.isFullyInitialized())i=Cn(s,en(n));else{const t=n.serverCache.getNode();e(t instanceof St,"serverChildren would be complete if leaf node"),i=wn(s,t)}c=t.filter.updateFullNode(h,i,o)}else{const e=qe(i);let r=bn(s,e,n.serverCache);null==r&&n.serverCache.isCompleteForChild(e)&&(r=h.getImmediateChild(e)),c=null!=r?t.filter.updateChild(h,e,r,Ue(i),l,o):n.eventCache.getNode().hasChild(e)?t.filter.updateChild(h,e,St.EMPTY_NODE,Ue(i),l,o):h,c.isEmpty()&&n.serverCache.isFullyInitialized()&&(a=Cn(s,en(n)),a.isLeafNode()&&(c=t.filter.updateFullNode(c,a,o)))}return a=n.serverCache.isFullyInitialized()||null!=In(s,Ae()),Jt(n,c,a,t.filter.filtersNodes())}}(t,n,l.path,s,r,o):function(e,t,n,i,s,r,o){if(null!=In(s,n))return t;const a=t.serverCache.isFiltered(),l=t.serverCache;if(null!=i.value){if(Ke(n)&&l.isFullyInitialized()||l.isCompleteForPath(n))return xn(e,t,n,l.getNode().getChild(n),s,r,a,o);if(Ke(n)){let i=new nn(null);return l.getNode().forEachChild(rt,(e,t)=>{i=i.set(new Oe(e),t)}),Ln(e,t,n,i,s,r,a,o)}return t}{let h=new nn(null);return i.foreach((e,t)=>{const i=Ve(n,e);l.isCompleteForPath(i)&&(h=h.set(e,l.getNode().getChild(i)))}),Ln(e,t,n,h,s,r,a,o)}}(t,n,l.path,l.affectedTree,s,r,o)}else{if(i.type!==jt.LISTEN_COMPLETE)throw y("Unknown operation type: "+i.type);a=function(e,t,n,i,s){const r=t.serverCache;return Pn(e,Xt(t,r.getNode(),r.isFullyInitialized()||Ke(n),r.isFiltered()),n,i,En,s)}(t,n,i.path,s,o)}const h=o.getChanges();return function(e,t,n){const i=t.eventCache;if(i.isFullyInitialized()){const s=i.getNode().isLeafNode()||i.getNode().isEmpty(),r=Zt(e);(n.length>0||!e.eventCache.isFullyInitialized()||s&&!i.getNode().equals(r)||!i.getNode().getPriority().equals(r.getPriority()))&&n.push({type:"value",snapshotNode:Zt(t)})}}(n,a,h),{viewCache:a,changes:h}}(t.processor_,r,n,i,s);var a,l;return a=t.processor_,l=o.viewCache,e(l.eventCache.getNode().isIndexed(a.filter.getIndex()),"Event snap not indexed"),e(l.serverCache.getNode().isIndexed(a.filter.getIndex()),"Server snap not indexed"),e(o.viewCache.serverCache.isFullyInitialized()||!r.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),t.viewCache_=o.viewCache,function(e,t,n){const i=e.eventRegistrations_;return function(e,t,n,i){const s=[],r=[];return t.forEach(t=>{var n;"child_changed"===t.type&&e.index_.indexedValueChanged(t.oldSnap,t.snapshotNode)&&r.push((n=t.childName,{type:"child_moved",snapshotNode:t.snapshotNode,childName:n}))}),Qt(e,s,"child_removed",t,i,n),Qt(e,s,"child_added",t,i,n),Qt(e,s,"child_moved",r,i,n),Qt(e,s,"child_changed",t,i,n),Qt(e,s,"value",t,i,n),s}(e.eventGenerator_,t,n,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(t,o.changes,o.viewCache.eventCache.getNode())}let qn,Wn;function Un(t,n,i,s){const r=n.source.queryId;if(null!==r){const o=t.views.get(r);return e(null!=o,"SyncTree gave us an op for an invalid query."),An(o,n,i,s)}{let e=[];for(const r of t.views.values())e=e.concat(An(r,n,i,s));return e}}function Hn(e,t){let n=null;for(const i of e.views.values())n=n||On(i,t);return n}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jn{constructor(e){this.listenProvider_=e,this.syncPointTree_=new nn(null),this.pendingWriteTree_={visibleWrites:sn.empty(),allWrites:[],lastWriteId:-1},this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function zn(t,n,i,s,r){return function(t,n,i,s,r){e(s>t.lastWriteId,"Stacking an older write on top of newer ones"),void 0===r&&(r=!0),t.allWrites.push({path:n,snap:i,writeId:s,visible:r}),r&&(t.visibleWrites=rn(t.visibleWrites,n,i)),t.lastWriteId=s}(t.pendingWriteTree_,n,i,s,r),r?Yn(t,new Bt({fromUser:!0,fromServer:!1,queryId:null,tagged:!1},n,i)):[]}function Vn(t,n,i=!1){const s=function(e,t){for(let n=0;n<e.allWrites.length;n++){const i=e.allWrites[n];if(i.writeId===t)return i}return null}(t.pendingWriteTree_,n);if(function(t,n){const i=t.allWrites.findIndex(e=>e.writeId===n);e(i>=0,"removeWrite called with nonexistent writeId.");const s=t.allWrites[i];t.allWrites.splice(i,1);let r=s.visible,o=!1,a=t.allWrites.length-1;for(;r&&a>=0;){const e=t.allWrites[a];e.visible&&(a>=i&&mn(e,s.path)?r=!1:Ge(s.path,e.path)&&(o=!0)),a--}return!!r&&(o?(function(e){e.visibleWrites=yn(e.allWrites,gn,Ae()),e.allWrites.length>0?e.lastWriteId=e.allWrites[e.allWrites.length-1].writeId:e.lastWriteId=-1}(t),!0):(s.snap?t.visibleWrites=an(t.visibleWrites,s.path):oe(s.children,e=>{t.visibleWrites=an(t.visibleWrites,Ve(s.path,e))}),!0))}(t.pendingWriteTree_,n)){let e=new nn(null);return null!=s.snap?e=e.set(Ae(),!0):oe(s.children,t=>{e=e.set(new Oe(t),!0)}),Yn(t,new Kt(s.path,e,i))}return[]}function Kn(e,t,n){return Yn(e,new Bt({fromUser:!1,fromServer:!0,queryId:null,tagged:!1},t,n))}function Bn(e,t,n){const i=e.pendingWriteTree_,s=e.syncPointTree_.findOnPath(t,(e,n)=>{const i=Hn(n,Be(e,t));if(i)return i});return vn(i,t,s,n,!0)}function Yn(e,t){return Gn(t,e.syncPointTree_,null,fn(e.pendingWriteTree_,Ae()))}function Gn(e,t,n,i){if(Ke(e.path))return Qn(e,t,n,i);{const s=t.get(Ae());null==n&&null!=s&&(n=Hn(s,Ae()));let r=[];const o=qe(e.path),a=e.operationForChild(o),l=t.children.get(o);if(l&&a){const e=n?n.getImmediateChild(o):null,t=kn(i,o);r=r.concat(Gn(a,l,e,t))}return s&&(r=r.concat(Un(s,e,i,n))),r}}function Qn(e,t,n,i){const s=t.get(Ae());null==n&&null!=s&&(n=Hn(s,Ae()));let r=[];return t.children.inorderTraversal((t,s)=>{const o=n?n.getImmediateChild(t):null,a=kn(i,t),l=e.operationForChild(t);l&&(r=r.concat(Qn(l,s,o,a)))}),s&&(r=r.concat(Un(s,e,i,n))),r}function $n(e,t){return e.tagToQueryMap.get(t)}function Jn(t){const n=t.indexOf("$");return e(-1!==n&&n<t.length-1,"Bad queryKey."),{queryId:t.substr(n+1),path:new Oe(t.substr(0,n))}}function Xn(t,n,i){const s=t.syncPointTree_.get(n);return e(s,"Missing sync point for query tag that we're tracking"),Un(s,i,fn(t.pendingWriteTree_,n),null)}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zn{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new Zn(t)}node(){return this.node_}}class ei{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=Ve(this.path_,e);return new ei(this.syncTree_,t)}node(){return Bn(this.syncTree_,this.path_)}}const ti=function(t,n,i){return t&&"object"==typeof t?(e(".sv"in t,"Unexpected leaf node or priority contents"),"string"==typeof t[".sv"]?ni(t[".sv"],n,i):"object"==typeof t[".sv"]?ii(t[".sv"],n):void e(!1,"Unexpected server value: "+JSON.stringify(t,null,2))):t},ni=function(t,n,i){if("timestamp"===t)return i.timestamp;e(!1,"Unexpected server value: "+t)},ii=function(t,n,i){t.hasOwnProperty("increment")||e(!1,"Unexpected server value: "+JSON.stringify(t,null,2));const s=t.increment;"number"!=typeof s&&e(!1,"Unexpected increment value: "+s);const r=n.node();if(e(null!=r,"Expected ChildrenNode.EMPTY_NODE for nulls"),!r.isLeafNode())return s;const o=r.getValue();return"number"!=typeof o?s:o+s},si=function(e,t,n){return ri(e,new Zn(t),n)};function ri(e,t,n){const i=e.getPriority().val(),s=ti(i,t.getImmediateChild(".priority"),n);let r;if(e.isLeafNode()){const i=e,r=ti(i.getValue(),t,n);return r!==i.getValue()||s!==i.getPriority().val()?new gt(r,Et(s)):e}{const i=e;return r=i,s!==i.getPriority().val()&&(r=r.updatePriority(new gt(s))),i.forEachChild(yt,(e,i)=>{const s=ri(i,t.getImmediateChild(e),n);s!==i&&(r=r.updateImmediateChild(e,s))}),r}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oi{constructor(e="",t=null,n={children:{},childCount:0}){this.name=e,this.parent=t,this.node=n}}function ai(e,t){let n=t instanceof Oe?t:new Oe(t),i=e,s=qe(n);for(;null!==s;){const e=f(i.node.children,s)||{children:{},childCount:0};i=new oi(s,i,e),n=Ue(n),s=qe(n)}return i}function li(e){return e.node.value}function hi(e,t){e.node.value=t,pi(e)}function ci(e){return e.node.childCount>0}function ui(e,t){oe(e.node.children,(n,i)=>{t(new oi(n,e,i))})}function di(e,t,n,i){n&&!i&&t(e),ui(e,e=>{di(e,t,!0,i)}),n&&i&&t(e)}function _i(e){return new Oe(null===e.parent?e.name:_i(e.parent)+"/"+e.name)}function pi(e){null!==e.parent&&function(e,t,n){const i=function(e){return void 0===li(e)&&!ci(e)}(n),s=u(e.node.children,t);i&&s?(delete e.node.children[t],e.node.childCount--,pi(e)):i||s||(e.node.children[t]=n.node,e.node.childCount++,pi(e))}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(e.parent,e.name,e)}const fi=/[\[\].#$\/\u0000-\u001F\u007F]/,mi=/[\[\].#$\u0000-\u001F\u007F]/,gi=10485760,yi=function(e){return"string"==typeof e&&0!==e.length&&!fi.test(e)},vi=function(e,t,n){const i=n instanceof Oe?new Qe(n,e):n;if(void 0===t)throw new Error(e+"contains undefined "+Je(i));if("function"==typeof t)throw new Error(e+"contains a function "+Je(i)+" with contents = "+t.toString());if(X(t))throw new Error(e+"contains "+t.toString()+" "+Je(i));if("string"==typeof t&&t.length>gi/3&&R(t)>gi)throw new Error(e+"contains a string greater than "+gi+" utf8 bytes "+Je(i)+" ('"+t.substring(0,50)+"...')");if(t&&"object"==typeof t){let n=!1,s=!1;if(oe(t,(t,r)=>{if(".value"===t)n=!0;else if(".priority"!==t&&".sv"!==t&&(s=!0,!yi(t)))throw new Error(e+" contains an invalid key ("+t+") "+Je(i)+'.  Keys must be non-empty strings and can\'t contain ".", "#", "$", "/", "[", or "]"');var o,a;a=t,(o=i).parts_.length>0&&(o.byteLength_+=1),o.parts_.push(a),o.byteLength_+=R(a),$e(o),vi(e,r,i),function(e){const t=e.parts_.pop();e.byteLength_-=R(t),e.parts_.length>0&&(e.byteLength_-=1)}(i)}),n&&s)throw new Error(e+' contains ".value" child '+Je(i)+" in addition to actual children.")}};
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class Ci{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function wi(e,t,n){!function(e,t){let n=null;for(let i=0;i<t.length;i++){const s=t[i],r=s.getPath();null===n||Ye(r,n.path)||(e.eventLists_.push(n),n=null),null===n&&(n={events:[],path:r}),n.events.push(s)}n&&e.eventLists_.push(n)}(e,n),function(e,t){e.recursionDepth_++;let n=!0;for(let i=0;i<e.eventLists_.length;i++){const s=e.eventLists_[i];s&&(t(s.path)?(Ti(e.eventLists_[i]),e.eventLists_[i]=null):n=!1)}n&&(e.eventLists_=[]),e.recursionDepth_--}(e,e=>Ge(e,t)||Ge(t,e))}function Ti(e){for(let t=0;t<e.events.length;t++){const n=e.events[t];if(null!==n){e.events[t]=null;const i=n.getEventRunner();K&&Y("event: "+n.toString()),ce(i)}}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ii{constructor(e,t,n,i){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=n,this.appCheckProvider_=i,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new Ci,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=At(),this.transactionQueueTree_=new oi,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function bi(e,t,n){if(e.stats_=be(e.repoInfo_),e.forceRestClient_||("object"==typeof window&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0)e.server_=new Lt(e.repoInfo_,(t,n,i,s)=>{Ni(e,t,n,i,s)},e.authTokenProvider_,e.appCheckProvider_),setTimeout(()=>Ei(e,!0),0);else{if(null!=n){if("object"!=typeof n)throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{h(n)}catch(i){throw new Error("Invalid authOverride provided: "+i)}}e.persistentConnection_=new et(e.repoInfo_,t,(t,n,i,s)=>{Ni(e,t,n,i,s)},t=>{Ei(e,t)},t=>{!function(e,t){oe(t,(t,n)=>{Ri(e,t,n)})}(e,t)},e.authTokenProvider_,e.appCheckProvider_,n),e.server_=e.persistentConnection_}e.authTokenProvider_.addTokenChangeListener(t=>{e.server_.refreshAuthToken(t)}),e.appCheckProvider_.addTokenChangeListener(t=>{e.server_.refreshAppCheckToken(t.token)}),e.statsReporter_=function(t){const n=t.toString();return Ie[n]||(Ie[n]=new Ht(e.stats_,e.server_)),Ie[n]}(e.repoInfo_),e.infoData_=new Ot,e.infoSyncTree_=new jn({startListening:(t,n,i,s)=>{let r=[];const o=e.infoData_.getNode(t._path);return o.isEmpty()||(r=Kn(e.infoSyncTree_,t._path,o),setTimeout(()=>{s("ok")},0)),r},stopListening:()=>{}}),Ri(e,"connected",!1),e.serverSyncTree_=new jn({startListening:(t,n,i,s)=>(e.server_.listen(t,i,n,(n,i)=>{const r=s(n,i);wi(e.eventQueue_,t._path,r)}),[]),stopListening:(t,n)=>{e.server_.unlisten(t,n)}})}function ki(e){const t=e.infoData_.getNode(new Oe(".info/serverTimeOffset")).val()||0;return(new Date).getTime()+t}function Si(e){return(t=(t={timestamp:ki(e)})||{}).timestamp=t.timestamp||(new Date).getTime(),t;var t}function Ni(e,t,n,i,s){e.dataUpdateCount++;const r=new Oe(t);n=e.interceptServerDataCallback_?e.interceptServerDataCallback_(t,n):n;let o=[];if(s)if(i){const t=m(n,e=>Et(e));o=function(e,t,n,i){const s=$n(e,i);if(s){const i=Jn(s),r=i.path,o=i.queryId,a=Be(r,t),l=nn.fromObject(n);return Xn(e,r,new Yt(Vt(o),a,l))}return[]}(e.serverSyncTree_,r,t,s)}else{const t=Et(n);o=function(e,t,n,i){const s=$n(e,i);if(null!=s){const i=Jn(s),r=i.path,o=i.queryId,a=Be(r,t);return Xn(e,r,new Bt(Vt(o),a,n))}return[]}(e.serverSyncTree_,r,t,s)}else if(i){const t=m(n,e=>Et(e));o=function(e,t,n){const i=nn.fromObject(n);return Yn(e,new Yt({fromUser:!1,fromServer:!0,queryId:null,tagged:!1},t,i))}(e.serverSyncTree_,r,t)}else{const t=Et(n);o=Kn(e.serverSyncTree_,r,t)}let a=r;o.length>0&&(a=Fi(e,r)),wi(e.eventQueue_,a,o)}function Ei(e,t){Ri(e,"connected",t),!1===t&&function(e){xi(e,"onDisconnectEvents");const t=Si(e),n=At();Wt(e.onDisconnect_,Ae(),(i,s)=>{const r=function(e,t,n,i){return ri(t,new ei(n,e),i)}(i,s,e.serverSyncTree_,t);qt(n,i,r)});let i=[];Wt(n,Ae(),(t,n)=>{i=i.concat(Kn(e.serverSyncTree_,t,n));const s=function(e,t){const n=_i(Li(e,t)),i=ai(e.transactionQueueTree_,t);return function(e,t){let n=e.parent;for(;null!==n;){if(t(n))return!0;n=n.parent}}(i,t=>{Wi(e,t)}),Wi(e,i),di(i,t=>{Wi(e,t)}),n}(e,t);Fi(e,s)}),e.onDisconnect_=At(),wi(e.eventQueue_,Ae(),i)}(e)}function Ri(e,t,n){const i=new Oe("/.info/"+t),s=Et(n);e.infoData_.updateSnapshot(i,s);const r=Kn(e.infoSyncTree_,i,s);wi(e.eventQueue_,i,r)}function Pi(e){return e.nextWriteId_++}function xi(e,...t){let n="";e.persistentConnection_&&(n=e.persistentConnection_.id+":"),Y(n,...t)}function Di(e,t,n){return Bn(e.serverSyncTree_,t,n)||St.EMPTY_NODE}function Mi(t,n=t.transactionQueueTree_){if(n||qi(t,n),li(n)){const i=Oi(t,n);e(i.length>0,"Sending zero length transaction queue"),i.every(e=>0===e.status)&&function(t,n,i){const s=i.map(e=>e.currentWriteId),r=Di(t,n,s);let o=r;const a=r.hash();for(let c=0;c<i.length;c++){const t=i[c];e(0===t.status,"tryToSendTransactionQueue_: items in queue should all be run."),t.status=1,t.retryCount++;const s=Be(n,t.path);o=o.updateChild(s,t.currentOutputSnapshotRaw)}const l=o.val(!0),h=n;t.server_.put(h.toString(),l,e=>{xi(t,"transaction put response",{path:h.toString(),status:e});let s=[];if("ok"===e){const e=[];for(let n=0;n<i.length;n++)i[n].status=2,s=s.concat(Vn(t.serverSyncTree_,i[n].currentWriteId)),i[n].onComplete&&e.push(()=>i[n].onComplete(null,!0,i[n].currentOutputSnapshotResolved)),i[n].unwatcher();qi(t,ai(t.transactionQueueTree_,n)),Mi(t,t.transactionQueueTree_),wi(t.eventQueue_,n,s);for(let t=0;t<e.length;t++)ce(e[t])}else{if("datastale"===e)for(let e=0;e<i.length;e++)3===i[e].status?i[e].status=4:i[e].status=0;else{J("transaction at "+h.toString()+" failed: "+e);for(let t=0;t<i.length;t++)i[t].status=4,i[t].abortReason=e}Fi(t,n)}},a)}(t,_i(n),i)}else ci(n)&&ui(n,e=>{Mi(t,e)})}function Fi(t,n){const i=Li(t,n),s=_i(i);return function(t,n,i){if(0===n.length)return;const s=[];let r=[];const o=n.filter(e=>0===e.status).map(e=>e.currentWriteId);for(let a=0;a<n.length;a++){const l=n[a],h=Be(i,l.path);let c,d=!1;if(e(null!==h,"rerunTransactionsUnderNode_: relativePath should not be null."),4===l.status)d=!0,c=l.abortReason,r=r.concat(Vn(t.serverSyncTree_,l.currentWriteId,!0));else if(0===l.status)if(l.retryCount>=25)d=!0,c="maxretry",r=r.concat(Vn(t.serverSyncTree_,l.currentWriteId,!0));else{const e=Di(t,l.path,o);l.currentInputSnapshot=e;const i=n[a].update(e.val());if(void 0!==i){vi("transaction failed: Data returned ",i,l.path);let n=Et(i);"object"==typeof i&&null!=i&&u(i,".priority")||(n=n.updatePriority(e.getPriority()));const s=l.currentWriteId,a=Si(t),h=si(n,e,a);l.currentOutputSnapshotRaw=n,l.currentOutputSnapshotResolved=h,l.currentWriteId=Pi(t),o.splice(o.indexOf(s),1),r=r.concat(zn(t.serverSyncTree_,l.path,h,l.currentWriteId,l.applyLocally)),r=r.concat(Vn(t.serverSyncTree_,s,!0))}else d=!0,c="nodata",r=r.concat(Vn(t.serverSyncTree_,l.currentWriteId,!0))}wi(t.eventQueue_,i,r),r=[],d&&(n[a].status=2,function(e){setTimeout(e,Math.floor(0))}(n[a].unwatcher),n[a].onComplete&&("nodata"===c?s.push(()=>n[a].onComplete(null,!1,n[a].currentInputSnapshot)):s.push(()=>n[a].onComplete(new Error(c),!1,null))))}qi(t,t.transactionQueueTree_);for(let e=0;e<s.length;e++)ce(s[e]);Mi(t,t.transactionQueueTree_)}(t,Oi(t,i),s),s}function Li(e,t){let n,i=e.transactionQueueTree_;for(n=qe(t);null!==n&&void 0===li(i);)i=ai(i,n),n=qe(t=Ue(t));return i}function Oi(e,t){const n=[];return Ai(e,t,n),n.sort((e,t)=>e.order-t.order),n}function Ai(e,t,n){const i=li(t);if(i)for(let s=0;s<i.length;s++)n.push(i[s]);ui(t,t=>{Ai(e,t,n)})}function qi(e,t){const n=li(t);if(n){let e=0;for(let t=0;t<n.length;t++)2!==n[t].status&&(n[e]=n[t],e++);n.length=e,hi(t,n.length>0?n:void 0)}ui(t,t=>{qi(e,t)})}function Wi(t,n){const i=li(n);if(i){const s=[];let r=[],o=-1;for(let n=0;n<i.length;n++)3===i[n].status||(1===i[n].status?(e(o===n-1,"All SENT items should be at beginning of queue."),o=n,i[n].status=3,i[n].abortReason="set"):(e(0===i[n].status,"Unexpected transaction status in abort"),i[n].unwatcher(),r=r.concat(Vn(t.serverSyncTree_,i[n].currentWriteId,!0)),i[n].onComplete&&s.push(i[n].onComplete.bind(null,new Error("set"),!1,null))));-1===o?hi(n,void 0):i.length=o+1,wi(t.eventQueue_,_i(n),r);for(let e=0;e<s.length;e++)ce(s[e])}}
/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ui=function(e,t){const n=Hi(e),i=n.namespace;"firebase.com"===n.domain&&$(n.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),i&&"undefined"!==i||"localhost"===n.domain||$("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),n.secure||"undefined"!=typeof window&&window.location&&window.location.protocol&&-1!==window.location.protocol.indexOf("https:")&&J("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().");const s="ws"===n.scheme||"wss"===n.scheme;return{repoInfo:new ve(n.host,n.secure,i,s,t,"",i!==n.subdomain),path:new Oe(n.pathString)}},Hi=function(e){let t="",n="",i="",s="",r="",o=!0,a="https",l=443;if("string"==typeof e){let h=e.indexOf("//");h>=0&&(a=e.substring(0,h-1),e=e.substring(h+2));let c=e.indexOf("/");-1===c&&(c=e.length);let u=e.indexOf("?");-1===u&&(u=e.length),t=e.substring(0,Math.min(c,u)),c<u&&(s=function(e){let t="";const n=e.split("/");for(let s=0;s<n.length;s++)if(n[s].length>0){let e=n[s];try{e=decodeURIComponent(e.replace(/\+/g," "))}catch(i){}t+="/"+e}return t}(e.substring(c,u)));const d=function(e){const t={};"?"===e.charAt(0)&&(e=e.substring(1));for(const n of e.split("&")){if(0===n.length)continue;const i=n.split("=");2===i.length?t[decodeURIComponent(i[0])]=decodeURIComponent(i[1]):J(`Invalid query segment '${n}' in query '${e}'`)}return t}(e.substring(Math.min(e.length,u)));h=t.indexOf(":"),h>=0?(o="https"===a||"wss"===a,l=parseInt(t.substring(h+1),10)):h=t.length;const _=t.slice(0,h);if("localhost"===_.toLowerCase())n="localhost";else if(_.split(".").length<=2)n=_;else{const e=t.indexOf(".");i=t.substring(0,e).toLowerCase(),n=t.substring(e+1),r=i}"ns"in d&&(r=d.ns)}return{host:t,port:l,domain:n,subdomain:i,secure:o,scheme:a,pathString:s,namespace:r}};
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
class ji{constructor(e,t,n,i){this._repo=e,this._path=t,this._queryParams=n,this._orderByCalled=i}get key(){return Ke(this._path)?null:He(this._path)}get ref(){return new zi(this._repo,this._path)}get _queryIdentifier(){const e=Ft(this._queryParams),t=se(e);return"{}"===t?"default":t}get _queryObject(){return Ft(this._queryParams)}isEqual(e){if(!((e=s(e))instanceof ji))return!1;const t=this._repo===e._repo,n=Ye(this._path,e._path),i=this._queryIdentifier===e._queryIdentifier;return t&&n&&i}toJSON(){return this.toString()}toString(){return this._repo.toString()+function(e){let t="";for(let n=e.pieceNum_;n<e.pieces_.length;n++)""!==e.pieces_[n]&&(t+="/"+encodeURIComponent(String(e.pieces_[n])));return t||"/"}(this._path)}}class zi extends ji{constructor(e,t){super(e,t,new Dt,!1)}get parent(){const e=ze(this._path);return null===e?null:new zi(this._repo,e)}get root(){let e=this;for(;null!==e.parent;)e=e.parent;return e}}var Vi;Vi=zi,e(!qn,"__referenceConstructor has already been defined"),qn=Vi,function(t){e(!Wn,"__referenceConstructor has already been defined"),Wn=t}(zi);
/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const Ki={};function Bi(e,t,n,i,s){let r=i||e.options.databaseURL;void 0===r&&(e.options.projectId||$("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),Y("Using default host for project ",e.options.projectId),r=`${e.options.projectId}-default-rtdb.firebaseio.com`);let o,a,l=Ui(r,s),h=l.repoInfo;"undefined"!=typeof process&&process.env&&(a=process.env.FIREBASE_DATABASE_EMULATOR_HOST),a?(o=!0,r=`http://${a}?ns=${h.namespace}`,l=Ui(r,s),h=l.repoInfo):o=!l.repoInfo.secure;const c=s&&o?new pe(pe.OWNER):new _e(e.name,e.options,t);!function(e,t){const n=t.path.toString();if("string"!=typeof t.repoInfo.host||0===t.repoInfo.host.length||!yi(t.repoInfo.namespace)&&"localhost"!==t.repoInfo.host.split(":")[0]||0!==n.length&&!function(e){return e&&(e=e.replace(/^\/*\.info(\/|$)/,"/")),function(e){return"string"==typeof e&&0!==e.length&&!mi.test(e)}(e)}(n))throw new Error(v("Invalid Firebase Database URL","url")+'must be a valid firebase URL and the path can\'t contain ".", "#", "$", "[", or "]".')}(0,l),Ke(l.path)||$("Database URL must point to the root of a Firebase Database (not including a child path).");const u=function(e,t,n,i){let s=Ki[t.name];s||(s={},Ki[t.name]=s);let r=s[e.toURLString()];return r&&$("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),r=new Ii(e,false,n,i),s[e.toURLString()]=r,r}(h,e,c,new de(e.name,n));return new Yi(u,e)}class Yi{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(bi(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new zi(this._repo,Ae())),this._rootInternal}_delete(){return null!==this._rootInternal&&(function(e,t){const n=Ki[t];n&&n[e.key]===e||$(`Database ${t}(${e.repoInfo_}) has already been deleted.`),function(e){e.persistentConnection_&&e.persistentConnection_.interrupt("repo_interrupt")}(e),delete n[e.key]}(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){null===this._rootInternal&&$("Cannot call "+e+" on a deleted database.")}}function Gi(e=i(),o){const a=t(e,"database").getImmediate({identifier:o});if(!a._instanceStarted){const e=n("database");e&&function(e,t,n,i={}){(e=s(e))._checkNotDeleted("useEmulator"),e._instanceStarted&&$("Cannot call useEmulator() after instance has already been initialized.");const o=e._repoInternal;let a;if(o.repoInfo_.nodeAdmin)i.mockUserToken&&$('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),a=new pe(pe.OWNER);else if(i.mockUserToken){const t="string"==typeof i.mockUserToken?i.mockUserToken:r(i.mockUserToken,e.app.options.projectId);a=new pe(t)}!function(e,t,n,i){e.repoInfo_=new ve(`${t}:${n}`,!1,e.repoInfo_.namespace,e.repoInfo_.webSocketOnly,e.repoInfo_.nodeAdmin,e.repoInfo_.persistenceKey,e.repoInfo_.includeNamespaceInQueryParams,!0),i&&(e.authTokenProvider_=i)}(o,t,n,a)}
/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */(a,...e)}return a}et.prototype.simpleListen=function(e,t){this.sendRequest("q",{p:e},t)},et.prototype.echo=function(e,t){this.sendRequest("echo",{d:e},t)},L=x,o(new a("database",(e,{instanceIdentifier:t})=>Bi(e.getProvider("app").getImmediate(),e.getProvider("auth-internal"),e.getProvider("app-check-internal"),t),"PUBLIC").setMultipleInstances(!0)),l(M,F,undefined),l(M,F,"esm2017");export{Gi as g};
