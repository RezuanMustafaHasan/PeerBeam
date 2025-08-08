(async () => {
  try {
    const modUser = await import('./models/User.js');
    const modPresence = await import('./presence.js');
    const modConfig = await import('./config.js');
    const modSession = await import('./models/Session.js');

    if (!modUser.default) throw new Error('User model not exported');
    if (typeof modPresence.listOnline !== 'function') throw new Error('presence helpers missing');
    if (!modConfig.config.JWT_SECRET) throw new Error('config not loaded');
    if (!modSession.Session) throw new Error('Session model not exported');
    if (!modSession.Session.schema.path('files')) throw new Error('Session.files path missing');

    console.log('[selftest] OK: modules load without duplicate identifiers');
    process.exit(0);
  } catch (e) {
    console.error('[selftest] FAIL:', e.message);
    process.exit(1);
  }
})();