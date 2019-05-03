# Transfer Types

Per CWMP (TR-069 base, but TR-181 model), at the model at the time of writing (data model 2.11), there are two lists in play.

## Script Base

All transfer scripts have the same home on this modem:

```sh
/usr/lib/cwmpd/transfers/%s.h
```

They execute based on the scripts named as square-bracketed literals at the end of their definition (e.g. '[`script.sh`]').  If the script is prefaced by a section sign (`§`) it is missing.  This is presumably because the cwmp handler is based on older products and Technicolor have opted to use legacy code here.

Script names have been extracted by putting the router into verbose debugging mode and re-routing all logging to remote syslog.

## Base List

These are the base types prescribed by TR-181, though this modem/router supports outdated CWMP models.  The naming for types 4 and 5 has been taken from `TR-069`, as it aligns with what appears to be listed in the data.  The updated types replaces 4 with `4 Vendor Log File (Upload Only)`, and drops the 'Ringer File' entirely.  Vendor specific (per below) is retained.

 * `1 Firmware Upgrade Image` (Download Only) [`upgrade.sh`]
 * `2 Web Content` (Download Only) [`§web.sh`]
 * `3 Vendor Configuration File` (Download or Upload) [`config.sh`]
 * `4 Tone File` [`§tone.sh`]
 * `5 Ringer File` [`§ringer.sh]

Values 2, 4, and 5, are obviously useless, as they lack scripts.  Even if they did not they are of very little value.  

Firmware upgrading via CWMP is useful (it's how ISPs are likely to achieve their upgrades).

Vendor Configuration upgrades are particularly interesting here, though the upload functionality is actually disabled here (we may only download from a remote source).  They have three modes (`ispconfig` is basically a mystery to me other than needing reset my factory modem repeatedly after trying to use it), pushing a standard `config.bin` works fine (it takes it and reads the first line and then processes it), and finally the dirty payload option.

## Vendor Specific

These should be unknown, but by basic testing (and getting an ACS response about being below 10) it's easy to ascertain types.  The actual names are unknown, but the types I used to test were as follows:

 * `6 TechniGuess` [`vendorconfig.sh`]
 * `7 TechniGuess` [`vendorlog.sh`]
 * `8 TechniGuess` [`vendorconfig.sh`]
 * `9 TechniGuess` [`vendorlog.sh`]

All four attempt uploads (which triggers an error on my makeshift ACS code).

Types 6 and 8 attempt uploads of vendor configuration data.  Precisely what they do is unclear, though I would guess they are tuned against `Device.DeviceInfo.VendorConfigFile.1` and `Device.DeviceInfo.VendorConfigFile.2` (which are part of the `Device.DeviceInfo.VendorConfigFile`), based solely on the count.  Based on the information present in them, and other information, there's of not much use to you unless you already have root access (at which point you don't need them anyway).

Types 7 and 9 attempt uploads of vendor log data.  There are three `Device.DeviceInfo.VendorLogFile` objects, and they are absolutely the targets of this.  As you can use syslog to get the data, they are basically redundant.  For an ISP, they are invaluable (as you don't need/want home users streaming data).