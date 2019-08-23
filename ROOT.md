> "DISCLAIMER"
    
> The documentation is provided "as is" and the author disclaims all warranties with regard to this documentation including all implied warranties of merchantability and fitness. In no event shall the author be liable for any special, direct, indirect, or consequential damages or any damages whatsoever resulting from loss of use, data or profits, whether in an action of contract, negligence or other tortious action, arising out of or in connection with the use or performance of this documentation.

In short, do so at your own risk. This is the procedure done on a Technicolor DJA0230TLS Gateway. The process itself *is* safe but it's fiddly.


## The Environment

This document assumes that you have Ubuntu 18.04 LTS installed on a separate machine. Ubuntu 18.04 LTS can be installed on a VM in Windows, but there is a possible added complication of the bridge adapter between the two operating systems that is not described.

The overall steps to root the DJA0230 device are listed below followed by details for each step.


## Acknowledgements

Thanks to Whirlpool users, particularly Swixel who provided suggestions and insights along the way.
 

## Overall Process

!!!Note
   There is no requirement for a factory reset, nor a firmware upgrade or downgrade for this process to work
   
The overall process involves two main steps:
1. Setting up an ACS (TR-069) server
2. Pushing a config update through ACS that will disable signature, allow plain text updates and enable dropbear


## Overall Steps

1. Install Ubuntu 18.04.2 LTS and boot into operating system
2. Install the prerequisites packages redis-server, screen, curl, git and build-essential via terminal
3. Install nodejs via terminal
4. Install mongodb via terminal
5. Install GenieACS via terminal
6. Install isc-dhcp-server via terminal and edit configuration file to allow for GenieACS
7. Configure the Ubuntu PC to have static IP4 address of 192.168.30.1
8. Connect ethernet port of Ubuntu PC to WAN port of DJA0230
9. Start isc-dhcp-server via terminal
10. Start mongodb via terminal
11. Start GenieACS via terminal
12. Using an internet browser on the Ubuntu PC, logon to the GUI of GenieACS (http://localhost:3000) and confirm that DJA0230 is online. Take note of device ID at the top with large font.
13. Load a system.config file with instruction set to root and set import and export files as flat files into GenieACS
14. Perform a *kick fix* to the device via terminal using the curl command and uuencode of device ID noted above
15. At the device screen of GenieACS, summon the device. A message will flash up to inform about whether this is successful
16. If summon is unsuccessful, repeat the ‘kick fix’ again. This may have to be repeated again.
17. Push the system.config file loaded in step 13 to the device. If successful, the DJA0230 device will reboot and you should have root access at port 22 after the device finishes booting up.
18. If using the same Ubuntu PC, reverse the static IP address, unplug Ethernet cable from WAN port and plug into one of the four LAN ports. Confirm root access.


## Detailed Notes

**1 -**  This process has been done successfully with a new install of Ubuntu 18.04.2 LTS. A new install is not compulsory and the process should work with other Linux packages. The main requirement is probably that GenieACS functions properly.

Ubuntu 18.04.2 LTS could be installed on a VM but this process would have to be adjusted accordingly.

**2 -** Open up a terminal and install the pre-requisite packages:

```bash
# Pre-requisite packages
sudo apt-get install redis-server build-essential screen curl git
```

**3 -** From terminal install [nodejs](https://github.com/nodesource/distributions#debinstall)(Ref 1). These commands are for Version 10 which is confirmed working.

```bash
# Node
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**4 -** From terminal install [MongoDB](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)(Ref 2)
 
```bash
# Mongodb

wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

**5 -** From terminal install [GenieACS3](https://github.com/genieacs/genieacs)(Ref 3)

```bash
# Genie
cd ~
git clone https://github.com/genieacs/genieacs.git
cd genieacs
npm install
npm run build
```

If the latest commit of GenieACS does not work, the commit of August 4 2019 (support more charsets) is confirmed working

**6 -** From terminal install isc-dhcp-server and configure (Ref 5, 6)

```bash
# isc-dhcp-server
sudo apt-get install isc-dhcp-server
```

Edit the configuration. The configuration assumes you're doing a direct connection to the router's WAN port (your PC's LAN port to the router's WAN).

The first line clears the dhcpd.conf file, while the second command opens the dhcp.conf file for edits

```bash
sudo sh -c 'echo > /etc/dhcp/dhcpd.conf’
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

Once the above has been input into the dhcp.conf file, `CTRL` + `X` to exit and save. Press `Y` when prompted to save the file and `Enter` to reuse file name

By default, the isc-dhcp-server should not start, but nevertheless run the following commands to stop the server just in case

```bash
sudo /etc/init.d/isc-dhcp-server stop
sudo /etc/init.d/isc-dhcp-server6 stop
```

**7 -** The Ubuntu PC now needs to have its IP4 address fixed at 192.168.30.1, which GenieACS looks for. In Ubuntu, the settings are the network icon at the top right of the screen (Ref 4)

**8 -** Connect ethernet port of Ubuntu PC to WAN port of DJA0230

**9 -** Start isc-dhcp-server via terminal (Ref 5)

```bash
sudo /etc/init.d/isc-dhcp-server start
```

Check isc-dhcp-server using the following command:

```bash
sudo /etc/init.d/isc-dhcp-server status
```

To exit back to cursor and command prompt use `CTRL` + `C`.

If isc-dhcp-server is running, the status check will have some words stating it is active. In addition, the DJA0230 device’s LED for `Online` turns green.

**10 -** Start mongodb via terminal

```bash
sudo service mongod start
```

Check mongodb status via the following command:

```bash
sudo service mongod status
```

Again, the message will flash up stating mongodb is active and running (in green). `CTRL` + `C`  to get back to command prompt.

**11 -** Start GenieACS via terminal

```bash
cd ~/genieacs
screen -S cwmp -dm ./dist/bin/genieacs-cwmp
screen -S fs -dm ./dist/bin/genieacs-fs
screen -S nbi -dm ./dist/bin/genieacs-nbi
screen -S ui -dm ./dist/bin/genieacs-ui --ui-jwt-secret secret
```

!!! Note
        The ports that GenieACS listens are cwmp-7547, nbi – 7557, fs – 7567 (send files) and ui -3000. To look at the status, might have to do “screen –dr cwmp” or others.

If during the next step of getting access to GenieACS via the browser, there is a blank screen, use the following commands to detach the screens and note any error or other messages which flash up – if GenieACS failed to start up, there will be a message stating that there is no screen to detach. Again `CTRL` + `C` to exit to cursor and command prompt.

```bash
screen -dr cwmp
CTRL + C
screen -dr fs
CTRL + C
screen -dr nbi
CTRL + C
screen -dr ui
CTRL + C
```

**12 -** Using an internet browser on the Ubuntu PC, logon to the GUI of GenieACS – http://localhost:3000.

If things have gone well, a screen will be presented with tick boxes for a few items to be set up. Leave that alone, or keep all boxes ticked. Press `ABRACADABRA!` at the bottom of the screen and the wizard should then set things up, including the admin user and password, both of which are admin.

Navigate to the device tab and you should see your device online. Click on `show` at the far right of the screen and copy the device ID which is in large font at the top of the screen. The format is typically in XXXX-TechnicolorXXX-XXXX. On the four devices I have seen it is XXXX-Technicolor%20DJA0230TLS-YYYY, where YYYY is the serial number that can be seen on the sticker at the bottom of the device. Also, XXXX is not necessarily 4 digits, numbers or charcters - it could be 5, 6, etc.

The device ID will need to be URL Encoded it. If you don't know what that means, visit https://www.urlencoder.io/ and paste the name into it.

A device ID of XXXX-Technicolor%20DJA0230TLS-YYYY will have uuencoded ID of XXXX-Technicolor%2520DJA0230TLS-YYYY

**13 -** Load a system.config file with instruction set to root and set import and export files as flat files into GenieACS.

The system.config file should have seven lines. Be careful that this file is actually created in Ubuntu because Windows messes up the line breaks and possibly other characters.


```ini
set system.config.export_plaintext='1'
set system.config.export_unsigned='1'
set system.config.import_plaintext='1'
set system.config.import_unsigned='1'
set dropbear.lan.RootPasswordAuth='on'
set dropbear.lan.enable='1'
set dropbear.lan.PasswordAuth='on'
```


!!! Note
    I have always used the two step push procedure to gain root access, but have been advised that the above should be enough for the DJA0230. IF YOU ARE USING THIS GUIDE TO ROOT OTHER TECHNICOLOR DEVICE AND HAVE DOUBTS ABOUT THE SYNTAX OF THE CONFIGURATION FILE, USE THE TWO STEP PUSH PROCEDURE ie. JUST USE THE FIRST FOUR LINES IN system.config FILE.

The original procedure requires two push action to gain root access. I have been advised this is because the configuration syntax and structure may be different for other devices. On one modem it may have wiped the entire config block when you patch it (so system.config there is completely reset).


To load the file on the GenieACS GUI:

    a. Go to the `Admin` tab
    b. Go to `Files` subtab (on left)
    c. Click `New`
    d. Select Type -> `3 Vendor Configuration File`
    e. `File` -> `Browse` -> select our `config` file that has just been created with the seven lines
    f. `Save`

**14 -** Perform a *kick fix* to the device via terminal using the curl command and uuencode of device ID noted above

    The curl command to use in the terminal is as follows

curl -i 'http://localhost:7557/devices/UUENCODEDDEVICEID/tasks?timeout=30000' -X POST --data '{"name":"setParameterValues", "parameterValues":[["Device.ManagementServer.X_000E50_ConnectionRequestAllowedIPs", "192.168.0.0/24,192.168.1.0/24,192.168.2.0/24,192.168.3.0/24,192.168.4.0/24,192.168.30.0/24,10.0.0.0/24,10.1.1.0/24"]]}'

So for the uuencoded device ID of XXXX-Technicolor%2520DJA0230TLS-YYYY, the curl command will be

curl -i 'http://localhost:7557/devices/XXXX-Technicolor%2520DJA0230TLS-YYYY/tasks?timeout=30000' -X POST --data '{"name":"setParameterValues", "parameterValues":[["Device.ManagementServer.X_000E50_ConnectionRequestAllowedIPs", "192.168.0.0/24,192.168.1.0/24,192.168.2.0/24,192.168.3.0/24,192.168.4.0/24,192.168.30.0/24,10.0.0.0/24,10.1.1.0/24"]]}'

**15 -** On the GenieACS GUI, device subtab and device selected, summon the device by clicking on the `Summon` hyperlink, just below the device ID. A message will flash up informing about whether this has been successful. If unsuccessful, perform the *kick fix* gain and repeat the summons. The *kick fix* may have to be repeated as many as five times before summon is successful.

**16 -** Push the system.config file loaded in step 13 to the device. If successful, the DJA0230 device will reboot and you should have root access at port 22 after the device finishes booting up.

At the bottom of the GenieACS GUI device screen click the `Push file` button and a drop down dialog box will appear allowing the selection of the file previously loaded in step 13.

Select the file, click on `queue` followed by `commit`. The only indication of the success of this action is when the device reboots. In addition, keep an eye on the faults subsection of the device on GenieACS GUI. If no faults appear around the time when the file was pushed, then the action would be successful.

The faults subsection would have a couple of faults related to the *kick fix*. Each time the curl command is run, a fault appears, which does not seem to interfere with the rooting process.

**17 -** Connect to the LAN port of the device and confirm root access, via putty, Winscp or some other means. Username and password is both root.  If using the same Ubuntu PC, the static IP4 address will have to be changed back to a dynamic address.  If using the two step process, skip the next step and proceed from step 18a in the section below.

**18 -** Post root, the whirlpool knowledge base should provide a springboard for other commands and steps


## A quick note about the two step process

The original process involves two push actions. In the first push, the 4 lines (the first 4 in step 13 above) are pushed to the device which allows the configuration files to be imported and exported as flat files.

Then the process continues:

**18a -** Connect to the LAN port of the device and if using the same Ubuntu machine, change back to dynamic IP4 address

**19a -** Using a browser, login to the device GUI

**20a -** Run the following commands in the browser console (console brought up by `CTRL`+`SHIFT`+`I`)

```bash
/* Downloader */

function exportConfig() {

    $.fileDownload("/modals/gateway-modal.lp", {
        httpMethod: "POST",
        data: new Array(
            { name : "action", value : "export_config" },
            { name : "CSRFtoken", value : $("meta[name=CSRFtoken]").attr("content") }),
    });
    
}
```

**21a -** After entering the commands press `Enter` and a line break should appear with the cursor after the symbol `>>`

**22a -** Type `exportConfig()` and press `Enter`

**23a -** A pop up box will enquire what is required of the config.bin file. Download and save `config.bin`.

**24a -** The config.bin should then be edited and the relevant dropbear lines changed. Again, DON'T edit the config.bin file in Windows to prevent erroneous line breaks and carriage returns.

```bash
dropbear.lan.RootPasswordAuth='on'
dropbear.lan.enable='1'
dropbear.lan.PasswordAuth='on'
```

**25a -** This edited config.bin file should then be loaded into GenieACS GUI similar to step 13 above. Again, a static IP address of 192.168.30.1 will need to be set on the Ubuntu machine (if using the same machine) prior to firing up GenieACS.

**26a -** Run the curl *kick fix* command, summon the device summoned and push the file to the device. Push success is again indicated when the device reboots.  The previous steps 14 to 16 in the section above provides details.

**27a -** Confirmation of root is via LAN access and using putty, Winscp or other. Note the need for dynamic IP4 address.


## References

1. https://tecadmin.net/install-latest-nodejs-npm-on-ubuntu/
2. https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
3. https://github.com/genieacs/genieacs
4. https://tecadmin.net/change-ip-address-on-ubuntu-18-04-desktop/
5. https://help.ubuntu.com/community/isc-dhcp-server
6. https://blog.localh0rst.de/isc-dhcp-add-cwmp-acs-server-tr069/
