/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */const s={lat:21.4225,lng:39.8262};function a(t){return t*Math.PI/180}function M(t){return t*180/Math.PI}function l(t,r){const o=a(t),n=a(s.lat),c=a(s.lng-r),e=Math.sin(c)*Math.cos(n),i=Math.cos(o)*Math.sin(n)-Math.sin(o)*Math.cos(n)*Math.cos(c);return(M(Math.atan2(e,i))+360)%360}const h=["شمال","شمال شرق","شرق","جنوب شرق","جنوب","جنوب غرب","غرب","شمال غرب"];function g(t){return h[Math.round(t%360/45)%8]}export{g as b,l as c};
