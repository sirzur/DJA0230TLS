# Bootloader

It's a Broadcom SoC, so this should be as interesting as it usually is.

## Access

Since I'm talking about a GPLed operating system (OpenWRT), I'm assuming [you have root/shell access](/ROOT.md).  If not, well, that's how I got my file access.  Chicken and egg scenario here, but at the same time there are other ways in, they're just far less pleasant than that route.

The bootloader is absolutely CFE and there are traces of it in the unallocated NVRAM.