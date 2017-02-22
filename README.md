# Dienstübergreifender Annotationen-Service 

Basiert auf Web Annotation Data Model (https://www.w3.org/TR/annotation-model/)

## Aufruf

Benötigt jQuery ab Version 1.11

Außerdem:

```html
<script type="text/javascript" src="http://anno.ub.uni-heidelberg.de/js/vue.js"></script>                                                                
<script type="text/javascript" src="http://anno.ub.uni-heidelberg.de/js/annotations.js"></script>                                                        
<script type="text/javascript" src="http://anno.ub.uni-heidelberg.de/js/js.cookie-2.1.2.min.js"></script>                                                
<link href="http://anno.ub.uni-heidelberg.de/js/bootstrap-3.2.0/dist/css/bootstrap.min.css" rel="stylesheet" type="text/css">                            
<script type="text/javascript" src="http://anno.ub.uni-heidelberg.de/js/bootstrap-3.2.0/dist/js/bootstrap.min.js"></script>                              
<link href="http://anno.ub.uni-heidelberg.de/js/font-awesome-4.5.0/css/font-awesome.min.css" rel="stylesheet" type="text/css">                           
<link href="http://anno.ub.uni-heidelberg.de/css/annotations.css" rel="stylesheet" type="text/css">                                                      
```

nur für Editor:

```html
<script type="text/javascript" src="http://anno.ub.uni-heidelberg.de/js/tinymce/tinymce.min.js"></script>

TODO: JS-Modul für SemToNoes ...
```

```js
displayAnnotations(htmlid, annotarget, options)
```

* htmlid: ID des HTML-Elements, in dem die Liste der Annotationen ausgegeben werden soll
* target: ID des Annotationen-Targets, für das die zugehörigen Annotationen ausgegeben werden soll
* options:
 * service: Dienst, für den die Annotationen verwaltet werden (z.B. "diglit", zukünftig mit zu target)
 * css: Präfix für verwendete CSS-Klassen und IDs
 * sort: Sortierung: date, datereverse, title
 * lang: Sprache: de, en
 * no_oai: Keine Ausgabe von IIIF-URLs (ggf. umbenennen)
 * edit_img_url: Editor: URL zu Image, für das Polygone erstellt werden
 * edit_img_width: Editor: Breite des Images, für das Zonen erstellt werden, in Pixel
 * edit_img_thumb: Editor: URL zu Thumb-Image (Orientierungsthumb im Editor)
 * highlight: Callback Funktion für das Highlighting der Zonen
 * iiif_url: URL-Anfang für die IIIF-URL (Zonenausschnitt)
 * iiif_img_width: TODO: raus aus Optionen, muss automatisch ermittelt werden (Zones)
 * iiif_img_height: TODO: raus aus Optionen, muss automatisch ermittelt werden (Zones)
 * gotopurl: 
 * purl: URL-Anfang für die persistenten URLs zu der Annotationen
 * login: URL für Login-Button in Annotationenanzeige
 * readtoken: Read-Token für Annotationenservice
 * writetoken: Write-Token für Annotationenservice


## Demo

### Standalone
http://anno.ub.uni-heidelberg.de/demo.html

### Integration in DWork

http://digi.ub.uni-heidelberg.de/diglit/annotationen_test/0002?template=ubhd3
