var app = app || {};

// shared app variables, move these inside the IIFE for production
var map,
    vizJSON,
    basemapLayer,
    layerToggle,
    mapLayers,
    carto,
    sql,
    infowindows;

    // mapboxgl.accessToken = 'pk.eyJ1IjoibGJsb2siLCJhIjoiY2o3djQ2ODd4MnVjMjJwbjBxZWZtZDB2ZiJ9.4gctlFUX_n0BzOAwbuL2aw';
    // const map = new mapboxgl.Map({
    // container: 'map',
    // style: 'mapbox://styles/lblok/cjk4889sb29b12splkdw0pzop',
    // center: [-73.919606, 40.677795],
    // zoom: 12.0
    // });

app.map = (function(w, d, L, $) {


  function initMap() {
    // initiates the Leaflet map
    basemapLayer = L.tileLayer('https://api.mapbox.com/styles/v1/lblok/cjk4889sb29b12splkdw0pzop/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibGJsb2siLCJhIjoiY2o3djQ2ODd4MnVjMjJwbjBxZWZtZDB2ZiJ9.4gctlFUX_n0BzOAwbuL2aw', {
      maxZoom: 22,  
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://carto.com/attributions">Carto</a>'
      });


      
      
      map = new L.Map('map', {
        center: [40.694045, -73.946571],
        zoom: 12,
        zoomControl: false,
      });
      
      new L.Control.Zoom({ position: 'bottomleft' }).addTo(map);
      
      map.addLayer(basemapLayer);
      
      // add address geocoder
      var geocoder = L.Control.geocoder({
        position: 'topleft', 
        collapsed: true, 
        placeholder:'', 
        defaultMarkGeocode: true, 
        geocoder:new L.Control.Geocoder.Bing("AnnevUOl-OXpLPrGjyTTzrwfiIBtB9CLKnO4rUwTKNlBXJS_2cr_nOA6pAoEUr7E"),
        })
        .on('markgeocode', function(e) {
        var bbox = e.geocode.bbox;
        map.fitBounds(bbox);
      })
      .addTo(map);
      

    }
    // set the cartodb sql object up
    sql = cartodb.SQL({ user: 'anhdnyc' });
  

  function createCDBLayer() {
    // adds the CartoDB overlay from the viz.json URL
    vizJSON = 'https://anhdnyc.cartodb.com/api/v2/viz/5dc8e250-31ab-11e6-a738-0ecfd53eb7d3/viz.json';
    // grab cartocss object
    carto = app.cartocss;

    // for use with CartoDB's 'Named Maps API', loads the data but
    // currently doesn't work with toggling the sublayers...
    var layerSource = {
      user_name: 'anhdnyc',
      type: 'namedmap',
      named_map: {
        name: 'dapmaptest',
        layers: [
          {
            layer_name: "rentregscore"
          },
          {
            layer_name: "dobscore"
          },
          {
            layer_name: "dofscore",
          },
          {
            layer_name: "evicscore",
          },
          {
            layer_name: "cb",
          },
          {
            layer_name: "cd",
          },
          {
            layer_name: "zipcode",
          }
        ]
      }
    };


    // you can switch how the cartodb layers are added below by passing either
    // layerSource or vizJSON as the second parameter to cartodb.createLayer()
    cartodb.createLayer(map, layerSource, {'https': true})
      .addTo(map)
      .done(function(layer) {

        mapLayers = [];
        var i = 0, sublayerCount = layer.getSubLayerCount();

        for (i; i < sublayerCount; i++) {
          var sublayer = layer.getSubLayer(i);
          mapLayers.push(sublayer);
        }

        /* when using the layerSource object, create infowindows like so: */
        infowindows = [];
        infowindows[0] = cdb.vis.Vis.addInfowindow(map,layer.getSubLayer(0),["cartodb_id"], {infowindowTemplate: $('#rentregscore_infowindow').html()});
        infowindows[1] = cdb.vis.Vis.addInfowindow(map,layer.getSubLayer(1),["cartodb_id"], {infowindowTemplate: $('#dobscore_infowindow').html()});
        infowindows[2] = cdb.vis.Vis.addInfowindow(map,layer.getSubLayer(2),["cartodb_id"], {infowindowTemplate: $('#dofscore_infowindow').html()});
        infowindows[3] = cdb.vis.Vis.addInfowindow(map,layer.getSubLayer(3),["cartodb_id"], {infowindowTemplate: $('#evicscore_infowindow').html()});


        mapLayers[0].show(); // rentregscore
        mapLayers[1].hide(); // dobscore
        mapLayers[2].hide(); // dofscore
        mapLayers[3].hide(); // evicscore

        mapLayers[4].hide(); // community districts
        mapLayers[4].setInteraction(false);
        mapLayers[5].hide(); // city council districts
        mapLayers[5].setInteraction(false);
        mapLayers[6].hide(); // city council districts
        mapLayers[6].setInteraction(false);

        // using the layerSource you can alter a "placeholder"
        // value from the template like so:
        // layer.setParams({ cc_sql: 30 });

        // listen for opening of popups to fomat numbers - THIS IS PROBABLY NOT NECESSARY ANYMORE 
        mapLayers[0].on('featureClick', function(e, latlng, pos, data, layer) {
          $('#pctchange').text((parseFloat($('#pctchange').text())*1).toFixed(0) + "%");
        });

        mapLayers[2].on('featureClick', function(e, latlng, pos, data, layer) {
          if ($('#pctchange').text().indexOf('%') == -1) {
            $('#pctchange').text((parseFloat($('#pctchange').text())*1).toFixed(0) + "%");
          }
        });

      })
      .error(function(error) {
        console.log('error loading CDB data', error);
      });
  }

  function wireLayerBtns() {
    // wires the UI map layer buttons to CartoDB
    layerToggle = {
      // hide / show the default map layer (rentregscore)
      

      rentregscore: function() {
        if (mapLayers[0].isVisible()) {
          mapLayers[0].hide();
          $('.cartodb-infowindow').css('visibility', 'hidden');
        } else {
          hideAllLayers();
          mapLayers[0].show();
          // set max legend value to 100
          $('#maxLegendNumber').text(100);
        }

        return true;
      },
      dobscore: function() {
        if (mapLayers[1].isVisible()) {
          mapLayers[1].hide();
          $('.cartodb-infowindow').css('visibility', 'hidden');
        } else {
          hideAllLayers();
          mapLayers[1].show();
          // set max legend value to 100
          $('#maxLegendNumber').text(100);
        }

        return true;
      },
      dofscore: function() {
        if (mapLayers[2].isVisible()) {
          mapLayers[2].hide();
          $('.cartodb-infowindow').css('visibility', 'hidden');
        } else {
          hideAllLayers();
          mapLayers[2].show();
          // set max legend value to 100
          $('#maxLegendNumber').text(100);
        }
        return true;
      },
      evicscore: function() {
        if (mapLayers[3].isVisible()) {
          mapLayers[3].hide();
          $('.cartodb-infowindow').css('visibility', 'hidden');
        } else {
          hideAllLayers();
          mapLayers[3].show();
          // set max legend value to 100
          $('#maxLegendNumber').text(100);
        }
        return true;
      },
      // Modify to allow multiple geographies to be visible at once
      cd: function() {
        // would use the below if i wanted geographies to toggle instead of check on and off
        // if (mapLayers[4].isVisible() || mapLayers[6].isVisible()) {
        //   mapLayers[4].hide();
        //   mapLayers[6].hide();
        //   $('.go-to-cb :nth-child(1)').prop('selected', true);          
        // }
        if (mapLayers[5].isVisible()) {
          mapLayers[5].hide();
        } else {
          mapLayers[5].show();
        }
        return true;
      },
      cb: function() {
        // if (mapLayers[5].isVisible() || mapLayers[6].isVisible()) {
        //   mapLayers[5].hide();
        //   mapLayers[6].hide();
        //   $('.go-to-cc :nth-child(1)').prop('selected', true);
        // }
        if (mapLayers[4].isVisible()) {
          mapLayers[4].hide();
        } else {
          mapLayers[4].show();
        }
        return true;
      },
      zipcode: function() {
        // if (mapLayers[4].isVisible() || mapLayers[5].isVisible()) {
        //   mapLayers[4].hide();
        //   mapLayers[5].hide();
        //   $('.go-to-zipcode :nth-child(1)').prop('selected', true);
        // }
        if (mapLayers[6].isVisible()) {
          mapLayers[6].hide();
        } else {
          mapLayers[6].show();
        }
        return true;
      }
    }

    function hideAllLayers() {
      // mapLayers[0].hide();
      mapLayers[0].hide();
      mapLayers[1].hide();
      mapLayers[2].hide();
      mapLayers[3].hide();

      for (let index = 0; index < infowindows.length; index++) {
        infowindows[index].model.set("visibility", !1);
      }
    }

    $('.radio1').click(function(e) {
      e.preventDefault();
      layerToggle[$(this).attr('id')]();
      if (!$(this).hasClass("selected")) {
        $('.radio1').removeClass('selected');
        $(this).addClass('selected');
      } else {
        $(this).removeClass('selected');
      }
    });
    // Changed 'selected' to false 'noselect' class
    $('.radio2').click(function(e) {
      e.preventDefault();
      console.log($(this).attr('id'));
      layerToggle[$(this).attr('id')]();
      if (!$(this).hasClass("noselect")) {
        $('.radio2').removeClass('noselect');
        $(this).addClass('noselect');
      } else {
        $(this).removeClass('noselect');
        }
      }
    );
    
  }

  function createSelect() {
    // sets up the select / dropdowns for community boards
    // and council districts
    function createOptions(arr, name) {
      var toReturn = '',
          first = '',
          geoName = '';
      if (name === 'coundist') {
        first = '<option val="0">Select a Council District</option>';
        geoName = 'Council District ';
      } else {
        first = '<option val="0">Select a Zip Code</option>';
        geoName = '';
      }

      toReturn += first;
      toReturn += arr.map(function(el){
        return '<option value="' + el[name] + '">' +
          geoName + el[name] + '</option>';
      }).join('');

      return toReturn;
    }

    function createCBspecial(arr, name, number) {
      var toReturn = '',
          first = '<option val="0">Select a Community Board</option>',
          geoName = '';

      toReturn += first;
      toReturn += arr.map(function(el){
        return '<option value="' + el[number] + '">' +
          geoName + el[name] + '</option>';
      }).join('');

      return toReturn;
    }

    function buildSelect(className, options) {
      $(className).append(options);
    }

    function initCC() {
      sql.execute('SELECT coundist FROM nycc ORDER BY coundist ASC')
        .done(function(data){
          buildSelect('.go-to-cc', createOptions(data.rows, 'coundist'));
          initCB();
        });
      }

    
    function initCB() {
      sql.execute('SELECT borocd2,borocd FROM nycd_new2 ORDER BY borocd ASC')
        .done(function(data){
          buildSelect('.go-to-cb', createCBspecial(data.rows, 'borocd2', 'borocd'));
          initZipCode();
        });
    }

    function initZipCode() {
      sql.execute('SELECT zipcode FROM nyc_zip_codes GROUP BY zipcode ORDER BY zipcode ASC')
        .done(function(data){
          buildSelect('.go-to-zipcode', createOptions(data.rows, 'zipcode'));
          selectEvents();
        });
    }

    function selectEvents() {
      $('.go-to-cc').on('change', function(e){
        // set the other selects to first option
        $('.go-to-cb :nth-child(1)').prop('btnactive', true);
        $('.go-to-zipcode :nth-child(1)').prop('btnactive', true);
        console.log($(this).val());
        getCC($(this).val());
        $('.radio2').removeClass('btnactive');
        $('#cd').addClass('btnactive');
      });

      $('.go-to-cb').on('change', function(e){
        // set the other select to first option
        $('.go-to-cc :nth-child(1)').prop('btnactive', true);
        $('.go-to-zipcode :nth-child(1)').prop('btnactive', true);
        console.log($(this).val());
        getCB($(this).val());
        $('.radio2').removeClass('btnactive');
        $('#cb').addClass('btnactive');
      });

      $('.go-to-zipcode').on('change', function(e){
        // set the other select to first option
        $('.go-to-cb :nth-child(1)').prop('btnactive', true);
        $('.go-to-cc :nth-child(1)').prop('btnactive', true);
        getZipCode($(this).val());
        $('.radio2').removeClass('btnactive');
        $('#zipcode').addClass('btnactive');
      });
      
        // Add btnactive class to "radio2" on click
      
        var acc = document.getElementsByClassName("radio2");
        var i;
        for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
        /* Toggle between adding and removing the "active" class,
        to highlight the button that controls the panel */
        this.classList.toggle("btnactive");
        });
        }

    }

    initCC();
  }

  function getCC(num) {
    // to set the map position to a city council district
    // zero means the first option in the select
    if (num !== 0) {
      sql.getBounds('SELECT * FROM nycc WHERE coundist = {{id}}', { id: num })
        .done(function(data){
          mapLayers[4].hide();
          mapLayers[5].show();
          mapLayers[6].hide();
          map.fitBounds(data);
        });   

    }
  }

  function getCB(num) {
    // to set the map position to a community board
    // zero means the first option in the select
    if (num !==0) {
      sql.getBounds('SELECT * FROM nycd_new2 WHERE borocd = {{id}}', { id: num })
        .done(function(data){
          mapLayers[4].show();
          mapLayers[5].hide();
          mapLayers[6].hide();
          map.fitBounds(data);
        });
    }
  }

  function getZipCode(num) {
    // to set the map position to a zip code
    // zero means the first option in the select
    if (num !==0) {
      sql.getBounds("SELECT * FROM nyc_zip_codes WHERE zipcode = '{{id}}'", { id: num })
        .done(function(data){
          mapLayers[5].hide();
          mapLayers[4].hide();
          mapLayers[6].show();
          map.fitBounds(data);
        });
    }
  }

  function setupToggleListener() {
    // toggle closed class when hamburger is clicked
    $('#hamburger').on( "click", function() {
      $('#map-layers').toggleClass('hideMapLayers');
    });

  }

  function showModalonPageLoad() {
    if (!$.cookie('noIntro')) {
      location.href = "#";
      location.href = "#openModal";
      // set cookie if don't show this message is checked
      $('#toggleIntroCookie').change(function() {
        if($(this).is(":checked")) {
          $.cookie('noIntro', 'noIntro', { expires: 365, path: '/' });
        } else {
          $.removeCookie('noIntro', { path: '/' });
        }
      });
    }
  }

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }




  function init(){
    initMap();
    createCDBLayer();
    wireLayerBtns();
    createSelect();
    setupToggleListener();
    showModalonPageLoad();
  }

  return {
    init: init
  };




})(window, document, L, jQuery);