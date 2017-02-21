var annoservicehosturl = 'http://anno.ub.uni-heidelberg.de';
var annoserviceurl = annoservicehosturl+'/cgi-bin/anno.cgi';

var typeList = {
  "dc:description-ger": "text",
  "dc:identifier": "identifier",
  "dc:title": "title",
  "foaf:account": "account",
  "foaf:name": "user_name",
  "jcr:lastModified": "jcr_modified",
  "jcr:uuid": "uuid",
  "dc:source": "link",
  "dc:sourceDescription": "sourcedescription",
  "jcr:versionHistory": "versioned",
  "dc:type": "type",
  "svg:polygon": 'svg_polygon',
  "user_rights": 'user_rights'
};

var texts = ['headline','login','new','open_all','close','close_all','sort','edit','comment','commenttarget','reply','comments','previous','sortdate','sortdatereverse','sorttitle','purl','save','cancel','edit_headline','annofield_title','annofield_link','annofield_linktitle','license','version_from','showref','showrefdefault','showrefnever','showrefalways','metadata','zones','edit_zones'];

var fields = {
  'id': 'clean_svname',
  'title': 'title',
  'text': 'test',
  'link': 'link',
  'linktitle': 'sourcedescription',
  'polygon': 'svg_polygon',
};

var zoneeditdrawing;
var zoneeditthumb;

function setAnnotationStatus(id,status,csspraefix) {
  if (status) {
    $('#'+id).addClass(csspraefix+'status-active');
  }
  else {
    $('#'+id).removeClass(csspraefix+'status-active');
  }
}

function displayAnnotations(targetid,path,options) {
  $.getScript("http://anno.ub.uni-heidelberg.de/js/localizations.js", function () {

  target = '#'+targetid;
  var annotations = getAnnotations(path,options);
  if (typeof(options['css']) == 'undefined') {options['css'] = 'anno'}
  var css = options['css'];
  if (typeof(options['sort']) == 'undefined') {options['sort'] = 'date'}
  if (typeof(options['lang']) == 'undefined') {options['lang'] = 'en'}
  var t = {};
  $.each(texts, function (k, v) {
    t[v] = anno_l10n_text(options.lang,v);
  });

  var html = '<div id="vueapp">'+annoColTemplate+'</div>';
  $(target).html(html);

  Vue.component('annocomments', {
    props: ['anno','options','css'],
    template: ` 
      <ul v-bind:class="css+'annochoicetree'">
         <li v-for="item in anno.children" v-bind:id="item.id" v-bind:class="'media '+css+'comment'">
           <div>
             <div v-if="item.user_name" class="media-left"><button class="btn btn-xs"><span class="glyphicon glyphicon-user"></span> {{item.user_name}} {{item.jcr_modified_display}}</button></div>
             <div class="media-body">
               <h4 v-html="item.title"></h4>
               <div v-html="item.text"></div>
               <p v-if="item.link"><a v-bind:href="item.link" target="_blank"><span v-if="item.sourcedescription">{{item.sourcedescription}}</span><span v-else>{{item.link}}</a></p>
               <div v-if="!options.no_oai" v-bind:class="css+'iiiflink'"><template v-if="item.iiif_url"><button class="btn-link" onclick="anno_toggle_iiif($(this));"><span class="fa fa-caret-right"></span> Bildausschnitt (IIIF-Image)</button><div><a v-bind:href="item.iiif_url" target="_blank">{{item.iiif_url}}</a></div></template></div>
               <!-- navigation -->
               <div class="btn-toolbar pull-right" role="toolbar" style="margin-top: 10px;">
                 <div class="btn-group btn-group-xs pull-right" role="group">
                   <button v-if="item.editable" v-bind:class="'btn btn-default '+css+'editbut'"><i class="fa fa-pencil"></i> &nbsp;{{text.edit}}</button>
                   <button v-if="item.commentable" v-bind:class="'btn btn-default '+css+'commentbut'"><i class="fa fa-reply"></i> &nbsp;{{text.reply}}</button>
                   <template v-if="item.versioned"><button class="btn btn-default dropdown-toggle" data-toggle="dropdown">{{text.previous}} <span class="caret"></span></button><ul v-bind:class="'dropdown-menu pull-right '+css+'versions'"></ul></template>
                 </div>
               </div>
               <div style="clear: both; margin-bottom: 2px;"></div>
             </div>
           </div>
           <template v-if="item.hasChildren">
             <div><div v-bind:class="css+'separator'"></div></div>
             <annocomments v-bind:anno="item" v-bind:options="options" v-bind:css="css"></annocomments>
           </template>
         </li>
      </ul>
   `, 
  });

  var app = new Vue({
    el: '#vueapp',
    data: {
      text: t,
      annotations: annotations,
      options: options, 
//    Zur Schreibvereinfachung css nochmal separat...
      css: css,
      annoservicehosturl: annoservicehosturl,
      zoneedit: (typeof(options.edit_img_url) != 'undefined' && typeof(options.edit_img_width) != 'undefined')?1:0,
    },
    computed: {
      annotations_sorted: function () {
        var items = annotations;
        if (typeof(options.sort) != 'undefined' && options.sort.length) {
          items.sort(function(a,b) {
            if (options.sort == 'date') {return ((a.jcr_modified < b.jcr_modified) ? -1 : ((a.jcr_modified > b.jcr_modified) ? 1 : 0))}
            else if (options.sort == 'date.reverse') {return ((a.jcr_modified < b.jcr_modified) ? 1 : ((a.jcr_modified > b.jcr_modified) ? -1 : 0))}
            else {
              return ((a.title < b.title) ? -1 : ((a.title > b.title) ? 1 : 0));
            }
          });
        }
        return items;
      }
    },
  }); 

// Annotation, die ueber PURL addressiert wurde, hervorheben
  if (typeof(options.gotopurl) != 'undefined' && options.gotopurl.length) {
    $('#'+options.gotopurl).addClass(css+'PURL');
  }

// Zone-Editor
  if (typeof(options.edit_img_url) != 'undefined' && typeof(options.edit_img_width) != 'undefined') {

    $('#'+css+'_tab_zones').html(zoneEditTemplate);

    var zoneapp = new Vue({
      el: '#'+css+'_tab_zones',
      data: {
        text: t,
        options: options,
        annoservicehosturl: annoservicehosturl,
//      Zur Schreibvereinfachung css nochmal separat...
        css: css,
      }
    });

    $('#'+css+'_zoneeditzoomout').on('click', function(){
      zoneeditdrawing.getViewbox().zoomOut();
      navigationThumb(zoneeditthumb,zoneeditdrawing)
    });
    $('#'+css+'_zoneeditzoomin').on('click', function(){
      zoneeditdrawing.getViewbox().zoomIn();
      navigationThumb(zoneeditthumb,zoneeditdrawing)
    });
    $('#'+css+'_zoneeditfittocanvas').on('click', function(){
      zoneeditdrawing.getViewbox().fit(true);
      zoneeditdrawing.getViewbox().setPosition(xrx.drawing.Orientation.NW);
      navigationThumb(zoneeditthumb,zoneeditdrawing)
    });
    $('#'+css+'_zoneeditrotleft').on('click', function(){
      zoneeditdrawing.getViewbox().rotateLeft();
      zoneeditthumb.getViewbox().rotateLeft();
      navigationThumb(zoneeditthumb,zoneeditdrawing)
    });
    $('#'+css+'_zoneeditrotright').on('click', function(){
      zoneeditdrawing.getViewbox().rotateRight();
      zoneeditthumb.getViewbox().rotateRight();
      navigationThumb(zoneeditthumb,zoneeditdrawing)
    });
    $('#'+css+'_zoneeditpolygon').on('click', function(){
      var styleCreatable = new xrx.shape.Style();
      styleCreatable.setFillColor('#3B3BFF');
      styleCreatable.setFillOpacity(.1);
      styleCreatable.setStrokeWidth(1);
      styleCreatable.setStrokeColor('#3B3BFF');
      var np = new xrx.shape.Polygon(zoneeditdrawing);
      np.setStyle(styleCreatable);
      np.getCreatable().setStyle(styleCreatable);
      zoneeditdrawing.setModeCreate(np.getCreatable());
      zoneeditdrawing.draw();
      $('#'+css+'_zoneedittoolbar button').removeClass('active');
      $('#'+css+'_zoneeditpolygon').addClass('active');
      $('#'+css+'_zoneeditdel').addClass('disabled');
    });
    $('#'+css+'_zoneeditrect').on('click', function(){
      var styleCreatable = new xrx.shape.Style();
      styleCreatable.setFillColor('#3B3BFF');
      styleCreatable.setFillOpacity(.1);
      styleCreatable.setStrokeWidth(1);
      styleCreatable.setStrokeColor('#3B3BFF');
      var nr = new xrx.shape.Rect(zoneeditdrawing);
      nr.setStyle(styleCreatable);
      nr.getCreatable().setStyle(styleCreatable);
      zoneeditdrawing.setModeCreate(nr.getCreatable());
      zoneeditdrawing.draw();
      $('#'+css+'_zoneedittoolbar button').removeClass('active');
      $('#'+css+'_zoneeditrect').addClass('active');
      $('#'+css+'_zoneeditdel').addClass('disabled');
    });
    $('#'+css+'_zoneeditview').on('click', function(){
      zoneeditdrawing.setModeView();
      $('#'+css+'_zoneedittoolbar button').removeClass('active');
      $('#'+css+'_zoneeditview').addClass('active');
      $('#'+css+'_zoneeditdel').addClass('disabled');
    });
    $('#'+css+'_zoneeditmove').on('click', function(){
      zoneeditdrawing.setModeModify();
      $('#'+css+'_zoneedittoolbar button').removeClass('active');
      $('#'+css+'_zoneeditmove').addClass('active');
      $('#'+css+'_zoneeditdel').removeClass('disabled');
    });
    $('#'+css+'_zoneeditdel').on('click', function(){
      if (typeof(zoneeditdrawing.getSelectedShape()) == 'undefined') {
        alert("Please select a shape");
        return;
      }
      if (window.confirm("Delete selected shape?")) {
        zoneeditdrawing.removeShape(zoneeditdrawing.getSelectedShape());
      }
    });

    $('#'+css+'_but_zoneedit').on('click', function () {
      $('a[href="#'+css+'_tab_zones"').tab('show');
    });

// Oeffnen Zone-Editor-Tab
    $('a[href="#'+css+'_tab_zones"').on('shown.bs.tab', function (e) {
      $('#'+css+'_zoneeditcanvas canvas').remove();
      $('#'+css+'_zoneeditthumb canvas').remove();
      $('#'+css+'_zoneeditcanvas').css('width',$('#'+css+'_zoneedittoolbar').innerWidth());
      zoneeditdrawing = new xrx.drawing.Drawing(goog.dom.getElement(css+'_zoneeditcanvas'));
      zoneeditdrawing.eventViewboxChange = function (x, y) {anno_navigationThumb(zoneeditthumb,zoneeditdrawing)}
      if (zoneeditdrawing.getEngine().isAvailable()) {
        zoneeditdrawing.setBackgroundImage(options.edit_img_url, function() {
          zoneeditdrawing.setModeView();
          zoneeditdrawing.getViewbox().fitToWidth(false);
          zoneeditdrawing.getViewbox().setZoomFactorMax(4);
          var z = $('#'+css+'_field_polygon').val();
          if (z.length > 0) {
            var p = z.split('<end>');
            var i;
            var shapes = new Array();
            for (i = 0; i < p.length; i++) {
              if (p[i]) {
                var coords = anno_coordRel2Abs(JSON.parse('['+p[i]+']'),options.edit_img_width);
                var shape;
                if (anno_isRectangle(coords)) {
                  shape = new xrx.shape.Rect(zoneeditdrawing);
                }
                else {
                  shape = new xrx.shape.Polygon(zoneeditdrawing);
                }
                shape.setCoords(coords);
                shape.setStrokeWidth(1);
                shape.setStrokeColor('#A00000');
                shape.setFillColor('#A00000');
                shape.setFillOpacity(0.2);
                shape.getSelectable().setFillColor('#000000');
                shape.getSelectable().setFillOpacity(0.2);
                shape.getSelectable().setStrokeWidth(3);
                shapes.push(shape);
              }
            }
            zoneeditdrawing.getLayerShape().addShapes(shapes);
          }
          zoneeditdrawing.draw();
          if (typeof(options.edit_img_thumb) != 'undefined') {
            $('#'+css+'_zoneeditthumb').show();
            zoneeditthumb = new xrx.drawing.Drawing(goog.dom.getElement(css+'_zoneeditthumb'));
            if (zoneeditthumb.getEngine().isAvailable()) {
              zoneeditthumb.setBackgroundImage(options.edit_img_thumb, function() {
                zoneeditthumb.setModeDisabled();
                zoneeditthumb.getViewbox().fit(true);
                zoneeditthumb.getViewbox().setPosition(xrx.drawing.Orientation.NW); ;
                zoneeditthumb.draw();
                anno_navigationThumb(zoneeditthumb,zoneeditdrawing)
              });
            }
          }
        });
      }
    });
  }

// Dropdown Bildbezuege setzen
  if (typeof(Cookies) != 'undefined') {
    if (Cookies.get('showref')) {
      $(target+' .'+css+'showrefstatus').hide();
      $(target+' .'+css+'showrefstatus_'+Cookies.get('showref')).show();
    }
  }
// Klick-Event Bildbezüge Dropdown
  $(target+' .'+css+'showrefopt li a').on('click', function() {
    var opt = $(this).attr('data-anno-showref');
    Cookies.set('showref',opt);
    $(target+' span.'+css+'showrefstatus').hide();
    $(target+' span.'+css+'showrefstatus_'+opt).show();
  });

// Wenn Annotation zugeklappt...
  $(target+' .collapse').on('hide.bs.collapse', function() {
    var i = $(this).attr('id').substr(5);
    $('#'+css+'head_'+i).find('span.glyphicon-chevron-down').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-right');
    var no_open = 0;
    var no_close = 0;
    $(target+' .collapse').each(function () {
      if ($(this).hasClass('in')) {no_open++}
      else {no_close++}
    });
    if (!no_open) {
      $(target+' .'+css+'closeall').addClass('hidden');
      $(target+' .'+css+'openall').removeClass('hidden');
    }
  });
  $(target+' .collapse').on('hidden.bs.collapse', function() {
    var no_open = 0;
    var no_close = 0;
    $(target+' .collapse').each(function () {
      if ($(this).hasClass('in')) {no_open++}
      else {no_close++}
    });
    if (!no_open) {
      $(target+' .'+css+'closeall').addClass('hidden');
      $(target+' .'+css+'openall').removeClass('hidden');
    }
  });

// Wenn Anntation aufgeklappt ...
  $(target+' .collapse').on('show.bs.collapse', function() {
    var i = $(this).attr('id').substr(5);
    $('#'+css+'head_'+i).find('span.glyphicon-chevron-right').removeClass('glyphicon-chevron-right').addClass('glyphicon-chevron-down');
    $(this).find('.'+css+'_old_version').css('display','none');
  });
  $(target+' .collapse').on('shown.bs.collapse', function() {
    var no_open = 0;
    var no_close = 0;
    $(target+' .collapse').each(function () {
      if ($(this).hasClass('in')) {no_open++}
      else {no_close++}
    });
    if (no_close == 0) {
      $(target+' .'+css+'openall').addClass('hidden');
      $(target+' .'+css+'closeall').removeClass('hidden');
    }
  });

// Mouseover Annotation ...
  $(target+' .'+css+'item').hover(
    function() {
      setAnnotationStatus($(this).attr('id'),true,css);
      callHighlight(options['highlight'],annotations,$(this).attr('id'),css);
    }, 
    function () {
      setAnnotationStatus($(this).attr('id'),false,css);
      callHighlight(options['highlight'],annotations,'',css);
    }
  );
// Mouseover Kommentar
  $(target+' .'+css+'comment > div:first-child').hover(
    function() {
      setAnnotationStatus($(this).parent().attr('id'),true,css);
      callHighlight(options['highlight'],annotations,'',css);
    },
    function () {
      setAnnotationStatus($(this).parent().attr('id'),false,css);
      callHighlight(options['highlight'],annotations,'',css);
    }
  );

// PURL-Popover
  $(target+' .'+css+'purlbut').popover({title: popover_title(anno_l10n_text(options.lang,'purl')), html: true, placement: 'left'});


// Alle öffnen, Alle Schließen setzen
  $(target+' .collapse').eq(0).collapse('show');
  $(target+' .'+css+'closeall').on('click', function() {
    $(target+' .'+css+'closeall').addClass('hidden');
    $(target+' .'+css+'openall').removeClass('hidden');
    $(target+' .collapse').collapse('hide');
  });
  $(target+' .'+css+'openall').on('click', function() {
    $(target+' .'+css+'openall').addClass('hidden');
    $(target+' .'+css+'closeall').removeClass('hidden');
    $(target+' .collapse').collapse('show');
  });

// Sortierung
  $(target+' .'+css+'sortdate').on('click', function() {
    var optionsnew = options;
    optionsnew.sort = 'date';
    displayAnnotations(targetid,path,optionsnew)
  });
  $(target+' .'+css+'sortdatereverse').on('click', function() {
    var optionsnew = options;
    optionsnew.sort = 'datereverse';
    displayAnnotations(targetid,path,optionsnew)
  });
  $(target+' .'+css+'sorttitle').on('click', function() {
    var optionsnew = options;
    optionsnew.sort = 'title';
    displayAnnotations(targetid,path,optionsnew)
  });

// Speichern im Editor
  $('#'+css+'_modal_edit .'+css+'savebut').on('click', function() {
    console.log($('#'+css+'_field_id').val())
    var ok = 1;
//  Pflichtfelder ausgefüllt?
    $.each(fields, function (k, v) {
      if (typeof($('#'+css+'_field_'+k).attr('required')) != 'undefined' && !$('#'+css+'_field_'+k).val()) {
        $('#'+css+'_field_'+k).closest('.form-group').addClass('has-error');
        ok = 0;
      }
    });
    if (ok) {
      if (typeof(options.edit_img_url) != 'undefined' && typeof(options.edit_img_width) != 'undefined') {
//      Wenn Zoneneditor aufgerufen wurde...
        if (typeof zoneeditdrawing != 'undefined') {
          var shapes = zoneeditdrawing.getLayerShape().getShapes();
          var new_svg_polygon = '';
          for (var i = 0; i < shapes.length; i++) {
            var c = ''
            var polygonnew = anno_coordAbs2Rel(shapes[i].getCoords(),options.edit_img_width);
            for (var j = 0; j < polygonnew.length; j++) {
              if (j > 0) {c += ','}
              c += JSON.stringify(polygonnew[j]);
            }
            if (c) {new_svg_polygon += c + '<end>';}
          }
          $('#'+css+'_field_polygon').val(new_svg_polygon);
        }
      }




// TODO





      $('#'+css+'_modal_edit').modal('hide');
    }
  });

// Version ausgewählt
  $(target+' .'+css+'versions a').on('click', function() {
    var annoid = $(this).closest('.'+css+'item').attr('id');
    var anno = getAnnotation(annotations,annoid);
    var searchid = $(this).attr('data-versionid');
    var ver = getVersion(anno,$(this).attr('data-versionid'));
    if (typeof(ver) != 'undefined') {
      ver.content = getVersionContent(path,annoid,ver,options);
      anno.shown_version = $(this).attr('data-versionid');
      anno.shown_version_polygons = ver.content.svg_polygon;
    }

    $('#old_version_'+annoid).html(versionTemplate);

    var app = new Vue({
      el: '#old_version_'+annoid,
      data: {
        text: t,
        item: ver.content,
//      Zur Schreibvereinfachung css nochmal separat...
        css: css,
        created_display: ver.created_display,
      } 
    });

    $('#old_version_'+annoid).css('display','block');
    callHighlight(options['highlight'],annotations,annoid,css);
    $(target+' .'+css+'versclosebut').on('click', function() {
      $(this).closest('.'+css+'_old_version').css('display','none');
      delete anno['shown_version'];
      delete anno['shown_version_polygons'];
      callHighlight(options['highlight'],annotations,'',css);
    });
  });

// Neue Annotation
  $(target+' .'+css+'new').on('click', function() {
//  Felder leeren
    $.each(fields, function (k, v) {
      if (k != 'text') {
        $('#'+css+'_field_'+k).val('');
      }
    });
    $('#'+css+'_field_parent').val(path);
    initHTMLEditor('#'+css+'_modal_edit form textarea','de','');
    $('#'+css+'_modal_edit .modal-body .nav-tabs a:first').tab('show');
    $('#'+css+'_modal_edit').modal('toggle');
  });

// Kommentar
  $(target+' .'+css+'commentbut').on('click', function() {
//  Felder leeren
    $.each(fields, function (k, v) {
      if (k != 'text') {
        $('#'+css+'_field_'+k).val('');
      }
    });
    initHTMLEditor('#'+css+'_modal_edit form textarea','de','');
    var commentonanno = getAnnotation(annotations,$(this).closest('.'+css+'item, .'+css+'comment').attr('id'));
    $('#'+css+'_field_parent').val(commentonanno.svname);
    $('#'+css+'_modal_edit .modal-body .nav-tabs a:first').tab('show');
    $('#'+css+'_modal_edit').modal('toggle');
  });  

// Annotation editieren
  $(target+' .'+css+'editbut').on('click', function() {
//  Felder vorausfüllen
    var editanno = getAnnotation(annotations,$(this).closest('.'+css+'item, .'+css+'comment').attr('id'));
    $.each(fields, function (k, v) {
      if (k != 'text') {
        $('#'+css+'_field_'+k).val(editanno[v]);
      }
    });
    $('#'+css+'_field_id').val(editanno.id);
    if (typeof(editanno.parent_svname) != 'undefined') {
      $('#'+css+'_field_parent').val(editanno.parent_svname);
    }
    else {
      $('#'+css+'_field_parent').val(path);
    }
    initHTMLEditor('#'+css+'_modal_edit form textarea','de',editanno.text);
    $('#'+css+'_modal_edit .modal-body .nav-tabs a:first').tab('show');
    $('#'+css+'_modal_edit').modal('toggle');
  });

  callHighlight(options['highlight'],annotations,'',css);

  $(document).on('focusin', function(e) {
    if ($(e.target).closest(".mce-window").length) {
        e.stopImmediatePropagation();
    }
  });
 });
}

function initHTMLEditor (selector,language,content) {
  $(selector).val(content);
  var ed = tinymce.editors;
  if (ed.length) {
    ed[0].setContent(content);
  }
  tinymce.init({
      selector: selector,
      plugins: 'image link',
      language: language,
      toolbar: 'undo redo | formatselect | bold italic underline blockquote | alignleft aligncenter alignright | bullist numlist indent outdent | link image',
      menubar: false,
      statusbar: false,
      height: 400,
      width: 350,
  });
}

function getAnnotation(annotations,annoid) {
  var single_annotation = {};
  var gef = 0;
  $.each(annotations, function (k, v) {  
    if (!gef && v.id == annoid) {
      single_annotation = v;
      gef = 1;
    }
    if (!gef && v.hasChildren) {
      single_annotation = getAnnotation(v.children,annoid);
      if (typeof(single_annotation.id) != 'undefined') {gef = 1}
    }
  });
  return single_annotation;
}

function getVersion(annotation,versionid) {
  var single_version = {};
  $.each(annotation.versions, function (k, v) {
    if (v.idshort == versionid) {
      single_version = v;
    }
  });
  return single_version;
}

function getAnnotations(path,options) {
  var annotations = [];
  var tokens = '';
  if (typeof(options.readtoken) != 'undefined' && options.readtoken.length) {tokens += '&rtok='+options.readtoken}
  if (typeof(options.writetoken) != 'undefined' && options.writetoken.length) {tokens += '&wtok='+options.writetoken}
  $.ajax({
    dataType: 'xml',
    url: 'http://digi.ub.uni-heidelberg.de/annotations?forward='+path+'/fcr:export?recurse=true&skipBinary=false',
// neu:
//    url: annoserviceurl+'?service='+options.service+'&target='+path+tokens,
    async: false,
  }).done(function (annoxml) {
//    var data = xmlToJson($.parseXML(annoxml));
    if (annoxml != null) {
      var data = xmlToJson(annoxml);
      if (typeof(data['sv:node']) != 'undefined') {
        var data1 = data['sv:node'];
        $.each(data1['sv:property'], function (ky, val) {
          var a = val['@attributes'];
          if (a["sv:name"] == 'user_rights') {
            if (val['sv:value']['#text'] == 'comment') {
         


            }
          }
        });
        if (typeof(data1['sv:node']) != 'undefined') {
          convertTree(annotations, data1['sv:node'], path, path, options);
        }
        else {
          console.log('Error in reading data', data1)
        }
      }
    }
  });
  return annotations;
}

function getVersionContent(path,annoidentifier,vers,options) {
  var versionid = vers.idshort;
  var result = {};
  var version = {};
  $.ajax({
    accepts: {
      jsonld: 'application/ld+json'
    },
    converters: {
      'text jsonld': function(result) {
        return JSON.parse(result);
      }
    },
    dataType: 'jsonld',
    url: 'http://digi.ub.uni-heidelberg.de/annotations?forward='+path+'/'+annoidentifier+'/fcr:versions/'+versionid+'/',
// neu:
//      url: annoserviceurl+'?service='+options.service+'&target='+path+'/'+annoidentifier+'/fcr:versions/'+versionid+'/',
    async: false,
  }).done(function (data) {
//  ???
    if (typeof(data[0]['http://purl.org/dc/elements/1.1/title']) != 'undefined') {result = data[0]}
    else {result = data[1]} 
  });
  if (typeof(result) != 'undefined') {
    if (typeof(result['http://purl.org/dc/elements/1.1/title']) != 'undefined') {
      version.title = result['http://purl.org/dc/elements/1.1/title'][0]['@value'];
    }
    if (typeof(result['http://purl.org/dc/elements/1.1/description-ger']) != 'undefined') {
      version.text = result['http://purl.org/dc/elements/1.1/description-ger'][0]['@value'];
    }
    if (typeof(result['http://purl.org/dc/elements/1.1/source']) != 'undefined') {
      version.link = result['http://purl.org/dc/elements/1.1/source'][0]['@value'];
    }
    else {version.link = ''}
    if (typeof(result['http://www.w3.org/2000/svg#polygon']) != 'undefined') {
      for (nr in result['http://www.w3.org/2000/svg#polygon']) {
        version.svg_polygon = result['http://www.w3.org/2000/svg#polygon'][nr]['@value'] + '<end>';
      }
    }
    if (vers["http://fedora.info/definitions/v4/repository#created"][0]['@value']) {
      version.date = vers["http://fedora.info/definitions/v4/repository#created"][0]['@value'];
    }
  }
  else {
    version.text = 'kein Annotationen vorhanden';
  }
  version.annotation_identifier = annoidentifier;

  return version;
}


function getVersions(anno,path,options) {
  if (anno.versioned && !anno.versions_loaded) {
    $.ajax({
      accepts: {
        jsonld: 'application/ld+json'
      },
      converters: {
        'text jsonld': function(result) {
          return JSON.parse(result);
        }
      },
      dataType: 'jsonld',
      url: 'http://digi.ub.uni-heidelberg.de/annotations?forward='+path+'/'+anno.id+'/fcr:versions',
// neu:
//      url: annoserviceurl+'?service='+options.service+'&target='+path+'/'+anno.id+'/fcr:versions',
      async: false,
    }).done(function (versionjson) {
      if (typeof(versionjson) == 'object') {
        var sort_text = "http://fedora.info/definitions/v4/repository#created";
        versionjson = versionjson.splice(1, versionjson.length);
        anno.versions = versionjson.sort(function(a,b) {
          if (a[sort_text][0]['@value'] < b[sort_text][0]['@value']) return 1;
          if (a[sort_text][0]['@value'] > b[sort_text][0]['@value']) return -1;
          return 0;
        });
        $.each(anno.versions, function (k, v) {
          v.created_display = convertDate(v[sort_text][0]['@value']);
          v.idshort = v['@id'].split('/')[v['@id'].split('/').length-1];
        });
      }
    });
  }
  anno.versions_loaded = true;
}

var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

function base64Decode(typ, s){
  if(typ=== 'Binary'){
    if (typeof s === 'object'){
      var out='';
      for (var i in s) {
        out += Base64.decode(s[i]);
      }
      return out;
    }
    else {
    return Base64.decode(s);
  }
    }
  else {
    return s
  }
}

function xmlToJson(xml) {
  var attr,
      child,
      attrs = xml.attributes,
      children = xml.childNodes,
      key = xml.nodeType,
      obj = {},
      i = -1;

  if (key === 1 && attrs.length) {
    obj[key = '@attributes'] = {};
    while (attr = attrs.item(++i)) {
      obj[key][attr.nodeName] = attr.value;
    }
    i = -1;
  } else if (key === 3) {
    obj = xml.nodeValue;
  }
  while (child = children.item(++i)) {
    key = child.nodeName;
    if (obj.hasOwnProperty(key)) {
      if (obj.toString.call(obj[key]) !== '[object Array]') {
        obj[key] = [obj[key]];
      }
      obj[key].push(xmlToJson(child));
    }
    else {
      obj[key] = xmlToJson(child);
    }
  }
  return obj;
}

function convertProperties(prop, properties, parent_string, options) {
  var anno = {};
/*  if (prop['@attributes']) {
    anno.identifier = prop['@attributes']['sv:name'];
console.log('anno.identifier: '+anno.identifier);
  } */
  if (properties['sv:name']) {
    anno.id = properties['sv:name'];
  }
  anno.iiif_url = '';
  anno.editable = false;
  anno.commentable = false;
  anno.hasChildren = false;
  anno.hasComment = false;
  anno.versions_loaded = false;
  anno.versions = [];
  $.each(prop, function (ky, val) {
    var a = val['@attributes'];
    var p ;
    if (typeof(val['sv:value']) != 'undefined' && typeof(val['sv:value']['#text']) != 'undefined') {
      p =base64Decode(a['sv:type'], val['sv:value']['#text']);

    }

    if (a["sv:name"] == 'svg:polygon') {
      anno.hasZones = 1;
    }

    $.each(typeList, function (k, v) {
      if (a["sv:name"] === k) {
        var strn = "anno." + v;
        if (typeof(val['sv:value']) != 'undefined') {
          if (typeof(val['sv:value']['#text']) == 'undefined') {
            var temp = "";
            $.each(val['sv:value'], function (key, value) {
              if (typeof(value['#text']) != 'undefined') {
                temp += base64Decode(a['sv:type'],value['#text']) + '<end>';
              }
            });
            anno[v] = temp;
          }
          else {
            anno[v] = p;
          }
        }
      }
    });
  });

  if (typeof(anno.user_rights) != 'undefined') {
    if (anno.user_rights == 'edit') {
      anno.editable = true;
      anno.commentable = true;
    }
    if (anno.user_rights == 'comment') {
      anno.commentable = true;
    }
  }

  if (typeof(properties) != 'undefined') {
    anno.svname = parent_string + '/' + properties['sv:name'];
    anno.clean_svname = properties['sv:name'];
  }

  if (typeof(anno.user_name) == 'undefined' || anno.user_name == '') {
    anno.user_name = anno.account;
  }
  if (typeof(anno.jcr_modified) != 'undefined' && anno.jcr_modified != '') {
    anno.jcr_modified_display = convertDate(anno.jcr_modified);
  }

// IIIF-URL ergaenzen (temporaer, bis eigenes Target)
  if (anno.hasZones && typeof(options.iiif_url) != 'undefined' && typeof(options.iiif_img_width) != 'undefined' && typeof(options.iiif_img_height) != 'undefined' && options.iiif_url.length) {
    var allpolygons = [];
    if (typeof(anno.svg_polygon) != 'undefined') {
      polygons = anno.svg_polygon.split('<end>');
      $.each(polygons, function (key, value) {
        if (value.length > 0 && typeof(value) != 'undefined' && value !== 'undefined') {
          allpolygons.push(JSON.parse('[' + value + ']'));
        }
      });
    }
    if (allpolygons.length) {
      anno.iiif_url = options.iiif_url + anno_coordIIIF(allpolygons,options.iiif_img_width,options.iiif_img_height) + '/full/0/default.jpg';
    }
  }

  return anno;
};

function callHighlight(callback,annotations,active,csspraefix) {
    // Liste der Annotationen
    // Liste der aktiven Annotationen und Kommentare(IDs) Hash mit Stufe als Value?
    // Versions-Polygon
    try {
      var fn = window[callback];
      if (typeof(fn) == 'function') {
        fn(annotations,active,csspraefix,Cookies.get('showref'));
      }
    }
    catch(err) {
      console.log(err);
    }
}

function convertDate(datestring,loc) {
  var dateObj = new Date(datestring);
  return dateObj.toLocaleString();
}

function convertTree(toAdd, data1, parent_string, path, options) {
  if ($.isArray(data1) === false) {
    var elem = convertProperties(data1['sv:property'], data1['@attributes'], parent_string, options);
    var element_position = toAdd.push(elem);
    if (toAdd.versioned !== null) {
      getVersions(toAdd,path,options);
    }
    var child = data1['sv:node'];
    var pos = element_position - 1;
    if (child) {
      toAdd[pos].children = [];
      convertTree(toAdd[pos].children, child, elem.svname, path, options);
      toAdd[pos].hasChildren = true;
      if (toAdd[pos].children[0].type == 'comment') {toAdd[pos].hasComment = true}
      for(var i = 0; i < toAdd[pos].children.length; i++) {
        toAdd[pos].children[i]['parent_svname'] = toAdd[pos].svname;
      }
    }
  }
  else {
    $.each(data1, function (key, value) {
      if (value['sv:property']) {
        var elem = convertProperties(value['sv:property'], value['@attributes'], parent_string, options);
        var element_position = toAdd.push(elem);
        var pos = element_position - 1;
        if (toAdd[key].versioned !== null) {
          getVersions(toAdd[key],path,options);
        }
        var child = value['sv:node'];
        if (child) {
          toAdd[pos].children = [];
          convertTree(toAdd[pos].children, child, elem.svname, path, options);
          toAdd[pos].hasChildren = true;
          if (toAdd[pos].children[0].type == 'comment') {toAdd[pos].hasComment = true}
          for(var i = 0; i < toAdd[pos].children.length; i++) {
            toAdd[pos].children[i]['parent_svname'] = toAdd[pos].svname;
          }
        }
      }
    });
  }
}

function popover_title(title) {
  return '<span class="text-info">'+title+'</span>&nbsp;&nbsp;<button type="button" id="close" class="close" onclick="$(\'.popover\').popover(\'hide\');">&times;</button>';
}

var annoColTemplate = `
      <div v-bind:id="css+'_modal_edit'" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
           <div class="modal-content">
             <div class="modal-header">
               <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
               <h4 class="modal-title">{{text.edit_headline}}</h4>
             </div>
             <div class="modal-body">
               <ul class="nav nav-tabs">
                 <li role="presentation" class="active"><a v-bind:href="'#'+css+'_tab_metadata'" role="tab" area-controls="tab_metadata" data-toggle="tab">{{text.metadata}}</a></li>
                 <li role="presentation"><a v-bind:href="'#'+css+'_tab_zones'" role="tab" area-controls="tab_zones" data-toggle="tab">{{text.zones}}</a></li>
               </ul>
               <div class="tab-content">
                 <div role="tabpanel" class="tab-pane active" v-bind:id="css+'_tab_metadata'">
                   <form action="" method="get">
                     <input v-bind:id="css+'_field_id'"/>
                     <input v-bind:id="css+'_field_parent'"/>
                     <div class="form-group"><input v-bind:id="css+'_field_title'" v-bind:placeholder="text.annofield_title" class="form-control" type="text" required="true"><br/></div>
                     <div class="form-group"><textarea v-bind:id="css+'_field_text'"></textarea></div><br/>
                     <div class="form-group"><input v-bind:id="css+'_field_link'" v-bind:placeholder="text.annofield_link" class="form-control" type="text"/><input v-bind:id="css+'_field_linktitle'" v-bind:placeholder="text.annofield_linktitle" class="form-control" type="text"/><br/></div>
                     <button v-if="zoneedit" v-bind:id="css+'_but_zoneedit'" type="button"><img v-bind:src="annoservicehosturl+'/img/polygon.png'" alt="polygon"> {{text.edit_zones}}</button>
                     <input v-if="zoneedit" v-bind:id="css+'_field_polygon'" class="form-control"/>
                     <div v-bind:class="css+'license'">{{text.license}}</div>
                     <div style="clear: both;"></div>
                   </form>
                 </div>
                 <div role="tabpanel" class="tab-pane" v-bind:id="css+'_tab_zones'">
                 </div>
               </div>
             </div>
             <div class="modal-footer">
               <button type="button" class="btn btn-default" data-dismiss="modal">{{text.cancel}}</button>
               <button type="button" v-bind:class="css+'savebut btn btn-primary'">{{text.save}}</button>
             </div>
           </div>
        </div>
      </div>
      <div class="panel panel-default">
        <div v-bind:id="css+'_annotations'">
          <span class="fa fa-comments" style="color: #606060;"></span> {{text.headline}} 
          <div class="btn-group pull-right hidden-print" role="group">
            <button v-if="options.writetoken" v-bind:class="'btn btn-default btn-xs '+css+'new'">{{text.new}}</button>
            <a v-if="options.login && !options.readtoken" v-bind:href="options.login" class="btn btn-default btn-xs">{{text.login}}</a>
            <button v-bind:class="'btn btn-default btn-xs '+css+'openall'">{{text.open_all}}</button>
            <button v-bind:class="'btn btn-default btn-xs hidden '+css+'closeall'">{{text.close_all}}</button>
            <button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-expanded="false">{{text.sort}} <span class="caret"></span></button>
             <ul class="dropdown-menu small" role="menu">
               <li><a v-bind:class="'small '+css+'sortdate'">{{text.sortdate}} <span v-if="options.sort == 'date'" class="glyphicon glyphicon-ok"></span></a></li>
               <li><a v-bind:class="'small '+css+'sortdatereverse'">{{text.sortdatereverse}} <span v-if="options.sort == 'datereverse'" class="glyphicon glyphicon-ok"></span></a></li>
               <li><a v-bind:class="'small '+css+'sorttitle'">{{text.sorttitle}} <span v-if="options.sort == 'title'" class="glyphicon glyphicon-ok"></span></a></li>
             </ul>
          </div>
          <div style="clear: both;"></div>
          <div v-bind:class="'hidden-print '+css+'showrefopt'">
            <div class="dropdown pull-right">
              <button type="button" class="btn btn-default btn-xs dropdown-toggle" v-bind:id="css+'dropdownMenuS'" data-toggle="dropdown" aria-expanded="false">{{text.showref}}: <span v-bind:class="css+'showrefstatus_0 '+css+'showrefstatus'">{{text.showrefdefault}}</span><span v-bind:class="css+'showrefstatus_1 '+css+'showrefstatus'">{{text.showrefalways}}</span><span v-bind:class="css+'showrefstatus_2 '+css+'showrefstatus'">{{text.showrefnever}}</span> <span class="caret"></span></button>
              <ul class="dropdown-menu small" role="menu" v-bind:aria-labelledby="css+'dropdownMenuS'">
                <li><a class="small" data-anno-showref="0">{{text.showrefdefault}}&nbsp;<span v-bind:class="'glyphicon glyphicon-ok '+css+'showrefstatus_0 '+css+'showrefstatus'" aria-hidden="true"></span></a></li>
                <li><a class="small" data-anno-showref="1">{{text.showrefalways}}&nbsp;<span v-bind:class="'glyphicon glyphicon-ok '+css+'showrefstatus_1 '+css+'showrefstatus'" aria-hidden="true"></span></a></li>
                <li><a class="small" data-anno-showref="2">{{text.showrefnever}}&nbsp;<span v-bind:class="'glyphicon glyphicon-ok '+css+'showrefstatus_2 '+css+'showrefstatus'" aria-hidden="true"></span></a></li>
              </ul>
            </div>
            <div style="clear: both;"></div>
          </div>
          <div class="panel-group" role="tablist" aria-multiselectable="true">
            <div v-for="item in annotations_sorted" v-bind:id="item.id" v-bind:class="css+'item panel panel-default'">
              <div class="panel-heading" data-toggle="collapse" v-bind:href="'#coll_'+item.id" aria-expanded="true" v-bind:aria-controls="item.id" v-bind:id="css+'head_'+item.id" role="tab">
                <h4 class="panel-title"><a role="button"><span class="glyphicon glyphicon-chevron-right"></span> {{item.title}}</a></h4>
              </div>
              <div v-bind:id="'coll_'+item.id" class="panel-collapse collapse" role="tabpanel" v-bind:aria-labbelledby="css+'head_'+item.id">
                <div class="panel-body">
                  <div v-bind:id="'old_version_'+item.id" v-bind:class="'well '+css+'_old_version'"></div>
                  <div class="media" style="height: auto;">
                    <div class="media-body">
                      <div v-if="item.user_name">
                        <button class="btn btn-xs"><span class="glyphicon glyphicon-user"> </span>{{item.user_name}} {{item.jcr_modified_display}}</button>
                        <button v-bind:class="'btn btn-xs '+css+'purlbut'" data-toggle="popover" v-bind:data-content="options.purl+'/'+item.clean_svname"><span class="glyphicon glyphicon-link"></span></button>
                      </div>
                      <br>
                      <div v-html="item.text"></div>
                      <p v-if="item.link"><a v-bind:href="item.link" target="_blank"><span v-if="item.sourcedescription">{{item.sourcedescription}}</span><span v-else>{{item.link}}</span></a></p>
                      <div v-if="!options.no_oai" v-bind:class="css+'iiiflink'"><template v-if="item.iiif_url"><button class="btn-link" onclick="anno_toggle_iiif($(this));"><span class="fa fa-caret-right"></span> Bildausschnitt (IIIF-Image)</button><div><a v-bind:href="item.iiif_url" target="_blank">{{item.iiif_url}}</a></div></template></div>
                    </div>
                  </div>
                  <!-- navigation -->
                  <div class="btn-toolbar pull-right" role="toolbar" style="margin-top: 10px;">
                    <div class="btn-group btn-group-xs pull-right" role="group">
                      <button v-if="item.editable" v-bind:class="'btn btn-default '+css+'editbut'"><i class="fa fa-pencil"></i> &nbsp;{{text.edit}}</button>
                      <button v-if="item.commentable" v-bind:class="'btn btn-default '+css+'commentbut'"><i class="fa fa-reply"></i> &nbsp;{{text.comment}}</button>
                      <template v-if="item.versioned"><button class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">{{text.previous}} <span class="caret"></span></button><ul v-bind:class="'dropdown-menu pull-right '+css+'versions'"><li v-for="version in item.versions"><a class="small" v-bind:data-versionid="version.idshort"><span class="glyphicon glyphicon-time"></span> {{version.created_display}}</a></li></ul></template>
                    </div>
                  </div>
                  <div style="clear: both; margin-bottom: 2px;"></div>
                  <template v-if="item.hasChildren">
                    <div><div v-bind:class="css+'separator'"><span v-if="item.hasComment">{{text.comments}}</span></div></div>
                    <annocomments v-bind:anno="item" v-bind:options="options" v-bind:css="css"></annocomments>
                  </template>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
`;

var versionTemplate = `
          <div v-bind:class="css+'versionhead'">{{text.version_from}}: {{created_display}}</div>
          <h4 v-html="item.title"></h4>
          <div v-html="item.text"></div>
          <p v-if="item.link"><a v-bind:href="item.link" target="_blank"><span v-if="item.sourcedescription">{{item.sourcedescription}}</span><span v-else>{{item.link}}</span></a></p>
          <div class="pull-right"><button v-bind:class="'btn btn-default btn-xs '+css+'versclosebut'"><i class="fa fa-times-circle-o"></i> {{text.close}}</button></div>
          <div style="clear: both;"></div>
`;

var zoneEditTemplate = ` 
          <div v-bind:id="css+'_zoneedittoolbar'">
            <div class="btn-group" role="group" style="float: left;">
              <button class="btn btn-default btn-sm" v-bind:id="css+'_zoneeditview'" v-bind:title="text.move_fak"><span class="glyphicon glyphicon-move"></span></button>
              <button class="btn btn-default btn-sm" v-bind:id="css+'_zoneeditzoomout'" v-bind:title="text.zoom_out"><span class="glyphicon glyphicon-zoom-out"></span></button>
              <button class="btn btn-default btn-sm" v-bind:id="css+'_zoneeditzoomin'" v-bind:title="text.zoom_in"><span class="glyphicon glyphicon-zoom-in"></span></button>
              <button class="btn btn-default btn-sm" v-bind:id="css+'_zoneeditfittocanvas'" v-bind:title="text.fit"><span class="glyphicon glyphicon-fullscreen"></span></button>
              <button class="btn btn-default btn-sm" v-bind:id="css+'_zoneeditrotleft'" v-bind:title="text.rotate_left"><span class="fa fa-rotate-left"></span></button>
              <button class="btn btn-default btn-sm" v-bind:id="css+'_zoneeditrotright'" v-bind:title="text.rotate_right"><span class="fa fa-rotate-right"></span></button>
            </div>
            <div style="float: left; margin-left: 30px;"><span style="font-size: 90%; color: #505050;">{{text.zones}}</span>
              <div class="btn-group" role="group" style="margin-left: 5px;">
                <button class="btn btn-default btn-sm" v-bind:id="css+'_zoneeditpolygon'" v-bind:title="text.add_polygon"><span class="fa fa-plus"></span> <img v-bind:src="annoservicehosturl+'/img/polygon.png'" alt="polygon"></button>
                <button class="btn btn-default btn-sm" v-bind:id="css+'_zoneeditrect'" v-bind:title="text.add_rect"><span class="fa fa-plus"></span> <img v-bind:src="annoservicehosturl+'/img/rect.png'" alt="rect"></button>
                <button class="btn btn-default btn-sm" v-bind:id="css+'_zoneeditmove'" v-bind:title="text.move_zone"><span class="fa fa-hand-o-up"></span></button>
              </div>
              <div class="btn-group" role="group" style="margin-left: 5px;">
                <button class="btn btn-default btn-sm disabled" v-bind:id="css+'_zoneeditdel'" v-bind:title="text.del_zones"><span class="glyphicon glyphicon-trash"></span></button>
              </div>
            </div>
            <div style="clear: both;"></div>
          </div>
          <div style="position: relative">
            <div v-bind:id="css+'_zoneeditcanvas'" style="width: 300px; height: 600px;"></div>
            <div v-bind:id="css+'_zoneeditthumb'" style="position: absolute; z-index: 999; top: 2px; left: 2px; width: 120px; opacity: 0.7; height: 120px; border: 1px solid #404040; display: none;"></div>
          </div>
`;

function anno_isRectangle(c) {
  if ($.isArray(c)) {
    if (c.length == 4) {
      var xcoords = {};
      var ycoords = {};
      var i;
      var oldx = 0;
      var oldy = 0;
      for (i = 0; i < c.length; i++) {
        if (xcoords[c[i][0]]) {xcoords[c[i][0]]++}
        else {xcoords[c[i][0]]=1}
        if (ycoords[c[i][1]]) {ycoords[c[i][1]]++}
        else {ycoords[c[i][1]]=1}
        if (i > 0) {
          if (c[i][0] != oldx && c[i][1] != oldy) {return false}
        }
        oldx = c[i][0];
        oldy = c[i][1];
      }
      var size = 0, key;
      for (key in xcoords) {
        if (xcoords.hasOwnProperty(key)) {
          size++;
          if (xcoords[key] != 2) {return false}
        }
      }
      if (size != 2) {return false}
      size = 0;
      for (key in ycoords) {
        if (ycoords.hasOwnProperty(key)) {
          size++;
          if (ycoords[key] != 2) {return false}
        }
      }
      if (size != 2) {return false}
      return true;
    }
  }
  return false;
}

function anno_coordIIIF (polygons,imgwidth,imgheight) {
  var maxx = 0;
  var minx = imgwidth;
  var maxy = 0;
  var miny = imgheight;

  var i;
  var j;

  if ($.isArray(polygons)) {
    for (i = 0; i < polygons.length; i++) {
      if ($.isArray(polygons[i])) {
        for (j = 0; j < polygons[i].length; j++) {
          if (polygons[i][j][0] > maxx) {maxx = polygons[i][j][0]}
          if (polygons[i][j][0] < minx) {minx = polygons[i][j][0]}
          if (polygons[i][j][1] > maxy) {maxy = polygons[i][j][1]}
          if (polygons[i][j][1] < miny) {miny = polygons[i][j][1]}
        }
      }
    }
  }
  minx *= imgwidth/1000;
  maxx *= imgwidth/1000;
  miny *= imgwidth/1000;
  maxy *= imgwidth/1000;
  var difx = maxx-minx;
  var dify = maxy-miny;
  return parseInt(minx)+','+parseInt(miny)+','+Math.round(difx)+','+Math.round(dify);
}

function anno_coordAbs2Rel (polygon,imgwidth) {
  var i;
  var polygonrel = new Array();
  if ($.isArray(polygon) && imgwidth > 0) {
    for (i = 0; i < polygon.length; i++) {
      var p = polygon[i];
      var px = p[0] * 1000 / imgwidth;
      var py = p[1] * 1000 / imgwidth;
      polygonrel.push([px,py]);
    }
  }
  return polygonrel;
}

function anno_coordRel2Abs (polygon,imgwidth) {
  var i;
  var polygonabs = new Array();
  if ($.isArray(polygon) && imgwidth > 0) {
    for (i = 0; i < polygon.length; i++) {
      var p = polygon[i];
      var px = Math.round(p[0] * imgwidth / 1000);
      var py = Math.round(p[1] * imgwidth / 1000);
      polygonabs.push([px,py]);
    }
  }
  return polygonabs;
}

function anno_navigationThumb (thumbdrawing,origdrawing) {
  if (typeof(thumbdrawing) == 'undefined') {return}
  if (typeof(origdrawing) == 'undefined') {return}
  var status = Cookies.get('navThumb');
  if (status == '0') {return}

  $('#'+thumbdrawing.element_.id).fadeIn();
  $('#'+thumbdrawing.element_.id).next('.thumbEye').eq(0).fadeIn();
  clearTimeout(thumbTimeout);
  thumbTimeout = window.setTimeout(function() {$('#'+thumbdrawing.element_.id).fadeOut(1000);$('#'+thumbdrawing.element_.id).next('.thumbEye').eq(0).fadeOut(1000);}, 3000);

  var matrix = origdrawing.getViewbox().ctmDump();
  var trans = new goog.math.AffineTransform(matrix[0],matrix[1],matrix[2],matrix[3],matrix[4],matrix[5]);
  var scaleX = Math.sqrt(Math.pow(trans.getScaleX(),2)+Math.pow(trans.getShearX(),2));
  var scaleY = Math.sqrt(Math.pow(trans.getScaleY(),2)+Math.pow(trans.getShearY(),2)); /* == scaleX, wenn keine Scherung */
  var thumbWidth = thumbdrawing.getLayerBackground().getImage().getWidth();
  var thumbHeight = thumbdrawing.getLayerBackground().getImage().getHeight();
  var origwidth = origdrawing.getLayerBackground().getImage().getWidth();
  var origheight = origdrawing.getLayerBackground().getImage().getHeight();
  var faktorX = thumbWidth/(origwidth*scaleX);
  var faktorY = thumbHeight/(origheight*scaleY);

  var bildLO = new Array();
  trans.transform([0,0],0,bildLO,0,1);

  var ausschnittWidth = origdrawing.getCanvas().getWidth();
  var ausschnittHeight = origdrawing.getCanvas().getHeight();
  var ausschnittRect = new xrx.shape.Rect(thumbdrawing);

  var ausschnittRectP1 = new Array();
  var ausschnittRectP2 = new Array();
  var ausschnittRectP3 = new Array();
  var ausschnittRectP4 = new Array();
  var angle = angle_from_matrix(matrix[0],matrix[1]);
/* Drechung 90 Grad rechts */
  if (angle == 270) {
    ausschnittRectP1 = [(0-bildLO[1])*faktorY,(bildLO[0]-ausschnittWidth)*faktorX];
    ausschnittRectP2 = [(ausschnittHeight-bildLO[1])*faktorY,(bildLO[0]-ausschnittWidth)*faktorX];
    ausschnittRectP3 = [(ausschnittHeight-bildLO[1])*faktorY,bildLO[0]*faktorX];
    ausschnittRectP4 = [(0-bildLO[1])*faktorY,bildLO[0]*faktorX]
  }
/* Drechung 180 Grad  */
  else if (angle == 180) {
    ausschnittRectP1 = [(bildLO[0]-ausschnittWidth)*faktorX,(bildLO[1]-ausschnittHeight)*faktorY];
    ausschnittRectP2 = [(bildLO[0])*faktorX,(bildLO[1]-ausschnittHeight)*faktorY];
    ausschnittRectP3 = [(bildLO[0])*faktorX,(bildLO[1])*faktorY];
    ausschnittRectP4 = [(bildLO[0]-ausschnittWidth)*faktorX,(bildLO[1])*faktorY];
  }
/* Drechung 90 Grad links */
  else if (angle == 90) {
    ausschnittRectP1 = [(bildLO[1]-ausschnittHeight)*faktorY,(0-bildLO[0])*faktorX];
    ausschnittRectP2 = [(bildLO[1])*faktorY,(0-bildLO[0])*faktorX];
    ausschnittRectP3 = [(bildLO[1])*faktorY,(ausschnittWidth-bildLO[0])*faktorX];
    ausschnittRectP4 = [(bildLO[1]-ausschnittHeight)*faktorY,(ausschnittWidth-bildLO[0])*faktorX]
  }
  else {
/* Drehung 0 Grad */
    ausschnittRectP1 = [(0-bildLO[0])*faktorX,(0-bildLO[1])*faktorY];
    ausschnittRectP2 = [(ausschnittWidth-bildLO[0])*faktorX,(0-bildLO[1])*faktorY];
    ausschnittRectP3 = [(ausschnittWidth-bildLO[0])*faktorX,(ausschnittHeight-bildLO[1])*faktorY];
    ausschnittRectP4 = [(0-bildLO[0])*faktorX,(ausschnittHeight-bildLO[1])*faktorY];
  }

  var rect = new xrx.shape.Rect(thumbdrawing);
  rect.setCoords([ausschnittRectP1,ausschnittRectP2,ausschnittRectP3,ausschnittRectP4]);
  rect.setStrokeWidth(1.5);
  var color = '#A00000';
  if (typeof(zonecolor) == 'object' && zonecolor.length > 3) {
    color = '#'+zonecolor[0];
  }
  rect.setStrokeColor(color);
  rect.setFillColor(color);
  rect.setFillOpacity(0.15);
  var rects = new Array();
  rects.push(rect);
  thumbdrawing.getLayerShape().removeShapes();
  thumbdrawing.getLayerShape().addShapes(rect);
  thumbdrawing.draw();
}

function anno_toggle_iiif (context) {
  context.parent().find('div').toggle();
  if (context.parent().find('div').css('display') == 'none') {
    context.find('span').removeClass('fa-caret-down');
    context.find('span').addClass('fa-caret-right');
  }
  else {
    context.find('span').removeClass('fa-caret-right');
    context.find('span').addClass('fa-caret-down');
  }
};

