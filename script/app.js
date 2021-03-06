'use strict';
const apikey1 = '0d38ed9b-3055-4756-94dc-f62f940b6914';
const apikey2 = '87cdfc5a-9655-4807-80ac-c564fa1bab22';

const provider = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}';
const copyright = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';


let map, mapview, layergroup, referencedata, chargepointdata, currentlat, currentlong;
let htmlmapview, htmllistview, htmlcontent, htmlcards, htmlmap;

//#region ***  DOM references                           ***********

//#endregion

//#region ***  Callback-Visualisation - show___         ***********
const showMapOrList = function(){
    if(mapview == true){
        htmlcontent.innerHTML = `
        <section>
            <div class="c-map" id="mapid"></div>
        </section>  
    `;
        showMap(chargepointdata);
    } else {
        htmlcontent.innerHTML = `<div class="c-cards js-cards"> </div>`;
        showCards(chargepointdata);
    }
}

const showLoading = function(){
    let html = `
        <div class="c-loader-body">
            <div class="c-loader"></div>
        </div>
    `;
    htmlcontent.innerHTML = html;
}

const showCards = function(jsonObject){
    htmlcards = document.querySelector('.js-cards');
    let html = ``;
    for(let point of jsonObject){
        let usagetype = referencedata.UsageTypes.find(x => x.ID === point.UsageTypeID);
        html += `
        <div class="c-card">
                
        <p class="c-card__content c-card__content-right c-card__content-title">${point.AddressInfo.Title}</p> 
        <p class="c-card__content c-card__content-title c-card__content-left">${parseFloat(point.AddressInfo.Distance).toFixed(2)}km</p>
       
        <p class="c-card__content c-card__content-right">${point.AddressInfo.AddressLine1}</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="c-card__content c-card__content-left c-card__content-status c-status-${(point.StatusTypeID === 140|15|10) ? 'available':'unavailable'}" width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/></svg>
        
        <p class="c-card__content c-card__content-right c-address-line">${point.AddressInfo.Postcode}, ${point.AddressInfo.Town}</p>
        
        <p class="c-card__content c-card__content-right c-access-type">${point.UsageTypeID ? usagetype.Title : "Unknown"}</p>
        
        <p class="c-card__content c-border-bottom c-card__content-right">Connection Type</p>
        <p class="c-card__content c-border-bottom c-card__content-left">Quantity</p>
        
    `;
    for(let connection of point.Connections){
        let connectiontype = referencedata.ConnectionTypes.find(x => x.ID === connection.ConnectionTypeID);
        html+= `
        <p class="c-card__content c-card__content-connection c-card__content-right" >${connectiontype.Title}</p>
        <p class="c-card__content c-card__content-connection c-card__content-left">${connection.Quantity}</p>
        `;
    }
    html+= `
                
    </div>
    `;
    }

    htmlcards.innerHTML = html;
    
}

const showMap = function(jsonObject) {
    map = L.map('mapid').setView([currentlat, currentlong], 12);
	L.tileLayer(provider, { attribution: copyright, maxZoom: 18, id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, accessToken: 'pk.eyJ1IjoiZGFhbmR3NSIsImEiOiJja21xYWVrY2IwbWo2MzBvOWNkdmdhMjlsIn0.2mkN44JAwQ3xoESwwRIJRw' }).addTo(map);
	layergroup = L.layerGroup().addTo(map);

    showMarkers(jsonObject);
}

const showMarkers = function(jsonObject) {
    let arrCoords = [currentlat, currentlong];
    var myIcon = L.icon({
        iconUrl: '/chargemap/img/Pin.svg',
        iconSize: [32, 32],
    });
    let marker = L.marker(arrCoords, { icon: myIcon }).addTo(layergroup);
    marker.bindPopup('<div>Current location</div>');


    for (let point of jsonObject){
        let arrCoords = [point.AddressInfo.Latitude, point.AddressInfo.Longitude];

        var myIcon = L.icon({
            iconUrl: '/chargemap/img/Marker.svg',
            iconSize: [32, 32],
        });
        let marker = L.marker(arrCoords, { icon: myIcon }).addTo(layergroup);
        marker.bindPopup(`
        <div>${point.AddressInfo.Title}, ${parseFloat(point.AddressInfo.Distance).toFixed(2)}km</div>
        <div>${point.AddressInfo.AddressLine1}, ${point.AddressInfo.Postcode} ${point.AddressInfo.Town}</div>
        `, { className: 'c-marker__name' });
    }
}

//#endregion

//#region ***  Callback-No Visualisation - callback___  ***********
const callbackGetCurrentPosition = function(position){
    currentlat = position.coords.latitude;
    currentlong = position.coords.longitude;
    getChargepointData(currentlat, currentlong);
}

const callbackReferencedata = function(jsonObject) {
    referencedata = jsonObject;
    listentoListview();
    listentoMapview();
    
    getCurrentLocation();
}

const callbackChargepoints = function(jsonObject){
    chargepointdata = jsonObject;
    showMapOrList();
}

const callbackError = function (jsonObject) {
	console.log(jsonObject);
};
//#endregion

//#region ***  Data Access - get___                     ***********
const getCurrentLocation = function(){
    navigator.geolocation.getCurrentPosition(callbackGetCurrentPosition);
}

const getReferenceData = function () {
	let url = `https://api.openchargemap.io/v3/referencedata&output`;
	handleData(url, callbackReferencedata, callbackError, 'GET');
};

const getChargepointData = function(lat, long,){
    let url = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=BE&latitude=${lat}&longitude=${long}&distance=10&distanceunit=KM&compact=true&verbose=false`;
	handleData(url, callbackChargepoints, callbackError, 'GET');
}

//#endregion

//#region ***  Event Listeners - listenTo___            ***********
const listentoMapview = function () {
	htmlmapview.addEventListener('click', function () {
		this.classList.add('c-togglebtn__selected');
		htmllistview.classList.remove('c-togglebtn__selected');
        mapview = true;
        showLoading();
		showMapOrList();
	});
};

const listentoListview = function () {
	htmllistview.addEventListener('click', function () {
		this.classList.add('c-togglebtn__selected');
		htmlmapview.classList.remove('c-togglebtn__selected');
        mapview = false;
        showLoading();
		showMapOrList();
	});
};

//#endregion

//#region ***  Init / DOMContentLoaded                  ***********
const init = function () {
	console.log('DOM Content loaded');
    mapview = false;

    htmlmapview = document.querySelector('.js-mapview');
	htmllistview = document.querySelector('.js-listview');
    htmlcontent = document.querySelector('.js-content');

    
    getReferenceData();
    showLoading()
    getCurrentLocation();
};

document.addEventListener('DOMContentLoaded', init);
//#endregion
