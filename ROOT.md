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

**Before we begin**: There is a note on the timing mechanism that you can use to bypass the issue.  This is now inlined into the process.  I refer to this as the "kick fix".  It used to be optional, but due to the number of errors by people not doing it, it's not part of the flow.

### What you need

  1. Some kind of CWMP ACS (try [GenieACS](https://github.com/genieacs/genieacs));
  2. Some kind of DHCP server that can use vendor extensions (`isc-dhcp-server` is perfect if you're on Linux);
  3. A configuration file (got you covered);
  4. [A copy of the config.js script](./browser-scripts/config.js) to download the configuration file easily (save it to your desktop);
  5. A way to move files to the Virtual Machine or remote host running Linux (if you're uncomfortable with command line things, try [WinSCP](https://winscp.net/eng/index.php), it's free, and awesome);
  6. Either turn off mobile fallback (temporarily) in the web interface, or take the SIM card out of the mobile temporarily.  If it gets an IP address when you're fiddling and refuses to give it up, no CWMP for you, which means none of this works;
  7. (Optionally) copying this file into the VM using the terminal: (`wget https://raw.githubusercontent.com/awstanley/DJA0230TLS/master/ROOT.md`) or even cloning the whole repository as a matter of paranoia: (`git clone https://github.com/awstanley/DJA0230TLS/`).  This gives you all of the files I'm talking about here in relation to this repository without having to worry about downloading them again later.  (You still need WinSCP to move your own configuration file in and out.)
  
This is your configuration file.  I called is `system.config`.  It is `the payload`.  Save this file to disk.  Call it whatever you like, we'll use it later.  

A copy of this is also in this repository as [system.config](./support-files/system.config) if you'd rather download it to avoid potential line break issues.  I'd actually recommend downloading it (click this link, then right click 'Raw' -> 'Save As', preferably inside your virtual machine, but having a backup on your desktop won't hurt in the event you forget later).

```ini
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

If you're using Genie, download it and build it.  **Bear in mind when you load it for the first time it will take a while to start up.  This is normal.**

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
npm run-script configure

# Edit your configuration here to make sure it didn't screw up.
# Things should be fine.  Make sure the JWT SECRET is populated
# and the IP address is set properly.  Everything else should
# be okay as defaults.
nano -w config/config.json
```

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

and 

```json
"UI_JWT_SECRET": "",
```

to whatever you want:

```json
"UI_JWT_SECRET": "whatever you want this does not matter",
```

`CTRL` and `X` to exit (press `Y` when prompted to save).

Finish it up with some finalisation:

```bash
# Run the build
npm run-script build

# Ensure the UI configuration is populated.
# If this fails, don't stress, we'll run it again if something went wrong.
./tools/configure-ui
```

If you're missing `tools/configure-ui`, grab the tar.bz2 from this repository, extract it into the genie directory (it should create the folder tools, not be a folder inside it).  It's just a script.  Feel free to take a look around it, it's nothing special, and it's from GenieACS.

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
# If you get an error here, we'll be paranoid:
npm install esm libxmljs
npm run-script build

# Ensure the UI configuration is populated.
# If this fails, don't stress, we'll run it again if something went wrong.
./tools/configure-ui
```

Finally, copy into place:

```bash
# Fix the failed copy for whatever's going on here.
cp -R dist/public/* public/
```

If it's still failing, SFTP a copy of `genie-public.tar.bz2` to your VM and extract the loose files into `public/` (it's a copy of my `public/` folder).  It should resolve to `public/app.js` and so on (it should be end up being `public/public/app.js`, if it does move the from files inside `public/public` so they are just inside `public/`).

Now we try again:

```bash
screen -S cwmp -dm ./bin/genieacs-cwmp
screen -S fs -dm ./bin/genieacs-fs
screen -S nbi -dm ./bin/genieacs-nbi
screen -S ui -dm ./bin/genieacs-ui
```

Once more, test the UI: `http://localhost:3000`

With any luck you can now sign in.

If you still can't sign in (and at this point, trust me, I'm more annoyed with Genie than you are), try this:

```bash
npm audit fix
npm update
npm install
```

Give it a minute to complete and then try the login again.

If that's still failing, something really hinky has happened.  At this point we're going to have to go nuclear on the database.  If you're using the default database name (`genieacs`), run the following (otherwise change the database name, it's the second argument here):

```bash
mongo genieacs --eval "db.dropDatabase()"
npm install
./tools/configure-ui
```

Now try again.  At this point it should be working.

## The process itself

You will lose internet at this point.  Make sure know your settings.  Make sure you have a backup plan.  Make sure you read the disclaimer at the top of this.  Yes, seriously, things can/do go wrong.

I assume at this point you have your router disconnected with power disconnected and an ethernet cable ("LAN cable") nearby.  If you're on ADSL/VDSL or anything else, make sure you've disabled mobile and disconnected the PSTN leads.  Those can/will mess this up.

  1. Plug the router's WAN port (the red port on this router) into an ethernet cable;
  2. Plug the other end of that ethernet cable into your computer's LAN port (so it's now Router WAN <=> Computer LAN);
  3. Plug your router's power cable in, it will begin to boot.  During the boot process the DHCP server will detect it and tell it that Genie ACS (or whatever ACS you're using) is its new master;
  4. Open a browser in the virtual machine (or your desktop if you've got a common network subnet available to it) to browse the Genie UI (or whatever ACS).  For Genie it's on port 3000.  In the virtual machine it'd be `http://localhost:3000`.  Default username and password are admin/admin.

While it loads in visit the GenieACS UI (or whatever you're using) to prepare the file we'll be using.  I'm assuming GenieACS, so here are the steps.

  1. Go to the "Admin" tab.
  2. Go to "Files" subtab;
  3. Click "New";
  4. Select Type -> `3 Vendor Configuration File`;
  5. File -> Browse (select our config file from before (up the top of this document));
  6. `Save`.

> **Note**: This file should be the one containing **four lines of code**, each starting with the word `set`.  If you have a JavaScript file, it's the wrong one.

At this time *hopefully* the router has authenticated for the first time with Genie.

  1. Click "Devices";
  2. You should only have one device, which if you're reading this is probably "Technicolor DJA0230TLS" (under "Product class");
  3. Click its Serial Number.

If it's not there, you're out of luck or something went awry.  Check your router's logs using its wireless (use your phone/tablet/whatever, or worst case move the ethernet cable over to the LAN port, get an IP from your desktop, and poke around).  Hopefully there's a clue.  Anyway, for those who did get a device...

### Kick Fix

**This used to be optional.  This makes this bit easier, so it's not mandatory, but if you're struggling you absolutely need to do this.  If you're worried that this is a rough enough path already, you *absolutely* need to do this.  It makes what follows easier because doing this here to fix it makes debugging the faults below trivial.**

You should only have the one (unless you're setting up multiple, in which case it's the latest one to be online, hopefully, or you're keeping track!).  Click on your target device.

On your device screen you'll see a name like this:

```
ABCDE-FGHI%20-JKLM-NOPQR
```

Copy that name with no leading or trailing spaces.  We're going to need to URL Encode it.  If you don't know what that means, visit https://www.urlencoder.io/ and paste the name into it.

Out the other side it'll come out like this:

```
ABCDE-FGHI%2520-JKLM-NOPQR
```

That %2520 converted the already URL Encoded %20 to %2520 which is crispy double encoding.  **Super crispy.**  (The nerd in my screams.  The nerd, that is me, wants to scream.)

The command we want to use looks like this:

```bash
curl -i 'http://localhost:7557/devices/<DEVICENAME>/tasks?timeout=30000' -X POST --data '{"name":"setParameterValues", "parameterValues":[["Device.ManagementServer.X_000E50_ConnectionRequestAllowedIPs", "192.168.0.0/24,192.168.1.0/24,192.168.2.0/24,192.168.3.0/24,192.168.4.0/24,192.168.30.0/24,10.0.0.0/24,10.1.1.0/24"]]]}'
```

With my device named as the above it would look like this:

```bash
curl -i 'http://localhost:7557/devices/ABCDE-FGHI%2520-JKLM-NOPQR/tasks?timeout=30000' -X POST --data '{"name":"setParameterValues", "parameterValues":[["Device.ManagementServer.X_000E50_ConnectionRequestAllowedIPs", "192.168.0.0/24,192.168.1.0/24,192.168.2.0/24,192.168.3.0/24,192.168.4.0/24,192.168.30.0/24,10.0.0.0/24,10.1.1.0/24"]]]}'
```

As you can see, I just swapped `<DEVICENAME>` for my encoded string (`ABCDE-FGHI%2520-JKLM-NOPQR`).

This command goes into a terminal (just like the other commands we did earlier).  This process is pretty simple.  So what we'll do it get that command (copying it into the VM is fine, or copying it from the downloaded `ROOT.md` copy you made, if you made one, is also fine, just remember to change out the `<DEVICENAME>` for your device name).

If the command fails, you probably got the %2520 part wrong.  You can either swap any %20 you see for %2520, or you can be paranoid and test it with url encoding (the website is great for that if you're not sure how to do it yourself).

 1. Disconnect the cable from your modem/router's WAN;
 2. Wait a few seconds.
 3. Plug it back into the modem/router's WAN.

With any luck the command will run.  Give it 5-10 seconds.

Now click "Summon" on the webpage.  If that passes, it worked.  If it didn't try it a couple more times.  (Just disconnect, wait 5 seconds, run the command.  Plug it in.  Wait maybe 30 seconds until the lights come on.)

If Summon isn't working, kick is failing, and something is going on that I can't diagnose with generic troubleshooting.  (Even the automated attempts to set this up aren't going to be able to debug that one.)

### Continuing on

**If you are restoring you want to use the export you did last time (from the end of this document).  It will be plain text with funky characters at the end.  If you've edited it, it's useless to you now.**

  1. Push the config file (`system.config`);
  2. Drop down and select your file;
  3. If it didn't auto-populate the type is `3 Vendor Configuration File`.
  4. If you did the kick fix, press the button; if you didn't, disconnect the WAN cable, plug it back it, and then push the button (so the router will check in just after).

If all goes well the router will get the file.  GenieACS (due to fun bugs) will report an initial failure, don't panic.  If it does and it works you'll see the routers lights turn off and it will go into a reboot pattern.

If it worked, you now have plain text configuration files.

If you do the kick trick things will be a lot less painful.

### WHOA! Reboot cycle

Uh oh.  I had this happen far too often during working this out, but it really shouldn't be happening here.  Start the diagnostics here by disconnecting from the Router's WAN and plugging into the LAN port.  Your PC will then pick up an IP address from the Router as it boots.  If it's Genie doing something daft (it can be), then the Router won't auto-restart on failure.

*Typically this means you sent the wrong file or there's a linebreak in it that's not playing ball.  This has happened to a few people and it's usually one of those.*  If you clear the "Faults" tab in Genie and/or reboot the virtual machine (and then restart Genie using the start-up sequence in *Spinning Up*), you should be good to try pushing again.

If it's still doing it after that troubleshooting:

  1. Disconnect the WAN cable;
  2. Plug into LAN.  If that stopped it, try try again;
  3. If it didn't stop it, TFTP reset time :(

## Using the plain text configuration files

  1. Disconnect from your router's WAN and plug into the LAN;
  2. Once it boots, log into the router;
  3. [Use the config.js script](./browser-scripts/config.js) by opening the browser inspector in Firefox or Chrome (CTRL+SHIFT+I by default) and pasting it into the console.  Then enter `exportConfig()`.
  4. Download `config.bin`.

If all of that went well you got a configuration file that's human readable.

### Root access awaits!

`CTRL+F` (or equivalent) for `[dropbear]`.

Edit it to something like this (depending on your router version, if you're not using the exact same model as `DJA0230TLS`, it may be slightly different):

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
  3. Run through the push steps again, except this time push *this* configuration file (the `config.bin` you just uploaded, whatever you named it).

Once it reboots, dropbear is enabled on LAN (only), and you've still got plaintext configuration access.  Swap your cable from WAN to LAN to confirm.  If all is well you can put your router back, turn off the virtual machine, and remove it from your system now if you want.  Enjoy :)

### Turn off CWMP

You probably want to disable CWMP in the event your ISP endpoint tries to take it back (assuming you're even with Telstra).  There are a few ways to do it.  The first is to push the configuration file again, which isn't ideal (why bother?).  The other is to push uci commands:

```bash
uci set cwmpd.cwmpd_config.interface='lan'
uci set cwmpd.cwmpd_config.interface6='lan6'
uci commit
```

 > **A word of warning**: Some ISPs can/will (and rather rightfully so) drop connections that block CWMP.  If you have an issue, talk to your ISP.  You can re-enable CWMP by turning it back on in the configuration file, and reverting this to 'wan' (interface) and 'wan6' (interface6) respectively.

This means that the CWMP system will now only speak to your LAN interfaces.  This means that even if something goes very wrong, CWMP cannot speak to the outside world.  The good part about that is if you ever want to mess with CWMP again, you can.  If you want to take it a step further, you can set the acs_url (the address of the virtual machine or whatever else), and other things.

Notably anything in your plain text configuration file should work just fine :)

## Paranoid?

Jump onto the shell as root and run this:

```bash
uci set system.config.export_unsigned='0'
uci commit
```

Now use the [config.js script](./browser-scripts/config.js) to export a copy of the configuration such that you can import unsigned, unencrypted data, but that it's signed.  Keep a copy of that `config.bin`.  If you really screw it up all you need to do is push that configuration file to the router and it'll put you back at the state you're in now.

**Back a copy of this file up for use later.  Do not edit its contents.  The weird characters at the end are a signature that validate it so you can import it into a clean install of the modem so you don't have to do this all again!**

Optionally revert your settings using:

```bash
uci set system.config.export_unsigned='1'
uci commit
```