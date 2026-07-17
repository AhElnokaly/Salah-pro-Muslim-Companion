/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const KAABA = { lat: 21.4225, lng: 39.8262 };

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function calculateQiblaBearing(lat: number, lng: number): number {
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA.lat);
  const Δλ = toRad(KAABA.lng - lng);
  
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return bearing;
}

const COMPASS_LABELS = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'] as const;

export function bearingToCompassLabel(bearing: number): string {
  return COMPASS_LABELS[Math.round((bearing % 360) / 45) % 8];
}
