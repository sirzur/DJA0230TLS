# What is this?

CWMP is the [CPE WAN Management Protocol](https://en.wikipedia.org/wiki/TR-069), also known as TR-069 (though that's not *strictly* right, as TR-069 is just part of it now).  [Data Models](http://cwmp-data-models.broadband-forum.org/) refer to the Broadband Forum data models for it.

## This sounds dangerous

It is.  It isn't.  It can be.  It's not.

When you connect to the internet you ask your ISP/RSP for an address (typically).  If you have a static IP you can tell your modem not to do that, and to instead just to say "Hi", and go on about its business.  The process of asking for an IP address is known as [DHCP](https://tools.ietf.org/html/rfc2132) ([Wikipedia Article](https://en.wikipedia.org/wiki/Dynamic_Host_Configuration_Protocol)).  During that process your ISP assigns information (address, how you connect, and so on).  The same thing happens to most devices at home when you connect to wireless, or plug in a cable.  It's how most IPv4 devices get their addresses (IPv6 in many cases too, but that's a nightmare for another time).

During that process vendor extensions (including CWMP's) can be used to send additional information.  One of those tells a device where to look for additional information (the CWMP 'ACS', or server).  Your ISP, being the only authoritative DHCP server your router should be seeing, responds.  It then 'provisions' your device.  Since CWMP can only set certain settings remotely, you're actually safe.  This isn't a [Mirai](https://en.wikipedia.org/wiki/Mirai_(malware)) situation (that's from a vulnerability TR-064, an older version of this), the [ManagementServer](https://cwmp-data-models.broadband-forum.org/tr-181-2-12-0-cwmp.html#D.Device:2.Device.ManagementServer.) settings are pretty restrictive.

Of course, implementation faults do exist.

The good news for us is that CWMP is a real pain to completely lock down, because based on the specification the only way to block CWMP workarounds like this is to hard-bake certificate authority codes into the router, which turns the device into a ticking timebomb.  If the device is sold off too late, or even second hand, a factory reset kicks off, a firmware reversion is forced or anything like that, and it's a brick.  The OEM is then forced to expose a workaround, issue a recall, or face the pretty harsh reality from the public.

To put this in perspective, *Cable Labs* (the people behind DOCSIS) actually risk timebombing their eRouters per specification (which is why if you own a router with a cable modem built into it you can't configure certain things without an insane amount of fiddling).  **CWMP does not force this, and any manufacturer that makes this call is one that we should, as a wider community, avoid at all costs.**

## Credit where credit is due

Technicolor not enforcing a timebomb here, and Telstra not forcing it either is to both of their credits.  If you're on Telstra and you leave CWMP enabled after rooting the device they can revert you.  No harm, no foul, and you can't really do any harm.  The trade-off is that if you do it you lose automatic upgrades and automatic remote support; I call that more than fair.

Broadband Forums, addressing the TR-064 shortcoming, also did a great job with TR-069 (SOAP notwithstanding).