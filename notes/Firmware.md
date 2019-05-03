# Firmware

Looking at the firmware process and structure.

## The target

First of all, our primary port of information is tracking back from any of the upgrade paths.  Regardless of where you go, you'll land at this file:

```bash
/sbin/sysupgrade
```

It's a long an boring shell script that does a ground work.

There are three things here are really useful for general use:

  1. Backups;
  2. Forcing (force even if it fails);
  3. Testing (don't run it, just make sure it's good).

For general use, that's great.

For the nerds amongst us, `--nosig` is great (hello bypass), `-v` to increase verbosity of the processs, and various other switches are also obviously incredibly useful (to say nothing of configuration loading).

*Welcome to the party.*

This isn't a useful file *for most things*, so you've gone too far in many senses, but it's really useful later on, so we'll come back to it later ;)

## The Lua target

Our road to the garden path:

```bash
/lib/upgrade/platform.sh
```

Follow it:

```bash
/lib/upgrade/rbi_vrss.lua
```

Hello!  Sadly, that's what processes the unpacked rbi.  But what that tells us is that there is a Linux kernel in the data file.  Still, it's pure Lua (no funky Technicolor binaries loaded), so we can poke around in it a bit to get an idea of what we're expecting.

## BIN structure

The BIN exists within the RBI, so we'll look at that first.

### Header

The 'version' region is 32-bytes according to `rbi_vrss`.  We'll treat it as a region.

Values are in hex to save space.

TODO: More output information.

```
  OFFSET  |   SIZE   | DESC
 0000000D | 00000004 | Offset to information table (u32 Little Endian)
 00000012 | 00000004 | Literal identifier ('LINU' for Linux)
```

That's enough to get us started.  Really what we're looking for is the `LINU` at 18 bytes (0x12) in.  From there we know we've nailed it.

## RBI structure

Starting slow...

### Working it out

Getting this is a bit more complicated as it's a massive piping into a bunch of binary files.  We could reverse engineer them, or we could look at the probably structuring based on what we know (and the former is a huge amount of effort, why cross certain lines when there are usually easier ways?).

  1. It's a Broadcom SoC, which means that Technicolor are likely using a modified variant of a previously known/specified format;
  2. We're on squashfs;
  3. We're on OpenWRT (which is more or less a point back to point 2).

Taking the names from the piping, we know the image is fetched, proped for messages, passed into a signature check, from there (assuming all goes well), parsed, and then 'unsealed', and then passed into our friendly Lua file (which is where we landed before).  *Cool*.

Working backwards, unseal is the unpacker.  But it obviously needs some information (in this case header information), which is compared to a constant value.  In this case that constant value is [rip data](/notes/RIP.md) (this is pretty critical information, so it deserves its own file).  Prior to that it's really just getting the file (not a huge deal).

Okay, so backwards and forwards, that's not too hard, right?  Diving into the scripts it's anything but.  It looks like there's a boatload of room for crypto (lovely), which means *keys or bust*.  Of course to get this information we have root access, which in turn means we have access to get them.  *Fun*.

We'll start at the beginning, after the download.  Platform RIP data/comparison aside for the moment (as that's device/model dependent), and focus purely on how we get the header, and what it is.

### From `/usr/bin/bli_parser`

  1. Running it with no arguments results in it waiting for stdin.  *Great*;
  2. Running it trying various flags for help results in errors about failing to open it, or bad options.  So that's a thing;
  3. `-h` and `-r` are valid options: success, but also not really.

Running it against the current firmware gave me information about my device, which in turn told me what the names of the header values were.  Score.

As above, this is in hex.  This is just the header region, as parsed out.  for our purposes we don't really care what the modem/router/device says, this is just the file format.

Enjoy that these are in Rust.  (For those unfamiliar, `[u8;4]` means `unsigned char[4]`, `[u8;2]` means `unsigned char[2]`).

It got a bit hazy from the `varid`, but working back from the data offset (clear byteswap here), and data size, it was pretty easy to re-align the version field (a 10 byte gap is huge, but version is X.X.X.X, so the first is 4 bytes and then 2 byte per subfield).  This is reflected as distinct fields below.  This should work, but for the purposes of packing I'll guess we'll find out later if a packing key is ever obtained somehow.  Presumably there are byte swaps required (order maintained), but who knows, again, future packing problem.

```
# HEADER PROPER

  OFFSET  |   SIZE   |   TYPE     | DESC
 00000000 | 00000004 | [u8;4]     | magic_value (Magic)
 00000004 | 00000002 | [u8;2]     | fim (Firmware? Major?)
 00000006 | 00000002 | [u8;2]     | fia (Firmware? ?????)
 00000008 | 0000000C | [u8;12]    | prodid (Product ID)
 00000014 | 0000000C | [u8;12]    | varid (Variant ID)
 00000020 | 00000004 | u32        | version.0
 00000024 | 00000002 | u16        | version.1
 00000026 | 00000002 | u16        | version.2
 00000028 | 00000002 | u16        | version.3
 0000002A | 00000004 | u32        | data_offset (Data Offset)
 0000002C | 00000004 | u32        | data_size (Data Size)
```

Both data offset and data size (may need a byte swap depending on your read method).  Using a proper reader helps here a lot.  Randomly throwing things into a system without paying attention is a good way to end up past EOF ;)

The arrays/slices all print out as strings from this, being null terminated.

After that we get the dump starting at `timestamp`, which if we step forward is based on the `data_offset` (i.e. 'read until').  This is where things kind of went weird for me, as the value seems to be based on keyed values, so this is clearly some kind of information table (dump/dumpsite).

What's mind boggling is that it consistently starts this data set at 0x134 into the file.  Either way, I assume there's some important data between the end of the header proper and this section, but whatever it is it isn't relevant to me yet.  260 bytes (0x104) is a really strange number, in that it's remarkably close to a lot of things.  Either way, here's the known tag set from my data:

  * `2`: `timestamp` (Time stamp, probably of compilation/build);
  * `8`: `boardname` (Board name, e.g. `VBNT-V`);
  * `9`: `prodname` (Product name, e.g. `Technicolor DJN2130`);
  * `10`: `varname` (Variant name, e.g. `DJN2130`);
  * `32`: `tagparserversion` (a number for me, `200`);
  * `129`: `flashaddress` (Flash address, `0x5A00000`);

### `/usr/bin/bli_unseal` (and friends)

This one's a shell script and picks up from the `data_offset` value.  It reads two things straight off:

  1. The first byte for the `SEALTYPE` (`0xB?`);
  2. The literal `MUTE` (four bytes) - this is the 'MAGIC'.

If the `MUTE` literal is missing, it fails.  If the `SEALTYPE` is unknown, it bombs.  That's fine, it is what it is.

Unsealing appears to *mostly* be a case of running it through with the given seal type, potentially using a value from a fixed from a [rip location](/notes/RIP.md), or form `/proc/keys`.  That's kind of neat.

Seal types are:
  
  * `0xB0`: Open (clear text);
  * `0xB1`: AES128;
  * `0xB2`: RSA;
  * `0xB3`: SHA1;
  * `0xB4`: ZIP;
  * `0xB7`: AES256;
  * `0xB8`: SHA256.

Anything else will fail on an unknown (and will not execute anything else).

As I only have `0xB7` files to test, I had a poke down that rabbit hole.  The key auto-defaults to a given key (`/proc/keys/0x121` in my case at least).  Try that on the current firmware file I got the response:

```
Decryption failed; platform key does not match build
```

Tricky.

Knocking together a quick keyfile with a known good value (to test how picky it is), I threw the hex values into `vi`, named it `keyfile`, and tried it again with `-k=keyfile`.  Behold, it ran until I killed it (I didn't want to be around all day).

How we get to that key is a matter for cross-compilation, messing with kernel data files, and involved more than a couple of kernel panics (and is a tale for another time).

## Upgrade File targets

Additional file upgrade targets.

### `conf`

Configuration files.  Nothing super special here.  They exist as part of the upgrade package and are useful to configure the device.

### `overlay`

Overlay files appear to be loaded into the banks.  Nothing super interesting here as they're just files copied into `/etc/overlay`.