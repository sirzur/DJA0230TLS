# DJA0230TLS

This repository contains (or will contain) information on the 'Telstra Smart Modem' (Generation 1), or DJA0230TLS, and things to do things with it.  Have fun.

## `Cargo.toml`?

Ignore that.  It's so Rust doesn't explode for cross-linking crates that are unique to this repository.

## Actually useful stuff:

  * [Getting root](ROOT.md);
  * [CWMP?](cwmp/README.md);
  * [Transfer Types](cwmp/TransferTypes.md);
  * [config.js](browser-scripts/config.js).

## TODO

  * Expose the various hidden subdirectories in here;
  * Share `www` safe/simple modifications;
  * Build a loader for trusted scripts (`get -> run -> rm`);
  * Build a better evaluation platform to test off-router;
  * Share scripts to unlock things automatically based on prior/current (programmatic) access;
  * Finish Rust utilities.