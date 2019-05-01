# Banks

Nothing new or interesting here.  You can do some nifty stuff around this (like add pages/cards to the web ui), but that's a different story.

The modem has two banks (as we can see in the [UBI](./UBI.md)): `bank_1` and `bank_2`.  They're on the same flash from what we can tell from the software end (though it's not really too important in many ways).

```sh
# ls /proc/banktable
active          booted          inactive        notbootedoid
activeversion   bootedoid       notbooted       passiveversion
```

## Compatibility Notes 

### This modem/router

I've made notes for wider/broader support here, but **this modem/router is dual bank**.

### Other modem/routers

The presence if `active` alone tells you if the system is dual bank.  If it's missing it, it most likely isn't (assume it isn't).

We're mostly interested in `active` and `inactive` here.

## Functionality

### Getting the current bank

To get the current bank read:

  * `booted` on *single bank*;
  * `active` on *dual bank* (this *modem/router* is dual bank).

### Getting the version

For active and single bank:

  * `activeversion`

For passive (only dual bank):

  * `passiveversion`

### Getting the OIDs

 * Active/Single Bank: `bootedoid`
 * Passive (dual bank only): `notbootedoid`