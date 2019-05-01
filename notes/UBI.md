# Unsorted Block Images

Exploration of the UBI information.  If you don't know what this is, it's probably not helpful to you.

## Raw Information

```bash
# cat /proc/mtd
dev:    size   erasesize  name
mtd0: 20000000 00020000 "brcmnand.0"
mtd1: 04e00000 00020000 "rootfs"
mtd2: 05920000 00020000 "rootfs_data"
mtd3: 05000000 00020000 "bank_1"
mtd4: 05000000 00020000 "bank_2"
mtd5: 00020000 00020000 "eripv2"
mtd6: 00040000 00020000 "rawstorage"
```

## Rip it

Grab a cheap USB drive from somewhere (doesn't have to be great), flash it up to something useful (FAT32 (`b`) is fine), format is up (`mkfs -t vfat` is fine) and begin the party.  The above really just gives names to the magic.

This will take a while (and yeah, on an active device, ripping the active bank isn't a wonderful idea, so test your active or just don't copy them... I'm not here for that very reason).

```sh
ls /mnt/usb
# your device will be here
```

Setup the export alias

```sh
export DUMPTARGET=/mnt/usb/whatever
echo $DUMPTARGET
```

If all went well it repeated back.  If it didn't, edit the below manually or you'll have a very bad time.

```sh
dd if=/dev/mtd0 of=$DUMPTARGET/brcmnand.0.dd
dd if=/dev/mtd1 of=$DUMPTARGET/rootfs.dd
dd if=/dev/mtd2 of=$DUMPTARGET/rootfs_data.dd
#dd if=/dev/mtd3 of=$DUMPTARGET/bank_1.dd
#dd if=/dev/mtd4 of=$DUMPTARGET/bank_2.dd
dd if=/dev/mtd5 of=$DUMPTARGET/eripv2.dd
dd if=/dev/mtd6 of=$DUMPTARGET/rawstorage
```