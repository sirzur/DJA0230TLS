# Browser Scripts

  1. Open the Developer Tools (`CTRL+SHIFT+I` typically);
  2. Drop in the script;
  3. Use the functions you want from the end of it (commented out).

Never trust random scripts, always find out what they actually do first.

## Rundown

`getMetaContent` is a common technique you'll see everywhere across the web as it just pulls a meta tag from the `<head>` region of a document based on its name, and then pulls its content.  This is typically used to the `CSRFToken`.

### `config.js`

The `DJA0230TLS` has configuration import and export disabled by default.  This is rough, but it is what it is.  This is used for importing and exporting the configuration from any page of the web administration page.  It uses the web interface's own trust against it, but even if you had to sign in it'd work.

`exportConfig` exports a configuration file and simulates its download by creating a download.  It's nothing fancy.

At some stage I'll get around to writing an importer that's more convenient than using curl.  For now it's a pain to hack up the DOM and inject things for convenience.