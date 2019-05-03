# RIP: Recovery Is Possible

'Recovery Is Possible' refers to `/proc/rip` in this case.  There's a host of information in here, and I'll get stuck into it later.  This isn't unique to Technicolor products, but it's interesting nonetheless how it functions.

Essentially they are nodes under `/proc` which function akin to readable devices.  Typically this means they have to be read in full, which isn't a huge issue.  They can be piped to a web interface via a custom page (though editing `.lp` is akin to editing PHP3, so that's a hard pass where it's not necessary for me), over a Lua socket, or over whatever else takes your fancy.

Some of these are actively disabled (including the one that gatekeeps the others from raw memory access), making general access to this fiddly.  If you know what you're doing and don't mind getting down and dirty with pinvoke and kernel debugging you can absolutely kernel panic your way into a syslogged key without manipulating the hardware.  Of course, if you're less insane, there are better ways to go about this.

(I'll dig more into this later.)