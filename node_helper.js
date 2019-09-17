'use strict';

/* Magic Mirror
 * Module: MMM-TMB
 *
 * By @jaumebosch
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
var request = require('request');

module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

    getData: function() {
        var self = this;
        var stop = new Array();
        var lines = new Array();

        global.stops = new Array();

        this.config.busStopCodes.forEach( function (value, index, array){
            stop = self.getStopInfo(value, lines);
        });

        setTimeout(function() { self.getData(); }, this.config.refreshInterval);
    },


    getStopInfo: function(busStopCode, lines) {
        var self = this;
        var stopInfoUrl =  "https://api.tmb.cat/v1/transit" +
            "/parades/" + busStopCode +
            "?app_id=" + this.config.appId +
            "&app_key=" + this.config.appKey;

        var stop = new Object();
        request({
            url: stopInfoUrl,
            method: 'GET',
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var stopInfo =  JSON.parse(body);
                var stop = stopInfo.features[0].properties;
            }


            var stopUrl =  "https://api.tmb.cat/v1/ibus";

            if (self.config.busLine){
               stopUrl += "/lines/" + self.config.busLine;
            } 
               
            stopUrl +=  "/stops/" + busStopCode +
                "?app_id=" + self.config.appId +
                "&app_key=" + self.config.appKey;

            request({
                url: stopUrl,
                method: 'GET',
            }, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var stopTimes =  JSON.parse(body);
                    var times = stopTimes.data.ibus;
                    var index;
                    times.forEach(function(value, index, array){
                       var line = 
                            {
                                busStopCode:stop['CODI_PARADA'],
                                busStopName:stop['NOM_PARADA'],
                                lineCode:value['line'],
                                tInS:value['t-in-s'],
                                tInText:value['text-ca'],
                                tInMin:value['t-in-min'],
                            }
                        lines.push(line);


                    });
console.log(lines);
                    self.sendSocketNotification("DATA", lines);
                }
            });
        });
    },

    

    socketNotificationReceived: function(notification, payload) {
        if (notification === 'CONFIG') {
            this.config = payload;
            this.getData();
        }
    }
});