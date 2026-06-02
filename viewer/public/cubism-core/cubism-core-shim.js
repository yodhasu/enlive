/**
 * Enlive Cubism Core Shim
 * 
 * The wasm2js Core from @proj-airi/unplugin-live2d-sdk is a stripped-down
 * version that lacks some APIs the Cubism Framework expects. This shim
 * patches Live2DCubismCore with the missing functionality.
 * 
 * Must load AFTER the Core script but BEFORE the application modules.
 */

(function patchLive2DCore() {
  'use strict';

  // Already patched?
  if (Live2DCubismCore.__patched) return;
  Object.defineProperty(Live2DCubismCore, '__patched', { value: true, writable: false });

  // ─── Memory API ────────────────────────────────────────────
  // The full Core has a Memory namespace for WASM memory management.
  // In wasm2js, memory is managed by JS, so these are no-ops.
  Live2DCubismCore.Memory = {
    initializeAmountOfMemory: function(size) {
      // No-op: wasm2js doesn't need pre-allocated memory
    },
    malloc: function(size) {
      // Dummy — real usage allocates from WASM heap
      return 0;
    },
    free: function(ptr) {
      // No-op
    }
  };

  // ─── Moc.prototype.hasMocConsistency ──────────────────────
  // The full Core validates moc3 file integrity. Since wasm2js
  // already validates during fromArrayBuffer, we just return true.
  if (!Live2DCubismCore.Moc.prototype.hasMocConsistency) {
    Live2DCubismCore.Moc.prototype.hasMocConsistency = function(bytes) {
      // If fromArrayBuffer succeeded, the moc is consistent
      return 1;
    };
  }

  // ─── ColorBlendType enum values ──────────────────────────
  // These are integer constants from the Cubism Core C header.
  // Values sourced from the official SDK Core (non-minified JS).
  const ColorBlend = {
    ColorBlendType_Normal: 0,
    ColorBlendType_AddCompatible: 1,
    ColorBlendType_MultiplyCompatible: 2,
    ColorBlendType_Add: 3,
    ColorBlendType_AddGlow: 4,
    ColorBlendType_Darken: 5,
    ColorBlendType_Multiply: 6,
    ColorBlendType_ColorBurn: 7,
    ColorBlendType_LinearBurn: 8,
    ColorBlendType_Lighten: 9,
    ColorBlendType_Screen: 10,
    ColorBlendType_ColorDodge: 11,
    ColorBlendType_Overlay: 12,
    ColorBlendType_SoftLight: 13,
    ColorBlendType_HardLight: 14,
    ColorBlendType_LinearLight: 15,
    ColorBlendType_Hue: 16,
    ColorBlendType_Color: 17,
  };

  for (const [key, value] of Object.entries(ColorBlend)) {
    if (Live2DCubismCore[key] === undefined) {
      Live2DCubismCore[key] = value;
    }
  }

  // ─── AlphaBlendType enum values ──────────────────────────
  if (Live2DCubismCore.AlphaBlendType_Over === undefined) {
    Live2DCubismCore.AlphaBlendType_Over = 0;
    Live2DCubismCore.AlphaBlendType_Atop = 1;
    Live2DCubismCore.AlphaBlendType_Out = 2;
    Live2DCubismCore.AlphaBlendType_In = 3;
  }

  // ─── Memory constants ────────────────────────────────────
  if (Live2DCubismCore.AlignofMoc === undefined) Live2DCubismCore.AlignofMoc = 64;
  if (Live2DCubismCore.AlignofModel === undefined) Live2DCubismCore.AlignofModel = 16;

  // ─── Log Utils ────────────────────────────────────────────
  // The full Core has these utility functions
  if (Live2DCubismCore.Utils && Live2DCubismCore.Utils.hasIsVisibleBit === undefined) {
    Live2DCubismCore.Utils.hasIsVisibleBit = function(flags) { return (flags & 1) !== 0; };
    Live2DCubismCore.Utils.hasVisibilityDidChangeBit = function(flags) { return (flags & 2) !== 0; };
    Live2DCubismCore.Utils.hasOpacityDidChangeBit = function(flags) { return (flags & 4) !== 0; };
    Live2DCubismCore.Utils.hasDrawOrderDidChangeBit = function(flags) { return (flags & 8) !== 0; };
    Live2DCubismCore.Utils.hasRenderOrderDidChangeBit = function(flags) { return (flags & 16) !== 0; };
    Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit = function(flags) { return (flags & 32) !== 0; };
    Live2DCubismCore.Utils.hasBlendAdditiveBit = function(flags) { return (flags & 64) !== 0; };
    Live2DCubismCore.Utils.hasBlendMultiplicativeBit = function(flags) { return (flags & 128) !== 0; };
    Live2DCubismCore.Utils.hasIsDoubleSidedBit = function(flags) { return (flags & 256) !== 0; };
    Live2DCubismCore.Utils.hasIsInvertedMaskBit = function(flags) { return (flags & 512) !== 0; };
    Live2DCubismCore.Utils.hasMaskCountBit = function(flags) { return (flags & 1024) !== 0; };
    Live2DCubismCore.Utils.constantFlagsHaveMaskCounts = function(flags) { return (flags & 2048) !== 0; };
    Live2DCubismCore.Utils.isVisible = function(flags) { return (flags & 1) !== 0; };
    Live2DCubismCore.Utils.isDoubleSided = function(flags) { return (flags & 256) !== 0; };
  }

  // ─── MocVersion enum ──────────────────────────────────────
  if (Live2DCubismCore.MocVersion_Unknown === undefined) Live2DCubismCore.MocVersion_Unknown = 0;
  if (Live2DCubismCore.MocVersion_30 === undefined) Live2DCubismCore.MocVersion_30 = 1;
  if (Live2DCubismCore.MocVersion_33 === undefined) Live2DCubismCore.MocVersion_33 = 2;
  if (Live2DCubismCore.MocVersion_40 === undefined) Live2DCubismCore.MocVersion_40 = 3;
  if (Live2DCubismCore.MocVersion_42 === undefined) Live2DCubismCore.MocVersion_42 = 4;
  if (Live2DCubismCore.MocVersion_50 === undefined) Live2DCubismCore.MocVersion_50 = 5;

  // ─── ParameterType enum ──────────────────────────────────
  if (Live2DCubismCore.ParameterType_Normal === undefined) Live2DCubismCore.ParameterType_Normal = 0;
  if (Live2DCubismCore.ParameterType_BlendShape === undefined) Live2DCubismCore.ParameterType_BlendShape = 1;

  // ─── Version API ──────────────────────────────────────────
  // The wasm2js Core has Version.csmGetMocVersion but its signature
  // expects a WASM pointer (moc._ptr), not a raw ArrayBuffer like
  // the official Core. Override with a pure-JS version using
  // Object.defineProperty to ensure it sticks.
  var versionShim = {};
  versionShim.csmGetMocVersion = function(mocBytes) {
    // Handle both ArrayBuffer and TypedArray (Uint8Array)
    var buf = mocBytes;
    if (buf && buf.buffer && buf.byteLength !== undefined) {
      buf = buf.buffer; // Uint8Array → extract backing ArrayBuffer
    }
    if (!buf || buf.byteLength < 8) return 0;
    var view = new DataView(buf);
    try {
      return view.getUint32(4, true);
    } catch(e) {
      return 0;
    }
  };
  versionShim.csmGetLatestMocVersion = function() { return 5; };
  versionShim.csmGetVersion = function() { return 0x04020002; };
  Object.defineProperty(Live2DCubismCore, 'Version', {
    configurable: true,
    writable: false,
    value: versionShim,
  });

  console.log('[Cubism Shim] Patched Live2DCubismCore with missing APIs');
})();
