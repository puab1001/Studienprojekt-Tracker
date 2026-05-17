// ─── BECOMING · state.js ─────────────────────────────────────────────────────
// Minimales Pub-Sub-Muster für globale Zustandsänderungen

const _stateStore = {
  values:      {},  // { event: currentValue }
  subscribers: {},  // { event: [callback, ...] }
};

function subscribe(event, callback) {
  if (!_stateStore.subscribers[event]) _stateStore.subscribers[event] = [];
  _stateStore.subscribers[event].push(callback);
  if (event in _stateStore.values) callback(_stateStore.values[event]);
  return () => {
    _stateStore.subscribers[event] =
      (_stateStore.subscribers[event] || []).filter(cb => cb !== callback);
  };
}

function publish(event, value) {
  _stateStore.values[event] = value;
  (_stateStore.subscribers[event] || []).forEach(cb => cb(value));
}

function getStateValue(event) {
  return _stateStore.values[event];
}
