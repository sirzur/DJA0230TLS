# Getting root

This isn't a short document, so buckle up, and it comes with the usual caveats, borrowed from the ISC Licence.

> THE DOCUMENTATION IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS DOCUMENTATION INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS DOCUMENTATION.

In short, do so at your own risk.  This is the procedure done to my own modem/router.  The process itself *is* safe, it's just a bit fiddly.

## Before you begin

This is a road currently lightly walked.  It's pretty rough, and not well documented because it's open source software thrown together into a guide and walked down by people who, for the most part, knew what they were doing (and just automatically debugged their way out of trouble without reporting it back to me).  So there are still sharp edges being reported back.  I'm trying to narrow these down while tooling something that makes this less unpleasant.

**The type/version of GenieACS you use is irrelevant here.  The GUI is a convenience thing, you can push files without it if you are comfortable with cURL.  Look at the Wiki pages on GenieACS's page for more information.**  (If you use another CWMP methd (i.e. ACS) just make sure you can send files and set params.)

## So you want to get root access?

Yes, we're talking about shell access.  Yes, this isn't specific to the DJA0230TLS, and probably works on a host of other routers made by Technicolor.  It probably works on most OpenWRT based routers, and probably even works on homebrew ones.  It relies on a few things:

  1. The common sense approach that you don't need or want to lock down CWMP (because you don't -- only your ISP should be feeding your DHCP to override your CWMP configuration endpoint);
  2. CWMP being enabled.

Since you probably have both those things, read on!

## Setup

**Before we begin**: There is a note on the timing mechanism that you can use to bypass the issue.  In that you can actually use curl on the virtual machine to bypass the need to fiddle the WAN reconnects to enable a "kick" to reconnect it.  The issue is that the command is this:

```bash
curl -i 'http://localhost:7557/devices/<DEVICENAME>/tasks?timeout=30000' -X POST   --data '{"name":"setParameterValues", "parameterValues":[["Device.ManagementServer.X_000E50_ConnectionRequestAllowedIPs", "192.168.0.0/24,192.168.1.0/24,192.168.2.0/24,192.168.3.0/24,192.168.4.0/24,192.168.30.0/24,10.0.0.0/24,10.1.1.0/24"]]]}'
```

The `<DEVICENAME>` section is URL encoded in the UI, and to get the appropriate form you have to URLEncode *again*.  (You can use [a site like this one](https://www.urlencoder.io/) to just copy and paste the name in.)  It means you'll end up with `%20` turning into `%2520`, which is *super crispy*.  If you're comfortable copying the ID name from the device page, and putting it into that string, executing that and then doing WAN trick, then the rest of this becomes more reliable (as CWMP kick functions as expected).  If you're not, the method below works, it just may take a few attempts to get right.  (And more's the infuriating part of CWMP without a functioning kick.)

### What you need

  1. Some kind of CWMP ACS (try [GenieACS](https://github.com/genieacs/genieacs));
  2. Some kind of DHCP server that can use vendor extensions (`isc-dhcp-server` is perfect if you're on Linux);
  3. A configuration file (got you covered);
  4. [A copy of the config.js script](./browser-scripts/config.js) to download the configuration file easily (save it to your desktop);
  5. A way to move files to the Virtual Machine or remote host running Linux (if you're uncomfortable with command line things, try [WinSCP](https://winscp.net/eng/index.php), it's free, and awesome).
  
This is your configuration file.  I called is `system.config`.  It is `the payload`.  Save this file to disk.  Call it whatever you like, we'll use it later.

```
set system.config.export_plaintext='1'
set system.config.export_unsigned='1'
set system.config.import_plaintext='1'
set system.config.import_unsigned='1'
```

From this point on I'm assuming you will be on `192.168.30.1` **at the end of this procedure**.  It's an IP (well, subnet) far enough away from most domestic LANs to be safe.  If you don't know what this means, or you're stuck, read the next section.

### Stuck?

You have two options for GenieACS.  The new and shiny, or the old.  I'm utterly useless with Ruby, so I used the newer one (which is pure node and npm).  People have pulled this off with both.

#### The Older Version

If you want to use the older, you can.  For the older version, you just follow [The Quick Start Guide](https://github.com/genieacs/genieacs#quick-start).  (You'll also need to compile the [old GUI](https://github.com/genieacs/genieacs-gui); if you get stuck on it, [there are some older guides, like this one](https://github.com/genieacs/genieacs/wiki/Installation-Guide-Ubuntu-16.04), but they are somewhat dated.)

#### The New and Shiny Version

If you want to use the new and shiny GenieACS (you'll only be using it briefly, unless you fall in love with CWMP), you'll need the latest version of Ubuntu, or Arch Linux.  If you don't know what you're doing, use Ubuntu.  If you don't have a spare system, or have no idea what you're doing, or really do know what you're doing and have the same terrified look whenever someone says "VMWare" that I do, then use [VirtualBox](https://www.virtualbox.org/) for run your host.

Ubuntu is pretty simple to setup.  The one catch is you'll want a `Bridged Adapter`.  That's in the Virtual Box GUI settings, and that's so your VM can talk to your router in a moment.  **Use the Desktop version of Ubuntu if you are going down this Road.  DO NOT USE LTS.**

At the end of this you will want to setup a static IP address.  I'll return to this in the section **Getting Unstuck** (towards the end).

##### Caveats

**This only applies to the New and Shiny GenieACS.  It should make no difference to anything else.**

  1. Do not use LTS:  You do not want to use LTS.  You won't be using it long term, so LTS isn't needed, and, due to a second issue, you'll want to go unstable anyway.  Going from LTS to unstable is possible, it's just annoying.
  2. Due to a `coreutils` issue with Ubuntu stable you're going to have go into the wild and fun area of *unstable*.  [This is touched on here](https://help.ubuntu.com/lts/serverguide/installing-upgrading.html), but the basic gist of it is this:  Install Ubuntu, and then run this:

```
sudo do-release-upgrade -d
sudo apt dist-upgrade
```

You absolutely want to be doing is in a Virtual Machine for this reason.

This will pull the latest updates to Ubuntu, and make the rest of this smooth sailing.

### ACS

If you're using Genie, download it and build it.

#### For the older version

Use the quick start linked above (skip to DHCP below).

#### For the new and shiny

This is longer.

I'm assuming you're using Ubuntu still, so:

```bash
# Essentials
sudo apt-get install redis-server build-essential screen
```

Get [Node from NodeSource](https://github.com/nodesource/distributions#debinstall) (code below should be safe):

```bash
# Node
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Get [MongoDB](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/).  Sorry, this could change and bite you, so you want to check that out yourself.

```bash
# Genie
cd ~
git clone https://github.com/genieacs/genieacs.git
cd genieacs
npm install
```

Finally edit the configuration file.  I honestly can't remember if genie ships with one, or if there's a sample, so we'll just copy the config to be safe:

```bash
cp config/config-sample.json config/config.json
```

You'll want to edit the file server here:

```bash
nano -w config/config.json
```

You want to change this:

```json
"FS_HOSTNAME" : "acs.example.com",
```

to this (or whatever your IP is):

```json
"FS_HOSTNAME" : "192.168.30.1",
```

`CTRL` and `X` to exit (press `Y` when prompted to save).

### DHCP

Install it and immediately stop it.

```bash
sudo apt-get install isc-dhcp-server
sudo /etc/init.d/isc-dhcp-server stop
```

Edit the configuration.  I'm assuming you're doing a direct connection to the router's WAN port (your PC's LAN port to the router's WAN).

This clear's the configuration and opens the editor.

```bash
sudo echo > /etc/dhcp/dhcpd.conf
sudo nano -w /etc/dhcp/dhcpd.conf
```

In the editor you want to input this:

```conf
option space ACS;
option ACS.acs_URL code 1 = text;
option ACS.acs_PROVCODE code 2 = text;

default-lease-time 600;
max-lease-time 7200;
option broadcast-address 192.168.3.255;
option routers 192.168.3.254;
option domain-name-servers 192.168.3.1;
option subnet-mask 255.255.255.0;

subnet 192.168.30.0 netmask 255.255.255.0 {
  range 192.168.30.2 192.168.30.10;
  vendor-option-space ACS;
  option ACS.acs_URL "http://192.168.30.1:7547";
  option ACS.acs_PROVCODE "FixedIt";
}
```

**Note**: If you intend to run this on a LAN with other hosts, it's a bit more complicated, and I wouldn't so much recommend it, but you can if you *really* must.  For that you can just add the ACS codes to it and share the same subnet with your other DHCP server (or even temporarily disable that server and operate in that range).

`CTRL` and `X` to exit (press `Y` when prompted to save).

Test it:

```bash
sudo /etc/init.d/isc-dhcp-server start
```

If all went well it started.  We'll stop it for now though.

```bash
sudo /etc/init.d/isc-dhcp-server stop
```

### Getting Unstuck

On Ubuntu?  All good?  Excellent.  Now, [you want to set a static IP address](https://linuxconfig.org/how-to-configure-static-ip-address-on-ubuntu-18-10-cosmic-cuttlefish-linux#h6-1-ubuntu-desktop).  The IP address you want is `192.168.30.1`.  The netmask is `255.255.255.0`.  Your gateway can be blank (If it won't let it be blank, put in `192.168.30.254`.)

At this point you'll lose your network connection (unable to download things and everything else).  If you need to fix things, your desktop can still talk to the outside world to get guides on how to fix it (notably when you switch to the WAN port and disconnect your router you'll obviously have to plug it back in to your modem, but I hope that goes without saying).

### Spinning up

Start everything up and get ready to roll.  (Yes, the wild insanity of me mixing init.d with service isn't lost on me either, but I wasn't going to write this up using OpenBSD and obscure hand-rolled scripts was I?)


```bash
sudo /etc/init.d/isc-dhcp-server start
sudo service mongod start
```

For the genieacs install, if you used the old version, starting up is similar, but the ui is split.

```bash
cd ~/genieacs
screen -S cwmp -dm ./bin/genieacs-cwmp
screen -S fs -dm ./bin/genieacs-fs
screen -S nbi -dm ./bin/genieacs-nbi
screen -S ui -dm ./bin/genieacs-ui
```

At this point point your browser (in the VM) to `http://localhost:3000`.  If it's a white screen, something went wrong.  This happens, so we need to end a few things.

Username and password are `admin` and `admin` (defaults).  Remember those even if didn't work.  If it did, great, skip the White Screen section below.

#### Genie's White Screen

Time to kill our session I'm afraid.
```bash
# Resume CWMP
screen -dr cwmp
CTRL + C
# Wait a moment

# Resume fs
screen -dr fs
CTRL + C
# Wait a moment

# Resume nbi
screen -dr nbi
CTRL + C
# Wait a moment

# Resume ui
screen -dr ui
CTRL + C
# Wait a moment
```

Time to fix the broken/incomplete build.

```bash
# Back to genie
cd genieacs

# Future proof this
npm run-script configure

# Edit your configuration here to make sure it didn't screw up.
# Things should be fine.  Make sure the JWT SECRET is populated
# and the IP address is set properly.  Everything else should
# be okay as defaults.
nano -w config/config.json

# Run the build
npm run-script build
```

If you got an error here about build not being supported:

```bash
# If you get an error here, we'll be paranoid:
npm install esm libxmljs
npm run-script build
```

Finally, copy into place:

```bash
# Fix the failed copy for whatever's going on here.
cp -R dist/public/* public/
```

Now we try again:

```bash
screen -S cwmp -dm ./bin/genieacs-cwmp
screen -S fs -dm ./bin/genieacs-fs
screen -S nbi -dm ./bin/genieacs-nbi
screen -S ui -dm ./bin/genieacs-ui
```

Once more, test the UI: `http://localhost:3000`

With any luck you can now sign in.

## The process itself

You will lose internet at this point.  Make sure know your settings.  Make sure you have a backup plan.  Make sure you read the disclaimer at the top of this.  Yes, seriously, things can/do go wrong.

I assume at this point you have your router disconnected with power disconnected and an ethernet cable ("LAN cable") nearby.  If you're on ADSL/VDSL or anything else, make sure you've disabled mobile and disconnected the PSTN leads.  Those can/will mess this up.

  1. Plug the router's WAN port (the red port on this router) into an ethernet cable;
  2. Plug the other end of that ethernet cable into your computer's WAN port;
  3. Plug your router's power cable in, it will begin to boot.  During the boot process the DHCP server will detect it and tell it that Genie ACS (or whatever ACS you're using) is its new master;
  4. Open a browser in the virtual machine (or your desktop if you've got a common network subnet available to it) to browse the Genie UI (or whatever ACS).  For Genie it's on port 3000.  In the virtual machine it'd be `http://localhost:3000`.  Default username and password are admin/admin.

While it loads in visit the GenieACS UI (or whatever you're using) to prepare the file we'll be using.  I'm assuming GenieACS, so here are the steps.

  1. Go to the "Admin" tab.
  2. Go to "Files" subtab;
  3. Click "New";
  4. Select Type -> `3 Vendor Configuration File`;
  5. File -> Browse (select our config file from before (up the top of this document));
  6. `Save`.

At this time *hopefully* the router has authenticated for the first time with Genie.

  1. Click "Devices";
  2. You should only have one device, which if you're reading this is probably "Technicolor DJA0230TLS" (under "Product class");
  3. Click its Serial Number.

If it's not there, you're out of luck or something went awry.  Check your router's logs using its wireless (use your phone/tablet/whatever, or worst case move the ethernet cable over to the LAN port, get an IP from your desktop, and poke around).  Hopefully there's a clue.  Anyway, for those who did get a device...

**If you are restoring you want to use the export you did last time (from the end of this document).  It will be plain text with funky characters at the end.  If you've edited it, it's useless to you now.**

  1. Push file;
  2. Drop down and select your file;
  3. If it didn't auto-populate the type is `3 Vendor Configuration File`.
  4. **DO NOT PRESS PUSH YET**;
  5. Disconnect the WAN cable from your router;
  6. Plug it back in;
  7. Press push moments after you do so (the router will auto-check back in moments after you do it).

If all goes well the router will get the file.  GenieACS (due to fun bugs) will report an initial failure, don't panic.  If it does and it works you'll see the routers lights turn off and it will go into a reboot pattern.

If it worked, you now have plain text configuration files.

## Using the plain text configuration files

  1. Disconnect from your router's WAN and plug into the LAN;
  2. Once it boots, log into the router;
  3. [Use the config.js script](./browser-scripts/config.js) by opening the browser inspector in Firefox or Chrome (CTRL+SHIFT+I by default) and pasting it into the console.  Then enter `exportConfig()`.
  4. Download `config.bin`.

If all of that went well you got a configuration file that's human readable.

### Root access awaits!

`CTRL+F` (or equivalent) for `[dropbear]`.

Edit it to:

```ini
[dropbear]
dropbear.lan=dropbear
dropbear.lan.IdleTimeout='600'
dropbear.lan.RootPasswordAuth='on'
dropbear.lan.enable='1'
dropbear.lan.Interface='lan'
dropbear.lan.Port='22'
dropbear.lan.PasswordAuth='on'
dropbear.wan=dropbear
dropbear.wan.IdleTimeout='600'
dropbear.wan.RootPasswordAuth='off'
dropbear.wan.enable='0'
dropbear.wan.Interface='wan'
dropbear.wan.Port='22'
dropbear.wan.PasswordAuth='off'
```

Save the file and fire it across to your virtual machine (or skip this if you can use the web interface from your desktop without needing to fiddle).

You can fiddle with this file more if you want, up to you.  The other changes you could make are to CWMP if you really like it (but you don't really need it and you can disable it later).

### Back to the CWMP/ACS

  1. In the virtual machine upload the config file you just made into the files list (as necessary);
  2. Disconnect from your router's LAN and plug into the WAN once more;
  3. Run through the push steps again, except this time push *this* configuration file.

Once it reboots, dropbear is enabled on LAN (only), and you've still got plaintext configuration access.  Swap your cable from WAN to LAN to confirm.  If all is well you can put your router back, turn off the virtual machine, and remove it from your system now if you want.  Enjoy :)

### Turn off CWMP

You probably want to disable CWMP in the event your ISP endpoint tries to take it back (assuming you're even with Telstra).  There are a few ways to do it.  The first is to push the configuration file again, which isn't ideal (why bother?).  The other is to push uci commands:

```bash
uci set cwmpd.cwmpd_config.interface='lan'
uci set cwmpd.cwmpd_config.interface6='lan6'
uci commit
```

This means that the CWMP system will now only speak to your LAN interfaces.  This means that even if something goes very wrong, CWMP cannot speak to the outside world.  The good part about that is if you ever want to mess with CWMP again, you can.  If you want to take it a step further, you can set the acs_url (the address of the virtual machine or whatever else), and other things.

Notably anything in your plain text configuration file should work just fine :)

## Paranoid?

Jump onto the shell as root and run this:

```bash
uci set system.config.export_unsigned='0'
uci commit
```

Now use the [config.js script](./browser-scripts/config.js) to export a copy of the configuration such that you can import unsigned, unencrypted data, but that it's signed.  Keep a copy of that `config.bin`.  If you really screw it up all you need to do is push that configuration file to the router and it'll put you back at the state you're in now.

**Back a copy of this file up for use later.  Do not edit its contents.**

Optionally revert your settings using:

```bash
uci set system.config.export_unsigned='1'
uci commit
```