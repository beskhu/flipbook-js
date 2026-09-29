# Flipbook-js

## This mono and dual mode responsive flipbook build upon enumeration of sources in "content" folder emulates the act of turning pages in css transforms

## Getting Started

### Dependencies

php 7 or newer

### Installing

```
cd your_destination_folder/
git clone https://github.com/beskhu/flipbook-js
```

replace the contents of "content" folder by your own sources for the flipbook and eventually (not required) if images sources, the contents of "thumbs" folder  by your own sources for thumbs.
if you don't need thumbs to speed up the loading, empty the thumbs folder.

if under apache modify eventually the .htaccess to match the folder you had chosen, relative to the hosting root folder
if under nginx add this rewrite rule to the host file : 
```
rewrite ^/([^/\.]+)$ /?page=$1 last;
```

### Executing program

go the web url you defined in your host.

## Help

don't hesitate to contact the author.

## Authors

Fabien Auréjac
[@AurejacFabien](https://x.com/AurejacFabien)

## Version History
* 0.1
    * Initial Release

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

Inspiration, code snippets, etc.
* [turnjs](https://github.com/bahadirdogru/Turn.js-5)
